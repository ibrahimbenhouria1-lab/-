import React from 'react';
import { motion } from 'motion/react';
import { 
  Bot, 
  LogOut, 
  Menu, 
  Bell, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Trophy, 
  MessageSquare,
  Search,
  Settings
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function DashboardLayout({ children, title }: { children: React.ReactNode, title: string }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const navItemsByRole = {
    admin: [
      { label: 'لوحة التحكم', icon: <LayoutDashboard size={20} />, path: '/admin' },
      { label: 'المعلمون', icon: <Users size={20} />, path: '/admin/teachers' },
      { label: 'الطلاب', icon: <LayoutDashboard size={20} />, path: '/admin/students' },
      { label: 'الإعلانات', icon: <Bell size={20} />, path: '/admin/announcements' },
      { label: 'المتصدرين', icon: <Trophy size={20} />, path: '/leaderboard' },
    ],
    teacher: [
      { label: 'لوحة التحكم', icon: <LayoutDashboard size={20} />, path: '/teacher' },
      { label: 'طلابي', icon: <Users size={20} />, path: '/teacher/students' },
      { label: 'الواجبات', icon: <Calendar size={20} />, path: '/teacher/homework' },
      { label: 'المتصدرين', icon: <Trophy size={20} />, path: '/leaderboard' },
      { label: 'الرسائل', icon: <MessageSquare size={20} />, path: '/teacher/messages' },
    ],
    parent: [
      { label: 'لوحة التحكم', icon: <LayoutDashboard size={20} />, path: '/parent' },
      { label: 'الملف الدراسي', icon: <LayoutDashboard size={20} />, path: '/parent/profile' },
      { label: 'الرسائل', icon: <MessageSquare size={20} />, path: '/parent/messages' },
      { label: 'المتصدرين', icon: <Trophy size={20} />, path: '/leaderboard' },
    ]
  };

  const navItems = navItemsByRole[user?.role as keyof typeof navItemsByRole] || [];

  if (!user) return null;

  return (
    <div className="flex flex-row-reverse min-h-screen bg-deep-space overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="glass-card m-4 border-r-0 rounded-3xl overflow-hidden hidden md:flex flex-col"
      >
        <div className="p-6 flex items-center gap-3 justify-end">
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-display font-black text-xl tracking-tighter text-right"
            >
              نيوجيت<span className="text-neon-blue">روبوت</span>
            </motion.span>
          )}
          <Bot className="text-neon-blue robot-glow" size={32} />
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-8">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex flex-row-reverse items-center justify-start gap-4 px-4 py-3 rounded-xl transition-all group",
                location.pathname === item.path ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5"
              )}
            >
              <span className="transition-colors">{item.icon}</span>
              {isSidebarOpen && <span className="font-medium text-right flex-1">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 bg-white/5 m-4 rounded-2xl">
          <div className="flex flex-row-reverse items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neon-blue/20 border border-neon-blue/40 flex items-center justify-center overflow-hidden">
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Bot size={20} className="text-neon-blue" />
              )}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0 text-right">
                <p className="font-bold text-sm truncate">{user?.name}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">
                  {user?.role === 'admin' ? 'مدير' : user?.role === 'teacher' ? 'معلم' : 'ولي أمر'}
                </p>
              </div>
            )}
          </div>
          <button 
            onClick={logout}
            className={cn(
              "mt-4 flex flex-row-reverse items-center gap-4 px-4 py-2 w-full text-red-400 hover:bg-red-400/10 rounded-lg transition-colors",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut size={18} />
            {isSidebarOpen && <span className="font-medium text-sm text-right flex-1">تسجيل الخروج</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden text-right">
        {/* Header */}
        <header className="flex flex-row-reverse items-center justify-between mb-8 glass-card px-6 py-4 rounded-2xl">
          <div className="flex flex-row-reverse items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg text-white/60 md:hidden"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-display font-bold tracking-tight text-white/90 text-right">
              {title}
            </h2>
          </div>

          <div className="flex flex-row-reverse items-center gap-4">
            <div className="hidden lg:flex flex-row-reverse items-center gap-2 px-4 py-2 glass-card rounded-xl border-white/5 bg-white/5">
              <Search size={18} className="text-white/20" />
              <input 
                placeholder="بحث..." 
                className="bg-transparent border-none outline-none text-sm placeholder:text-white/10 w-48 text-right"
              />
            </div>
            <button className="p-2 glass-card border-white/10 hover:bg-white/10 rounded-xl relative">
              <Bell size={20} className="text-white/60" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-neon-red rounded-full" />
            </button>
            <button className="p-2 glass-card border-white/10 hover:bg-white/10 rounded-xl">
              <Settings size={20} className="text-white/60" />
            </button>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pl-2">
          {children}
        </div>
      </main>
    </div>
  );
}
