"use client";

import React, { useState, useEffect, useRef } from "react";
import { Calendar, Clock, ChevronLeft, ChevronRight, X, Check, RotateCcw } from "lucide-react";

export interface DateTimePickerProps {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  showSeconds?: boolean;
  label?: string;
}

// Helpers
const pad = (n: number) => String(n).padStart(2, "0");

export const parseDateTimeInput = (dateStr?: string | null): Date | null => {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (!s || s === "—" || s === "null" || s === "undefined") return null;

  // DD/MM/YYYY or DD-MM-YYYY (with optional HH:mm or HH:mm:ss)
  if (/^\d{2}[-/]\d{2}[-/]\d{4}/.test(s)) {
    const parts = s.split(/[-/ :]/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const hour = parts[3] ? parseInt(parts[3], 10) : 0;
      const min = parts[4] ? parseInt(parts[4], 10) : 0;
      const sec = parts[5] ? parseInt(parts[5], 10) : 0;
      const d = new Date(year, month, day, hour, min, sec);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  // ISO with Z or offset
  if (s.endsWith("Z") || /[+-]\d{2}(:?\d{2})?$/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // YYYY-MM-DDTHH:mm or YYYY-MM-DD HH:mm
  if (/^\d{4}[-/]\d{2}[-/]\d{2}/.test(s)) {
    const parts = s.split(/[-/ T:]/);
    if (parts.length >= 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const hour = parts[3] ? parseInt(parts[3], 10) : 0;
      const min = parts[4] ? parseInt(parts[4], 10) : 0;
      const sec = parts[5] ? parseInt(parts[5], 10) : 0;
      const d = new Date(year, month, day, hour, min, sec);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

// Returns format "YYYY-MM-DDTHH:mm" for internal state standard
export const toDateTimeLocalString = (date: Date): string => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const mins = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${mins}`;
};

// Returns display format "DD/MM/YYYY HH:mm"
export const formatDisplayDateTime = (dateStr?: string | null): string => {
  const d = parseDateTimeInput(dateStr);
  if (!d) return "";
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

const WEEKDAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function DateTimePicker({
  value,
  onChange,
  placeholder = "DD/MM/YYYY HH:mm",
  className = "",
  disabled = false,
  required = false,
  id,
  name,
  label,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parsed current date
  const parsedDate = parseDateTimeInput(value);

  // Internal view state for month & year
  const [viewYear, setViewYear] = useState<number>(parsedDate ? parsedDate.getFullYear() : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(parsedDate ? parsedDate.getMonth() : new Date().getMonth());
  const [selectedHour, setSelectedHour] = useState<number>(parsedDate ? parsedDate.getHours() : new Date().getHours());
  const [selectedMinute, setSelectedMinute] = useState<number>(parsedDate ? parsedDate.getMinutes() : new Date().getMinutes());

  // Input typing state
  const [textInput, setTextInput] = useState<string>(formatDisplayDateTime(value));

  useEffect(() => {
    setTextInput(formatDisplayDateTime(value));
    const d = parseDateTimeInput(value);
    if (d) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setSelectedHour(d.getHours());
      setSelectedMinute(d.getMinutes());
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Select day
  const handleSelectDay = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day, selectedHour, selectedMinute, 0);
    const formatted = toDateTimeLocalString(newDate);
    onChange(formatted);
  };

  // Quick button "Hiện tại" (Now)
  const handleSelectNow = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedHour(now.getHours());
    setSelectedMinute(now.getMinutes());
    onChange(toDateTimeLocalString(now));
    setIsOpen(false);
  };

  // Quick button "Hôm nay" (Today)
  const handleSelectToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    const newDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), selectedHour, selectedMinute, 0);
    onChange(toDateTimeLocalString(newDate));
  };

  // Clear value
  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange("");
    setTextInput("");
  };

  // Handle Hour change
  const handleHourChange = (newHour: number) => {
    setSelectedHour(newHour);
    if (parsedDate) {
      const newDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), newHour, selectedMinute, 0);
      onChange(toDateTimeLocalString(newDate));
    } else {
      const now = new Date();
      const newDate = new Date(viewYear, viewMonth, now.getDate(), newHour, selectedMinute, 0);
      onChange(toDateTimeLocalString(newDate));
    }
  };

  // Handle Minute change
  const handleMinuteChange = (newMin: number) => {
    setSelectedMinute(newMin);
    if (parsedDate) {
      const newDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), selectedHour, newMin, 0);
      onChange(toDateTimeLocalString(newDate));
    } else {
      const now = new Date();
      const newDate = new Date(viewYear, viewMonth, now.getDate(), selectedHour, newMin, 0);
      onChange(toDateTimeLocalString(newDate));
    }
  };

  // Direct text typing
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setTextInput(text);
    if (!text.trim()) {
      onChange("");
      return;
    }
    const d = parseDateTimeInput(text);
    if (d && !isNaN(d.getTime())) {
      onChange(toDateTimeLocalString(d));
    }
  };

  // Generate calendar days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  // In JS, 0 is Sunday, 1 is Monday. We want Monday as index 0.
  let startWeekday = firstDayOfMonth.getDay() - 1;
  if (startWeekday === -1) startWeekday = 6;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const daysGrid: Array<{ day: number; currentMonth: boolean }> = [];

  // Previous month trailing days
  for (let i = startWeekday - 1; i >= 0; i--) {
    daysGrid.push({ day: daysInPrevMonth - i, currentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    daysGrid.push({ day: i, currentMonth: true });
  }

  // Next month leading days (fill up to 42 slots for standard 6-row grid)
  const remainingSlots = 42 - daysGrid.length;
  for (let i = 1; i <= remainingSlots; i++) {
    daysGrid.push({ day: i, currentMonth: false });
  }

  const today = new Date();
  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === viewMonth &&
    today.getFullYear() === viewYear;

  const isSelected = (day: number) =>
    parsedDate &&
    parsedDate.getDate() === day &&
    parsedDate.getMonth() === viewMonth &&
    parsedDate.getFullYear() === viewYear;

  return (
    <div ref={containerRef} className="relative w-full text-left">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Input Display Field */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen((o) => !o);
        }}
        className={`w-full min-h-[40px] px-3 py-2 bg-white border rounded-xl flex items-center justify-between gap-2 transition cursor-pointer shadow-2xs ${
          isOpen ? "border-teal-500 ring-2 ring-teal-500/20" : "border-slate-200 hover:border-slate-300"
        } ${disabled ? "opacity-50 pointer-events-none bg-slate-50" : ""} ${className}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Calendar size={15} className="text-teal-600 shrink-0" />
          <input
            id={id}
            name={name}
            type="text"
            value={textInput}
            onChange={handleTextChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none font-medium cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition cursor-pointer"
              title="Xóa ngày giờ"
            >
              <X size={13} />
            </button>
          )}
          <Clock size={14} className="text-slate-400" />
        </div>
      </div>

      {/* Popup Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 w-[310px] sm:w-[330px] animate-in fade-in slide-in-from-top-2 duration-150 text-slate-800 select-none">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              title="Tháng trước"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1.5 font-bold text-sm text-slate-800">
              <span>{MONTH_NAMES[viewMonth]}</span>
              <span className="text-teal-600 font-extrabold">{viewYear}</span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              title="Tháng sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_NAMES.map((name, idx) => (
              <span
                key={name}
                className={`text-[11px] font-bold py-1 ${
                  idx >= 5 ? "text-amber-600 font-extrabold" : "text-slate-400"
                }`}
              >
                {name}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center mb-3">
            {daysGrid.map((item, idx) => {
              if (!item.currentMonth) {
                return (
                  <div
                    key={idx}
                    className="h-8 flex items-center justify-center text-xs text-slate-300 font-normal rounded-lg cursor-not-allowed"
                  >
                    {item.day}
                  </div>
                );
              }

              const selected = isSelected(item.day);
              const todayDay = isToday(item.day);

              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectDay(item.day)}
                  className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition cursor-pointer relative ${
                    selected
                      ? "bg-teal-600 text-white shadow-xs font-bold"
                      : todayDay
                      ? "bg-teal-50 text-teal-700 border border-teal-200/80 font-bold hover:bg-teal-100"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item.day}
                  {todayDay && !selected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-teal-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Time Picker Section */}
          <div className="border-t border-slate-100 pt-3 mb-3">
            <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <Clock size={14} className="text-teal-600" />
                <span>Thời gian:</span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Hours select */}
                <select
                  value={selectedHour}
                  onChange={(e) => handleHourChange(Number(e.target.value))}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-teal-500 cursor-pointer shadow-2xs"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>
                      {pad(i)} giờ
                    </option>
                  ))}
                </select>

                <span className="font-bold text-slate-400">:</span>

                {/* Minutes select */}
                <select
                  value={selectedMinute}
                  onChange={(e) => handleMinuteChange(Number(e.target.value))}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-teal-500 cursor-pointer shadow-2xs"
                >
                  {Array.from({ length: 60 }).map((_, i) => (
                    <option key={i} value={i}>
                      {pad(i)} phút
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Action Footer Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSelectNow}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200/60 transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={11} />
              <span>Hiện tại</span>
            </button>

            <button
              type="button"
              onClick={handleSelectToday}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            >
              Hôm nay
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition flex items-center gap-1 shadow-xs cursor-pointer ml-auto"
            >
              <Check size={12} />
              <span>Xong</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DateTimePicker;
