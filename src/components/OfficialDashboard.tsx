import React from 'react';
import { CheckCircle2, Clock3, MapPinned, RefreshCw } from 'lucide-react';
import { IssuePost } from '../types';

interface OfficialDashboardProps {
  user: any;
  issues: IssuePost[];
}

export const OfficialDashboard: React.FC<OfficialDashboardProps> = ({ user, issues }) => {
  const department = user?.department || '';
  const scopedIssues = department
    ? issues.filter((issue) => (issue.suggestedDepartment || '').toLowerCase().includes(department.toLowerCase()) || (issue.category || '').toLowerCase().includes(department.toLowerCase()))
    : issues;

  const pending = scopedIssues.filter((issue) => issue.status === 'pending' || issue.status === 'accepted').length;
  const active = scopedIssues.filter((issue) => issue.status === 'in_progress').length;
  const resolved = scopedIssues.filter((issue) => issue.status === 'resolved' || issue.status === 'verified').length;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Official Dashboard</p>
        <h3 className="text-2xl font-black text-slate-950 mt-1">Department workspace</h3>
        <p className="text-sm text-slate-500 mt-1">Monitor cases for {department || 'your assigned department'}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Pending / Accepted</div>
          <div className="text-3xl font-black text-slate-900 mt-1">{pending}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">In Progress</div>
          <div className="text-3xl font-black text-slate-900 mt-1">{active}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Resolved / Verified</div>
          <div className="text-3xl font-black text-slate-900 mt-1">{resolved}</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-3">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <MapPinned className="w-4 h-4 text-orange-500" />Recent assigned reports
        </div>
        {scopedIssues.length === 0 ? (
          <div className="py-8 text-sm text-slate-500">No reports are mapped to your department yet.</div>
        ) : (
          <div className="space-y-3">
            {scopedIssues.slice(0, 5).map((issue) => (
              <div key={issue.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900">{issue.title}</div>
                    <div className="text-xs text-slate-500">{issue.category} · {issue.location}</div>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                    {issue.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
