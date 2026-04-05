import Dexie, { type EntityTable } from "dexie";
import type { LogCategory } from "./log-categories";
import type { LogMotive } from "./log-motives";
export type { LogCategory } from "./log-categories";
export type { LogMotive } from "./log-motives";

export type LogStatus = "Fixed" | "Pending";
export type SyncStatus = "synced" | "pending_insert";

export interface LogRecord {
  id: string;
  created_at: string;
  updated_at: string;
  author_name: string;
  machine_name: string;
  motive: LogMotive;
  category: LogCategory[];
  symptoms: string;
  solution_applied: string | null;
  status: LogStatus;
  image_url: string | null;
  sync_status: SyncStatus;
}

export interface MachineRecord {
  id: string;
  name: string;
  department: string | null;
  created_at?: string;
}

export interface MechanicRecord {
  id: string;
  name: string;
}

export interface LogEventRecord {
  id: string;
  log_id: string;
  event_type: "created" | "status_changed" | "fields_updated";
  actor_mechanic_id: string | null;
  actor_name: string;
  occurred_at: string;
  details: {
    from_status?: LogStatus;
    to_status?: LogStatus;
    changed_fields?: string[];
  } | null;
  sync_status: SyncStatus;
}

const db = new Dexie("FixLogDB") as Dexie & {
  logs: EntityTable<LogRecord, "id">;
  machines: EntityTable<MachineRecord, "id">;
  mechanics: EntityTable<MechanicRecord, "id">;
  log_events: EntityTable<LogEventRecord, "id">;
};

db.version(4).stores({
  logs: "id, created_at, machine_name, status, sync_status, author_name",
  machines: "id, name",
  mechanics: "id, name",
  log_events:
    "id, log_id, occurred_at, event_type, actor_name, sync_status, [log_id+occurred_at]",
});

export { db };
