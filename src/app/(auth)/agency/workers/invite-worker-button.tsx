"use client";

import { useState } from "react";
import { Send, X, Loader2, CheckCircle, Clock, MapPin } from "lucide-react";
import { inviteWorkerToShift } from "@/actions/agency";

interface OpenShift {
  id: string;
  role: string;
  startTime: string;
  location: string;
  payRate: number;
}

interface InviteWorkerButtonProps {
  workerId: string;
  workerName: string;
  openShifts: OpenShift[];
}

export function InviteWorkerButton({ workerId, workerName, openShifts }: InviteWorkerButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite() {
    if (!selectedShift) return;
    setLoading(true);
    setError(null);

    const result = await inviteWorkerToShift(workerId, selectedShift);
    if (!result.success) {
      setError(result.error ?? "Failed to send invitation.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      setShowModal(false);
      setSuccess(false);
      setSelectedShift(null);
    }, 2000);
  }

  if (openShifts.length === 0) {
    return (
      <span className="text-xs text-slate-400">No open shifts</span>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-700 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors"
      >
        <Send className="h-3 w-3" />
        Invite
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setShowModal(false); setError(null); setSuccess(false); }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <button
              onClick={() => { setShowModal(false); setError(null); setSuccess(false); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Invite {workerName}
              </h3>
              <p className="text-sm text-slate-500 mb-4">Select an open shift to invite them to.</p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {success ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-emerald-800">Invitation sent!</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                    {openShifts.map((shift) => (
                      <label
                        key={shift.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedShift === shift.id
                            ? "bg-cyan-50 border-cyan-300"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="shift"
                          value={shift.id}
                          checked={selectedShift === shift.id}
                          onChange={() => setSelectedShift(shift.id)}
                          className="h-4 w-4 text-cyan-600 focus:ring-cyan-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{shift.role} Shift</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="inline-flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              {new Date(shift.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                            <span className="inline-flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {shift.location.split(",")[0]}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-600">${shift.payRate}/hr</span>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={handleInvite}
                    disabled={!selectedShift || loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 text-white text-sm font-semibold rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {loading ? "Sending..." : "Send Invitation"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
