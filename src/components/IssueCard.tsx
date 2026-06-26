import React, { useState, useEffect } from 'react';
import { 
  ArrowUp, MessageSquare, MapPin, Calendar, User, ShieldCheck, 
  Sparkles, Clock, ChevronDown, ChevronUp, CheckSquare, RefreshCw, 
  Send, Camera, Eye, Plus 
} from 'lucide-react';
import { IssuePost, Comment, StatusType } from '../types';

interface IssueCardProps {
  issue: IssuePost;
  token: string;
  currentUser: any;
  onIssueUpdated: (updatedIssue: IssuePost) => void;
  onFocusOnMap?: (issue: IssuePost) => void;
  isFocused?: boolean;
}

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  token,
  currentUser,
  onIssueUpdated,
  onFocusOnMap,
  isFocused = false,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Status updates state
  const [showStatusUpdateForm, setShowStatusUpdateForm] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusInput, setStatusInput] = useState<string>(issue.status);
  const [proofImage, setProofImage] = useState('');
  const [proofNotes, setProofNotes] = useState('');

  const [voteLoading, setVoteLoading] = useState(false);

  // Auto-scroll or highlight if focused
  useEffect(() => {
    if (isFocused) {
      const element = document.getElementById(`issue-card-${issue.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isFocused, issue.id]);

  // Fetch comments
  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const response = await fetch(`/api/issues/${issue.id}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, issue.id]);

  // Handle Upvote toggle
  const handleVote = async () => {
    if (voteLoading) return;
    setVoteLoading(true);
    try {
      const response = await fetch(`/api/issues/${issue.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: currentUser.username })
      });

      if (response.ok) {
        const voteResult = await response.json();
        onIssueUpdated({
          ...issue,
          upvotes: voteResult.upvotes,
          upvoters: voteResult.upvoters,
          priorityScore: voteResult.priorityScore,
        });
      }
    } catch (err) {
      console.error('Error upvoting issue:', err);
    } finally {
      setVoteLoading(false);
    }
  };

  // Submit comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setCommentSubmitting(true);
    try {
      const response = await fetch(`/api/issues/${issue.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          author: currentUser.username,
          content: newCommentText.trim()
        })
      });

      if (response.ok) {
        const addedComment = await response.json();
        setComments([...comments, addedComment]);
        setNewCommentText('');
        // Update issue parent counters
        onIssueUpdated({
          ...issue,
          commentsCount: issue.commentsCount + 1,
        });
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Handle status resolution update
  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/issues/${issue.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: statusInput,
          proofImage: proofImage.trim() || undefined,
          proofNotes: proofNotes.trim() || undefined
        })
      });

      if (response.ok) {
        const updatedIssue = await response.json();
        onIssueUpdated(updatedIssue);
        setShowStatusUpdateForm(false);
        setProofImage('');
        setProofNotes('');
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const isUpvotedByMe = issue.upvoters?.includes(currentUser.username) || false;
  const isCreatorMe = issue.creator === currentUser.username;
  const isCityEmployee = currentUser.role === 'admin' || currentUser.role === 'employee' || currentUser.role === 'staff';

  // Styles based on severity
  const severityColors = {
    critical: 'bg-red-50 text-red-700 border-red-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    medium: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const statusColors = {
    reported: 'bg-slate-100 text-slate-800 border-slate-200',
    verified: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <div 
      id={`issue-card-${issue.id}`}
      className={`bg-white border rounded-2xl shadow-sm hover:shadow-md overflow-hidden transition-all duration-300 ${
        isFocused ? 'ring-2 ring-orange-500/50 scale-[1.01] border-orange-200' : 'border-slate-200'
      }`}
    >
      {/* Upper info ribbon */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div className="space-y-2 flex-1">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white">
              {issue.category}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${severityColors[issue.severity]}`}>
              {issue.severity}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColors[issue.status as StatusType || 'reported']}`}>
              {(issue.status || 'reported').replace('_', ' ')}
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              Priority: {issue.priorityScore}
            </span>
          </div>

          <h3 className="font-extrabold text-slate-950 text-lg sm:text-xl tracking-tight leading-snug">
            {issue.title}
          </h3>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
            {issue.description}
          </p>
        </div>

        {/* Action button to focus on map */}
        {onFocusOnMap && (
          <button
            onClick={() => onFocusOnMap(issue)}
            className="text-[10px] font-extrabold text-slate-400 hover:text-orange-500 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition self-end sm:self-start cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-orange-500" />
            Locate Pin
          </button>
        )}
      </div>

      {/* Featured Image */}
      {issue.imageUrl && (
        <div className="relative aspect-[16/9] w-full bg-slate-100 group overflow-hidden border-y border-slate-100">
          <img 
            src={issue.imageUrl} 
            alt={issue.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
          {issue.aiSummary && (
            <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur text-white text-[11px] leading-relaxed p-3 rounded-xl border border-slate-800 shadow-lg flex items-start gap-2 animate-fadeIn">
              <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-bold text-orange-400 block uppercase tracking-wide text-[9px]">Gemini Vision AI Summary</span>
                <span>"{issue.aiSummary}"</span>
                {issue.suggestedDepartment && (
                  <span className="text-[9px] text-slate-400 font-bold block mt-1">Responsible Agent: {issue.suggestedDepartment}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Location Bar & Footer Info */}
      <div className="px-4 sm:px-5 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap justify-between items-center text-[11px] text-slate-500 gap-3">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
          <span className="truncate max-w-[240px] sm:max-w-xs">{issue.location}</span>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            Reported by <strong className="text-slate-700 font-bold">{issue.creator}</strong>
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(issue.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Resolution Proof Card (If status is Resolved) */}
      {issue.status === 'resolved' && issue.resolutionProof && (
        <div className="m-4 sm:m-5 p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Verified Infrastructure Resolution Proof
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {issue.resolutionProof.imageUrl && (
              <img 
                src={issue.resolutionProof.imageUrl} 
                alt="Resolution" 
                className="w-full sm:w-28 aspect-video sm:aspect-square object-cover rounded-xl border border-emerald-200/50"
              />
            )}
            <div className="space-y-1.5 flex-1 text-xs">
              <p className="text-slate-600 leading-relaxed font-medium">
                "{issue.resolutionProof.notes}"
              </p>
              <span className="text-[10px] text-slate-400 font-mono block">
                Closed Date: {new Date(issue.resolutionProof.updatedAt || '').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Controls Bar: upvoting, comments, status updates */}
      <div className="px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Reddit Upvote Button */}
          <button
            onClick={handleVote}
            className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
              isUpvotedByMe
                ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/15'
                : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
            }`}
          >
            <ArrowUp className={`w-4 h-4 ${isUpvotedByMe ? 'text-white' : 'text-slate-400'}`} />
            <span>Upvote {issue.upvotes}</span>
          </button>

          {/* Comments Toggle Button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
              showComments 
                ? 'bg-slate-100 text-slate-800 border-slate-300' 
                : 'bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 border-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-slate-400" />
            <span>Discussion ({issue.commentsCount})</span>
            {showComments ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Municipal Verification / Collaboration Update button */}
        {(isCreatorMe || isCityEmployee) && (
          <button
            onClick={() => setShowStatusUpdateForm(!showStatusUpdateForm)}
            className="text-[11px] font-black text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-3 py-1.5 rounded-xl border border-transparent hover:border-orange-200 transition cursor-pointer"
          >
            Update Maintenance Status
          </button>
        )}
      </div>

      {/* Interactive Status Form */}
      {showStatusUpdateForm && (
        <form onSubmit={handleUpdateStatusSubmit} className="mx-4 sm:mx-5 mb-5 p-4 border border-slate-150 rounded-2xl bg-slate-50 space-y-4 animate-fadeIn">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-orange-500" />
            Submit Maintenance Update Form
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Set Progress Status</label>
              <select
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white"
              >
                <option value="reported">Reported (Open)</option>
                <option value="verified">Verified (DPW Inspected)</option>
                <option value="in_progress">In Progress (Active Maintenance)</option>
                <option value="resolved">Resolved (Complete & Clean)</option>
              </select>
            </div>

            {statusInput === 'resolved' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Resolution Proof Photo URL</label>
                <input
                  type="url"
                  value={proofImage}
                  onChange={(e) => setProofImage(e.target.value)}
                  placeholder="e.g. https://images.unsplash.com/... (optional)"
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-[10px]"
                />
              </div>
            )}

            {statusInput === 'resolved' && (
              <div className="col-span-1 sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Resolution Notes / Verification Proof</label>
                <textarea
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  placeholder="Describe details of the fix (e.g. cold patched pothole, bulb replaced, debris removed by truck #9)"
                  rows={2}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={() => setShowStatusUpdateForm(false)}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatingStatus}
              className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold flex items-center gap-1"
            >
              {updatingStatus ? <RefreshCw className="w-3 animate-spin" /> : null}
              Submit Progress Update
            </button>
          </div>
        </form>
      )}

      {/* Discussion / Comments Section */}
      {showComments && (
        <div className="bg-slate-50/60 border-t border-slate-100 p-4 sm:p-5 space-y-4">
          <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            Discussion Feed ({comments.length})
          </div>

          {/* Comments List */}
          {commentsLoading ? (
            <div className="text-center py-4 text-xs font-semibold text-slate-400 flex items-center justify-center gap-1.5">
              <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
              Loading citizen discussion...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 italic">
              No comments filed yet. Be the first to start the conversation!
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs text-xs space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-extrabold text-slate-700 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {comment.author}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment Form */}
          <form onSubmit={handlePostComment} className="flex gap-2">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Add your public verification comment or support detail..."
              className="flex-1 text-xs font-semibold text-slate-700 bg-white focus:bg-white border border-slate-250 focus:border-orange-400 px-3 py-2 rounded-xl outline-none focus:ring-1 focus:ring-orange-400/20 transition"
              required
            />
            <button
              type="submit"
              disabled={commentSubmitting}
              className="p-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
