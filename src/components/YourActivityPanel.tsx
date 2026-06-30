import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, FileText, Bookmark, ThumbsUp, MessageSquare, Shield, BadgeCheck } from 'lucide-react';
import { IssueCard } from './IssueCard';
import { IssuePost } from '../types';
import { mapPostToIssue } from '../utils/postTransforms';

type ActivityTab = 'reports-filed' | 'saved-posts' | 'upvoted-posts' | 'commented-posts' | 'official-application';

interface OfficialApplicationStatus {
  status: 'not_applied' | 'pending_review' | 'approved' | 'rejected';
  approvedAt?: string | null;
  isOfficial?: boolean;
  application?: {
    id: string;
    status: string;
    fullName?: string;
    department?: string;
    designation?: string;
    employeeId?: string;
    governmentEmail?: string;
    proofDocument?: string;
    rejectionReason?: string;
    reviewedAt?: string | null;
    submittedAt?: string | null;
  } | null;
}

interface YourActivityPanelProps {
  token: string;
  currentUser: any;
  onIssueUpdated: (updatedIssue: IssuePost) => void;
  onSaveToggled: (issueId: string, saved: boolean, issue?: IssuePost) => void;
}

const tabConfig: Array<{
  id: ActivityTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'reports-filed', label: 'Reports Filed', icon: FileText },
  { id: 'saved-posts', label: 'Saved Posts', icon: Bookmark },
  { id: 'upvoted-posts', label: 'Upvoted Posts', icon: ThumbsUp },
  { id: 'commented-posts', label: 'Commented Posts', icon: MessageSquare },
  { id: 'official-application', label: 'Official Application', icon: Shield },
];

const mapPosts = (posts: any[]) => posts.map(mapPostToIssue).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const YourActivityPanel: React.FC<YourActivityPanelProps> = ({
  token,
  currentUser,
  onIssueUpdated,
  onSaveToggled,
}) => {
  const [activeTab, setActiveTab] = useState<ActivityTab>('reports-filed');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportsFiled, setReportsFiled] = useState<IssuePost[]>([]);
  const [savedPosts, setSavedPosts] = useState<IssuePost[]>([]);
  const [upvotedPosts, setUpvotedPosts] = useState<IssuePost[]>([]);
  const [commentedPosts, setCommentedPosts] = useState<IssuePost[]>([]);
  const [officialApplication, setOfficialApplication] = useState<OfficialApplicationStatus | null>(null);
  const isBusy = loading || refreshing;

  const activitySummary = useMemo(() => ([
    { label: 'Reports', value: reportsFiled.length },
    { label: 'Saved', value: savedPosts.length },
    { label: 'Upvoted', value: upvotedPosts.length },
    { label: 'Commented', value: commentedPosts.length },
  ]), [reportsFiled.length, savedPosts.length, upvotedPosts.length, commentedPosts.length]);

  const fetchSection = async (url: string) => {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Failed to load ${url}`);
    }
    return data;
  };

  const refreshActivity = async () => {
    setError(null);
    setRefreshing(true);
    try {
      const [reportsRes, savedRes, upvotedRes, commentedRes, officialRes] = await Promise.all([
        fetchSection('/api/users/me/reports'),
        fetchSection('/api/users/me/saved-posts'),
        fetchSection('/api/users/me/upvoted-posts'),
        fetchSection('/api/users/me/commented-posts'),
        fetchSection('/api/users/me/official-application'),
      ]);

      setReportsFiled(mapPosts(reportsRes.posts || []));
      setSavedPosts(mapPosts(savedRes.posts || savedRes.savedReports || []));
      setUpvotedPosts(mapPosts(upvotedRes.posts || []));
      setCommentedPosts(mapPosts(commentedRes.posts || []));
      setOfficialApplication({
        status: officialRes.status || 'not_applied',
        approvedAt: officialRes.approvedAt || null,
        isOfficial: officialRes.isOfficial || false,
        application: officialRes.application || null,
      });
    } catch (fetchError: any) {
      setError(fetchError.message || 'Unable to load your activity history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const updateIssueLists = (updatedIssue: IssuePost) => {
    const updateList = (list: IssuePost[]) => {
      const existingIndex = list.findIndex((item) => item.id === updatedIssue.id);
      if (existingIndex === -1) return list;
      const next = [...list];
      next[existingIndex] = updatedIssue;
      return next;
    };

    setReportsFiled((current) => updateList(current));
    setSavedPosts((current) => updateList(current));

    setUpvotedPosts((current) => {
      const isUpvoted = updatedIssue.upvoters?.includes(currentUser?.id) || updatedIssue.upvoters?.includes(currentUser?.username);
      const exists = current.some((item) => item.id === updatedIssue.id);
      if (isUpvoted && !exists) return [updatedIssue, ...current];
      if (!isUpvoted) return current.filter((item) => item.id !== updatedIssue.id);
      return updateList(current);
    });

    setCommentedPosts((current) => updateList(current));
    onIssueUpdated(updatedIssue);
  };

  const handleSaveToggle = (issueId: string, saved: boolean, issue?: IssuePost) => {
    setSavedPosts((current) => {
      const existingIndex = current.findIndex((item) => item.id === issueId);
      if (saved && issue && existingIndex === -1) {
        return [issue, ...current];
      }
      if (!saved) {
        return current.filter((item) => item.id !== issueId);
      }
      if (existingIndex > -1 && issue) {
        const next = [...current];
        next[existingIndex] = issue;
        return next;
      }
      return current;
    });

    onSaveToggled(issueId, saved, issue);
  };

  const renderReportList = (reports: IssuePost[], emptyMessage: string) => {
    if (isBusy) {
      return (
        <div className="py-10 flex items-center justify-center gap-2 text-sm text-slate-500 font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
          Loading activity history...
        </div>
      );
    }

    if (reports.length === 0) {
      return (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-500">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {reports.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            token={token}
            currentUser={currentUser}
            onIssueUpdated={updateIssueLists}
            onSaveToggled={handleSaveToggle}
          />
        ))}
      </div>
    );
  };

  const renderOfficialApplication = () => {
    if (isBusy) {
      return (
        <div className="py-10 flex items-center justify-center gap-2 text-sm text-slate-500 font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
          Loading application status...
        </div>
      );
    }

    if (!officialApplication || officialApplication.status === 'not_applied') {
      return (
        <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-500 space-y-2">
          <p className="font-bold text-slate-700">Not Applied</p>
          <p>You have not submitted an official application yet.</p>
        </div>
      );
    }

    const badgeStyles = {
      pending_review: 'bg-amber-50 text-amber-800 border-amber-200',
      approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    } as const;
    const accentClass =
      officialApplication.status === 'approved'
        ? badgeStyles.approved
        : officialApplication.status === 'rejected'
          ? badgeStyles.rejected
          : badgeStyles.pending_review;

    const statusLabel = officialApplication.status === 'pending_review'
      ? 'Pending Review'
      : officialApplication.status === 'approved'
        ? 'Approved'
        : 'Rejected';

    return (
      <div className="space-y-4">
        <div className={`p-5 rounded-2xl border ${accentClass}`}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Application Status</div>
              <div className="text-2xl font-black text-slate-950">{statusLabel}</div>
              {officialApplication.application?.submittedAt && (
                <p className="text-xs text-slate-500">
                  Submitted {new Date(officialApplication.application.submittedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border ${accentClass}`}>
              {officialApplication.status === 'approved' ? <BadgeCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              {statusLabel}
            </span>
          </div>
        </div>

        {officialApplication.status === 'approved' && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm font-semibold space-y-1">
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4" />
              Official badge granted
            </div>
            {officialApplication.approvedAt && (
              <p className="text-xs font-medium text-emerald-700">
                Approved on {new Date(officialApplication.approvedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>
        )}

        {officialApplication.status === 'rejected' && officialApplication.application?.rejectionReason && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
            {officialApplication.application.rejectionReason}
          </div>
        )}
      </div>
    );
  };

  const activeSection = tabConfig.find((tab) => tab.id === activeTab);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Your Activity</p>
            <h3 className="text-2xl font-black text-slate-950 mt-1">Complete history of your Fixdit account</h3>
            <p className="text-sm text-slate-500 mt-1">Track the reports you filed, saved, upvoted, and commented on in one place.</p>
          </div>
          <button
            onClick={refreshActivity}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface-strong)] text-white text-sm font-bold hover:bg-[color:color-mix(in_srgb,var(--surface-strong)_82%,black)] transition"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {activitySummary.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</div>
              <div className="text-2xl font-black text-slate-950 mt-1">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-3 sm:p-4">
        <div className="flex flex-wrap gap-2">
          {tabConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
                  isActive
                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selected View</p>
            <h4 className="text-lg font-black text-slate-950">{activeSection?.label}</h4>
          </div>
        </div>

        {activeTab === 'reports-filed' && renderReportList(reportsFiled, 'No reports filed yet. Your submitted reports will appear here.')}
        {activeTab === 'saved-posts' && renderReportList(savedPosts, 'You have not saved any reports yet.')}
        {activeTab === 'upvoted-posts' && renderReportList(upvotedPosts, 'You have not upvoted any reports yet.')}
        {activeTab === 'commented-posts' && renderReportList(commentedPosts, 'You have not commented on any reports yet.')}
        {activeTab === 'official-application' && renderOfficialApplication()}
      </div>
    </div>
  );
};
