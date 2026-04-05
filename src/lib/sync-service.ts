import { db } from "./db";
import { parseCategories, serializeCategories } from "./log-categories";
import { normalizeMotive } from "./log-motives";
import { supabase } from "./supabase";

let isSyncing = false;

function isNetworkFetchError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const maybeError = error as {
    code?: string;
    message?: string;
    details?: string | null;
  };

  return (
    maybeError.message === "TypeError: Failed to fetch" ||
    maybeError.details?.includes("TypeError: Failed to fetch") === true
  );
}

export const syncService = {
  async syncAll(): Promise<boolean> {
    if (typeof window !== "undefined" && !navigator.onLine) return false;
    if (isSyncing) return true;

    isSyncing = true;

    try {
      await this.pushLocalToRemote();
      await this.pushEventsToRemote();
      await this.pullRemoteToLocal();
      await this.pullRemoteEventsToLocal();
      await this.syncMachines();
      await this.syncMechanics();
      return true;
    } catch (error) {
      console.error("Sync failed:", error);
      return false;
    } finally {
      isSyncing = false;
    }
  },

  async pushLocalToRemote() {
    const pendingLogs = await db.logs
      .where("sync_status")
      .equals("pending_insert")
      .toArray();

    if (pendingLogs.length === 0) return;

    for (const log of pendingLogs) {
      let finalImageUrl = log.image_url;

      if (finalImageUrl && finalImageUrl.startsWith("data:image")) {
        finalImageUrl = await this.uploadBase64Image(finalImageUrl, log.id);
        if (!finalImageUrl) continue;
      }

      const payload = {
        id: log.id,
        created_at: log.created_at,
        updated_at: log.updated_at,
        author_name: log.author_name,
        machine_name: log.machine_name,
        motive: log.motive,
        category: serializeCategories(log.category),
        symptoms: log.symptoms,
        solution_applied: log.solution_applied,
        status: log.status,
        image_url: finalImageUrl,
      };

      const { error } = await supabase.from("maintenance_logs").insert(payload);

      if (!error) {
        await db.logs.update(log.id, {
          sync_status: "synced",
          image_url: finalImageUrl,
        });
      } else {
        console.error(`Failed to push log ${log.id}:`, error);
      }
    }
  },

  async pullRemoteToLocal() {
    const { data: remoteLogs, error } = await supabase
      .from("maintenance_logs")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(500);

    if (error || !remoteLogs) {
      if (isNetworkFetchError(error)) {
        throw error;
      }
      console.error("Failed to pull remote logs:", error);
      return;
    }

    await db.transaction("rw", db.logs, async () => {
      const pendingLocalLogs = await db.logs
        .where("sync_status")
        .equals("pending_insert")
        .toArray();
      const pendingIds = new Set(pendingLocalLogs.map((log) => log.id));

      const logsToPut = remoteLogs
        .map((log) => ({
          ...log,
          motive: normalizeMotive(log.motive),
          category: parseCategories(log.category),
          sync_status: "synced" as const,
        }))
        .filter((log) => !pendingIds.has(log.id));

      if (logsToPut.length > 0) {
        await db.logs.bulkPut(logsToPut);
      }
    });
  },

  async pushEventsToRemote() {
    const pendingEvents = await db.log_events
      .where("sync_status")
      .equals("pending_insert")
      .toArray();

    for (const event of pendingEvents) {
      const { error } = await supabase.from("maintenance_log_events").insert({
        id: event.id,
        log_id: event.log_id,
        event_type: event.event_type,
        actor_mechanic_id: event.actor_mechanic_id,
        actor_name: event.actor_name,
        occurred_at: event.occurred_at,
        details: event.details,
      });

      if (!error) {
        await db.log_events.update(event.id, { sync_status: "synced" });
      } else {
        console.error(`Failed to push log event ${event.id}:`, error);
      }
    }
  },

  async pullRemoteEventsToLocal() {
    const { data: remoteEvents, error } = await supabase
      .from("maintenance_log_events")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(1000);

    if (error || !remoteEvents) {
      if (isNetworkFetchError(error)) {
        throw error;
      }
      console.error("Failed to pull remote log events:", error);
      return;
    }

    const eventsToPut = remoteEvents.map((event) => ({
      ...event,
      sync_status: "synced" as const,
    }));

    if (eventsToPut.length > 0) {
      await db.log_events.bulkPut(eventsToPut);
    }
  },

  async syncMachines() {
    const { data: machines, error } = await supabase
      .from("machines")
      .select("*");

    if (error || !machines) {
      if (isNetworkFetchError(error)) {
        throw error;
      }
      return;
    }

    await db.machines.bulkPut(machines);
  },

  async syncMechanics() {
    const { data: mechanics, error } = await supabase
      .from("mechanics")
      .select("id, name");

    if (error || !mechanics) {
      if (isNetworkFetchError(error)) {
        throw error;
      }
      return;
    }

    await db.mechanics.bulkPut(mechanics);
  },

  async uploadBase64Image(
    base64Str: string,
    logId: string,
  ): Promise<string | null> {
    try {
      const res = await fetch(base64Str);
      const blob = await res.blob();

      const fileName = `breakdowns/${logId}-${Date.now()}.webp`;

      const { error } = await supabase.storage
        .from("log-images")
        .upload(fileName, blob, {
          contentType: "image/webp",
          upsert: true,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from("log-images")
        .getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e) {
      console.error("Image upload failed:", e);
      return null;
    }
  },
};
