import React, { useState } from 'react';
import { LogOut, LayoutDashboard, Menu as MenuIcon, Settings, X, Shield, ExternalLink, Store } from 'lucide-react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { Logo } from './Logo';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isSuperAdminUser = user?.email === 'axceljohnpatriarca@gmail.com';
  const isAdminSection = location.pathname.startsWith('/superadmin');

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

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Logo size={24} color="white" />
          </div>
          <span className="font-bold text-lg tracking-tight">ChatCart</span>
          {isSuperAdminUser && (
            <span className="bg-zinc-900 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
              Admin
            </span>
          )}
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar / Mobile Menu Overlay */}
      <aside className={cn(
        "fixed inset-0 z-40 bg-white md:relative md:z-auto md:w-64 md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col border-r border-zinc-200",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 hidden md:flex items-center justify-between border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Logo size={28} color="white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block text-zinc-900">ChatCart</span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                {isAdminSection ? 'Super Admin' : 'Business Portal'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Menu Header (only visible when overlay is open) */}
        <div className="p-6 flex md:hidden items-center justify-between border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Logo size={24} color="white" />
            </div>
            <span className="font-bold text-lg tracking-tight">ChatCart Menu</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-zinc-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {displayNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all",
                  isActive
                    ? "bg-emerald-50 text-emerald-700 font-bold"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-emerald-600" : "text-zinc-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User profile & Logout footer */}
        <div className="p-4 border-t border-zinc-100 space-y-2">
          <a
            href="https://wapdev.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-500 hover:text-emerald-600 hover:bg-zinc-50 rounded-xl transition-all"
          >
            <span>Visit wapdev.xyz</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>

          {user && (
            <div className="px-3 py-2 bg-zinc-50 rounded-xl">
              <p className="text-[10px] text-zinc-400 uppercase font-black tracking-wider">Logged In As</p>
              <p className="text-xs font-bold text-zinc-800 truncate" title={user.email || ''}>
                {user.email}
              </p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-xs text-red-500 hover:bg-red-50 transition-all"
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
    </div>
  );
}
