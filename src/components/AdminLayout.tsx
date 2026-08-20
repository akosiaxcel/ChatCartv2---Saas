import React, { useState, useEffect } from 'react';
import { LogOut, LayoutDashboard, Menu as MenuIcon, Settings, X, Shield, ExternalLink, Store, Sparkles, MessageSquare } from 'lucide-react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { Logo } from './Logo';
import { getBusinessProfile } from '../firebase/firestore';
import { BusinessProfile } from '../types';
import { ProUpgradeModal } from './ProUpgradeModal';
import { PAYMENT_CONFIG } from '../lib/constants';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const isSuperAdminUser = user?.email === 'axceljohnpatriarca@gmail.com';
  const isAdminSection = location.pathname.startsWith('/superadmin');

  useEffect(() => {
    if (user && !isAdminSection) {
      getBusinessProfile(user.uid).then(p => {
        if (p) setProfile(p);
      });
    }
  }, [user, isAdminSection]);

  const handleLogout = async () => {
    await signOut(auth);
    if (isAdminSection) {
      navigate('/superadmin');
    } else {
      navigate('/login');
    }
  };

  const standardNavItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: slug ? `/${slug}/dashboard` : '/dashboard' },
    { label: 'Menu Editor', icon: MenuIcon, path: slug ? `/${slug}/editor` : '/editor' },
  ];

  const superAdminNavItems = [
    { label: 'Platform Overview', icon: Settings, path: '/superadmin/dashboard' },
    { label: 'My Store Dashboard', icon: Store, path: '/dashboard' },
    { label: 'My Menu Editor', icon: MenuIcon, path: '/editor' },
  ];

  const displayNavItems = isSuperAdminUser ? superAdminNavItems : standardNavItems;

  const isPro = profile?.plan === 'pro';

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b-2 border-zinc-900 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs border-2 border-zinc-900 p-0.5 overflow-hidden">
            <Logo size={36} />
          </div>
          <span className="font-bold text-lg tracking-tight">ChatCart</span>
          {isSuperAdminUser ? (
            <span className="bg-zinc-900 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-zinc-900">
              Admin
            </span>
          ) : isPro ? (
            <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs border border-amber-700">
              PRO
            </span>
          ) : null}
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors border-2 border-zinc-900"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar / Mobile Menu Overlay */}
      <aside className={cn(
        "fixed inset-0 z-40 bg-white md:relative md:z-auto md:w-64 md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col border-r-2 border-zinc-900",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 hidden md:flex items-center justify-between border-b-2 border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-xs border-2 border-zinc-900 p-0.5 overflow-hidden">
              <Logo size={40} />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block text-zinc-900">ChatCart</span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                {isAdminSection ? 'Super Admin' : 'Business Portal'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Menu Header (only visible when overlay is open) */}
        <div className="p-6 flex md:hidden items-center justify-between border-b-2 border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs border-2 border-zinc-900 p-0.5 overflow-hidden">
              <Logo size={34} />
            </div>
            <span className="font-bold text-lg tracking-tight">ChatCart Menu</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-zinc-700 border-2 border-zinc-900 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {displayNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all border-2",
                  isActive
                    ? "bg-emerald-50 text-emerald-950 font-bold border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                    : "border-transparent text-zinc-600 hover:border-zinc-900/30 hover:bg-zinc-50 hover:text-zinc-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-emerald-700" : "text-zinc-500")} />
                {item.label}
              </Link>
            );
          })}

          {/* Plan Card for Regular Businesses */}
          {!isAdminSection && !isSuperAdminUser && (
            <div className="pt-4 mt-4 border-t-2 border-zinc-900">
              {isPro ? (
                <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                      Pro Business
                    </span>
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full border border-amber-400">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-950/80 leading-tight mt-1 font-medium">
                    Unlimited items & custom branding unlocked.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-zinc-900 text-white rounded-2xl border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      Free Starter Plan
                    </span>
                    <span className="text-[9px] font-bold text-zinc-300">
                      Max 15 Items
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-tight">
                    Upgrade to Pro for unlimited dishes & branding for ₱499/mo.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition-all border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                    Upgrade to Pro
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* User profile & Logout footer */}
        <div className="p-4 border-t-2 border-zinc-900 space-y-2">
          <a
            href={PAYMENT_CONFIG.messengerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-700 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-all border border-zinc-200 hover:border-zinc-900"
          >
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              Chat Support on Messenger
            </span>
            <ExternalLink className="w-3 h-3 text-zinc-500" />
          </a>

          <a
            href="https://wapdev.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-all"
          >
            <span>wapdev.xyz</span>
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </a>

          {user && (
            <div className="px-3 py-2 bg-zinc-100 rounded-xl border border-zinc-900/30">
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Logged In As</p>
              <p className="text-xs font-bold text-zinc-900 truncate" title={user.email || ''}>
                {user.email}
              </p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 hover:border-rose-400 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Pro Upgrade Modal */}
      <ProUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        profile={profile}
        onSuccess={() => {
          if (profile) setProfile({ ...profile, plan: 'pro', planStatus: 'pending_payment' });
        }}
      />
    </div>
  );
}

