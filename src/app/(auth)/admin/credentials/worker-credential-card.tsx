"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { approveCredentialItem, rejectCredentialItem } from "@/actions/admin";

interface SerializedCredential {
  id: string;
  type: string;
  name: string;
  licenseNumber: string | null;
  issuingAuthority: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  status: string;
  documentUrl: string | null;
  verifiedAt: string | null;
  notes: string | null;
}

interface SerializedWorker {
  id: string;
  workerRole: string | null;
  credentialStatus: string;
  requiredCredentials: string[];
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    createdAt: string;
  };
  credentials: SerializedCredential[];
  roleLabel: string;
}

const CREDENTIAL_TYPE_LABELS: Record<string, string> = {
  LICENSE: "License/Certificate",
  CERTIFICATION: "Certification",
  BACKGROUND_CHECK: "Background Check",
  TB_TEST: "TB Test",
  CPR: "CPR/BLS Certification",
  OTHER: "Other",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending" },
  VERIFIED: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Verified" },
  REJECTED: { bg: "bg-red-50", text: "text-red-700", label: "Rejected" },
  EXPIRED: { bg: "bg-slate-100", text: "text-slate-600", label: "Expired" },
};

export function WorkerCredentialCard({ worker }: { worker: SerializedWorker }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(worker.credentialStatus === "PENDING");
  const [actionState, setActionState] = useState<Record<string, { mode: "idle" | "approve" | "reject"; loading: boolean; error: string; expiryDate: string; reason: string }>>({});

  const overallStatus = STATUS_STYLES[worker.credentialStatus] || STATUS_STYLES.PENDING;

  // Check which required credentials are present and verified
  const credentialsByType = new Map<string, SerializedCredential[]>();
  for (const cred of worker.credentials) {
    const existing = credentialsByType.get(cred.type) || [];
    existing.push(cred);
    credentialsByType.set(cred.type, existing);
  }

  const verifiedCount = worker.requiredCredentials.filter((reqType) => {
    const creds = credentialsByType.get(reqType);
    return creds?.some((c) => c.status === "VERIFIED");
  }).length;

  function getActionState(credId: string) {
    return actionState[credId] || { mode: "idle", loading: false, error: "", expiryDate: "", reason: "" };
  }

  function updateActionState(credId: string, updates: Partial<typeof actionState[string]>) {
    setActionState((prev) => ({
      ...prev,
      [credId]: { ...getActionState(credId), ...updates },
    }));
  }

  async function handleApprove(credId: string) {
    const state = getActionState(credId);
    updateActionState(credId, { loading: true, error: "" });
    const result = await approveCredentialItem(credId, state.expiryDate || undefined);
    if (result.success) {
      router.refresh();
    } else {
      updateActionState(credId, { loading: false, error: result.error || "Failed to approve." });
    }
  }

  async function handleReject(credId: string) {
    const state = getActionState(credId);
    if (!state.reason.trim()) {
      updateActionState(credId, { error: "Rejection reason is required." });
      return;
    }
    updateActionState(credId, { loading: true, error: "" });
    const result = await rejectCredentialItem(credId, state.reason);
    if (result.success) {
      router.refresh();
    } else {
      updateActionState(credId, { loading: false, error: result.error || "Failed to reject." });
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${
              worker.credentialStatus === "VERIFIED"
                ? "bg-emerald-600"
                : worker.credentialStatus === "REJECTED"
                ? "bg-red-500"
                : "bg-amber-500"
            }`}
          >
            {worker.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-900">
              {worker.user.name}
            </p>
            <p className="text-xs text-slate-400">
              {worker.roleLabel} &middot; {worker.user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Verification progress */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {verifiedCount}/{worker.requiredCredentials.length} verified
            </span>
            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{
                  width: `${worker.requiredCredentials.length > 0 ? (verifiedCount / worker.requiredCredentials.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${overallStatus.bg} ${overallStatus.text}`}
          >
            {overallStatus.label}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-slate-100">
          {/* Worker details */}
          <div className="px-6 py-4 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              {worker.user.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              {worker.user.phone || "No phone"}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <User className="h-3.5 w-3.5 text-slate-400" />
              {worker.roleLabel}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Signed up{" "}
              {new Date(worker.user.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>

          {/* Required Credentials Checklist */}
          <div className="px-6 py-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Required Credentials for {worker.roleLabel}
            </h3>

            {worker.requiredCredentials.length === 0 ? (
              <p className="text-sm text-slate-400">
                No specific credentials required.
              </p>
            ) : (
              <div className="space-y-3">
                {worker.requiredCredentials.map((reqType) => {
                  const matchingCreds = credentialsByType.get(reqType) || [];
                  const hasVerified = matchingCreds.some(
                    (c) => c.status === "VERIFIED"
                  );
                  const hasPending = matchingCreds.some(
                    (c) => c.status === "PENDING"
                  );

                  return (
                    <div key={reqType}>
                      {/* Requirement header */}
                      <div className="flex items-center gap-2 mb-1">
                        {hasVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : hasPending ? (
                          <Clock className="h-4 w-4 text-amber-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-slate-300" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            hasVerified
                              ? "text-emerald-700"
                              : hasPending
                              ? "text-amber-700"
                              : "text-slate-400"
                          }`}
                        >
                          {CREDENTIAL_TYPE_LABELS[reqType] || reqType}
                        </span>
                        {!hasVerified && matchingCreds.length === 0 && (
                          <span className="text-xs text-slate-400 italic">
                            Not submitted
                          </span>
                        )}
                      </div>

                      {/* Submitted credentials for this type */}
                      {matchingCreds.map((cred) => {
                        const credState = getActionState(cred.id);
                        const statusStyle =
                          STATUS_STYLES[cred.status] || STATUS_STYLES.PENDING;

                        return (
                          <div
                            key={cred.id}
                            className="ml-6 p-3 bg-slate-50 rounded-lg border border-slate-100 mb-2"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-slate-800">
                                    {cred.name || CREDENTIAL_TYPE_LABELS[cred.type] || cred.type}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyle.bg} ${statusStyle.text}`}
                                  >
                                    {statusStyle.label}
                                  </span>
                                </div>
                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                  {cred.licenseNumber && (
                                    <span>
                                      License: <span className="font-mono">{cred.licenseNumber}</span>
                                    </span>
                                  )}
                                  {cred.issuingAuthority && (
                                    <span>Issued by: {cred.issuingAuthority}</span>
                                  )}
                                  {cred.expiryDate && (
                                    <span>
                                      Expires:{" "}
                                      {new Date(cred.expiryDate).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </span>
                                  )}
                                  {cred.verifiedAt && (
                                    <span className="text-emerald-600">
                                      Verified{" "}
                                      {new Date(cred.verifiedAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </span>
                                  )}
                                </div>
                                {cred.notes && cred.status === "REJECTED" && (
                                  <p className="mt-1 text-xs text-red-600">
                                    Reason: {cred.notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {cred.documentUrl && (
                                  <a
                                    href={cred.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-600 hover:text-cyan-700 p-1"
                                    title="View document"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Actions for PENDING credentials */}
                            {cred.status === "PENDING" && (
                              <div className="mt-3 pt-3 border-t border-slate-200">
                                {credState.mode === "idle" && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        updateActionState(cred.id, { mode: "approve" })
                                      }
                                      className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                      <Check size={14} />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() =>
                                        updateActionState(cred.id, { mode: "reject" })
                                      }
                                      className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                      <X size={14} />
                                      Reject
                                    </button>
                                  </div>
                                )}

                                {credState.mode === "approve" && (
                                  <div className="space-y-2">
                                    <div>
                                      <label className="text-xs text-slate-500 mb-1 block">
                                        Expiry date (optional)
                                      </label>
                                      <input
                                        type="date"
                                        value={credState.expiryDate}
                                        onChange={(e) =>
                                          updateActionState(cred.id, {
                                            expiryDate: e.target.value,
                                          })
                                        }
                                        className="w-full rounded-lg border border-slate-200 text-xs h-8 px-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                      />
                                    </div>
                                    {credState.error && (
                                      <p className="text-xs text-red-500">
                                        {credState.error}
                                      </p>
                                    )}
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleApprove(cred.id)}
                                        disabled={credState.loading}
                                        className="flex items-center gap-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                      >
                                        {credState.loading ? "..." : "Confirm Approve"}
                                      </button>
                                      <button
                                        onClick={() =>
                                          updateActionState(cred.id, {
                                            mode: "idle",
                                            error: "",
                                          })
                                        }
                                        className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {credState.mode === "reject" && (
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      value={credState.reason}
                                      onChange={(e) =>
                                        updateActionState(cred.id, {
                                          reason: e.target.value,
                                        })
                                      }
                                      className="w-full rounded-lg border border-slate-200 text-xs h-8 px-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
                                      placeholder="Reason for rejection..."
                                      autoFocus
                                    />
                                    {credState.error && (
                                      <p className="text-xs text-red-500">
                                        {credState.error}
                                      </p>
                                    )}
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleReject(cred.id)}
                                        disabled={credState.loading}
                                        className="flex items-center gap-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                      >
                                        {credState.loading ? "..." : "Confirm Reject"}
                                      </button>
                                      <button
                                        onClick={() =>
                                          updateActionState(cred.id, {
                                            mode: "idle",
                                            error: "",
                                            reason: "",
                                          })
                                        }
                                        className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Extra credentials not in the required list */}
            {(() => {
              const extraCreds = worker.credentials.filter(
                (c) => !worker.requiredCredentials.includes(c.type)
              );
              if (extraCreds.length === 0) return null;

              return (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Additional Documents
                  </h4>
                  {extraCreds.map((cred) => {
                    const statusStyle =
                      STATUS_STYLES[cred.status] || STATUS_STYLES.PENDING;
                    return (
                      <div
                        key={cred.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-2 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-sm text-slate-700">
                              {cred.name || CREDENTIAL_TYPE_LABELS[cred.type] || cred.type}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyle.bg} ${statusStyle.text}`}
                            >
                              {statusStyle.label}
                            </span>
                          </div>
                        </div>
                        {cred.documentUrl && (
                          <a
                            href={cred.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-600 hover:text-cyan-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
