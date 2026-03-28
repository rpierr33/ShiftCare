import { db } from "@/lib/db";
import { requireWorker } from "@/lib/auth-utils";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  XCircle,
  Calendar,
  BellOff,
} from "lucide-react";
import { MarkReadButton, MarkAllReadButton } from "./notification-actions";

const ICON_MAP: Record<string, React.ReactNode> = {
  SHIFT_ACCEPTED: <Calendar size={18} className="text-cyan-600" />,
  WORKER_ACCEPTED: <CheckCircle2 size={18} className="text-emerald-600" />,
  WORKER_CANCELLED: <XCircle size={18} className="text-red-500" />,
  AGENCY_CANCELLED: <XCircle size={18} className="text-red-500" />,
  PAYMENT_RELEASED: <DollarSign size={18} className="text-emerald-600" />,
  DISPUTE_FILED: <AlertTriangle size={18} className="text-amber-500" />,
  CREDENTIAL_APPROVED: <ShieldCheck size={18} className="text-emerald-600" />,
  CREDENTIAL_REJECTED: <AlertTriangle size={18} className="text-red-500" />,
};

export const metadata = {
  title: "Notifications | ShiftCare",
};

export default async function WorkerNotificationsPage() {
  const user = await requireWorker();
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell size={22} className="text-cyan-600" />
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        </div>
        {hasUnread && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <BellOff size={40} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg font-medium">
            No notifications yet.
          </p>
          <p className="text-slate-400 text-sm mt-1">
            You&apos;ll be notified about shift updates, payments, and more.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-xl border p-4 flex items-start gap-3 transition-colors ${
                notification.read
                  ? "bg-white border-slate-100"
                  : "bg-cyan-50 border-cyan-100"
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                {ICON_MAP[notification.type] || (
                  <Bell size={18} className="text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`text-sm font-semibold ${
                      notification.read ? "text-slate-700" : "text-slate-900"
                    }`}
                  >
                    {notification.title}
                  </p>
                  <span className="text-xs text-slate-400 flex-shrink-0 mt-0.5">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {notification.body}
                </p>
              </div>
              {!notification.read && (
                <MarkReadButton notificationId={notification.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
