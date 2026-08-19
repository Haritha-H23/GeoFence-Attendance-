import { useState } from 'react';
import { Menu, X, LogOut, MapPinned, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface NavItem { id: string; label: string; icon: React.ReactNode; badge?: number; }
interface SidebarProps {
  items: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  title: string;
  subtitle: string;
}

export default function Sidebar({ items, activeTab, onTabChange, title, subtitle }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const NavLinks = ({ onSelect }: { onSelect?: () => void }) => (
    <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
      {items.map((item) => {
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => { onTabChange(item.id); onSelect?.(); }}
            className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
              active
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_10px_24px_rgba(37,99,235,0.28)]'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${active ? 'bg-white/12' : 'bg-slate-800 text-slate-400 group-hover:text-white'}`}>
              {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="min-w-[20px] rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                {item.badge}
              </span>
            ) : active ? (
              <ChevronRight size={14} className="text-blue-100" />
            ) : null}
          </button>
        );
      })}
    </nav>
  );

  const UserFooter = () => (
    <div className="border-t border-slate-800/80 p-3">
      <div className="mb-2 flex items-center gap-3 rounded-2xl bg-slate-900/60 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-bold text-white shadow-lg shadow-blue-500/20">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
          <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-rose-300"
      >
        <LogOut size={15} /> Sign Out
      </button>
    </div>
  );

  return (
    <>
      <aside className="hidden min-h-screen w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950 md:flex">
        <div className="border-b border-slate-800/80 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-400 to-sky-300 shadow-[0_12px_24px_rgba(37,99,235,0.38)]">
              <MapPinned size={18} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">{title || 'GeoAttend'}</p>
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="px-4 pb-2 pt-5">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Menu</p>
        </div>

        <NavLinks />
        <UserFooter />
      </aside>

      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400">
            <MapPinned size={15} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-white">{title || 'GeoAttend'}</span>
            <span className="ml-1.5 text-[10px] uppercase tracking-[0.16em] text-slate-400">{subtitle}</span>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-200 transition hover:bg-slate-700"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 bottom-0 w-72 border-r border-slate-800 bg-slate-950 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400">
                <MapPinned size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{title || 'GeoAttend'}</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{subtitle}</p>
              </div>
            </div>
            <div className="px-4 pb-2 pt-5">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Menu</p>
            </div>
            <NavLinks onSelect={() => setMobileOpen(false)} />
            <UserFooter />
          </div>
        </div>
      )}
    </>
  );
}
