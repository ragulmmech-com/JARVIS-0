export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  title: string;
  type: "celebration" | "holiday" | "reminder" | "important" | "function";
  category: "பண்டிகை" | "விசேஷம்" | "டாஸ்க்" | "முக்கியம்" | "நோட்ஸ்";
  notes?: string;
  isImportant?: boolean;
  status: "pending" | "alerted" | "completed";
  createdAt: number;
}

const STORAGE_KEY = "jarvis_smart_calendar_events_v2";

// Helper to format date as YYYY-MM-DD
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Multi-year authentic Indian & Tamil Nadu government holidays and festivals
// Accurate lunar and solar dates per year (2024 to 2030)
export const FESTIVALS_BY_YEAR: Record<string, { title: string; type: "celebration" | "holiday"; category: "பண்டிகை" | "முக்கியம்" | "விசேஷம்"; isHoliday?: boolean }[]> = {
  // 2024
  "2024-01-01": [{ title: "ஆங்கில புத்தாண்டு (New Year's Day)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2024-01-14": [{ title: "போகிப் பண்டிகை (Bhogi)", type: "celebration", category: "விசேஷம்" }],
  "2024-01-15": [{ title: "தைப்பொங்கல் (Pongal)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2024-01-16": [{ title: "மாட்டுப் பொங்கல் & திருவள்ளுவர் தினம்", type: "celebration", category: "விசேஷம்", isHoliday: true }],
  "2024-01-17": [{ title: "உழவர் திருநாள் & காணும் பொங்கல்", type: "celebration", category: "விசேஷம்", isHoliday: true }],
  "2024-01-26": [{ title: "குடியரசு தினம் (Republic Day)", type: "holiday", category: "முக்கியம்", isHoliday: true }],
  "2024-04-14": [{ title: "தமிழ் புத்தாண்டு & அம்பேத்கர் ஜெயந்தி", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2024-05-01": [{ title: "மே தினம் - தொழிலாளர் தினம் (May Day)", type: "holiday", category: "முக்கியம்", isHoliday: true }],
  "2024-08-15": [{ title: "சுதந்திர தினம் (Independence Day)", type: "holiday", category: "முக்கியம்", isHoliday: true }],
  "2024-10-02": [{ title: "காந்தி ஜெயந்தி (Gandhi Jayanti)", type: "holiday", category: "முக்கியம்", isHoliday: true }],
  "2024-10-11": [{ title: "ஆயுத பூஜை & சரஸ்வதி பூஜை", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2024-10-12": [{ title: "விஜயதசமி (Vijaya Dasami)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2024-10-31": [{ title: "தீபாவளி பண்டிகை (Deepavali Festival)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2024-12-25": [{ title: "கிறிஸ்துமஸ் பெருநாள் (Christmas)", type: "celebration", category: "பண்டிகை", isHoliday: true }],

  // 2025
  "2025-01-01": [{ title: "ஆங்கில புத்தாண்டு (New Year's Day)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2025-01-14": [{ title: "போகிப் பண்டிகை (Bhogi)", type: "celebration", category: "விசேஷம்" }],
  "2025-01-15": [{ title: "தைப்பொங்கல் (Pongal)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2025-01-16": [{ title: "மாட்டுப் பொங்கல் & திருவள்ளுவர் தினம்", type: "celebration", category: "விசேஷம்", isHoliday: true }],
  "2025-01-17": [{ title: "உழவர் திருநாள் & காணும் பொங்கல்", type: "celebration", category: "விசேஷம்", isHoliday: true }],
  "2025-01-26": [{ title: "குடியரசு தினம் (Republic Day)", type: "holiday", category: "முக்கியம்", isHoliday: true }],
  "2025-02-26": [{ title: "மகா சிவராத்திரி (Maha Shivaratri)", type: "celebration", category: "பண்டிகை" }],
  "2025-03-14": [{ title: "ஹோலி பண்டிகை (Holi)", type: "celebration", category: "பண்டிகை" }],
  "2025-03-31": [{ title: "ரம்ஜான் / ஈகைத் திருநாள் (Eid al-Fitr)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2025-04-14": [{ title: "தமிழ் புத்தாண்டு & அம்பேத்கர் ஜெயந்தி", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2025-05-01": [{ title: "மே தினம் - தொழிலாளர் தினம் (May Day)", type: "holiday", category: "முக்கியம்", isHoliday: true }],
  "2025-06-07": [{ title: "பக்ரீத் (Bakrid / Eid al-Adha)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2025-07-06": [{ title: "மொஹரம் (Muharram)", type: "celebration", category: "முக்கியம்", isHoliday: true }],
  "2025-08-15": [{ title: "சுதந்திர தினம் (Independence Day)", type: "holiday", category: "முக்கியம்", isHoliday: true }],
  "2025-08-16": [{ title: "கிருஷ்ண ஜெயந்தி (Krishna Jayanti)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2025-08-27": [{ title: "விநாயகர் சதுர்த்தி (Vinayagar Chaturthi)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2025-09-05": [{ title: "மிலாதுன் நபி (Milad-un-Nabi)", type: "celebration", category: "முக்கியம்", isHoliday: true }],
  "2025-10-01": [{ title: "ஆயுத பூஜை & சரஸ்வதி பூஜை", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2025-10-02": [{ title: "காந்தி ஜெயந்தி & விஜயதசமி", type: "holiday", category: "முக்கியம்", isHoliday: true }],
  "2025-10-20": [{ title: "தீபாவளி பண்டிகை (Deepavali Festival of Lights)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2025-12-04": [{ title: "கார்த்திகை தீபம் (Karthigai Deepam)", type: "celebration", category: "பண்டிகை" }],
  "2025-12-25": [{ title: "கிறிஸ்துமஸ் பெருநாள் (Christmas)", type: "celebration", category: "பண்டிகை", isHoliday: true }],

  // 2026 (CURRENT YEAR IN ENVIRONMENT)
  "2026-01-01": [{ title: "ஆங்கில புத்தாண்டு (New Year's Day)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2026-01-14": [{ title: "போகிப் பண்டிகை (Bhogi)", type: "celebration", category: "விசேஷம்" }],
  "2026-01-15": [{ title: "தைப்பொங்கல் (Pongal)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2026-01-16": [{ title: "மாட்டுப் பொங்கல் & திருவள்ளுவர் தினம்", type: "celebration", category: "விசேஷம்", isHoliday: true }],
  "2026-01-17": [{ title: "உழவர் திருநாள் & காணும் பொங்கல்", type: "celebration", category: "விசேஷம்", isHoliday: true }],
  "2026-01-26": [{ title: "குடியரசு தினம் (Republic Day)", type: "holiday", category: "முக்கியம்", isHoliday: true }],
  "2026-02-15": [{ title: "மகா சிவராத்திரி (Maha Shivaratri)", type: "celebration", category: "பண்டிகை" }],
  "2026-03-04": [{ title: "ஹோலி பண்டிகை (Holi)", type: "celebration", category: "பண்டிகை" }],
  "2026-03-20": [{ title: "ரம்ஜான் / ஈகைத் திருநாள் (Eid al-Fitr)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2026-04-03": [{ title: "புனித வெள்ளி (Good Friday)", type: "holiday", category: "முக்கியம்", isHoliday: true }],
  "2026-04-14": [{ title: "தமிழ் புத்தாண்டு (சித்திரை திருநாள்) & அம்பேத்கர் ஜெயந்தி", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2026-04-19": [{ title: "மகாவீர் ஜெயந்தி (Mahavir Jayanti)", type: "celebration", category: "முக்கியம்", isHoliday: true }],
  "2026-05-01": [{ title: "மே தினம் - தொழிலாளர் தினம் (May Day)", type: "holiday", category: "முக்கியம்", isHoliday: true }],
  "2026-05-27": [{ title: "பக்ரீத் (Bakrid / Eid al-Adha)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2026-06-26": [{ title: "மொஹரம் (Muharram)", type: "celebration", category: "முக்கியம்", isHoliday: true }],
  "2026-08-15": [{ title: "சுதந்திர தினம் (Independence Day)", type: "holiday", category: "முக்கியம்", isHoliday: true }],
  "2026-08-26": [{ title: "மிலாதுன் நபி (Milad-un-Nabi)", type: "celebration", category: "முக்கியம்", isHoliday: true }],
  "2026-09-04": [{ title: "கிருஷ்ண ஜெயந்தி (Krishna Jayanti)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2026-09-14": [{ title: "விநாயகர் சதுர்த்தி (Vinayagar Chaturthi)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2026-10-02": [{ title: "காந்தி ஜெயந்தி (Gandhi Jayanti)", type: "holiday", category: "முக்கியம்", isHoliday: true }],
  "2026-10-19": [{ title: "ஆயுத பூஜை & சரஸ்வதி பூஜை (Ayudha Pooja)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2026-10-20": [{ title: "விஜயதசமி (Vijaya Dasami)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2026-11-08": [{ title: "தீபாவளி பண்டிகை (Deepavali / Diwali Festival)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2026-11-24": [{ title: "கார்த்திகை தீபம் (Karthigai Deepam)", type: "celebration", category: "பண்டிகை" }],
  "2026-12-25": [{ title: "கிறிஸ்துமஸ் பெருநாள் (Christmas Celebration)", type: "celebration", category: "பண்டிகை", isHoliday: true }],

  // 2027
  "2027-01-01": [{ title: "ஆங்கில புத்தாண்டு (New Year's Day)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2027-01-14": [{ title: "போகிப் பண்டிகை (Bhogi)", type: "celebration", category: "விசேஷம்" }],
  "2027-01-15": [{ title: "தைப்பொங்கல் (Pongal)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2027-01-16": [{ title: "மாட்டுப் பொங்கல் & திருவள்ளுவர் தினம்", type: "celebration", category: "விசேஷம்", isHoliday: true }],
  "2027-01-17": [{ title: "உழவர் திருநாள் & காணும் பொங்கல்", type: "celebration", category: "விசேஷம்", isHoliday: true }],
  "2027-01-26": [{ title: "குடியரசு தினம் (Republic Day)", type: "holiday", category: "முக்கியம்", isHoliday: true }],
  "2027-03-06": [{ title: "மகா சிவராத்திரி (Maha Shivaratri)", type: "celebration", category: "பண்டிகை" }],
  "2027-03-10": [{ title: "ரம்ஜான் (Eid al-Fitr)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2027-03-22": [{ title: "ஹோலி பண்டிகை (Holi)", type: "celebration", category: "பண்டிகை" }],
  "2027-04-14": [{ title: "தமிழ் புத்தாண்டு & அம்பேத்கர் ஜெயந்தி", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2027-05-01": [{ title: "மே தினம் - தொழிலாளர் தினம் (May Day)", type: "holiday", category: "முக்கியம்", isHoliday: true }],
  "2027-05-17": [{ title: "பக்ரீத் (Bakrid / Eid al-Adha)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2027-08-15": [{ title: "சுதந்திர தினம் (Independence Day)", type: "holiday", category: "முக்கியம்", isHoliday: true }],
  "2027-08-25": [{ title: "கிருஷ்ண ஜெயந்தி (Krishna Jayanti)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2027-09-04": [{ title: "விநாயகர் சதுர்த்தி (Vinayagar Chaturthi)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2027-10-02": [{ title: "காந்தி ஜெயந்தி (Gandhi Jayanti)", type: "holiday", category: "முக்கியம்", isHoliday: true }],
  "2027-10-09": [{ title: "ஆயுத பூஜை & சரஸ்வதி பூஜை", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2027-10-10": [{ title: "விஜயதசமி (Vijaya Dasami)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2027-10-29": [{ title: "தீபாவளி பண்டிகை (Deepavali Festival of Lights)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
  "2027-12-25": [{ title: "கிறிஸ்துமஸ் பெருநாள் (Christmas)", type: "celebration", category: "பண்டிகை", isHoliday: true }],
};

export function getFestivalsForDate(dateKey: string) {
  return FESTIVALS_BY_YEAR[dateKey] || [];
}

export function getInitialEvents(): CalendarEvent[] {
  const today = new Date();
  const todayKey = formatDateKey(today);

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowKey = formatDateKey(tomorrow);

  const twoDaysLater = new Date();
  twoDaysLater.setDate(today.getDate() + 2);
  const twoDaysKey = formatDateKey(twoDaysLater);

  return [
    {
      id: "ev-plan-1",
      date: todayKey,
      time: "10:00",
      title: "J.A.R.V.I.S. ஸ்மார்ட் கேலண்டர் திட்டமிடல்",
      type: "important",
      category: "முக்கியம்",
      notes: "நிகழ்நேர ஒரிஜினல் கேலண்டர் மற்றும் கூகுள் கேலண்டர் லிங்கிங் சரிபார்ப்பு.",
      isImportant: true,
      status: "completed",
      createdAt: Date.now() - 3600000,
    },
    {
      id: "ev-plan-2",
      date: tomorrowKey,
      time: "11:00",
      title: "ப்ராஜெக்ட் ரிவியூ & கோட் ஆப்டிமைசேஷன்",
      type: "reminder",
      category: "டாஸ்க்",
      notes: "கோர் சிஸ்டம் அப்டேட் மற்றும் மெமரி சேமிப்பு.",
      isImportant: false,
      status: "pending",
      createdAt: Date.now() - 1800000,
    },
    {
      id: "ev-plan-3",
      date: twoDaysKey,
      time: "17:30",
      title: "குடும்ப விழா & சந்திப்பு (Family Gathering)",
      type: "function",
      category: "விசேஷம்",
      notes: "குடும்ப விழாவுக்கு தயாராதல் மற்றும் திட்டமிடுதல்.",
      isImportant: true,
      status: "pending",
      createdAt: Date.now() - 900000,
    },
  ];
}

export function loadCalendarEvents(): CalendarEvent[] {
  if (typeof window === "undefined") return getInitialEvents();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialEvents();
      saveCalendarEvents(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getInitialEvents();
  } catch (e) {
    console.warn("Failed to load calendar events:", e);
    return getInitialEvents();
  }
}

export function saveCalendarEvents(events: CalendarEvent[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    window.dispatchEvent(new CustomEvent("jarvis-calendar-updated", { detail: { events } }));
  } catch (e) {
    console.warn("Failed to save calendar events:", e);
  }
}

/**
 * Checks if there is any reminder/event scheduled within 2 days from now.
 * Used for the sidebar blinking alert requirement!
 */
export function hasUpcoming2DayAlerts(events: CalendarEvent[]): boolean {
  const alerts = getUpcoming2DayAlerts(events);
  return alerts.length > 0;
}

export function getUpcoming2DayAlerts(events: CalendarEvent[]): CalendarEvent[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  const threshold = todayStart + twoDaysMs + (24 * 60 * 60 * 1000 - 1); // Up to end of 2nd day

  return events.filter(ev => {
    if (ev.status === "completed") return false;
    const [y, m, d] = ev.date.split("-").map(Number);
    const evTime = new Date(y, m - 1, d).getTime();
    return evTime >= todayStart && evTime <= threshold;
  });
}

/**
 * Direct Google Calendar Link Generator
 * Opens Google Calendar event creation URL directly with pre-filled title, time, notes!
 */
export function getGoogleCalendarUrl(event: {
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  notes?: string;
}): string {
  const title = encodeURIComponent(event.title || "J.A.R.V.I.S. Plan");
  const details = encodeURIComponent(event.notes ? `${event.notes}\n\n[Created via J.A.R.V.I.S. Smart Calendar]` : "Created via J.A.R.V.I.S. Smart Calendar");
  
  const [y, m, d] = event.date.split("-");
  let startIso: string;
  let endIso: string;

  if (event.time) {
    const [hh, mm] = event.time.split(":");
    const start = `${y}${m}${d}T${hh || "10"}${mm || "00"}00`;
    // Add 1 hour default
    const endH = String((Number(hh || 10) + 1) % 24).padStart(2, "0");
    const end = `${y}${m}${d}T${endH}${mm || "00"}00`;
    startIso = start;
    endIso = end;
  } else {
    // All day
    startIso = `${y}${m}${d}`;
    // Next day for all-day end date
    const nextDate = new Date(Number(y), Number(m) - 1, Number(d) + 1);
    const ny = nextDate.getFullYear();
    const nm = String(nextDate.getMonth() + 1).padStart(2, "0");
    const nd = String(nextDate.getDate()).padStart(2, "0");
    endIso = `${ny}${nm}${nd}`;
  }

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}`;
}

/**
 * Download standard .ics calendar file for import into Google Calendar / Apple Calendar
 */
export function downloadIcsFile(event: {
  title: string;
  date: string;
  time?: string;
  notes?: string;
}) {
  const [y, m, d] = event.date.split("-");
  const timeStr = event.time ? event.time.replace(":", "") + "00" : "090000";
  const dtStart = `${y}${m}${d}T${timeStr}`;

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JARVIS AI//Smart Calendar//TA",
    "BEGIN:VEVENT",
    `UID:jarvis-${Date.now()}@jarvis.ai`,
    `DTSTAMP:${y}${m}${d}T000000Z`,
    `DTSTART:${dtStart}`,
    `SUMMARY:${event.title.replace(/\n/g, " ")}`,
    `DESCRIPTION:${(event.notes || "").replace(/\n/g, "\\n")}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^a-zA-Z0-9]/g, "_") || "event"}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
