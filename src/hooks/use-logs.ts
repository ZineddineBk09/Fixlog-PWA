"use client";

import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { v4 as uuidv4 } from "uuid";
import Fuse from "fuse.js";
import {
  db,
  type LogEventRecord,
  type LogRecord,
  type LogStatus,
  type MachineRecord,
} from "@/lib/db";
import { syncService } from "@/lib/sync-service";
import { supabase } from "@/lib/supabase";
import type { Mechanic } from "@/hooks/use-auth";

export interface LogFilters {
  search?: string;
  status?: "Fixed" | "Pending";
  machine?: string;
  authorName?: string;
}

export type NewLogData = Omit<
  LogRecord,
  "id" | "created_at" | "updated_at" | "sync_status"
>;

export interface CreateMachineResult {
  success: boolean;
  machine?: MachineRecord;
  errorKey?:
    | "machineNameRequired"
    | "machineCatalogNeedsInternet"
    | "machineExists"
    | "machineSaveFailed";
}

const fuseOptions = {
  keys: ["machine_name", "symptoms", "solution_applied", "author_name"],
  threshold: 0.4,
  ignoreLocation: true,
};

export function useLogs(filters?: LogFilters) {
  const logs = useLiveQuery(async () => {
    let results = await db.logs.orderBy("created_at").reverse().toArray();

    if (filters?.status) {
      results = results.filter((l) => l.status === filters.status);
    }
    if (filters?.machine) {
      results = results.filter((l) => l.machine_name === filters.machine);
    }
    if (filters?.authorName) {
      results = results.filter((l) => l.author_name === filters.authorName);
    }

    if (filters?.search && filters.search.trim()) {
      const fuse = new Fuse(results, fuseOptions);
      results = fuse.search(filters.search).map((r) => r.item);
    }

    return results;
  }, [filters?.search, filters?.status, filters?.machine, filters?.authorName]);

  const refresh = useCallback(async () => {
    await syncService.syncAll();
  }, []);

  return { logs: logs ?? [], isLoading: logs === undefined, refresh };
}

export function useLog(id: string) {
  const log = useLiveQuery(async () => db.logs.get(id), [id]);

  return { log: log ?? null, isLoading: log === undefined };
}

export function useLogEvents(logId: string) {
  const events = useLiveQuery(async () => {
    const items = await db.log_events.where("log_id").equals(logId).toArray();
    return items.sort(
      (a, b) =>
        new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
    );
  }, [logId]);

  return { events: events ?? [], isLoading: events === undefined };
}

export function usePendingCount() {
  const pendingCount = useLiveQuery(
    async () => db.logs.where("status").equals("Pending").count(),
    [],
  );

  return pendingCount ?? 0;
}

function createEventRecord(
  input: Omit<LogEventRecord, "id"> & { id?: string },
): LogEventRecord {
  return {
    id: input.id ?? uuidv4(),
    ...input,
  };
}

export async function createLog(
  data: NewLogData,
  actor: Mechanic,
): Promise<string> {
  const id = uuidv4();
  const now = new Date().toISOString();

  const record: LogRecord = {
    ...data,
    id,
    created_at: now,
    updated_at: now,
    sync_status: "pending_insert",
  };

  await db.logs.add(record);
  await db.log_events.add(
    createEventRecord({
      log_id: id,
      event_type: "created",
      actor_mechanic_id: actor.id,
      actor_name: actor.name,
      occurred_at: now,
      details: null,
      sync_status: "pending_insert",
    }),
  );

  if (navigator.onLine) {
    syncService.syncAll().catch(console.error);
  }

  return id;
}

export async function updateLog(
  id: string,
  data: Partial<Omit<LogRecord, "id" | "created_at" | "sync_status">>,
  actor: Mechanic,
): Promise<boolean> {
  if (!navigator.onLine) return false;
  const currentLog = await db.logs.get(id);
  if (!currentLog) return false;

  const updatedAt = new Date().toISOString();

  const { error } = await supabase
    .from("maintenance_logs")
    .update({ ...data, updated_at: updatedAt })
    .eq("id", id);

  if (error) {
    console.error("Failed to update log:", error);
    return false;
  }

  await db.logs.update(id, {
    ...data,
    updated_at: updatedAt,
  });

  const changedFields = Object.keys(data);
  const isStatusChange =
    typeof data.status !== "undefined" && data.status !== currentLog.status;
  const event = createEventRecord({
    log_id: id,
    event_type: isStatusChange ? "status_changed" : "fields_updated",
    actor_mechanic_id: actor.id,
    actor_name: actor.name,
    occurred_at: updatedAt,
    details: isStatusChange
      ? {
          from_status: currentLog.status,
          to_status: data.status as LogStatus,
        }
      : {
          changed_fields: changedFields,
        },
    sync_status: "synced",
  });

  const { error: eventError } = await supabase
    .from("maintenance_log_events")
    .insert({
      id: event.id,
      log_id: event.log_id,
      event_type: event.event_type,
      actor_mechanic_id: event.actor_mechanic_id,
      actor_name: event.actor_name,
      occurred_at: event.occurred_at,
      details: event.details,
    });

  if (eventError) {
    console.error("Failed to write log event:", eventError);
    event.sync_status = "pending_insert";
  }

  await db.log_events.put(event);

  return true;
}

export async function createMachine(
  name: string,
  department?: string,
): Promise<CreateMachineResult> {
  const normalizedName = name.trim();
  if (!normalizedName) {
    return { success: false, errorKey: "machineNameRequired" };
  }

  if (!navigator.onLine) {
    return {
      success: false,
      errorKey: "machineCatalogNeedsInternet",
    };
  }

  const { data, error } = await supabase
    .from("machines")
    .insert({
      name: normalizedName,
      department: department?.trim() || null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return {
      success: false,
      errorKey: error?.code === "23505" ? "machineExists" : "machineSaveFailed",
    };
  }

  await db.machines.put(data);

  return { success: true, machine: data };
}
