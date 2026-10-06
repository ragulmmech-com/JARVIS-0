import React, { useState, useEffect, useMemo } from "react";
import { 
  Calendar as CalendarIcon, CalendarDays, BellRing, Clock, 
  CheckCircle2, Plus, Trash2, X, ChevronLeft, ChevronRight, 
  ExternalLink, Download, Check, Sparkles, AlertCircle
} from "lucide-react";
import { 
  CalendarEvent, 
  loadCalendarEvents, 
  saveCalendarEvents, 
  getUpcoming2DayAlerts, 
  formatDateKey, 
  getFestivalsForDate,
  getGoogleCalendarUrl,
  downloadIcsFile
} from "../lib/smartCalendarStorage";

interface SmartCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MONTH_NAMES_TA = [
  "ஜனவரி (January)", "பிப்ரவரி (February)", "மார்ச் (March)", 
  "ஏப்ரல் (April)", "மே (May)", "ஜூன் (June)", 
  "ஜூலை (July)", "ஆகஸ்ட் (August)", "செப்டம்பர் (September)", 
  "அக்டோபர் (October)", "நவம்பர் (November)", "டிசம்பர் (December)"
];

const WEEKDAYS_SHORT_TA = ["ஞா", "தி", "செ", "பு", "வி", "வெ", "ச"];
const WEEKDAYS_FULL_TA = ["ஞாயிற்றுக்கிழமை", "திங்கட்கிழமை", "செவ்வாய்க்கிழமை", "புதன்கிழமை", "வியாழக்கிழமை", "வெள்ளிக்கிழமை", "சனிக்கிழமை"];

export const SmartCalendarModal: React.FC<SmartCalendarModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>(loadCalendarEvents);
  
  // Real current date
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDateKey(today), [today]);

  const [currentYear, setCurrentYear] = useState<number>(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);

  // Quick Plan Creation Form State
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [planTitle, setPlanTitle] = useState("");
  const [planTime, setPlanTime] = useState("10:00");
  const [planCategory, setPlanCategory] = useState<CalendarEvent["category"]>("முக்கியம்");
  const [planNotes, setPlanNotes] = useState("");
  const [syncToGoogleOnAdd, setSyncToGoogleOnAdd] = useState(false);

  // Sync events from storage or custom events
  useEffect(() => {
    const handleUpdate = () => {
      setEvents(loadCalendarEvents());
    };
    window.addEventListener("jarvis-calendar-updated", handleUpdate);
    return () => window.removeEventListener("jarvis-calendar-updated", handleUpdate);
  }, []);

  // Upcoming 2-day alerts
  const upcomingAlerts = useMemo(() => getUpcoming2DayAlerts(events), [events]);

  // Selected date events
  const selectedDateEvents = useMemo(() => {
    return events.filter(e => e.date === selectedDate);
  }, [events, selectedDate]);

  // Festivals & Holidays for selected date
  const festivalsForSelectedDate = useMemo(() => {
    return getFestivalsForDate(selectedDate);
  }, [selectedDate]);

  if (!isOpen) return null;

  // Month Navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(todayKey);
  };

  // Add new plan
  const handleAddPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle.trim()) return;

    const newEv: CalendarEvent = {
      id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: selectedDate,
      time: planTime,
      title: planTitle.trim(),
      category: planCategory,
      type: "reminder",
      notes: planNotes.trim(),
      isImportant: planCategory === "முக்கியம்" || planCategory === "பண்டிகை",
      status: "pending",
      createdAt: Date.now(),
    };

    const updated = [newEv, ...events];
    setEvents(updated);
    saveCalendarEvents(updated);

    if (syncToGoogleOnAdd) {
      const gUrl = getGoogleCalendarUrl(newEv);
      window.open(gUrl, "_blank", "noopener,noreferrer");
    }

    // Reset Form
    setPlanTitle("");
    setPlanNotes("");
    setIsAddingPlan(false);
  };

  // Toggle complete plan
  const handleToggleComplete = (id: string) => {
    const updated = events.map(ev => {
      if (ev.id === id) {
        return {
          ...ev,
          status: ev.status === "completed" ? "pending" : "completed",
        } as CalendarEvent;
      }
      return ev;
    });
    setEvents(updated);
    saveCalendarEvents(updated);
  };

  // Delete plan
  const handleDeleteEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    saveCalendarEvents(updated);
  };

  // Calendar Grid calculation for Monthly view
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Selected date human readable in Tamil
  const [selY, selM, selD] = selectedDate.split("-").map(Number);
  const selectedDateObj = new Date(selY, selM - 1, selD);
  const selectedDayOfWeek = WEEKDAYS_FULL_TA[selectedDateObj.getDay()];

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#070b14] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,243,255,0.2)] overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/20 bg-slate-900/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  J.A.R.V.I.S. Smart Calendar
                </h2>
                {upcomingAlerts.length > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full animate-pulse">
                    <BellRing className="w-3 h-3" /> {upcomingAlerts.length} வரவிருக்கும் நிகழ்வுகள்
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                நிகழ்நேர ஒரிஜினல் கேலண்டர் • துல்லியமான பண்டிகை & திட்டமிடல்
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* DIRECT GOOGLE CALENDAR LINK BUTTON */}
            <a
              href="https://calendar.google.com/calendar/u/0/r"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 transition-all hover:scale-[1.02] shadow-sm"
              title="கூகுள் கேலண்டரை நேரடியாக திறக்க (Open Google Calendar in Browser)"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z" />
              </svg>
              <span>Google Calendar திறக்க</span>
              <ExternalLink className="w-3 h-3 text-blue-400 opacity-80" />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="மூடுக (Close)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY: SPLIT VIEW (LEFT: CALENDAR GRID, RIGHT: AGENDA & PLANS) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          
          {/* LEFT: CALENDAR GRID (7 COLS) */}
          <div className="lg:col-span-7 p-5 flex flex-col justify-between">
            <div>
              {/* MONTH / YEAR CONTROLS */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-cyan-300">
                    {MONTH_NAMES_TA[currentMonth]} {currentYear}
                  </h3>
                  <button
                    onClick={handleJumpToToday}
                    className="px-2 py-0.5 text-xs font-medium rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-colors"
                  >
                    இன்று (Today)
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-900 border border-slate-750 rounded-lg p-1">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="முந்தைய மாதம்"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="அடுத்த மாதம்"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* WEEKDAYS HEADER */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {WEEKDAYS_SHORT_TA.map((w, idx) => (
                  <div 
                    key={w} 
                    className={`py-1 text-xs font-semibold ${
                      idx === 0 ? "text-rose-400" : idx === 6 ? "text-amber-400" : "text-slate-400"
                    }`}
                  >
                    {w}
                  </div>
                ))}
              </div>

              {/* DAYS GRID */}
              <div className="grid grid-cols-7 gap-1.5">
                {/* Previous month filler days */}
                {Array.from({ length: firstDayIndex }).map((_, i) => {
                  const dayNum = daysInPrevMonth - firstDayIndex + 1 + i;
                  return (
                    <div 
                      key={`prev-${i}`} 
                      className="h-12 rounded-lg p-1.5 text-slate-600 bg-slate-900/20 text-xs flex flex-col justify-between opacity-40 select-none cursor-default"
                    >
                      <span>{dayNum}</span>
                    </div>
                  );
                })}

                {/* Current month days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                  const isSelected = selectedDate === dateStr;
                  const isToday = todayKey === dateStr;
                  
                  // Check festivals
                  const dayFestivals = getFestivalsForDate(dateStr);
                  const hasFestival = dayFestivals.length > 0;
                  
                  // Check user plans
                  const dayPlans = events.filter(e => e.date === dateStr);
                  const hasPlans = dayPlans.length > 0;

                  // Check if this date has a 2-day alert
                  const has2DayAlert = upcomingAlerts.some(a => a.date === dateStr);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`h-12 rounded-lg p-1.5 text-left relative flex flex-col justify-between transition-all ${
                        isSelected 
                          ? "bg-cyan-500/20 border-2 border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.25)] text-white" 
                          : isToday 
                            ? "bg-slate-800/80 border border-cyan-500/50 text-cyan-200" 
                            : "bg-slate-900/50 hover:bg-slate-850 border border-slate-800/80 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-semibold ${
                          isSelected ? "text-cyan-300" : isToday ? "text-cyan-400 font-bold" : ""
                        }`}>
                          {dayNum}
                        </span>

                        {isToday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ring-2 ring-cyan-400/30" />
                        )}
                      </div>

                      {/* BADGES/DOTS */}
                      <div className="flex items-center gap-1 mt-auto overflow-hidden">
                        {hasFestival && (
                          <span 
                            className="w-2 h-2 rounded-full bg-amber-400 shrink-0" 
                            title={dayFestivals[0].title}
                          />
                        )}
                        {hasPlans && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                        )}
                        {has2DayAlert && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* QUICK LEGEND */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>இன்று (Today)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>பண்டிகைகள் / விடுமுறை (Festivals)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>2-நாள் முந்தைய எச்சரிக்கை (2-Day Alert)</span>
              </div>
            </div>
          </div>

          {/* RIGHT: SELECTED DATE AGENDA, FESTIVALS, AND DIRECT PLANS (5 COLS) */}
          <div className="lg:col-span-5 p-5 flex flex-col justify-between bg-slate-950/40">
            <div>
              {/* SELECTED DATE HEADER */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{selectedDayOfWeek}</span>
                  </h3>
                  <p className="text-xs text-cyan-400 font-mono mt-0.5">
                    {selectedDate}
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingPlan(prev => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-[0_0_10px_rgba(0,243,255,0.3)]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>திட்டம் சேர்க்க</span>
                </button>
              </div>

              {/* FESTIVALS & SPECIAL DAYS CARD IF ANY */}
              {festivalsForSelectedDate.length > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>பண்டிகை & அரசு விடுமுறை நாள்:</span>
                  </div>
                  {festivalsForSelectedDate.map((f, i) => (
                    <div key={i} className="text-sm font-semibold text-white">
                      🎉 {f.title}
                    </div>
                  ))}
                </div>
              )}

              {/* QUICK ADD PLAN FORM */}
              {isAddingPlan && (
                <form 
                  onSubmit={handleAddPlan}
                  className="mt-3 p-3 rounded-xl bg-slate-900 border border-cyan-500/30 animate-fadeIn space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300">
                      புதிய திட்டம் அல்லது நினைவூட்டல்
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingPlan(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="திட்டம் அல்லது தலைப்பு (எ.கா: தீபாவளி ஷாப்பிங், மீட்டிங்)..."
                      value={planTitle}
                      onChange={(e) => setPlanTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">நேரம் (Time)</label>
                      <input
                        type="time"
                        value={planTime}
                        onChange={(e) => setPlanTime(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">வகை (Category)</label>
                      <select
                        value={planCategory}
                        onChange={(e) => setPlanCategory(e.target.value as any)}
                        className="w-full px-2 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="முக்கியம்">முக்கியம்</option>
                        <option value="பண்டிகை">பண்டிகை</option>
                        <option value="விசேஷம்">விசேஷம்</option>
                        <option value="டாஸ்க்">டாஸ்க்</option>
                        <option value="நோட்ஸ்">நோட்ஸ்</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <textarea
                      placeholder="கூடுதல் குறிப்புகள் (Notes)..."
                      value={planNotes}
                      onChange={(e) => setPlanNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={syncToGoogleOnAdd}
                        onChange={(e) => setSyncToGoogleOnAdd(e.target.checked)}
                        className="rounded border-slate-700 text-blue-500 focus:ring-0"
                      />
                      <span>Google Calendar-ல் உடனே திறக்க</span>
                    </label>

                    <button
                      type="submit"
                      disabled={!planTitle.trim()}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors"
                    >
                      சேமிக்க (Save Plan)
                    </button>
                  </div>
                </form>
              )}

              {/* LIST OF PLANS FOR SELECTED DATE */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">
                    இந்த நாளுக்கான திட்டங்கள் ({selectedDateEvents.length})
                  </span>
                </div>

                {selectedDateEvents.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    இந்த தேதியில் இதுவரை திட்டங்கள் ஏதுமில்லை.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[36vh] overflow-y-auto pr-1">
                    {selectedDateEvents.map(event => {
                      const isDone = event.status === "completed";
                      const gCalUrl = getGoogleCalendarUrl(event);

                      return (
                        <div
                          key={event.id}
                          className={`p-3 rounded-xl border transition-all ${
                            isDone 
                              ? "bg-slate-900/40 border-slate-800 opacity-60" 
                              : "bg-slate-900/80 border-slate-750 hover:border-cyan-500/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <button
                                onClick={() => handleToggleComplete(event.id)}
                                className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                  isDone 
                                    ? "bg-emerald-500 border-emerald-500 text-black" 
                                    : "border-slate-600 hover:border-cyan-400 text-transparent"
                                }`}
                                title={isDone ? "முடிக்கப்படாததாக மாற்ற" : "முடித்ததாகக் குறிக்க"}
                              >
                                <Check className="w-3 h-3" />
                              </button>

                              <div>
                                <h4 className={`text-xs font-semibold ${isDone ? "line-through text-slate-400" : "text-white"}`}>
                                  {event.title}
                                </h4>
                                
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                  {event.time && (
                                    <span className="flex items-center gap-1 font-mono text-cyan-300">
                                      <Clock className="w-3 h-3" /> {event.time}
                                    </span>
                                  )}
                                  <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300">
                                    {event.category}
                                  </span>
                                </div>

                                {event.notes && (
                                  <p className="mt-1 text-xs text-slate-300">
                                    {event.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* ADD TO GOOGLE CALENDAR BUTTON */}
                              <a
                                href={gCalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded text-blue-400 hover:text-blue-300 hover:bg-blue-500/15 transition-colors"
                                title="Google Calendar-ல் சேர்க்க (Add to Google Calendar)"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>

                              {/* DOWNLOAD .ICS BUTTON */}
                              <button
                                onClick={() => downloadIcsFile(event)}
                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                title="Download .ICS file"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              {/* DELETE BUTTON */}
                              <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="நீக்குக (Delete)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* UPCOMING 2-DAY ALERTS BANNER AT BOTTOM */}
            {upcomingAlerts.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300 mb-2">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  <span>அடுத்த 2 நாள் எச்சரிக்கை அறிவிப்புகள் ({upcomingAlerts.length}):</span>
                </div>
                <div className="space-y-1.5 max-h-24 overflow-y-auto">
                  {upcomingAlerts.slice(0, 3).map(alert => (
                    <div 
                      key={alert.id}
                      onClick={() => setSelectedDate(alert.date)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs flex items-center justify-between cursor-pointer hover:bg-rose-500/20 transition-colors"
                    >
                      <span className="truncate font-medium text-slate-200">{alert.title}</span>
                      <span className="font-mono text-[10px] text-rose-400 shrink-0 ml-2">{alert.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-900/60 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>நிகழ்நேர ஒரிஜினல் கேலண்டர் தயார் • முழுமையான லோக்கல் & கூகுள் கேலண்டர் லிங்கிங்</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
            >
              முடிந்தது (Done)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
