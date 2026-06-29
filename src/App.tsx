import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Sparkles, AlertCircle, FileText, Search, Filter, 
  MapPin, CheckCircle, SlidersHorizontal, ArrowUpDown, Bell, Settings as SettingsIcon, Info
} from 'lucide-react';
import { Login } from './components/Login';
import { SignUp } from './components/SignUp';
import { EmailVerification } from './components/EmailVerification';
import { ProfileDrawer } from './components/ProfileDrawer';
import { Navbar } from './components/Navbar';
import { IssueCard } from './components/IssueCard';
import { CivicMap } from './components/CivicMap';
import { ReportIssueForm } from './components/ReportIssueForm';
import { CivicStatsDashboard } from './components/CivicStatsDashboard';
import { OfficialApplicationPanel } from './components/OfficialApplicationPanel';
import { NotificationsPanel } from './components/NotificationsPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { AdminDashboard } from './components/AdminDashboard';
import { OfficialDashboard } from './components/OfficialDashboard';
import { IssuePost } from './types';

export default function App() {
  // Authentication session state
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('fixdit_token') || sessionStorage.getItem('fixdit_token') || null;
  });
  const [user, setUser] = useState<any | null>(null);
  const [authView, setAuthView] = useState<'login' | 'signup' | 'verification'>('login');
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Application main workspaces
  const [activeTab, setActiveTab] = useState<'feed' | 'stats' | 'official-dashboard' | 'admin-dashboard'>('feed');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showCreateIssue, setShowCreateIssue] = useState(false);

  // Issues feed state
  const [issues, setIssues] = useState<IssuePost[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [focusedIssue, setFocusedIssue] = useState<IssuePost | null>(null);
  const [feedMode, setFeedMode] = useState<'active' | 'resolved'>('active');

  // Feed filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('priority');

  // Drawer filter
  const [drawerFilter, setDrawerFilter] = useState<'home' | 'my-reports' | 'saved-reports' | 'notifications' | 'settings' | 'official-application'>('home');

  // Validate session on load or token change
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setAuthChecking(false);
        return;
      }

      setAuthChecking(true);
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok && data.user) {
          setUser(data.user);
        } else {
          setToken(null);
          setUser(null);
          localStorage.removeItem('fixdit_token');
          sessionStorage.removeItem('fixdit_token');
        }
      } catch (err) {
        console.error('Session validation connection failure:', err);
      } finally {
        setAuthChecking(false);
      }
    };

    validateToken();
  }, [token]);

  // Fetch issues from backend with filters
  const fetchIssues = async () => {
    if (!token) return;
    setIssuesLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (categoryFilter) queryParams.append('category', categoryFilter);
      if (statusFilter) queryParams.append('status', statusFilter);
      if (searchTerm) queryParams.append('search', searchTerm);
      queryParams.append('sortBy', sortBy);

      const response = await fetch(`/api/issues?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIssues(data);
      }
    } catch (err) {
      console.error('Error fetching issue feed:', err);
    } finally {
      setIssuesLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [categoryFilter, statusFilter, searchTerm, sortBy, token]);

  // Session teardown
  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setAuthView('login');
    localStorage.removeItem('fixdit_token');
    sessionStorage.removeItem('fixdit_token');
    setIsDrawerOpen(false);
  };

  const handleIssueUpdated = (updatedIssue: IssuePost) => {
    setIssues((prevIssues) =>
      prevIssues.map((issue) => (issue.id === updatedIssue.id ? updatedIssue : issue))
    );
    if (focusedIssue?.id === updatedIssue.id) {
      setFocusedIssue(updatedIssue);
    }
  };

  const handleSaveToggled = (issueId: string, saved: boolean) => {
    setUser((currentUser: any) => {
      if (!currentUser) return currentUser;
      const savedReports = Array.isArray(currentUser.savedReports) ? [...currentUser.savedReports.map(String)] : [];
      const normalizedIssueId = String(issueId);
      const existingIndex = savedReports.indexOf(normalizedIssueId);
      if (saved && existingIndex === -1) {
        savedReports.push(normalizedIssueId);
      }
      if (!saved && existingIndex > -1) {
        savedReports.splice(existingIndex, 1);
      }
      return { ...currentUser, savedReports };
    });
  };

  const handleFocusOnMap = (issue: IssuePost) => setFocusedIssue(issue);
  const handleFocusFromMap = (issue: IssuePost) => setFocusedIssue(issue);

  const handleDrawerNavigate = (view: 'home' | 'my-reports' | 'saved-reports' | 'notifications' | 'settings' | 'official-application' | 'admin-dashboard') => {
    if (view === 'admin-dashboard') {
      setActiveTab('admin-dashboard');
      setDrawerFilter('home');
      return;
    }
    if (view === 'official-application') {
      setDrawerFilter('official-application');
      setActiveTab('feed');
      return;
    }
    setDrawerFilter(view);
    setActiveTab('feed');
  };

  const getFilteredIssuesList = () => {
    let result = [...issues];
    if (feedMode === 'active') {
      result = result.filter((issue) => ['pending', 'accepted', 'in_progress'].includes(String(issue.status)));
    } else if (feedMode === 'resolved') {
      result = result.filter((issue) => ['resolved', 'verified'].includes(String(issue.status)));
    }
    if (drawerFilter === 'my-reports' && user) {
      result = result.filter(issue => issue.creator === user.username);
    } else if (drawerFilter === 'saved-reports' && user) {
      const savedIds = Array.isArray(user.savedReports) ? user.savedReports.map(String) : [];
      result = result.filter(issue => savedIds.includes(String(issue.id)));
    }
    return result;
  };

  const finalIssuesList = getFilteredIssuesList();

  // Loading Splash Screen
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans antialiased" id="splash-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-[#ea580c] font-black text-3xl tracking-tighter shadow-md animate-pulse">
            Fd
          </div>
          <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
            <RefreshCw className="w-4 h-4 animate-spin text-[#ea580c]" />
            Initializing Fixdit Secure Gateway...
          </div>
        </div>
      </div>
    );
  }

  // Not Logged In View
  if (!user || !token) {
    return (
      <div
        className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased selection:bg-orange-500 selection:text-white relative overflow-hidden"
        id="fixdit-auth-app"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        <div className="absolute top-8 left-8 text-xs font-mono text-slate-400 select-none hidden lg:flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>FIXDIT // COMMUNITY EMPOWERED INFRASTRUCTURE</span>
        </div>
        <div className="absolute bottom-8 right-8 text-xs font-mono text-slate-400 select-none hidden lg:block">
          AUTHENTICATION CENTER // EST. 2026
        </div>

        <div className="w-full flex justify-center items-center" id="auth-view-wrapper">
          {authView === 'login' && (
            <Login
              onLoginSuccess={(tok, usr) => {
                setToken(tok);
                setUser(usr);
              }}
              onNavigateToSignUp={() => setAuthView('signup')}
            />
          )}

          {authView === 'signup' && (
            <SignUp
              onRegisterSuccess={(email) => {
                // Only receive the email — no OTP token, no shortcut
                setVerificationEmail(email);
                setAuthView('verification');
              }}
              onNavigateToLogin={() => setAuthView('login')}
            />
          )}

          {authView === 'verification' && (
            <EmailVerification
              email={verificationEmail}
              onBackToLogin={() => setAuthView('login')}
            />
          )}
        </div>
      </div>
    );
  }

  // Logged In Main Application
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased" id="fixdit-app">
      <Navbar
        currentUser={user}
        onOpenProfile={() => setIsDrawerOpen(true)}
        onToggleCreateIssue={() => {
          setShowCreateIssue(!showCreateIssue);
          setActiveTab('feed');
          setDrawerFilter('home');
        }}
        showCreateIssue={showCreateIssue}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setDrawerFilter('home');
        }}
      />

      <ProfileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        token={token}
        user={user}
        onLogout={handleLogout}
        onUserUpdated={setUser}
        onNavigate={handleDrawerNavigate}
        activeView={drawerFilter}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8" id="app-workspace-container">
        {activeTab === 'stats' ? (
          <CivicStatsDashboard token={token} />
        ) : activeTab === 'official-dashboard' ? (
          <OfficialDashboard user={user} issues={issues} />
        ) : activeTab === 'admin-dashboard' ? (
          <AdminDashboard token={token} currentUser={user} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            <div className="lg:col-span-7 space-y-6">

              {drawerFilter !== 'home' && (
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-between animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-800">
                    <Info className="w-4 h-4 text-orange-500" />
                    <span>
                      Viewing Filtered Vault: <strong className="capitalize">{drawerFilter.replace('-', ' ')}</strong> ({finalIssuesList.length} cases)
                    </span>
                  </div>
                  <button
                    onClick={() => setDrawerFilter('home')}
                    className="text-[10px] font-black text-orange-600 hover:underline uppercase"
                  >
                    Clear Filter
                  </button>
                </div>
                )}

              {drawerFilter === 'official-application' && (
                <OfficialApplicationPanel token={token} user={user} />
              )}

              {drawerFilter === 'notifications' ? (
                <NotificationsPanel token={token} />
              ) : drawerFilter === 'settings' ? (
                <SettingsPanel token={token} user={user} onUserUpdated={setUser} />
              ) : (
                <>
                  {showCreateIssue && (
                    <ReportIssueForm
                      token={token}
                      username={user.username}
                      onIssueCreated={(newIssue) => {
                        setIssues([newIssue, ...issues]);
                        setShowCreateIssue(false);
                      }}
                      onCancel={() => setShowCreateIssue(false)}
                    />
                  )}

                  {/* Filter & Search Bar */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4" id="feed-search-filter-controls">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setFeedMode('active')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${feedMode === 'active' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-white text-slate-500 border-slate-200'}`}
                      >
                        Active Feed
                      </button>
                      <button
                        onClick={() => setFeedMode('resolved')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${feedMode === 'resolved' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-white text-slate-500 border-slate-200'}`}
                      >
                        Resolved Feed
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search reported incidents by keyword or location..."
                        className="w-full text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-400 pl-8 pr-3 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-orange-400/20 transition shadow-xs"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 items-center">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Category</label>
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="w-full text-[10px] sm:text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200/60 p-2 rounded-lg outline-none cursor-pointer"
                        >
                          <option value="">All Sectors</option>
                          <option value="Roads & Potholes">Roads & Potholes</option>
                          <option value="Garbage & Sanitation">Garbage & Sanitation</option>
                          <option value="Water & Leakages">Water & Leakages</option>
                          <option value="Lighting & Power">Lighting & Power</option>
                          <option value="Parks & Infrastructure">Parks & Infrastructure</option>
                          <option value="Public Transit">Public Transit</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full text-[10px] sm:text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200/60 p-2 rounded-lg outline-none cursor-pointer"
                        >
                          <option value="">All Statuses</option>
                          <option value="pending">Pending (Open)</option>
                          <option value="accepted">Accepted</option>
                          <option value="verified">Verified (DPW Checked)</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved (Closed)</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Sort</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full text-[10px] sm:text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200/60 p-2 rounded-lg outline-none cursor-pointer"
                        >
                          <option value="priority">Priority Score</option>
                          <option value="most_upvoted">Upvotes Count</option>
                          <option value="recent">Recent Filing</option>
                          <option value="severity">Severity Rank</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Feed list */}
                  <div className="space-y-5" id="community-feed-list">
                    {issuesLoading ? (
                      <div className="p-12 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
                        <span>Synchronizing community reports feed...</span>
                      </div>
                    ) : finalIssuesList.length === 0 ? (
                      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                        <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                          Ø
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">No reported incidents found</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                            Try adjusting your filters, searching for another keyword, or report a new issue yourself!
                          </p>
                        </div>
                      </div>
                    ) : (
                      finalIssuesList.map((issue) => (
                        <IssueCard
                          key={issue.id}
                          issue={issue}
                          token={token}
                          currentUser={user}
                          onIssueUpdated={handleIssueUpdated}
                          onSaveToggled={handleSaveToggled}
                          onFocusOnMap={handleFocusOnMap}
                          isFocused={focusedIssue?.id === issue.id}
                        />
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
              <div className="h-[380px] lg:h-[480px]">
                <CivicMap
                  issues={issues}
                  onSelectIssue={handleFocusFromMap}
                  selectedIssue={focusedIssue}
                />
              </div>

              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-3.5 relative overflow-hidden">
                <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-slate-100 rounded text-[9px] text-slate-400 uppercase font-sans font-bold">
                  SF CO-OP
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  How Fixdit Operates
                </h4>
                <div className="space-y-2 text-xs text-slate-500 leading-relaxed">
                  <p>
                    Fixdit connects citizens and local municipal workers to accelerate infrastructure repair.
                    Upload a photo of an issue (pothole, leakage, dumping) to run an immediate <strong>Gemini Vision AI</strong> audit.
                  </p>
                  <p>
                    Upvote urgent matters to dynamically amplify their <strong>Priority Score</strong>. Officials or active responders can patch the issue and upload physical completion proof right on the card.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
