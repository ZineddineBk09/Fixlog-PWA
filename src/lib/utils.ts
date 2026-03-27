import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  categoryLabelKeys,
  statusLabelKeys,
  translate,
  type Locale,
} from "@/lib/i18n";
import type { LogCategory, LogEventRecord, LogStatus } from "@/lib/db";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string, locale: Locale): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === "ar" ? "ar" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(dateStr: string, locale: Locale): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(locale === "ar" ? "ar" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(dateStr: string, locale: Locale): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return translate(locale, "justNow");
  if (minutes === 1) return translate(locale, "minuteAgo");
  if (minutes < 60) return translate(locale, "minutesAgo", { count: minutes });
  if (hours === 1) return translate(locale, "hourAgo");
  if (hours < 24) return translate(locale, "hoursAgo", { count: hours });
  if (days === 1) return translate(locale, "dayAgo");
  if (days < 7) return translate(locale, "daysAgo", { count: days });
  return formatDate(dateStr, locale);
}

export function buildWhatsAppShareUrl(
  logId: string,
  machineName: string,
  symptoms: string,
  status: LogStatus,
  baseUrl: string,
  locale: Locale,
): string {
  const deepLink = `${baseUrl}/log/${logId}`;
  const text = [
    `🔧 ${translate(locale, "sharePrefix")}: ${machineName}`,
    `${translate(locale, "shareStatus")}: ${
      status === "Fixed"
        ? `✅ ${translate(locale, "fixed")}`
        : `🔴 ${translate(locale, "pending")}`
    }`,
    `${translate(locale, "shareIssue")}: ${symptoms.slice(0, 100)}${symptoms.length > 100 ? "..." : ""}`,
    `${translate(locale, "shareDetails")}: ${deepLink}`,
  ].join("\n");

  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getStatusLabel(status: LogStatus, locale: Locale) {
  return translate(locale, statusLabelKeys[status]);
}

export function getCategoryLabel(category: LogCategory, locale: Locale) {
  return translate(locale, categoryLabelKeys[category]);
}

export function getEventMessage(event: LogEventRecord, locale: Locale) {
  if (event.event_type === "created") {
    return translate(locale, "createdEvent");
  }

  if (
    event.event_type === "status_changed" &&
    event.details?.to_status === "Fixed"
  ) {
    return translate(locale, "statusChangedEventFixed");
  }

  if (
    event.event_type === "status_changed" &&
    event.details?.to_status === "Pending"
  ) {
    return translate(locale, "statusChangedEventPending");
  }

  return translate(locale, "fieldsUpdatedEvent");
}
