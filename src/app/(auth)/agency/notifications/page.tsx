export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  UserCheck,
  XCircle,
  Info,
  CalendarCheck,
  Users,
  Briefcase,
} from "lucide-react";
import { MarkAllReadButton, MarkReadButton } from "./notification-actions";

const ICON_MAP: Record<string, typeof Bell> = {
  shift_accepted: CheckCircle,
  shift_cancelled: XCircle,
  shift_completed: CalendarCheck,
  shift_invitation: Users,
  shift_posted: Briefcase,
  worker_joined: Users,
  WORKER_ACCEPTED: UserCheck,
  WORKER_CANCELLED: XCircle,
  SHIFT_MATCH: Bell,
  PAYMENT_RELEASED: DollarSign,
  DISPUTE_FILED: AlertTriangle,
  CREDENTIAL_APPROVED: CheckCircle,
  system: Info,
};

const ICON_COLORS: Record<string, string> = {
  shift_accepted: "text-emerald-600 bg-emerald-50",
  shift_cancelled: "text-red-600 bg-red-50",
  shift_completed: "text-cyan-600 bg-cyan-50",
  shift_invitation: "text-purple-600 bg-purple-50",
  shift_posted: "text-blue-600 bg-blue-50",
  worker_joined: "text-amber-600 bg-amber-50",
  WORKER_ACCEPTED: "text-emerald-600 bg-emerald-50",
  WORKER_CANCELLED: "text-red-600 bg-red-50",
  PAYMENT_RELEASED: "text-emerald-600 bg-emerald-50",
  DISPUTE_FILED: "text-red-600 bg-red-50",
  CREDENTIAL_APPROVED: "text-emerald-600 bg-emerald-50",
};

export default async function AgencyNotificationsPage() {
  const user = await getSessionUser();
  if (user.role !== "PROVIDER") redirect("/worker/shifts");

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Bell className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No notifications</h3>
          <p className="text-sm text-slate-500">
            You will receive notifications when workers interact with your shifts.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
          {notifications.map((n) => {
            const IconComponent = ICON_MAP[n.type] || Info;
            const iconColors = ICON_COLORS[n.type] || "text-slate-600 bg-slate-50";

            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-6 py-4 transition-colors ${
                  !n.read ? "bg-cyan-50/40" : ""
                }`}
              >
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColors}`}>
                  <IconComponent className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.read ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!n.read && (
                    <>
                      <span className="h-2 w-2 rounded-full bg-cyan-500" />
                      <MarkReadButton notificationId={n.id} />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
