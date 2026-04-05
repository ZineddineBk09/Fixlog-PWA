export const logCategories = [
  "Mechanical",
  "Electrical",
  "Software",
  "Pneumatic",
  "Hydraulics",
] as const;

export type LogCategory = (typeof logCategories)[number];

export function isLogCategory(value: string): value is LogCategory {
  return (logCategories as readonly string[]).includes(value);
}

export function normalizeCategories(categories: readonly string[]) {
  const unique: LogCategory[] = [];

  for (const category of categories) {
    if (isLogCategory(category) && !unique.includes(category)) {
      unique.push(category);
    }
  }

  return unique;
}

export function parseCategories(value: unknown): LogCategory[] {
  if (Array.isArray(value)) {
    return normalizeCategories(
      value.filter((item): item is string => typeof item === "string"),
    );
  }

  if (typeof value !== "string") {
    return [];
  }

  return normalizeCategories(
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

export function serializeCategories(categories: readonly string[]) {
  return normalizeCategories(categories).join(", ");
}
