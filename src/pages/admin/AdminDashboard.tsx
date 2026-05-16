import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  QrCode, 
  TrendingUp, 
  Plus, 
  Search,
  ShieldCheck,
  UserPlus,
  LayoutGrid,
  Bot,
  Filter,
  ArrowUpDown,
  Calendar
} from 'lucide-react';
import { collection, query, onSnapshot, getDocs, addDoc, serverTimestamp, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { User, Student, Class, BehaviorRecord } from '../../types';
import { cn } from '../../lib/utils';
import { AnimatePresence } from 'motion/react';

import AddUserModal from '../../components/admin/AddUserModal';
import AddStudentModal from '../../components/admin/AddStudentModal';
import AddClassModal from '../../components/admin/AddClassModal';
import AccessCodeList from '../../components/admin/AccessCodeList';

import Announcements from '../../components/layout/Announcements';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState<'student' | 'teacher' | 'admin' | 'parent' | 'class' | null>(null);
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    activeCourses: 4
  });

  const [activities, setActivities] = useState<any[]>([]);
  const [behaviorRecords, setBehaviorRecords] = useState<BehaviorRecord[]>([]);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [classesList, setClassesList] = useState<Class[]>([]);
  const [teachersList, setTeachersList] = useState<User[]>([]);

  // Filtering & Sorting State for Behavior Logs
  const [behaviorFilter, setBehaviorFilter] = useState({
    type: 'all' as 'all' | 'excellent' | 'good' | 'bad',
    startDate: '',
    endDate: '',
    sortField: 'timestamp' as 'timestamp' | 'pointsAdded' | 'studentName',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  useEffect(() => {
    console.log("AdminDashboard active. User:", user);
    if (!user || user.role !== 'admin') {
      console.warn("User is not admin or not loaded:", user);
      return;
    }

    // Helper to log errors as per integration guide
    const handleFirestoreError = (error: any, operation: string, path: string) => {
      console.error(`Firestore ${operation} error on ${path}:`, error.message, error);
      // We don't throw here to avoid crashing the whole dashboard, but we log it
    };

    // Fetch teachers for name lookup
    const unsubscribeTeachersList = onSnapshot(query(collection(db, 'users'), where('role', '==', 'teacher')), (snap) => {
      setTeachersList(snap.docs.map(d => ({ uid: d.id, ...d.data() } as User)));
      setStats(prev => ({ ...prev, teachers: snap.size }));
    }, (error) => handleFirestoreError(error, 'LIST', 'users'));

    const unsubscribeStudents = onSnapshot(collection(db, 'students'), (snap) => {
      setStudentsList(snap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
      setStats(prev => ({ ...prev, students: snap.size }));
    }, (error) => handleFirestoreError(error, 'LIST', 'students'));

    const unsubscribeClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      setClassesList(snap.docs.map(d => ({ id: d.id, ...d.data() } as Class)));
      setStats(prev => ({ ...prev, classes: snap.size }));
    }, (error) => handleFirestoreError(error, 'LIST', 'classes'));

    // Fetch all behavior records for logs
    const unsubscribeBehaviorAll = onSnapshot(query(collection(db, 'behavior'), orderBy('timestamp', 'desc'), limit(100)), (snap) => {
        const records = snap.docs.map(d => ({ id: d.id, ...d.data() } as BehaviorRecord));
        setBehaviorRecords(records);
        // Also update recent activities for the summary table
        setActivities(records.slice(0, 5));
    }, (error) => handleFirestoreError(error, 'LIST', 'behavior'));

    return () => {
      unsubscribeStudents();
      unsubscribeTeachersList();
      unsubscribeClasses();
      unsubscribeBehaviorAll();
    };
  }, [user]);

  const filteredBehaviorRecords = behaviorRecords
    .filter(record => {
      // Type Filter
      if (behaviorFilter.type !== 'all' && record.type !== behaviorFilter.type) return false;
      
      // Date Filter
      if (record.timestamp) {
        const date = record.timestamp.toDate();
        if (behaviorFilter.startDate) {
          const start = new Date(behaviorFilter.startDate);
          if (date < start) return false;
        }
        if (behaviorFilter.endDate) {
          const end = new Date(behaviorFilter.endDate);
          end.setHours(23, 59, 59, 999);
          if (date > end) return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (behaviorFilter.sortField === 'timestamp') {
        comparison = (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0);
      } else if (behaviorFilter.sortField === 'pointsAdded') {
        comparison = a.pointsAdded - b.pointsAdded;
      } else if (behaviorFilter.sortField === 'studentName') {
        const nameA = studentsList.find(s => s.id === a.studentId)?.name || '';
        const nameB = studentsList.find(s => s.id === b.studentId)?.name || '';
        comparison = nameA.localeCompare(nameB);
      }
      return behaviorFilter.sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (field: typeof behaviorFilter.sortField) => {
    setBehaviorFilter(prev => ({
      ...prev,
      sortField: field,
      sortOrder: prev.sortField === field && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  };

  const setQuickFilter = (range: 'today' | 'week' | 'all') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (range === 'today') {
      const dateStr = today.toISOString().split('T')[0];
      setBehaviorFilter(prev => ({ ...prev, startDate: dateStr, endDate: dateStr }));
    } else if (range === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);
      setBehaviorFilter(prev => ({ 
        ...prev, 
        startDate: weekAgo.toISOString().split('T')[0], 
        endDate: today.toISOString().split('T')[0] 
      }));
    } else {
      setBehaviorFilter(prev => ({ ...prev, startDate: '', endDate: '', type: 'all' }));
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Users className="text-neon-blue" />} label="الطلاب النشطون" value={stats.students} />
        <StatCard icon={<GraduationCap className="text-neon-green" />} label="المعلمون المعتمدون" value={stats.teachers} />
        <StatCard icon={<BookOpen className="text-neon-yellow" />} label="الصفوف الدراسية" value={stats.classes} />
        <StatCard icon={<ShieldCheck className="text-neon-red" />} label="صحة النظام" value="ممتازة" />
      </div>

      <AnimatePresence>
        {activeModal === 'student' && <AddStudentModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'class' && <AddClassModal onClose={() => setActiveModal(null)} />}
        {(activeModal === 'teacher' || activeModal === 'admin' || activeModal === 'parent') && (
          <AddUserModal 
            role={activeModal as 'teacher' | 'admin' | 'parent'} 
            onClose={() => setActiveModal(null)} 
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-8 text-right">
          <div className="glass-card p-6">
            <h3 className="text-xl font-display font-bold uppercase text-right w-full mb-6">نظرة عامة على النظام</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <ActionButton onClick={() => setActiveModal('student')} icon={<UserPlus />} label="إضافة طالب" color="border-neon-blue" />
              <ActionButton onClick={() => setActiveModal('teacher')} icon={<ShieldCheck />} label="إضافة معلم" color="border-neon-green" />
              <ActionButton onClick={() => setActiveModal('admin')} icon={<ShieldCheck />} label="إضافة مدير" color="border-neon-red" />
              <ActionButton onClick={() => setActiveModal('parent')} icon={<Users />} label="إضافة ولي أمر" color="border-neon-yellow" />
              <ActionButton onClick={() => setActiveModal('class')} icon={<BookOpen />} label="إضافة صف" color="border-neon-blue" />
              <ActionButton onClick={() => {}} icon={<QrCode />} label="تصدير رموز QR" color="border-white/20" />
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/5 flex flex-row-reverse items-center justify-between">
              <h3 className="text-xl font-display font-bold">آخر العمليات</h3>
              <Search size={18} className="text-white/20" />
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-right min-w-[500px]">
                <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-white/40">
                  <tr>
                    <th className="px-6 py-4">النوع</th>
                    <th className="px-6 py-4">النقاط</th>
                    <th className="px-6 py-4 text-left">التوقيت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   {activities.length > 0 ? activities.map((act) => (
                     <tr key={act.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold uppercase">{act.type}</td>
                        <td className="px-6 py-4 text-xs text-neon-green">+{act.pointsAdded}</td>
                        <td className="px-6 py-4 text-xs text-white/40 text-left">{act.timestamp?.toDate ? act.timestamp.toDate().toLocaleTimeString('ar-EG') : '...'}</td>
                     </tr>
                   )) : (
                     <tr className="border-none"><td colSpan={3} className="py-20 text-center text-white/10 italic">لا يوجد نشاط مسجل حالياً</td></tr>
                   )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/5 flex flex-row-reverse items-center justify-between">
              <h3 className="text-xl font-display font-bold">قائمة الصفوف الدراسية</h3>
              <BookOpen size={18} className="text-white/20" />
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-right min-w-[500px]">
                <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-white/40">
                  <tr>
                    <th className="px-6 py-4">اسم الصف</th>
                    <th className="px-6 py-4">المعلم المسؤول</th>
                    <th className="px-6 py-4 text-left">عدد الطلاب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {classesList.length > 0 ? classesList.map((cls) => (
                    <tr key={cls.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold">{cls.name}</td>
                      <td className="px-6 py-4 text-xs">
                        {teachersList.find(t => t.uid === cls.teacherId)?.name || 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 text-xs text-white/40 text-left font-mono">
                        {cls.studentIds?.length || 0}
                      </td>
                    </tr>
                  )) : (
                    <tr className="border-none">
                      <td colSpan={3} className="py-20 text-center text-white/10 italic">لا يوجد صفوف مسجلة حالياً</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System Logs / Analytics */}
        <div className="space-y-8 text-right">
          <div className="glass-card p-6">
            <Announcements />
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-display font-bold mb-6 uppercase">توزيع الموارد</h3>
            <div className="space-y-6">
              <ResourceProgress label="الروبوتات" value={0} color="bg-neon-blue" />
              <ResourceProgress label="الذكاء الاصطناعي" value={0} color="bg-neon-red" />
              <ResourceProgress label="الأردوينو" value={0} color="bg-neon-yellow" />
              <ResourceProgress label="البرمجة" value={0} color="bg-neon-green" />
            </div>
          </div>

          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp size={80} />
            </div>
            <h3 className="text-lg font-display font-bold mb-2">إحصائيات XP</h3>
            <p className="text-3xl font-display font-black text-neon-blue">0</p>
            <p className="text-xs text-white/40 mt-1 flex flex-row-reverse items-center gap-1">
              <TrendingUp size={12} className="text-neon-green" /> 
              لا يوجد بيانات كافية
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Behavior Logs */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 space-y-4">
          <div className="flex flex-row-reverse items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-row-reverse">
              <LayoutGrid size={18} className="text-neon-blue" />
              <h3 className="text-xl font-display font-bold">سجلات السلوك المفصلة</h3>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-2 flex-row-reverse">
              <button 
                onClick={() => setQuickFilter('today')}
                className="px-3 py-1 text-[10px] uppercase tracking-wider font-bold bg-white/5 hover:bg-neon-blue/20 hover:text-neon-blue rounded-md border border-white/10 transition-all"
              >
                اليوم
              </button>
              <button 
                onClick={() => setQuickFilter('week')}
                className="px-3 py-1 text-[10px] uppercase tracking-wider font-bold bg-white/5 hover:bg-neon-blue/20 hover:text-neon-blue rounded-md border border-white/10 transition-all"
              >
                هذا الأسبوع
              </button>
              <button 
                onClick={() => setQuickFilter('all')}
                className="px-3 py-1 text-[10px] uppercase tracking-wider font-bold bg-white/5 hover:text-neon-red border border-white/10 rounded-md transition-all"
              >
                إعادة ضبط
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-row-reverse flex-wrap pt-2">
            {/* Type Filter */}
            <div className="flex items-center gap-2 flex-row-reverse">
              <span className="text-[10px] text-white/40 uppercase font-black">نوع السلوك:</span>
              <select 
                value={behaviorFilter.type}
                onChange={(e) => setBehaviorFilter(prev => ({ ...prev, type: e.target.value as any }))}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/60 focus:outline-none focus:border-neon-blue min-w-[120px]"
              >
                <option value="all">جميع الأنواع</option>
                <option value="excellent">ممتاز</option>
                <option value="good">جيد</option>
                <option value="bad">سلبي</option>
              </select>
            </div>

            <div className="h-4 w-px bg-white/10 hidden md:block" />

            {/* Date Inputs */}
            <div className="flex items-center gap-2 flex-row-reverse text-xs text-white/40">
              <Calendar size={14} className="ml-1" />
              <span className="mr-1">النطاق الزمني:</span>
              <div className="flex items-center gap-2 flex-row-reverse">
                <input 
                  type="date"
                  value={behaviorFilter.startDate}
                  onChange={(e) => setBehaviorFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 focus:outline-none focus:border-neon-blue text-white"
                />
                <span>إلى</span>
                <input 
                  type="date"
                  value={behaviorFilter.endDate}
                  onChange={(e) => setBehaviorFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 focus:outline-none focus:border-neon-blue text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-right min-w-[800px]">
            <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                <th onClick={() => toggleSort('studentName')} className="px-6 py-4 cursor-pointer hover:text-white transition-colors group">
                  <div className="flex items-center justify-end gap-2">
                    <ArrowUpDown size={12} className={cn("opacity-40 group-hover:opacity-100", behaviorFilter.sortField === 'studentName' && "text-neon-blue opacity-100")} />
                    اسم الطالب
                  </div>
                </th>
                <th className="px-6 py-4">المعلم</th>
                <th className="px-6 py-4">نوع السلوك</th>
                <th onClick={() => toggleSort('pointsAdded')} className="px-6 py-4 cursor-pointer hover:text-white transition-colors group">
                  <div className="flex items-center justify-end gap-2">
                    <ArrowUpDown size={12} className={cn("opacity-40 group-hover:opacity-100", behaviorFilter.sortField === 'pointsAdded' && "text-neon-blue opacity-100")} />
                    النقاط
                  </div>
                </th>
                <th onClick={() => toggleSort('timestamp')} className="px-6 py-4 text-left cursor-pointer hover:text-white transition-colors group">
                  <div className="flex items-center justify-start gap-2">
                    التوقيت
                    <ArrowUpDown size={12} className={cn("opacity-40 group-hover:opacity-100", behaviorFilter.sortField === 'timestamp' && "text-neon-blue opacity-100")} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredBehaviorRecords.length > 0 ? filteredBehaviorRecords.map((record) => {
                const student = studentsList.find(s => s.id === record.studentId);
                const teacher = teachersList.find(t => t.uid === record.teacherId);
                
                return (
                  <tr key={record.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-sm font-bold">{student?.name || 'غير معروف'}</span>
                        {student?.robotAvatar ? (
                          <div className="w-8 h-8 rounded-full bg-white/5 p-1">
                            <img src={student.robotAvatar} alt="avatar" className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                            <Bot size={14} className="text-white/20" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-white/60">
                      {teacher?.name || '---'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter",
                        record.type === 'excellent' ? "bg-neon-green/10 text-neon-green border border-neon-green/20" :
                        record.type === 'good' ? "bg-neon-blue/10 text-neon-blue border border-neon-blue/20" :
                        "bg-neon-red/10 text-neon-red border border-neon-red/20"
                      )}>
                        {record.type === 'excellent' ? 'ممتاز' : record.type === 'good' ? 'جيد' : 'سلبي'}
                      </span>
                    </td>
                    <td className={cn(
                      "px-6 py-4 text-xs font-mono",
                      record.pointsAdded >= 0 ? "text-neon-green" : "text-neon-red"
                    )}>
                      {record.pointsAdded >= 0 ? `+${record.pointsAdded}` : record.pointsAdded}
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40 text-left">
                      {record.timestamp?.toDate ? record.timestamp.toDate().toLocaleString('ar-EG', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      }) : '...'}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-white/10 italic">
                    لا توجد سجلات تطابق عوامل التصفية المختارة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Access Codes Management */}
      <AccessCodeList />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass-card p-6 border-white/5 flex flex-col items-end gap-3 text-right"
    >
      <div className="p-3 bg-white/5 rounded-xl w-fit">
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">{label}</p>
        <p className="text-3xl font-display font-black mt-1 leading-none">{value}</p>
      </div>
    </motion.div>
  );
}

function ActionButton({ icon, label, color, onClick }: { icon: React.ReactNode, label: string, color: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
      "flex flex-col items-center justify-center p-6 rounded-2xl border bg-white/5 hover:bg-white/10 transition-all gap-3 group",
      color
    )}>
      <div className="p-2 transition-transform group-hover:scale-110">
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest leading-tight text-center">{label}</span>
    </button>
  );
}

function ResourceProgress({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-2 text-right">
      <div className="flex flex-row-reverse justify-between items-end">
        <span className="text-xs font-bold uppercase tracking-wider text-white/60">{label}</span>
        <span className="text-xs font-mono text-white/40">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={cn("h-full ml-auto", color)}
        />
      </div>
    </div>
  );
}
