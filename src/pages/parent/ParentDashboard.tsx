import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Calendar, 
  AlertCircle, 
  MessageSquare, 
  Zap, 
  TrendingUp,
  Star,
  BookOpen,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { Student, AttendanceRecord, BehaviorRecord } from '../../types';
import { cn } from '../../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import Announcements from '../../components/layout/Announcements';
import AIStudyAssistant from '../../components/AIStudyAssistant';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [records, setRecords] = useState<{ attendance: AttendanceRecord[], behavior: BehaviorRecord[] }>({ attendance: [], behavior: [] });
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'attendance'>('overview');

  useEffect(() => {
    if (!user?.studentIds || user.studentIds.length === 0) return;

    const unsubscribes: any[] = [];
    user.studentIds.forEach(id => {
      const u = onSnapshot(doc(db, 'students', id), (snap) => {
        if (snap.exists()) {
          const studentData = { id: snap.id, ...snap.data() } as Student;
          setStudents(prev => {
            const index = prev.findIndex(s => s.id === id);
            if (index > -1) {
              const next = [...prev];
              next[index] = studentData;
              return next;
            }
            return [...prev, studentData];
          });
          if (!selectedStudent && id === user.studentIds?.[0]) setSelectedStudent(studentData);
        }
      }, (error) => {
        console.warn(`Parent student ${id} read permission denied:`, error.message);
      });
      unsubscribes.push(u);
    });

    return () => unsubscribes.forEach(u => u());
  }, [user]);

  useEffect(() => {
    if (!selectedStudent) return;

    const qAtt = query(collection(db, 'attendance'), where('studentId', '==', selectedStudent.id));
    const uAtt = onSnapshot(qAtt, (snap) => {
      setRecords(prev => ({ ...prev, attendance: snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord)) }));
    }, (error) => {
      console.warn("Parent attendance read permission denied:", error.message);
    });

    const qBh = query(collection(db, 'behavior'), where('studentId', '==', selectedStudent.id));
    const uBh = onSnapshot(qBh, (snap) => {
      setRecords(prev => ({ ...prev, behavior: snap.docs.map(d => ({ id: d.id, ...d.data() } as BehaviorRecord)) }));
    }, (error) => {
      console.warn("Parent behavior read permission denied:", error.message);
    });

    return () => { uAtt(); uBh(); };
  }, [selectedStudent]);

  if (!user?.studentIds || user.studentIds.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="p-6 rounded-full bg-neon-red/10 border border-neon-red/20">
          <ShieldAlert size={48} className="text-neon-red" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-display font-bold">لا يوجد حسابات مرتبطة</h3>
          <p className="text-white/40 max-w-sm">لم يتم العثور على أي ملف طالب مرتبط بتوقيع الهوية الخاص بك في النظام.</p>
        </div>
        <button className="btn-outline font-sans">إدخال رمز الدخول</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 text-right">
      {/* Header with Student Switcher */}
      <div className="flex flex-col md:flex-row-reverse justify-between items-start md:items-center gap-6">
        <div className="text-right">
          <h2 className="text-3xl font-display font-black tracking-tight mb-2 uppercase">فضاء الأولياء</h2>
          <p className="text-white/40 text-xs font-mono">مرحباً بك، {user?.name} // مراقبة الأداء الدراسي</p>
        </div>
        
        <div className="flex flex-row-reverse items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
          <div className="flex flex-row-reverse -space-x-2 space-x-reverse">
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                className={cn(
                  "w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center font-black overflow-hidden",
                  selectedStudent?.id === s.id ? "border-neon-blue scale-110 z-10 shadow-[0_0_15px_rgba(0,229,255,0.3)]" : "border-transparent opacity-40 grayscale hover:opacity-100"
                )}
              >
                <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${s.name}`} alt={s.name} />
              </button>
            ))}
          </div>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <div className="text-right pl-4">
            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">تلميذي</p>
            <p className="text-sm font-bold text-neon-blue">{selectedStudent?.name || 'اختر طالب'}</p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-row-reverse gap-4 border-b border-white/5 pb-4">
        {[
          { id: 'overview', label: 'الخلاصة' },
          { id: 'results', label: 'كشف النقاط' },
          { id: 'attendance', label: 'سجل الغيابات' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === tab.id ? "bg-neon-blue text-deep-space shadow-lg" : "text-white/40 hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Student Profile Overview */}
            {selectedStudent && (
              <div className="relative overflow-hidden glass-card p-8 group">
                <div className="absolute top-0 left-0 w-64 h-64 bg-neon-blue/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
                
                <div className="flex flex-col md:flex-row-reverse gap-8 items-start relative z-10">
                  <div className="relative mx-auto md:mx-0">
                    <img src={selectedStudent.robotAvatar} alt="" className="w-32 h-32 md:w-40 md:h-40 rounded-3xl robot-glow bg-white/5 border border-white/10" />
                    <div className="absolute -bottom-2 -left-2 bg-neon-blue text-deep-space font-display font-black px-3 py-1 rounded-lg text-sm border-2 border-deep-space">
                      مستوى {selectedStudent.level}
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 w-full">
                    <div>
                      <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight">{selectedStudent.name}</h2>
                      <p className="text-neon-green text-sm font-mono flex items-center justify-end gap-2 mt-1 uppercase">
                         الترتيب: {selectedStudent.ranking}# في الصف <Trophy size={14} />
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <MiniStats icon={<Zap size={14} className="text-neon-yellow" />} label="إجمالي النقاط" value={selectedStudent.xp} />
                      <MiniStats icon={<Calendar size={14} className="text-neon-blue" />} label="نسبة الحضور" value={`${selectedStudent.attendancePercentage}%`} />
                      <MiniStats icon={<Star size={14} className="text-neon-green" />} label="الرصيد" value={selectedStudent.points} />
                      <MiniStats icon={<BookOpen size={14} className="text-neon-red" />} label="رمز الصف" value={selectedStudent.classId} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Progress Chart */}
              <div className="lg:col-span-2 space-y-8">
                <div className="glass-card p-6">
                  <h3 className="text-xl font-display font-bold mb-8 uppercase tracking-widest">سرعة التعلم والتقدم</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={records.behavior.slice(-7).map((b, i) => ({ day: i, points: b.pointsAdded }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="day" stroke="#ffffff40" fontSize={10} />
                        <YAxis orientation="right" stroke="#ffffff40" fontSize={10} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#050505', border: '1px solid #ffffff10', borderRadius: '12px', textAlign: 'right' }}
                          itemStyle={{ color: '#00E5FF' }}
                        />
                        <Line type="monotone" dataKey="points" stroke="#00E5FF" strokeWidth={3} dot={{ fill: '#00E5FF' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <Announcements />
                </div>
              </div>

              {/* Notifications / Teacher Notes */}
              <div className="space-y-8">
                <div className="glass-card flex flex-col text-right">
                  <div className="p-6 border-b border-white/5 flex items-center justify-between flex-row-reverse">
                    <h3 className="text-xl font-display font-bold">آخر الملاحظات</h3>
                    <MessageSquare size={18} className="text-white/20" />
                  </div>
                  <div className="flex-1 p-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {records.behavior.length > 0 ? records.behavior.sort((a, b) => b.timestamp - a.timestamp).map((note) => (
                      <div key={note.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2 text-right">
                        <div className="flex justify-between items-center flex-row-reverse">
                          <span className={cn(
                            "text-[10px] font-black uppercase px-2 py-0.5 rounded",
                            note.type === 'excellent' ? "bg-neon-green/10 text-neon-green" : 
                            note.type === 'good' ? "bg-neon-blue/10 text-neon-blue" : "bg-neon-red/10 text-neon-red"
                          )}>
                            {note.type === 'excellent' ? 'امتياز' : note.type === 'good' ? 'جيد' : 'تنبيه'}
                          </span>
                          <span className="text-[10px] font-mono text-white/20">
                            {note.timestamp?.toDate ? note.timestamp.toDate().toLocaleDateString('ar-EG') : 'جاري المزامنة...'}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed italic">"{note.note || 'لا يوجد ملاحظات تفصيلية'}"</p>
                        <div className="text-[10px] font-bold text-neon-blue">
                           تم منح {note.pointsAdded} نقطة خبرة
                        </div>
                      </div>
                    )) : (
                      <div className="h-full py-12 flex items-center justify-center text-white/10 text-xs uppercase tracking-widest italic font-sans">
                        لا يوجد إشعارات مسجلة
                      </div>
                    )}
                  </div>
                </div>

                <div className="glass-card p-6 bg-neon-blue/5 border-neon-blue/20">
                  <div className="flex flex-row-reverse items-center justify-between mb-4">
                    <h3 className="text-lg font-display font-bold">تحليل الذكاء الروبوتي</h3>
                    <Zap size={20} className="text-neon-blue" />
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed text-right">
                    بناءً على سلوك الطالب الأخير في الحصص البرمجية، نلاحظ تقدماً ملحوظاً في التفكير المنطقي. يُنصح بتوفير وقت إضافي لممارسة حل الألغاز التقنية في المنزل.
                  </p>
                  <div className="mt-4 flex flex-row-reverse items-center gap-2 text-[10px] font-black text-neon-blue uppercase">
                    <TrendingUp size={12} />
                    نمو متوقع بنسبة 15% في الشهر القادم
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'results' && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-card overflow-hidden"
          >
            <div className="p-6 border-b border-white/10 bg-white/5 flex flex-row-reverse justify-between items-center">
              <h3 className="text-xl font-display font-black uppercase tracking-widest">كشف نتائج الفصل الدراسي</h3>
              <button className="px-4 py-2 bg-neon-green/20 text-neon-green text-[10px] font-black rounded-lg border border-neon-green/20 hover:bg-neon-green/30 transition-all">تحميل بصيغة PDF</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-white/5 text-[10px] font-black uppercase text-white/40 tracking-widest">
                    <th className="px-6 py-4">المادة</th>
                    <th className="px-6 py-4">التقويم المستمر</th>
                    <th className="px-6 py-4">الفرض</th>
                    <th className="px-6 py-4">الاختبار</th>
                    <th className="px-6 py-4">المعدل</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { subject: 'برمجة روبوت', eval: 18, homework: 17, exam: 19, avg: 18.5 },
                    { subject: 'ذكاء اصطناعي', eval: 19, homework: 19, exam: 20, avg: 19.5 },
                    { subject: 'منطق وبرمجة', eval: 16, homework: 15, exam: 17, avg: 16.2 },
                    { subject: 'أدوات تقنية', eval: 17, homework: 18, exam: 16, avg: 16.8 },
                  ].map((row, i) => (
                    <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-all">
                      <td className="px-6 py-4 font-bold">{row.subject}</td>
                      <td className="px-6 py-4 font-mono text-white/60">{row.eval}</td>
                      <td className="px-6 py-4 font-mono text-white/60">{row.homework}</td>
                      <td className="px-6 py-4 font-mono text-white/60">{row.exam}</td>
                      <td className="px-6 py-4 font-mono text-neon-blue font-black">{row.avg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'attendance' && (
          <motion.div 
            key="attendance"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                   <h3 className="text-lg font-display font-bold mb-6 text-right uppercase tracking-[0.2em]">سجل الحضور اليومي</h3>
                   <div className="space-y-3">
                      {records.attendance.length > 0 ? records.attendance.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).map((att, i) => (
                        <div key={i} className="flex flex-row-reverse items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                           <div className="flex flex-row-reverse items-center gap-3">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                att.status === 'present' ? "bg-neon-green shadow-[0_0_8px_rgba(0,184,148,0.5)]" : 
                                att.status === 'late' ? "bg-neon-yellow shadow-[0_0_8px_rgba(253,203,110,0.5)]" : "bg-neon-red shadow-[0_0_8px_rgba(255,118,117,0.5)]"
                              )} />
                              <span className="text-xs font-bold text-white/80">
                                {att.status === 'present' ? 'حاضر' : att.status === 'late' ? 'متأخر' : 'غائب'}
                              </span>
                           </div>
                           <span className="text-[10px] font-mono text-white/40">
                              {att.timestamp?.toDate ? att.timestamp.toDate().toLocaleDateString('ar-EG') : 'جاري العرض'}
                           </span>
                        </div>
                      )) : (
                        <div className="py-12 text-center text-white/10 italic text-xs">لا توجد سجلات حضور مسجلة حالياً</div>
                      )}
                   </div>
                </div>

                <div className="glass-card p-6 border-neon-red/20 bg-neon-red/5">
                   <h3 className="text-lg font-display font-bold mb-4 text-right text-neon-red uppercase tracking-widest">تنبيهات الغياب</h3>
                   <p className="text-xs text-white/60 leading-relaxed text-right mb-6">
                      يرجى تبرير الغيابات في غضون 48 ساعة من وقوعها عبر الرابط أدناه أو بزيارة الإدارة.
                   </p>
                   <button className="w-full py-4 bg-neon-red/20 text-neon-red text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-neon-red/30 border border-neon-red/20 transition-all">تقديم تبرير غياب</button>
                   <div className="mt-6 pt-6 border-t border-white/5">
                      <h4 className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-4">إحصائيات الغياب</h4>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-3 bg-white/5 rounded-xl text-center">
                            <p className="text-xl font-display font-black text-neon-red">2</p>
                            <p className="text-[8px] text-white/20 uppercase">أيام غياب</p>
                         </div>
                         <div className="p-3 bg-white/5 rounded-xl text-center">
                            <p className="text-xl font-display font-black text-neon-yellow">1</p>
                            <p className="text-[8px] text-white/20 uppercase">تأخير</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedStudent && <AIStudyAssistant student={selectedStudent} />}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: string }) {
  return (
    <div className="glass-card p-4 text-right">
       <div className={cn("inline-flex p-2 rounded-lg bg-white/5 mb-3", color)}>
          {icon}
       </div>
       <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">{label}</p>
       <p className="text-xl font-display font-black">{value}</p>
    </div>
  );
}

function MiniStats({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-right">
      <div className="flex flex-row-reverse items-center gap-2 mb-1">
        {icon}
        <span className="text-[8px] font-black uppercase tracking-widest text-white/30">{label}</span>
      </div>
      <p className="text-lg font-display font-black leading-none">{value}</p>
    </div>
  );
}
