"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  id?: string;
  name: string;
  label?: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ["00", "15", "30", "45"];

export function TimePicker({ id, name, label, defaultValue, required, className }: TimePickerProps) {
  // Parse default value like "07:00" or "13:30"
  const parseDefault = (val?: string) => {
    if (!val) return { hour: "9", minute: "00", period: "AM" };
    const [h, m] = val.split(":");
    const hour24 = parseInt(h, 10);
    const period = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    return { hour: String(hour12), minute: m || "00", period };
  };

  const defaults = parseDefault(defaultValue);
  const [hour, setHour] = useState(defaults.hour);
  const [minute, setMinute] = useState(defaults.minute);
  const [period, setPeriod] = useState(defaults.period);

  // Convert to 24h format for the hidden input
  const to24h = () => {
    let h = parseInt(hour, 10);
    if (period === "AM" && h === 12) h = 0;
    if (period === "PM" && h !== 12) h += 12;
    return `${String(h).padStart(2, "0")}:${minute}`;
  };

  const [value, setValue] = useState(to24h());

  useEffect(() => {
    setValue(to24h());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hour, minute, period]);

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input type="hidden" name={name} value={value} />
      <div className="flex items-center gap-1">
        <select
          value={hour}
          onChange={(e) => setHour(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {HOURS.map((h) => (
            <option key={h} value={String(h)}>{h}</option>
          ))}
        </select>
        <span className="text-gray-500 font-medium">:</span>
        <select
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
      {required && <input type="hidden" required value={value} tabIndex={-1} />}
    </div>
  );
}
