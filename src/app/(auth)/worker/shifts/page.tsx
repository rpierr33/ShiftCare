import { getAvailableShifts } from "@/actions/shifts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AcceptShiftButton } from "@/components/worker/accept-shift-button";

function formatShiftDateTime(start: Date, end: Date): string {
  const dateStr = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(start);

  const startTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(start);

  const endTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(end);

  return `${dateStr} \u2022 ${startTime} \u2013 ${endTime}`;
}

const ROLE_LABELS: Record<string, string> = {
  RN: "Registered Nurse",
  LPN: "Licensed Practical Nurse",
  CNA: "Certified Nursing Assistant",
  HHA: "Home Health Aide",
  MEDICAL_ASSISTANT: "Medical Assistant",
  COMPANION: "Companion",
  OTHER: "Other",
};

export default async function WorkerShiftsPage() {
  const shifts = await getAvailableShifts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Available Shifts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse open shifts and accept ones that fit your schedule.
        </p>
      </div>

      {shifts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              No open shifts right now. Check back soon — new shifts are posted daily.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shifts.map((shift) => {
            const companyName =
              shift.provider?.providerProfile?.companyName ||
              shift.provider?.name ||
              "Unknown Provider";
            const location =
              shift.provider?.providerProfile?.city && shift.provider?.providerProfile?.state
                ? `${shift.provider.providerProfile.city}, ${shift.provider.providerProfile.state}`
                : null;

            return (
              <Card key={shift.id}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="default">
                      {ROLE_LABELS[shift.role] || shift.role}
                    </Badge>
                    <span className="text-lg font-semibold text-gray-900 whitespace-nowrap">
                      ${parseFloat(String(shift.payRate)).toFixed(2)}/hr
                    </span>
                  </div>

                  {shift.title && (
                    <p className="text-sm font-medium text-gray-900">{shift.title}</p>
                  )}

                  <div className="space-y-1.5 text-sm text-gray-600">
                    <p className="font-medium text-gray-700">{companyName}</p>
                    <p className="flex items-center gap-1.5">
                      <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      {shift.location}
                      {location && ` \u2022 ${location}`}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatShiftDateTime(new Date(shift.startTime), new Date(shift.endTime))}
                    </p>
                  </div>

                  {shift.notes && (
                    <p className="text-xs text-gray-400 line-clamp-2">{shift.notes}</p>
                  )}

                  <div className="pt-1">
                    <AcceptShiftButton shiftId={shift.id} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
