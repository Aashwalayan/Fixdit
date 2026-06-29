import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, FileText, ShieldAlert } from 'lucide-react';

interface OfficialApplicationPanelProps {
  token: string;
  user: any;
}

export const OfficialApplicationPanel: React.FC<OfficialApplicationPanelProps> = ({ token, user }) => {
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [application, setApplication] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: user?.displayName || user?.username || '',
    department: user?.department || '',
    designation: user?.designation || '',
    employeeId: '',
    governmentEmail: '',
    proofDocument: '',
  });

  useEffect(() => {
    const fetchApplication = async () => {
      setStatusLoading(true);
      try {
        const response = await fetch('/api/official-applications/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setApplication(data.application);
        }
      } catch (fetchError) {
        console.error(fetchError);
      } finally {
        setStatusLoading(false);
      }
    };

    fetchApplication();
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/official-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Application submission failed.');
      }

      setApplication(data.application);
      setMessage('Application submitted. Admin review is pending.');
    } catch (submitError: any) {
      setError(submitError.message || 'Unable to submit application.');
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = application?.status || 'not started';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Official Application</p>
          <h3 className="text-xl font-black text-slate-950 mt-1">Apply to become an official</h3>
          <p className="text-sm text-slate-500 mt-1">Submit your credentials and track review status in one place.</p>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-slate-900 text-white">
          {statusLabel}
        </span>
      </div>

      {statusLoading ? (
        <div className="py-8 flex items-center justify-center text-slate-500 gap-2 text-sm font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
          Loading application status...
        </div>
      ) : application?.status === 'approved' ? (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm font-semibold flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          Your application was approved. Your account should now have the Official role.
        </div>
      ) : application?.status === 'rejected' ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold flex items-start gap-2">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          Your application was rejected.
          {application.rejectionReason ? <span className="block mt-1 font-normal">{application.rejectionReason}</span> : null}
        </div>
      ) : null}

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm font-semibold">
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold">
          {error}
        </div>
      )}

      {application?.status === 'pending' ? (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-sm">
          Your application is under review. You can refresh this panel to check for updates.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</span>
            <input
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Department</span>
            <input
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
              value={form.department}
              onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Designation</span>
            <input
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
              value={form.designation}
              onChange={(event) => setForm((current) => ({ ...current, designation: event.target.value }))}
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employee ID</span>
            <input
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
              value={form.employeeId}
              onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))}
              required
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Government Email</span>
            <input
              type="email"
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
              value={form.governmentEmail}
              onChange={(event) => setForm((current) => ({ ...current, governmentEmail: event.target.value }))}
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Proof Document URL</span>
            <input
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
              value={form.proofDocument}
              onChange={(event) => setForm((current) => ({ ...current, proofDocument: event.target.value }))}
              required
            />
          </label>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm disabled:bg-slate-300"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
