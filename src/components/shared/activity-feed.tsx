"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Users, Briefcase, Clock, MapPin } from "lucide-react";

type ActivityType =
  | "shift_posted"
  | "worker_matched"
  | "shift_accepted"
  | "shift_confirmed"
  | "worker_joined";

interface ActivityItem {
  id: number;
  type: ActivityType;
  message: string;
  timestamp: string;
}

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { color: string; icon?: "check" }
> = {
  shift_posted: { color: "bg-blue-500" },
  worker_matched: { color: "bg-amber-500" },
  shift_accepted: { color: "bg-emerald-500" },
  shift_confirmed: { color: "bg-emerald-500", icon: "check" },
  worker_joined: { color: "bg-purple-500" },
};

const ACTIVITY_POOL: Omit<ActivityItem, "id">[] = [
  { type: "shift_posted", message: "New CNA shift posted in Tampa, FL", timestamp: "just now" },
  { type: "worker_matched", message: "3 workers matched for RN shift", timestamp: "2m ago" },
  { type: "shift_accepted", message: "Maria G. accepted CNA shift", timestamp: "3m ago" },
  { type: "shift_confirmed", message: "Shift confirmed \u2014 starting tomorrow 7AM", timestamp: "5m ago" },
  { type: "worker_joined", message: "New RN joined in Orlando area", timestamp: "1m ago" },
  { type: "shift_posted", message: "LPN night shift posted in Miami, FL", timestamp: "just now" },
  { type: "worker_matched", message: "5 workers matched for CNA shift", timestamp: "4m ago" },
  { type: "shift_accepted", message: "James T. accepted LPN shift", timestamp: "2m ago" },
  { type: "shift_confirmed", message: "Shift confirmed \u2014 starting tonight 11PM", timestamp: "6m ago" },
  { type: "worker_joined", message: "New CNA joined in Jacksonville area", timestamp: "3m ago" },
  { type: "shift_posted", message: "HHA weekend shift posted in St. Pete, FL", timestamp: "just now" },
  { type: "worker_matched", message: "2 workers matched for HHA shift", timestamp: "1m ago" },
  { type: "shift_accepted", message: "Linda R. accepted RN shift", timestamp: "4m ago" },
  { type: "shift_confirmed", message: "Shift confirmed \u2014 starting Friday 3PM", timestamp: "7m ago" },
  { type: "worker_joined", message: "New LPN joined in Fort Lauderdale area", timestamp: "5m ago" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function ActivityIcon({ type }: { type: ActivityType }) {
  const config = ACTIVITY_CONFIG[type];

  if (config.icon === "check") {
    return <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />;
  }

  switch (type) {
    case "shift_posted":
      return <Briefcase className="h-3 w-3 text-blue-500 flex-shrink-0" />;
    case "worker_matched":
      return <Users className="h-3 w-3 text-amber-500 flex-shrink-0" />;
    case "shift_accepted":
      return <MapPin className="h-3 w-3 text-emerald-500 flex-shrink-0" />;
    case "worker_joined":
      return <Users className="h-3 w-3 text-purple-500 flex-shrink-0" />;
    default:
      return <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />;
  }
}

interface ActivityFeedProps {
  variant?: "sidebar" | "inline" | "compact";
  maxItems?: number;
}

export function ActivityFeed({
  variant = "compact",
  maxItems = 5,
}: ActivityFeedProps) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [pool, setPool] = useState<Omit<ActivityItem, "id">[]>([]);
  const [nextId, setNextId] = useState(0);

  // Initialize on mount
  useEffect(() => {
    const shuffled = shuffleArray(ACTIVITY_POOL);
    const initial = shuffled.slice(0, maxItems).map((item, i) => ({
      ...item,
      id: i,
    }));
    const remaining = shuffled.slice(maxItems);
    setItems(initial);
    setPool(remaining);
    setNextId(maxItems);
  }, [maxItems]);

  const rotateItem = useCallback(() => {
    setItems((prev) => {
      setPool((prevPool) => {
        // Put the removed item back into the pool
        const removed = prev[0];
        if (removed) {
          const { id: _id, ...rest } = removed;
          return [...prevPool, rest];
        }
        return prevPool;
      });
      return prev;
    });

    setPool((prevPool) => {
      if (prevPool.length === 0) return prevPool;

      const nextItem = prevPool[0];
      const remaining = prevPool.slice(1);

      setNextId((prevId) => {
        const newId = prevId + 1;
        setItems((prev) => {
          const withoutOldest = prev.slice(1);
          return [...withoutOldest, { ...nextItem, id: newId }];
        });
        return newId;
      });

      return remaining;
    });
  }, []);

  // Cycle every 4 seconds
  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(rotateItem, 4000);
    return () => clearInterval(interval);
  }, [items.length, rotateItem]);

  const header = (
    <div className="flex items-center gap-2 mb-3">
      <span className="relative flex h-2 w-2">
        <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Live Activity
      </span>
    </div>
  );

  const list = (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="animate-feed-in flex items-start gap-2.5"
        >
          <div className="mt-1">
            <span className={`block h-2 w-2 rounded-full ${ACTIVITY_CONFIG[item.type].color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-gray-700 leading-snug truncate ${
                variant === "compact" ? "text-xs" : "text-sm"
              }`}
            >
              {item.message}
            </p>
          </div>
          <span
            className={`flex-shrink-0 text-gray-400 whitespace-nowrap ${
              variant === "compact" ? "text-[10px]" : "text-xs"
            }`}
          >
            {item.timestamp}
          </span>
        </div>
      ))}
    </div>
  );

  if (variant === "inline") {
    return (
      <div>
        {header}
        {list}
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        {header}
        {list}
      </div>
    );
  }

  // compact (default)
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 px-4 py-3">
      {header}
      {list}
    </div>
  );
}
