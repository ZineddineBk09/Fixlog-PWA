export const logMotives = [
  "Corrective",
  "Preventive",
  "Inspection",
  "Calibration",
  "Emergency",
] as const;

export type LogMotive = (typeof logMotives)[number];

export function isLogMotive(value: string): value is LogMotive {
  return (logMotives as readonly string[]).includes(value);
}

export function normalizeMotive(value: unknown): LogMotive {
  if (typeof value === "string" && isLogMotive(value)) {
    return value;
  }

  return "Corrective";
}
