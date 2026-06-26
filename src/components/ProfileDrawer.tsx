import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User, Mail, Shield, Calendar, LogOut, CheckCircle, ShieldAlert, 
  Key, RefreshCw, Terminal, Eye, EyeOff, Home, FileText, Bookmark, 
  Bell, Settings, ChevronRight, Sparkles 
} from 'lucide-react';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  user: any;
  onLogout: () => void;
  onNavigate: (view: 'home' | 'my-reports' | 'saved-reports' | 'notifications' | 'settings') => void;
  activeView: 'home' | 'my-reports' | 'saved-reports' | 'notifications' | 'settings';
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  token,
  user,
  onLogout,
  onNavigate,
  activeView,
}) => {
  const [profile, setProfile] = useState<any>(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [showInspector, setShowInspector] = useState(false);

  // Notifications mock count
  const mockNotifications = [
    { id: 1, text: "Report #seed-1 updated to In Progress", time: "2h ago" },
    { id: 2, text: "New comment on your report 'Pothole on Mission'", time: "4h ago" },
    { id: 3, text: "Your report was upvoted by 5 citizens", time: "1d ago" },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isOpen || !token) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch current user profile.');
        }

        setProfile(data.user);
      } catch (err: any) {
        setError(err.message || 'Error communicating with profile backend.');
        if (err.message && err.message.toLowerCase().includes('unauthorized')) {
          onLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, isOpen]);

  // Decode JWT client-side for visualization
  const getDecodedPayload = () => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const decoded = atob(parts[1]);
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  };

  const decodedPayload = getDecodedPayload();

  const navItems = [
    { id: 'home', label: 'Home Feed', icon: Home },
    { id: 'my-reports', label: 'My Reports', icon: FileText },
    { id: 'saved-reports', label: 'Saved Reports', icon: Bookmark },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: mockNotifications.length },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900 z-40 cursor-pointer"
            id="drawer-backdrop"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] bg-white border-l border-slate-200 z-50 flex flex-col h-full shadow-2xl font-sans"
            id="profile-drawer-panel"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                  Civic Profile Center
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              {/* User Identity Section */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-6 space-y-2">
                    <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
                    <p className="text-[11px] font-semibold text-slate-400">Updating active session...</p>
                  </div>
                ) : error ? (
                  <div className="text-center p-2 space-y-2">
                    <div className="text-red-500 flex justify-center"><ShieldAlert className="w-5 h-5" /></div>
                    <p className="text-xs text-slate-500">{error}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <img
                      src={profile.profilePicture || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`}
                      alt="Profile Avatar"
                      className="w-16 h-16 bg-white rounded-xl border border-slate-200 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 text-lg truncate leading-tight">
                          {profile.username}
                        </h4>
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-2.5 h-2.5" /> VERIFIED
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        Fixdit Civic Member
                      </p>
                    </div>
                  </div>
                )}

                {/* Info Fields */}
                <div className="space-y-2.5 pt-2 border-t border-slate-200/60 text-xs">
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email
                    </span>
                    <span className="text-slate-700 font-semibold truncate max-w-[200px]">{profile.email}</span>
                  </div>

                  <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Access Role
                    </span>
                    <span className="text-slate-700 font-semibold capitalize bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                      {profile.role || 'User'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Joined Date
                    </span>
                    <span className="text-slate-700 font-semibold">
                      {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'Just now'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block px-1">
                  Navigation
                </span>
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          onClose();
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-orange-50 text-orange-600 border border-orange-100 font-bold' 
                            : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-transparent font-semibold'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                          <span className="text-sm">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {'badge' in item && item.badge && (
                            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 opacity-50" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Collapsible Advanced JWT Inspector */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowInspector(!showInspector)}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 transition text-left cursor-pointer"
                >
                  <span className="text-xs font-mono font-bold text-slate-700 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-orange-500" />
                    Advanced JWT Inspector
                  </span>
                  <span className="text-[10px] text-orange-600 font-bold">
                    {showInspector ? 'Hide' : 'Inspect'}
                  </span>
                </button>

                {showInspector && (
                  <div className="p-4 bg-slate-950 text-slate-300 font-mono text-[10px] leading-relaxed space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
                          <Key className="w-3 h-3" /> BEARER TOKEN
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="text-[9px] font-bold text-orange-500 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {showToken ? 'Hide' : 'Reveal'}
                        </button>
                      </div>
                      <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-900 break-all text-[9px] text-slate-400 max-h-24 overflow-y-auto scrollbar-thin">
                        {showToken ? token : `${token.substring(0, 16)}••••••••${token.substring(token.length - 16)}`}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[9px] text-slate-500 font-bold block">DECODED PAYLOAD CLAIMS</span>
                      <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-900 text-[10px] text-slate-300 space-y-1">
                        {decodedPayload ? (
                          <>
                            <p><span className="text-orange-400">"userId":</span> <span className="text-emerald-400">"{decodedPayload.userId || decodedPayload.id}"</span></p>
                            <p><span className="text-orange-400">"iat":</span> <span className="text-blue-400">{decodedPayload.iat}</span> <span className="text-[8px] text-slate-500">({new Date(decodedPayload.iat * 1000).toLocaleTimeString()})</span></p>
                            <p><span className="text-orange-400">"exp":</span> <span className="text-blue-400">{decodedPayload.exp}</span> <span className="text-[8px] text-slate-500">({new Date(decodedPayload.exp * 1000).toLocaleDateString()})</span></p>
                          </>
                        ) : (
                          <p className="text-slate-500 italic">No valid JWT token detected.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer / Logout */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="text-[10px] text-slate-400 font-mono">
                SESSION SECURE
              </div>
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-red-600 text-white hover:text-white font-bold rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out Session
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
