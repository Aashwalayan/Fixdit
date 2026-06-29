import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  TrendingUp, CheckCircle, Clock, AlertCircle, RefreshCw, 
  Building2, ArrowUpRight, Award, ShieldCheck 
} from 'lucide-react';
import { CivicStats } from '../types';

interface CivicStatsDashboardProps {
  token: string;
}

export const CivicStatsDashboard: React.FC<CivicStatsDashboardProps> = ({ token }) => {
  const [stats, setStats] = useState<CivicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (!response.ok) {
        throw new Error('Failed to retrieve transparency metrics.');
      }
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Error communicating with stats backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] shadow-sm">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-500">Retrieving real-time transparency metrics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h4 className="font-bold text-slate-800">Failed to Load Dashboard</h4>
        <p className="text-sm text-slate-500 mt-1">{error || 'Data is currently unavailable.'}</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-[var(--surface-strong)] hover:bg-[color:color-mix(in_srgb,var(--surface-strong)_82%,black)] text-white font-bold rounded-xl text-xs transition"
        >
          Retry Load
        </button>
      </div>
    );
  }

  // Prep charts data
  const pieData = Object.entries(stats.categoryDistribution || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#ea580c', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

  const barData = [
    { name: 'Total Filed', count: stats.totalIssues },
    { name: 'Resolved', count: stats.resolvedIssues },
    { name: 'In Progress', count: stats.inProgressIssues },
    { name: 'Critical Open', count: stats.criticalIssues },
  ];

  return (
    <div className="space-y-6 animate-fadeIn" id="civic-stats-dashboard">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-orange-500" />
            Civic Integrity Dashboard
          </h2>
          <p className="text-sm text-slate-500">Live analytics validating local maintenance accountability and response times.</p>
        </div>
        <button
          onClick={fetchStats}
          className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 bg-white text-slate-600 font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-[color:var(--border)] rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50/50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />
          <div className="w-9 h-9 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Total Reports</span>
            <span className="text-3xl font-black text-slate-900">{stats.totalIssues}</span>
          </div>
          <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
            Registered locally <ArrowUpRight className="w-3 h-3 text-orange-500" />
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-[color:var(--border)] rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />
          <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Resolved cases</span>
            <span className="text-3xl font-black text-slate-900">{stats.resolvedIssues}</span>
          </div>
          <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
            {stats.totalIssues > 0 ? Math.round((stats.resolvedIssues / stats.totalIssues) * 100) : 100}% fixrate
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
          </span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-[color:var(--border)] rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />
          <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Avg Resolution</span>
            <span className="text-3xl font-black text-slate-900">{stats.resolutionTimeAverageHours}h</span>
          </div>
          <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
            Dispatch to verification <Award className="w-3 h-3 text-blue-500" />
          </span>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-[color:var(--border)] rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50/50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform" />
          <div className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Critical open</span>
            <span className="text-3xl font-black text-slate-900">{stats.criticalIssues}</span>
          </div>
          <span className="text-[10px] text-slate-500">
            Assigned priority dispatch
          </span>
        </div>
      </div>

      {/* Recharts Data Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Category distribution Pie Chart */}
        <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-sm tracking-tight mb-1">Issue Distribution by Category</h4>
            <p className="text-xs text-slate-400 mb-4">Relative frequency of reports registered across civic sectors.</p>
          </div>
          <div className="h-60 w-full flex items-center justify-center relative">
            {pieData.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No category data recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderColor: '#334155', 
                      borderRadius: '8px', 
                      color: '#fff',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2 justify-center">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span>{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Metrics Bar Chart */}
        <div className="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-sm tracking-tight mb-1">Workforce Case Funnel</h4>
            <p className="text-xs text-slate-400 mb-4">Breakdown of operational volume from submission to final resolution.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 10 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderColor: '#334155', 
                    borderRadius: '8px', 
                    color: '#fff',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }} 
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => {
                    const barColors = ['#ea580c', '#10b981', '#3b82f6', '#ef4444'];
                    return <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-center text-slate-400 font-mono mt-2">
            METRICS REALTIME RECONCILIATION ACTIVE // UPDATES DYNAMICALLY
          </div>
        </div>
      </div>
    </div>
  );
};
