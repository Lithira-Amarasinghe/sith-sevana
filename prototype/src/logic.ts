import type { Booking, ChatRule, Counsellor, Settings, Thread } from "./types";

export const CLIENT_ID = "sanduni";

export function at(daysFromNow: number, hours: number, minutes: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export function lkr(amount: number) {
  return `LKR ${amount.toLocaleString("en-LK")}`;
}

export function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDay(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function ageOn(dob: string, now = new Date()) {
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return null;
  let years = now.getFullYear() - born.getFullYear();
  const month = now.getMonth() - born.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < born.getDate())) years -= 1;
  return years;
}

export function chatRuleCopy(rule: ChatRule) {
  switch (rule) {
    case "after-choose":
      return "You can message any time after you choose this counsellor.";
    case "after-paid":
      return "You can message after a booking is confirmed.";
    case "during-session":
      return "You can message only while a session is open to join.";
    case "after-session":
      return "You can message after a session is completed.";
  }
}

export function inSessionWindow(booking: Booking, settings: Settings, now = new Date()) {
  const start = new Date(booking.startsAt).getTime();
  const open = start - settings.joinMinutesBefore * 60_000;
  const close = start + booking.minutes * 60_000;
  const time = now.getTime();
  return time >= open && time <= close;
}

export function hoursUntil(iso: string, now = new Date()) {
  return (new Date(iso).getTime() - now.getTime()) / 3_600_000;
}

export type Opening = { slot: string; startsAt: string };

export function openings(counsellor: Counsellor, bookings: Booking[], settings: Settings, now = new Date()): Opening[] {
  if (counsellor.suspended || counsellor.pendingSetup) return [];
  const found: Opening[] = [];
  for (let day = 0; day < 14; day += 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + day);
    for (const slot of counsellor.slots) {
      if (slot.weekday !== date.getDay()) continue;
      const [hour, minute] = slot.time.split(":").map(Number);
      const starts = new Date(date);
      starts.setHours(hour, minute, 0, 0);
      if (starts.getTime() < now.getTime() + settings.bookingNoticeHours * 3_600_000) continue;
      const taken = bookings.some((booking) => {
        if (booking.counsellorId !== counsellor.id || booking.status === "cancelled" || booking.status === "refunded") {
          return false;
        }
        return Math.abs(new Date(booking.startsAt).getTime() - starts.getTime()) < 60_000;
      });
      if (taken) continue;
      const iso = starts.toISOString();
      found.push({ slot: `${counsellor.id}@${iso}`, startsAt: iso });
    }
  }
  return found;
}

export function quote(counsellor: Counsellor, bookings: Booking[], settings: Settings) {
  const prior = bookings.filter(
    (booking) =>
      booking.clientId === CLIENT_ID &&
      booking.counsellorId === counsellor.id &&
      (booking.status === "confirmed" || booking.status === "completed"),
  ).length;
  const free = settings.freeSession && prior === 0 && !counsellor.pendingSetup;
  return {
    minutes: settings.sessionMinutes,
    cancelHours: settings.cancelHours,
    free,
    priceLkr: counsellor.pendingSetup ? null : free ? 0 : counsellor.priceLkr,
  };
}

export function clientCanSend(thread: Thread, bookings: Booking[], settings: Settings, now = new Date()) {
  const mine = bookings.filter(
    (booking) => booking.clientId === thread.clientId && booking.counsellorId === thread.counsellorId,
  );
  if (thread.ruleAtOpen === "after-choose") return { ok: true, reason: "" };
  if (thread.ruleAtOpen === "after-paid") {
    const ok = mine.some((booking) => booking.status === "confirmed" || booking.status === "completed");
    return { ok, reason: ok ? "" : "Messaging opens when a booking is confirmed." };
  }
  if (thread.ruleAtOpen === "during-session") {
    const ok = mine.some((booking) => booking.status === "confirmed" && inSessionWindow(booking, settings, now));
    return { ok, reason: ok ? "" : "Messaging is open only during the session window." };
  }
  const ok = mine.some((booking) => booking.status === "completed");
  return { ok, reason: ok ? "" : "Messaging opens after a completed session." };
}

export function threadIdFor(counsellorId: string, clientId = CLIENT_ID) {
  return `thread-${clientId}-${counsellorId}`;
}

export function grantUntil(sharedAt: string, grantDays: number) {
  const date = new Date(sharedAt);
  date.setDate(date.getDate() + grantDays);
  return date;
}

export function documentVisibleToCounsellor(doc: { sharedWith?: string; revoked?: boolean; sharedAt?: string; grantDays?: number }, counsellorId: string, now = new Date()) {
  if (doc.revoked || doc.sharedWith !== counsellorId || !doc.sharedAt || !doc.grantDays) return false;
  return grantUntil(doc.sharedAt, doc.grantDays).getTime() > now.getTime();
}

export function statusLabel(status: Booking["status"]) {
  switch (status) {
    case "awaiting-payment":
      return "Waiting for payment";
    case "payment-rejected":
      return "Slip not accepted";
    case "confirmed":
      return "Confirmed";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "refund-review":
      return "Refund in review";
    case "refunded":
      return "Refunded";
  }
}

export function weekdayName(day: number) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day];
}
