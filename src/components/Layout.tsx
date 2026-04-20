import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  LogOut, 
  Menu, 
  X, 
  User,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { useState } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  user: UserProfile;
}

export default function Layout({ user }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Data Pasien', path: '/patients', icon: Users },
    { name: 'Jadwal & Janji', path: '/appointments', icon: Calendar },
    { name: 'Edukasi & Promosi', path: '/education', icon: BookOpen },
    { name: 'Laporan', path: '/reports', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="w-72 bg-white border-r border-slate-200 flex flex-col z-50 shadow-sm"
          >
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <h1 className="font-bold text-xl text-slate-800 tracking-tight">DentalCare</h1>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    location.pathname === item.path
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors",
                    location.pathname === item.path ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                  )} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3 px-4 py-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border-2 border-white shadow-sm">
                  {user.displayName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.displayName}</p>
                  <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
              >
                <LogOut className="w-5 h-5" />
                <span>Keluar</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <Menu className="w-6 h-6 text-slate-600" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-slate-800">
              {navItems.find(item => item.path === location.pathname)?.name || 'Detail'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               Sistem Online
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
