import { useState } from 'react';
import { Menu, X, LogOut, Shield, ChevronRight } from 'lucide-react';
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
    <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
      {items.map((item) => {
        const active = activeTab === item.id;
        return (
          <button key={item.id}
            onClick={() => { onTabChange(item.id); onSelect?.(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
              active
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}>
            <span className={`shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}>
              {item.icon}
            </span>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge ? (
              <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {item.badge}
              </span>
            ) : active ? (
              <ChevronRight size={14} className="text-indigo-200" />
            ) : null}
          </button>
        );
      })}
    </nav>
  );

  const UserFooter = () => (
    <div className="p-3 border-t border-slate-800">
      <div className="flex items-center gap-3 px-3 py-2 mb-1">
        <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
        </div>
      </div>
      <button onClick={handleLogout}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition">
        <LogOut size={15} /> Sign Out
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-slate-900 min-h-screen shrink-0">
        <div className="px-4 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-none">SKCET</p>
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="mt-2 px-3 py-2">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-1">Menu</p>
        </div>

        <NavLinks />
        <UserFooter />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Shield size={15} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">SKCET</span>
            <span className="text-slate-500 text-xs ml-1.5">{subtitle}</span>
          </div>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-5 border-b border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Shield size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">SKCET</p>
                <p className="text-xs text-slate-500">{subtitle}</p>
              </div>
            </div>
            <div className="mt-2 px-3 py-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-1">Menu</p>
            </div>
            <NavLinks onSelect={() => setMobileOpen(false)} />
            <UserFooter />
          </div>
        </div>
      )}
    </>
  );
}
