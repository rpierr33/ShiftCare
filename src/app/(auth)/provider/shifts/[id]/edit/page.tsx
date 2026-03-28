"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { getShiftById, editShift } from "@/actions/shifts";
import { LocationAutocomplete } from "@/components/shared/location-autocomplete";

const ROLES = ["RN", "LPN", "CNA", "HHA", "MEDICAL_ASSISTANT", "COMPANION", "OTHER"];

export default function EditShiftPage() {
  const router = useRouter();
  const params = useParams();
  const shiftId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    role: "",
    title: "",
    location: "",
    date: "",
    startTime: "",
    endTime: "",
    payRate: "",
    notes: "",
    minExperience: "",
  });

  useEffect(() => {
    async function load() {
      const shift = await getShiftById(shiftId);
      if (!shift) {
        setError("Shift not found.");
        setLoading(false);
        return;
      }
      if (shift.status === "COMPLETED" || shift.status === "CANCELLED") {
        router.replace(`/provider/shifts/${shiftId}`);
        return;
      }
      const start = new Date(shift.startTime);
      const end = new Date(shift.endTime);
      setForm({
        role: shift.role,
        title: shift.title || "",
        location: shift.location,
        date: start.toISOString().split("T")[0],
        startTime: start.toTimeString().slice(0, 5),
        endTime: end.toTimeString().slice(0, 5),
        payRate: String(shift.payRate),
        notes: shift.notes || "",
        minExperience: shift.minExperience != null ? String(shift.minExperience) : "",
      });
      setLoading(false);
    }
    load();
  }, [shiftId]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const startTime = `${form.date}T${form.startTime}:00`;
    const endTime = `${form.date}T${form.endTime}:00`;

    const result = await editShift(shiftId, {
      role: form.role as "RN" | "LPN" | "CNA" | "HHA" | "MEDICAL_ASSISTANT" | "COMPANION" | "OTHER",
      title: form.title,
      location: form.location,
      startTime,
      endTime,
      payRate: parseFloat(form.payRate),
      notes: form.notes,
      minExperience: form.minExperience ? parseInt(form.minExperience) : null,
    });

    if (!result.success) {
      setError(result.error || "Failed to update shift.");
      setSaving(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push(`/provider/shifts/${shiftId}`), 1500);
  }

  const inputClass = "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all";

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
        <p className="text-sm text-slate-500 mt-3">Loading shift...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/provider/shifts/${shiftId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to shift
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit Shift</h1>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 mb-6 text-sm font-medium">
          Shift updated successfully! Redirecting...
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1.5">Role *</label>
            <select id="role" name="role" value={form.role} onChange={handleChange} className={inputClass}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
            <input id="title" name="title" value={form.title} onChange={handleChange} placeholder="e.g., Morning Patient Care" className={inputClass} />
          </div>
          <div>
            <LocationAutocomplete
              id="location"
              value={form.location}
              onChange={(val) => setForm(prev => ({ ...prev, location: val }))}
              onSelect={(loc) => setForm(prev => ({ ...prev, location: loc.fullAddress || loc.display }))}
              label="Location"
              required
              placeholder="Search address, city, or zip code..."
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1.5">Date *</label>
            <input id="date" name="date" type="date" value={form.date} onChange={handleChange} onClick={(e) => (e.target as HTMLInputElement).showPicker?.()} required className={`${inputClass} cursor-pointer`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-slate-700 mb-1.5">Start</label>
              <input id="startTime" name="startTime" type="time" value={form.startTime} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-slate-700 mb-1.5">End</label>
              <input id="endTime" name="endTime" type="time" value={form.endTime} onChange={handleChange} required className={inputClass} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div>
            <label htmlFor="payRate" className="block text-sm font-medium text-slate-700 mb-1.5">Pay Rate ($/hr) *</label>
            <input id="payRate" name="payRate" type="number" step="0.01" min="0" value={form.payRate} onChange={handleChange} required className={inputClass} />
          </div>
          <div>
            <label htmlFor="minExperience" className="block text-sm font-medium text-slate-700 mb-1.5">Min. Experience (years)</label>
            <input id="minExperience" name="minExperience" type="number" min="0" value={form.minExperience} onChange={handleChange} placeholder="Any" className={inputClass} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
          <textarea id="notes" name="notes" rows={3} value={form.notes} onChange={handleChange} className={`${inputClass} resize-none`} />
        </div>

        <button type="submit" disabled={saving} className="w-full inline-flex items-center justify-center gap-2 py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 disabled:opacity-50 transition-all shadow-lg shadow-cyan-600/20">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Changes</>}
        </button>
      </form>
    </div>
  );
}
