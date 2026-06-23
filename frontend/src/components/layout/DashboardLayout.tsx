import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  User,
  FileText,
  Briefcase,
  Users,
  BarChart3,
  LogOut,
  Moon,
  Sun,
  Brain,
  HelpCircle,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

const navItems: Record<UserRole, Array<{ path: string; label: string; icon: React.ElementType }>> = {
  candidate: [
    { path: '/candidate/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/candidate/profile', label: 'Profile', icon: User },
    { path: '/candidate/jobs', label: 'Browse Jobs', icon: Briefcase },
    { path: '/candidate/applications', label: 'Applications', icon: FileText },
  ],
  recruiter: [
    { path: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/recruiter/jobs', label: 'Jobs', icon: Briefcase },
    { path: '/recruiter/candidates', label: 'Candidates', icon: Users },
    { path: '/recruiter/analytics', label: 'Analytics', icon: BarChart3 },
  ],
  admin: [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/questions', label: 'Questions', icon: HelpCircle },
    { path: '/admin/ai-config', label: 'AI Config', icon: Settings },
    { path: '/recruiter/jobs', label: 'Jobs', icon: Briefcase },
  ],
};

function NavLinks({
  items,
  location,
  onNavigate,
}: {
  items: typeof navItems.candidate;
  location: ReturnType<typeof useLocation>;
  onNavigate?: () => void;
}) {
  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <Icon className="w-5 h-5" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = user ? navItems[user.role] : [];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      <aside className="w-64 glass-card m-4 mr-0 rounded-r-none hidden lg:flex flex-col">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white">AI Interview</h1>
              <p className="text-xs text-slate-500 capitalize">{user?.role} Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLinks items={items} location={location} />
        </nav>

        <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50 space-y-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 glass-card flex flex-col">
            <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
              <span className="font-bold">Menu</span>
              <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              <NavLinks items={items} location={location} onNavigate={() => setMobileOpen(false)} />
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="glass-card m-4 mb-0 rounded-b-none px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary-600" />
              <span className="font-bold">AI Interview</span>
            </div>
            <div className="hidden lg:block">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white capitalize">
                {location.pathname.split('/').pop()?.replace('-', ' ')}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
