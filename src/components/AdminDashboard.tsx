import React, { useEffect, useState } from 'react';
import { Shield, RefreshCw, CheckCircle2, XCircle, ArrowRightLeft, Users, FileText } from 'lucide-react';

interface AdminDashboardProps {
  token: string;
  currentUser: any;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, currentUser }) => {
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [officialCandidates, setOfficialCandidates] = useState<any[]>([]);
  const [selectedOfficialId, setSelectedOfficialId] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [applicationsRes, officialsRes] = await Promise.all([
        fetch('/api/official-applications/pending', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/officials', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const applicationsData = await applicationsRes.json();
      const officialsData = await officialsRes.json();
      if (applicationsRes.ok) setPendingApplications(applicationsData.applications || []);
      if (officialsRes.ok) setOfficialCandidates(officialsData.officials || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [token]);

  const transferAdmin = async () => {
    if (!selectedOfficialId) return;
    if (!window.confirm('Transfer admin rights to the selected official?')) return;
    setActionLoading(true);
    await fetch('/api/admin/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetUserId: selectedOfficialId }),
    });
    await fetchDashboard();
    setActionLoading(false);
  };

  const reviewApplication = async (id: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    if (status === 'rejected' && !rejectionReason) return;
    setActionLoading(true);
    await fetch(`/api/official-applications/${id}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, rejectionReason }),
    });
    await fetchDashboard();
    setActionLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Admin Dashboard</p>
            <h3 className="text-2xl font-black text-slate-950 mt-1">Platform control center</h3>
            <p className="text-sm text-slate-500 mt-1">Review official applications and transfer admin ownership atomically.</p>
          </div>
          <Shield className="w-10 h-10 text-orange-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Current Admin</div>
          <div className="text-lg font-black text-slate-900 mt-1">{currentUser?.username}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Pending Applications</div>
          <div className="text-3xl font-black text-slate-900 mt-1">{pendingApplications.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Official Candidates</div>
          <div className="text-3xl font-black text-slate-900 mt-1">{officialCandidates.length}</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900"><ArrowRightLeft className="w-4 h-4 text-orange-500" />Transfer Admin</div>
        <div className="flex flex-col md:flex-row gap-3">
          <select value={selectedOfficialId} onChange={(e) => setSelectedOfficialId(e.target.value)} className="flex-1 p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm">
            <option value="">Select an official</option>
            {officialCandidates.map((official) => (
              <option key={official.id} value={official.id}>
                {official.username} ({official.department || official.role})
              </option>
            ))}
          </select>
          <button onClick={transferAdmin} disabled={!selectedOfficialId || actionLoading} className="px-4 py-3 rounded-xl bg-[var(--surface-strong)] text-white font-bold text-sm disabled:bg-slate-300">
            Transfer
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900"><FileText className="w-4 h-4 text-orange-500" />Pending Official Applications</div>
        {loading ? (
          <div className="py-8 text-sm text-slate-500 flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin text-orange-500" />Loading dashboard...</div>
        ) : pendingApplications.length === 0 ? (
          <div className="py-6 text-sm text-slate-500">No pending applications right now.</div>
        ) : (
          <div className="space-y-3">
            {pendingApplications.map((application) => (
              <div key={application._id} className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-bold text-slate-900">{application.fullName}</div>
                  <div className="text-xs text-slate-500">{application.department} · {application.designation}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Employee ID: {application.employeeId}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => reviewApplication(application._id, 'approved')} disabled={actionLoading} className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />Approve
                  </button>
                  <button onClick={() => reviewApplication(application._id, 'rejected', 'Reviewed and rejected by admin.')} disabled={actionLoading} className="px-3 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center gap-1">
                    <XCircle className="w-4 h-4" />Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
