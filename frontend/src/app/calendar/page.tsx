"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { fetchMeetings, createMeeting, deleteMeeting, fetchProjects } from "@/lib/api";
import { MeetingItem, MeetingType, Project } from "@/types";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Plus,
  Search,
  Filter,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Layers,
  Briefcase,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CalendarRange,
  X,
  ListFilter
} from "lucide-react";
import { cn } from "@/lib/utils";

const MEETING_TYPES: MeetingType[] = [
  "Sprint Planning",
  "1-on-1 Review",
  "Architecture Sync",
  "Design Review",
  "Executive Briefing",
];

const MEETING_TYPE_STYLES: Record<
  MeetingType,
  { bg: string; text: string; border: string; dot: string; pill: string }
> = {
  "Sprint Planning": {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-600",
    pill: "bg-indigo-100 text-indigo-800",
  },
  "1-on-1 Review": {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-600",
    pill: "bg-emerald-100 text-emerald-800",
  },
  "Architecture Sync": {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-600",
    pill: "bg-purple-100 text-purple-800",
  },
  "Design Review": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-600",
    pill: "bg-amber-100 text-amber-800",
  },
  "Executive Briefing": {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-600",
    pill: "bg-rose-100 text-rose-800",
  },
};

const DEFAULT_ATTENDEE_PRESETS = [
  "Arjun Reddy",
  "Ishita Rao",
  "Rahul Kumar",
  "Priya Sharma",
  "Sneha Patel",
  "Vikram Singh",
  "Ananya Rao",
  "Divya Menon"
];

const getLocalDateString = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getValidMeetingUrl = (raw: string | undefined | null): string | null => {
  if (!raw || !raw.trim()) return null;
  const text = raw.trim();

  // 1. Direct http/https URL
  const httpMatch = text.match(/https?:\/\/[^\s)>]+/i);
  if (httpMatch) {
    return httpMatch[0];
  }

  // 2. Parenthesized URL like "Google Meet (meet.google.com/abc)"
  const parenMatch = text.match(/\((meet\.google\.com\/[^\s)]+|[^\s)]*zoom\.us\/[^\s)]+|teams\.microsoft\.com\/[^\s)]+)\)/i);
  if (parenMatch && parenMatch[1]) {
    return `https://${parenMatch[1]}`;
  }

  // 3. Domain path without protocol
  const domainMatch = text.match(/([a-zA-Z0-9.-]+\.(?:zoom\.us|google\.com|microsoft\.com)\/[^\s)]+)/i);
  if (domainMatch && domainMatch[1]) {
    return `https://${domainMatch[1]}`;
  }

  return null;
};

function CalendarPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // View state: 'month' | 'week' | 'agenda'
  const [viewMode, setViewMode] = useState<"month" | "week" | "agenda">("month");

  // Date Navigation State - Real Current Date
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => getLocalDateString());

  // Real Today String
  const todayDateStr = useMemo(() => getLocalDateString(new Date()), []);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");

  // Schedule Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State for creating a meeting
  const [formTitle, setFormTitle] = useState("");
  const [formProjectId, setFormProjectId] = useState<string>("general");
  const [formDate, setFormDate] = useState<string>(() => getLocalDateString());
  const [formStartTime, setFormStartTime] = useState<string>("10:30 AM");
  const [formEndTime, setFormEndTime] = useState<string>("11:30 AM");
  const [formDuration, setFormDuration] = useState<number>(60);
  const [formType, setFormType] = useState<MeetingType>("Sprint Planning");
  const [formAttendees, setFormAttendees] = useState<string[]>(["Arjun Reddy", "Ishita Rao"]);
  const [customAttendee, setCustomAttendee] = useState("");
  const [formAgenda, setFormAgenda] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [n8nToastMessage, setN8nToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [meets, projs] = await Promise.all([
        fetchMeetings(),
        fetchProjects().catch(() => []),
      ]);
      setMeetings(meets);
      setProjects(projs);
    } catch (err) {
      console.error("Failed to load calendar data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Check URL param ?schedule=true
  useEffect(() => {
    if (searchParams.get("schedule") === "true") {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  // Sync form date with selected date
  useEffect(() => {
    setFormDate(selectedDateStr);
  }, [selectedDateStr]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(getLocalDateString(now));
  };

  // Calendar Grid Calculation
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun, 1 is Mon...
  // Shift so Monday is index 0
  const startOffset = (firstDayIndex + 6) % 7;

  // Filtered Meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (selectedProjectFilter !== "ALL") {
        if (selectedProjectFilter === "general" && m.project_id) return false;
        if (selectedProjectFilter !== "general" && m.project_id !== selectedProjectFilter) return false;
      }
      if (selectedTypeFilter !== "ALL" && m.type !== selectedTypeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesProject = m.project_name.toLowerCase().includes(q);
        const matchesAgenda = m.agenda.toLowerCase().includes(q);
        const matchesAttendee = m.attendees.some((a) => a.toLowerCase().includes(q));
        if (!matchesTitle && !matchesProject && !matchesAgenda && !matchesAttendee) {
          return false;
        }
      }
      return true;
    });
  }, [meetings, selectedProjectFilter, selectedTypeFilter, searchQuery]);

  // Meetings mapped by date YYYY-MM-DD
  const meetingsByDate = useMemo(() => {
    const map: Record<string, MeetingItem[]> = {};
    filteredMeetings.forEach((m) => {
      if (!map[m.date]) map[m.date] = [];
      map[m.date].push(m);
    });
    return map;
  }, [filteredMeetings]);

  // Selected Day Meetings
  const selectedDayMeetings = meetingsByDate[selectedDateStr] || [];

  // Metrics
  const todayCount = (meetingsByDate[todayDateStr] || []).length;
  const totalCount = meetings.length;
  const uniqueParticipants = Array.from(new Set(meetings.flatMap((m) => m.attendees))).length;

  const handleOpenScheduleModal = (prefillDate?: string) => {
    if (prefillDate) {
      setFormDate(prefillDate);
    } else {
      setFormDate(selectedDateStr);
    }
    setFormTitle("");
    setFormAgenda("");
    setFormError("");
    setIsCreateModalOpen(true);
  };

  const handleToggleAttendee = (name: string) => {
    setFormAttendees((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const handleAddCustomAttendee = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAttendee.trim() && !formAttendees.includes(customAttendee.trim())) {
      setFormAttendees([...formAttendees, customAttendee.trim()]);
      setCustomAttendee("");
    }
  };

  const handleCreateMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Please provide a meeting title.");
      return;
    }
    if (!formDate) {
      setFormError("Please select a meeting date.");
      return;
    }
    if (formAttendees.length === 0) {
      setFormError("Please add at least one attendee.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const selectedProj = projects.find((p) => p.id === formProjectId);
      const payload = {
        title: formTitle.trim(),
        project_id: formProjectId === "general" ? undefined : formProjectId,
        project_name: selectedProj ? selectedProj.name : "General Sprint & Portfolio Sync",
        date: formDate,
        start_time: formStartTime,
        end_time: formEndTime,
        duration_minutes: formDuration,
        type: formType,
        attendees: formAttendees,
        location_or_link: "",
        agenda: formAgenda.trim(),
      };

      const newMeet = await createMeeting(payload);
      setMeetings((prev) => [...prev, newMeet]);
      setIsCreateModalOpen(false);
      setSelectedDateStr(formDate);
      
      const successText = newMeet.location_or_link
        ? `Meeting created successfully! Zoom link generated (${newMeet.location_or_link}) & invitations emailed to members.`
        : `Meeting created successfully! Zoom scheduling automation triggered & invitations emailed to members.`;
      
      setN8nToastMessage(successText);
      setTimeout(() => setN8nToastMessage(null), 8000);
    } catch (err: any) {
      setFormError(err.message || "Failed to schedule meeting via n8n automation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: string, title: string) => {
    if (confirm(`Cancel and delete the meeting "${title}"?`)) {
      try {
        await deleteMeeting(meetingId);
        setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
      } catch (err) {
        alert("Failed to delete meeting");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans relative">
      <Navbar />

      {/* Floating n8n Automation Toast */}
      {n8nToastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md rounded-2xl bg-slate-900 text-white p-4 shadow-2xl border border-indigo-500/40 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#6366f1] text-white text-xs font-bold flex-shrink-0">⚡</span>
          <div className="text-xs min-w-0 flex-1">
            <div className="font-bold text-indigo-300">n8n Automation Triggered</div>
            <div className="text-slate-200 mt-0.5">{n8nToastMessage}</div>
          </div>
          <button
            onClick={() => setN8nToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        
        {/* 1. Header Ribbon & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-[#4f46e5] border border-indigo-200">
                Workspace Calendar
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Team Schedules & Sync Milestones
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Welcome, <strong className="text-slate-800">{user?.name || "Arjun Reddy"}</strong> • Coordinate sprint syncs, client briefings, and architecture reviews.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex items-center rounded-xl bg-slate-200/70 p-1 text-xs font-semibold text-slate-600 shadow-inner">
              <button
                onClick={() => setViewMode("month")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all",
                  viewMode === "month"
                    ? "bg-white text-slate-900 shadow-sm font-bold"
                    : "hover:text-slate-900"
                )}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all",
                  viewMode === "week"
                    ? "bg-white text-slate-900 shadow-sm font-bold"
                    : "hover:text-slate-900"
                )}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode("agenda")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all",
                  viewMode === "agenda"
                    ? "bg-white text-slate-900 shadow-sm font-bold"
                    : "hover:text-slate-900"
                )}
              >
                Agenda
              </button>
            </div>

            {/* Schedule Meeting Primary CTA Button */}
            <button
              onClick={() => handleOpenScheduleModal()}
              className="flex items-center gap-2 rounded-xl bg-[#6366f1] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#4f46e5] transition-all shadow-sm shadow-indigo-500/20 active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Meeting</span>
            </button>
          </div>
        </div>

        {/* 2. Top Summary KPI Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-[#6366f1]">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{totalCount}</div>
              <div className="text-xs font-medium text-slate-500">Scheduled Meets</div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{todayCount}</div>
              <div className="text-xs font-medium text-slate-500">Today's Syncs</div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{uniqueParticipants}</div>
              <div className="text-xs font-medium text-slate-500">Active Attendees</div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">100%</div>
              <div className="text-xs font-medium text-slate-500">AI Synced</div>
            </div>
          </div>
        </div>

        {/* 3. Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search meetings, attendees, agenda topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Project Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <Briefcase className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="rounded-xl border border-slate-200/80 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
              >
                <option value="ALL">All Projects</option>
                <option value="general">General / Portfolio Sync</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Meeting Type Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="rounded-xl border border-slate-200/80 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
              >
                <option value="ALL">All Types</option>
                {MEETING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 4. Main Body: Calendar Grid / Views & Day Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left 2 Columns: Calendar View */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Calendar Controls & Month Header */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {monthNames[month]} {year}
                </h2>
                <button
                  onClick={handleToday}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* View Renderers */}
            {viewMode === "month" && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-2">
                {/* Day Names Header */}
                <div className="grid grid-cols-7 text-center font-bold text-xs text-slate-400 pb-2 border-b border-slate-100">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>

                {/* Calendar Days Cells */}
                <div className="grid grid-cols-7 gap-1.5">
                  {/* Empty offset days */}
                  {[...Array(startOffset)].map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="min-h-[88px] rounded-xl border border-dashed border-slate-100 bg-slate-50/50 p-1.5 opacity-40"
                    />
                  ))}

                  {/* Month days */}
                  {[...Array(daysInMonth)].map((_, i) => {
                    const dayNumber = i + 1;
                    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
                    const dayMeets = meetingsByDate[dateString] || [];
                    const isSelected = selectedDateStr === dateString;
                    const isToday = dateString === todayDateStr;

                    return (
                      <div
                        key={dayNumber}
                        onClick={() => setSelectedDateStr(dateString)}
                        className={cn(
                          "min-h-[92px] rounded-xl border p-2 flex flex-col justify-between transition-all cursor-pointer group text-left relative",
                          isSelected
                            ? "border-[#6366f1] bg-indigo-50/30 ring-2 ring-[#6366f1]/20 shadow-sm"
                            : "border-slate-200/70 bg-white hover:border-indigo-300 hover:bg-slate-50/60",
                          isToday && !isSelected && "border-indigo-200 bg-indigo-50/10"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "text-xs font-bold flex items-center justify-center h-6 w-6 rounded-full",
                              isToday
                                ? "bg-[#6366f1] text-white shadow-xs"
                                : isSelected
                                ? "text-[#4f46e5] font-black"
                                : "text-slate-700"
                            )}
                          >
                            {dayNumber}
                          </span>

                          {dayMeets.length > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700">
                              {dayMeets.length}
                            </span>
                          )}
                        </div>

                        {/* Meeting Event Pills */}
                        <div className="space-y-1 mt-1 overflow-hidden">
                          {dayMeets.slice(0, 2).map((m) => {
                            const style = MEETING_TYPE_STYLES[m.type] || MEETING_TYPE_STYLES["Sprint Planning"];
                            return (
                              <div
                                key={m.id}
                                className={cn(
                                  "truncate text-[10px] px-1.5 py-0.5 rounded font-medium border flex items-center gap-1",
                                  style.bg,
                                  style.text,
                                  style.border
                                )}
                                title={`${m.start_time} - ${m.title}`}
                              >
                                <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", style.dot)} />
                                <span className="truncate">{m.title}</span>
                              </div>
                            );
                          })}

                          {dayMeets.length > 2 && (
                            <span className="text-[9px] text-slate-400 font-semibold pl-1">
                              +{dayMeets.length - 2} more
                            </span>
                          )}
                        </div>

                        {/* Quick Add icon on hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenScheduleModal(dateString);
                          }}
                          className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-[#6366f1] hover:border-indigo-300 transition-opacity shadow-xs"
                          title="Schedule on this day"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {viewMode === "week" && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
                <div className="text-xs font-bold text-slate-700">
                  7-Day Schedule View around {selectedDateStr}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                  {[...Array(7)].map((_, idx) => {
                    const base = new Date(selectedDateStr + "T00:00:00");
                    const dayOfWeek = (base.getDay() + 6) % 7;
                    base.setDate(base.getDate() - dayOfWeek + idx);
                    const dStr = getLocalDateString(base);
                    const meets = meetingsByDate[dStr] || [];
                    const isSelected = selectedDateStr === dStr;
                    const isDayToday = dStr === todayDateStr;

                    return (
                      <div
                        key={dStr}
                        onClick={() => setSelectedDateStr(dStr)}
                        className={cn(
                          "rounded-xl border p-2.5 min-h-[180px] space-y-2 cursor-pointer transition-all",
                          isSelected
                            ? "border-[#6366f1] bg-indigo-50/20 shadow-xs"
                            : isDayToday
                            ? "border-indigo-200 bg-indigo-50/10"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        )}
                      >
                        <div className="border-b border-slate-100 pb-1 flex items-center justify-between">
                          <span className={cn("text-[11px] font-bold", isDayToday ? "text-[#4f46e5]" : "text-slate-500")}>
                            {base.toLocaleDateString("en-US", { weekday: "short" })}
                          </span>
                          <span className={cn(
                            "text-xs font-bold h-5 w-5 rounded-full flex items-center justify-center",
                            isDayToday ? "bg-[#6366f1] text-white" : "text-slate-800"
                          )}>
                            {base.getDate()}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {meets.length === 0 ? (
                            <div className="text-[10px] text-slate-400 italic text-center py-4">
                              No meets
                            </div>
                          ) : (
                            meets.map((m) => (
                              <div
                                key={m.id}
                                className="rounded-lg border border-slate-200 bg-slate-50 p-1.5 space-y-0.5 text-[11px]"
                              >
                                <div className="font-bold text-slate-900 truncate">{m.title}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{m.start_time}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {viewMode === "agenda" && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Master Agenda List ({filteredMeetings.length} Meetings)
                  </h3>
                  <span className="text-xs text-slate-500">Chronological sync order</span>
                </div>

                {filteredMeetings.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <CalendarRange className="h-10 w-10 text-slate-300 mx-auto" />
                    <div className="text-sm font-bold text-slate-700">No scheduled meetings found</div>
                    <p className="text-xs text-slate-400">Click "+ Schedule Meeting" above to create one.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMeetings.map((m) => {
                      const style = MEETING_TYPE_STYLES[m.type] || MEETING_TYPE_STYLES["Sprint Planning"];
                      return (
                        <div
                          key={m.id}
                          className="rounded-xl border border-slate-200/90 bg-white p-4 hover:border-slate-300 transition-all shadow-xs space-y-2.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", style.bg, style.text, style.border)}>
                                {m.type}
                              </span>
                              <span className="text-xs font-semibold text-slate-500">
                                {m.project_name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              <span>{m.date} • {m.start_time} - {m.end_time}</span>
                            </div>
                          </div>

                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{m.title}</h4>
                              {m.agenda && (
                                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{m.agenda}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => handleDeleteMeeting(m.id, m.title)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer"
                                title="Cancel meeting"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-slate-400" />
                              <div className="flex items-center gap-1">
                                {m.attendees.map((att, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                                    {att}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {(() => {
                              const validUrl = getValidMeetingUrl(m.location_or_link);
                              if (!validUrl) return null;
                              return (
                                <a
                                  href={validUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4f46e5] hover:underline bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 shadow-xs"
                                >
                                  <span>📹 {validUrl.includes("zoom") ? "Join Zoom" : validUrl.includes("meet.google") ? "Join Google Meet" : "Join Call"}</span>
                                  <span className="text-[10px]">↗</span>
                                </a>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Column: Selected Date Day Inspector & Detail Cards */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Day Agenda & Schedule
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {new Date(selectedDateStr + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h3>
                </div>

                <button
                  onClick={() => handleOpenScheduleModal(selectedDateStr)}
                  className="flex items-center gap-1 rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-[#4f46e5] hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Sync</span>
                </button>
              </div>

              {/* Day Meetings List */}
              {selectedDayMeetings.length === 0 ? (
                <div className="text-center py-8 space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 p-4">
                  <CalendarIcon className="h-8 w-8 text-slate-300 mx-auto" />
                  <div className="text-xs font-bold text-slate-700">No meetings on this day</div>
                  <p className="text-[11px] text-slate-400">Your calendar is completely open for focus work.</p>
                  <button
                    onClick={() => handleOpenScheduleModal(selectedDateStr)}
                    className="text-xs font-bold text-[#6366f1] hover:underline pt-1 inline-block cursor-pointer"
                  >
                    + Schedule a meeting
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayMeetings.map((meet) => {
                    const style = MEETING_TYPE_STYLES[meet.type] || MEETING_TYPE_STYLES["Sprint Planning"];
                    return (
                      <div
                        key={meet.id}
                        className="rounded-xl border border-slate-200/90 bg-white p-3.5 space-y-2.5 shadow-xs hover:border-slate-300 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", style.bg, style.text, style.border)}>
                            {meet.type}
                          </span>
                          <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {meet.start_time} - {meet.end_time}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#6366f1] transition-colors">
                            {meet.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {meet.project_name}
                          </p>
                        </div>

                        {meet.agenda && (
                          <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            {meet.agenda}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs pt-1">
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Users className="h-3 w-3 text-slate-400" />
                              <span>{meet.attendees.length} attendee{meet.attendees.length !== 1 ? "s" : ""}</span>
                            </div>
                            {(() => {
                              const validUrl = getValidMeetingUrl(meet.location_or_link);
                              if (!validUrl) return null;
                              return (
                                <a
                                  href={validUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4f46e5] hover:underline bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 shadow-xs"
                                >
                                  <span>📹 {validUrl.includes("zoom") ? "Zoom" : "Meet"}</span>
                                  <span className="text-[9px]">↗</span>
                                </a>
                              );
                            })()}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDeleteMeeting(meet.id, meet.title)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Cancel meeting"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Tips / Workspace Sync Info */}
            <div className="rounded-2xl border border-indigo-100 bg-[#ede9fe]/40 p-4 space-y-2 text-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-[#4f46e5]">
                <Sparkles className="h-4 w-4" />
                <span>Executive Calendar Sync</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                All meetings scheduled by managers dynamically link with project blueprints, employee task dashboards, and sprint feasibility milestones.
              </p>
            </div>
          </div>

        </div>

      </main>

      {/* 5. Schedule Meeting Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 text-slate-900 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-[#6366f1]">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Schedule Team Meeting</h3>
                  <p className="text-xs text-slate-500">Create a synchronized event for your project team.</p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateMeetingSubmit} className="space-y-4">
              
              {/* Meeting Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 4 Architecture & Safety Review"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all font-medium"
                />
              </div>

              {/* Project & Meeting Type Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Project Blueprint</label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]"
                  >
                    <option value="general">General / Portfolio Sync</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Meeting Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as MeetingType)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]"
                  >
                    {MEETING_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Start Time</label>
                  <input
                    type="text"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    placeholder="10:30 AM"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">End Time</label>
                  <input
                    type="text"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    placeholder="11:30 AM"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  />
                </div>
              </div>

              {/* Attendees Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Attendees *</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {DEFAULT_ATTENDEE_PRESETS.map((name) => {
                    const isSelected = formAttendees.includes(name);
                    return (
                      <button
                        type="button"
                        key={name}
                        onClick={() => handleToggleAttendee(name)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer",
                          isSelected
                            ? "bg-[#6366f1] text-white border-[#6366f1] shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {name} {isSelected && "✓"}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add custom attendee (name or email)..."
                    value={customAttendee}
                    onChange={(e) => setCustomAttendee(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAttendee}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Agenda / Objectives */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Agenda & Objectives</label>
                <textarea
                  rows={3}
                  value={formAgenda}
                  onChange={(e) => setFormAgenda(e.target.value)}
                  placeholder="Outline key deliverables, design questions, or discussion points..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                />
              </div>

              {/* n8n Automation Workflow Badge */}
              <div className="rounded-xl border border-indigo-100 bg-[#ede9fe]/30 p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#6366f1] text-white text-[11px] font-bold">⚡</span>
                  <div>
                    <div className="font-bold text-slate-800">n8n Email Workflow Trigger</div>
                    <div className="text-[10px] text-slate-500">Auto-generates & sends Project Assignment Reminder emails to attendees</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Active
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-[#6366f1] px-5 py-2 text-xs font-bold text-white hover:bg-[#4f46e5] transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span>{submitting ? "Scheduling..." : "Confirm & Schedule"}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Calendar...</div>}>
      <CalendarPageContent />
    </Suspense>
  );
}
