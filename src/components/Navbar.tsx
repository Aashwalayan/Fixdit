import React from 'react';
import { 
  Building2, PlusCircle, Bell, BarChart3, HelpCircle, 
  User, CheckCircle, Sparkles, MessageSquareHeart 
} from 'lucide-react';

interface NavbarProps {
  currentUser: any;
  onOpenProfile: () => void;
  onToggleCreateIssue: () => void;
  showCreateIssue: boolean;
  activeTab: 'feed' | 'stats';
  setActiveTab: (tab: 'feed' | 'stats') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenProfile,
  onToggleCreateIssue,
  showCreateIssue,
  activeTab,
  setActiveTab,
}) => {
  return (
    <nav className="w-full bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm font-sans" id="app-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <div 
              onClick={() => setActiveTab('feed')}
              className="flex items-center gap-2 cursor-pointer select-none group"
            >
              <div className="w-10 h-10 bg-orange-600 group-hover:bg-orange-700 text-white rounded-xl flex items-center justify-center font-black text-xl tracking-tighter shadow-md shadow-orange-500/10 transition-colors">
                Fd
              </div>
              <div className="hidden sm:block">
                <span className="font-black text-slate-900 text-base tracking-tight block leading-tight">
                  Fixdit
                </span>
                <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider">
                  Civic Gateway
                </span>
              </div>
            </div>

            {/* Navigation Tabs (Feed vs Dashboard) */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-tight transition cursor-pointer ${
                  activeTab === 'feed'
                    ? 'bg-orange-50 text-orange-600 border border-orange-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                Community Feed
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-tight transition cursor-pointer ${
                  activeTab === 'stats'
                    ? 'bg-orange-50 text-orange-600 border border-orange-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                Transparency Metrics
              </button>
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-3">
            {/* File Report shortcut button */}
            <button
              onClick={onToggleCreateIssue}
              className={`px-3.5 py-2 rounded-xl text-xs font-black tracking-tight flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-orange-500/5 cursor-pointer ${
                showCreateIssue
                  ? 'bg-slate-950 text-white hover:bg-slate-800'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">File New Report</span>
            </button>

            {/* Notification Tray Icon */}
            <button 
              onClick={() => onOpenProfile()} 
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 relative transition cursor-pointer"
              aria-label="Notifications Drawer"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
            </button>

            {/* Mobile Navigation Tabs Shortcut Menu */}
            <div className="flex md:hidden border-l border-slate-200 pl-2 gap-1">
              <button
                onClick={() => setActiveTab(activeTab === 'feed' ? 'stats' : 'feed')}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
                title="Switch Feed/Dashboard"
              >
                <BarChart3 className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* User Account Avatar (opens right side drawer) */}
            <div className="border-l border-slate-200 pl-3 flex items-center">
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-all text-left cursor-pointer border border-transparent hover:border-slate-200"
                aria-label="Open Profile Panel"
              >
                <img
                  src={currentUser.profilePicture || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`}
                  alt="Profile Avatar"
                  className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 object-cover shadow-sm"
                />
                <div className="hidden lg:block">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-extrabold text-slate-800 tracking-tight leading-none block">
                      {currentUser.username}
                    </span>
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                  </div>
                  <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest block mt-0.5 leading-none">
                    Verified ID
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
