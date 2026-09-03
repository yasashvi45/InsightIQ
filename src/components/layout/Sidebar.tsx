import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart2, 
  Sparkles, 
  TrendingUp, 
  FileText, 
  Bot 
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  { name: 'AI Insights', path: '/insights', icon: Sparkles },
  { name: 'Forecast', path: '/forecast', icon: TrendingUp },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'AI Assistant', path: '/assistant', icon: Bot },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const location = useLocation();

  return (
    <aside className="w-64 border-r border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] flex flex-col h-screen shrink-0 sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-primary)] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(18,209,142,0.3)]">
          <Sparkles className="w-5 h-5 text-[var(--color-brand-bg)]" />
        </div>
        <span className="font-heading font-semibold text-xl tracking-tight text-[var(--color-brand-text)]">InsightIQ</span>
      </div>

      <nav className="flex-1 px-4 pt-2 pb-6 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-[var(--color-brand-muted)] uppercase tracking-wider mb-4 mt-2 px-2">Menu</div>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (location.pathname === '/' && item.path === '/dashboard');
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-[var(--color-brand-card)] text-[var(--color-brand-primary)]" 
                  : "text-[var(--color-brand-muted)] hover:text-[var(--color-brand-text)] hover:bg-[var(--color-brand-card)]"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-[var(--color-brand-primary)]" : "text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-text)]"
              )} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
