import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Calendar, 
  Award, 
  MessageSquare, 
  Plus, 
  Scan,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Star,
  Zap,
  Brain,
  Code,
  Bot
} from 'lucide-react';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { Student, Class } from '../../types';
import { cn, formatPoints } from '../../lib/utils';

import QRScanner from '../../components/ui/QRScanner';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Announcements from '../../components/layout/Announcements';
import AIStudyAssistant from '../../components/AIStudyAssistant';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<'attendance' | 'behavior' | 'grades'>('attendance');
  const [showScanner, setShowScanner] = useState(false);
  const [aiStudent, setAiStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const cls = snap.docs.map(d => ({ id: d.id, ...d.data() } as Class));
      setClasses(cls);
      if (cls.length > 0 && !selectedClass) setSelectedClass(cls[0]);
    }, (error) => {
      console.warn("Teacher classes list permission denied:", error.message);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!selectedClass) return;

    const q = query(collection(db, 'students'), where('classId', '==', selectedClass.id));
    const unsubscribe = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
    }, (error) => {
      console.warn("Teacher students list permission denied:", error.message);
    });

    return () => unsubscribe();
  }, [selectedClass]);

  const handleAttendance = async (studentId: string, status: 'present' | 'late' | 'absent') => {
    const pointsMap = { present: 5, late: 2, absent: 0 };
    const points = pointsMap[status];

    try {
      await addDoc(collection(db, 'attendance'), {
        studentId,
        classId: selectedClass?.id,
        status,
        pointsAdded: points,
        date: new Date().toISOString().split('T')[0],
        timestamp: serverTimestamp()
      });

      if (points > 0) {
        await updateDoc(doc(db, 'students', studentId), {
          points: increment(points),
          xp: increment(points * 10)
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBehavior = async (studentId: string, type: 'excellent' | 'good' | 'bad') => {
    const pointsMap = { excellent: 10, good: 5, bad: -5 };
    const points = pointsMap[type];

    try {
      await addDoc(collection(db, 'behavior'), {
        studentId,
        teacherId: user?.uid,
        type,
        pointsAdded: points,
        timestamp: serverTimestamp()
      });

      await updateDoc(doc(db, 'students', studentId), {
        points: increment(points),
        xp: increment(points * 10)
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Class Selector */}
      <div className="flex flex-row-reverse items-center gap-4 py-2 overflow-x-auto no-scrollbar">
        {classes.map((cls) => (
          <button
            key={cls.id}
            onClick={() => setSelectedClass(cls)}
            className={cn(
              "flex-shrink-0 px-6 py-3 rounded-xl font-display font-bold text-sm transition-all border",
              selectedClass?.id === cls.id 
                ? "bg-neon-blue text-deep-space border-neon-blue shadow-[0_0_20px_rgba(0,229,255,0.3)]" 
                : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
            )}
          >
            {cls.name}
          </button>
        ))}
        <button className="flex-shrink-0 p-3 rounded-xl bg-white/5 border border-dashed border-white/20 text-white/40">
          <Plus size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-row-reverse items-center justify-between glass-card p-2 rounded-2xl">
            <div className="flex flex-row-reverse gap-2 p-1">
              <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} label="الحضور" icon={<Calendar size={16} />} />
              <TabButton active={activeTab === 'behavior'} onClick={() => setActiveTab('behavior')} label="السلوك" icon={<Award size={16} />} />
              <TabButton active={activeTab === 'grades'} onClick={() => setActiveTab('grades')} label="الدرجات" icon={<Brain size={16} />} />
            </div>
            <button 
              onClick={() => setShowScanner(true)}
              className="btn-primary py-2 px-4 text-xs m-1 font-sans"
            >
              <Scan size={16} /> مسح الكود
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {students.length > 0 ? students.map((student) => (
                <motion.div
                  layout
                  key={student.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card p-4 flex items-center gap-4 group justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={student.robotAvatar} alt="" className="w-16 h-16 rounded-xl robot-glow bg-white/5 p-1" />
                      <div className="absolute -bottom-1 -left-1 bg-neon-blue text-deep-space text-[10px] font-black px-1 rounded border border-deep-space">
                        مستوى {student.level}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 text-right">
                      <h4 className="font-display font-bold text-lg truncate mb-1">{student.name}</h4>
                      <div className="flex items-center justify-end gap-2 text-[10px] font-mono text-white/40">
                        {student.xp} إجمالي // {student.points} نقطة
                        <Zap size={10} className="text-neon-yellow" />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <ActionIcon onClick={() => setAiStudent(student)} icon={<Bot size={18} />} color="text-neon-blue" bg="bg-neon-blue/10" />
                    {activeTab === 'attendance' && (
                      <>
                        <ActionIcon onClick={() => handleAttendance(student.id, 'present')} icon={<CheckCircle2 size={18} />} color="text-neon-green" bg="bg-neon-green/10" />
                        <ActionIcon onClick={() => handleAttendance(student.id, 'late')} icon={<Clock size={18} />} color="text-neon-yellow" bg="bg-neon-yellow/10" />
                        <ActionIcon onClick={() => handleAttendance(student.id, 'absent')} icon={<XCircle size={18} />} color="text-neon-red" bg="bg-neon-red/10" />
                      </>
                    )}
                    {activeTab === 'behavior' && (
                      <>
                        <ActionIcon onClick={() => handleBehavior(student.id, 'excellent')} icon={<Star size={18} />} color="text-neon-green" bg="bg-neon-green/10" />
                        <ActionIcon onClick={() => handleBehavior(student.id, 'good')} icon={<Zap size={18} />} color="text-neon-blue" bg="bg-neon-blue/10" />
                        <ActionIcon onClick={() => handleBehavior(student.id, 'bad')} icon={<XCircle size={18} />} color="text-neon-red" bg="bg-neon-red/10" />
                      </>
                    )}
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-full py-20 text-center text-white/10 italic">لا يوجد طلاب في هذا الصف حالياً</div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-6 text-right lg:col-span-1">
          <div className="glass-card p-6">
            <Announcements />
          </div>

          <div className="glass-card p-6">
            <h3 className="font-display font-bold text-lg mb-6 tracking-widest uppercase">حالة الصف</h3>
            <div className="space-y-4">
              <InsightRow label="نسبة الحضور" value="92%" trend="up" />
              <InsightRow label="متوسط XP" value="1250" trend="up" />
              <InsightRow label="الوحدات المنجزة" value="8/12" trend="up" />
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-display font-bold text-lg mb-4 tracking-widest uppercase">توزيع المهارات</h3>
            <div className="space-y-4">
              <div className="flex flex-wrap flex-row-reverse gap-2">
                <SkillTag icon={<Code size={12} />} label="البرمجة" val="45" color="bg-blue-500" />
                <SkillTag icon={<Brain size={12} />} label="المنطق" val="38" color="bg-purple-500" />
                <SkillTag icon={<Zap size={12} />} label="الأدوات" val="29" color="bg-yellow-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {aiStudent && <AIStudyAssistant student={aiStudent} />}
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-widest transition-all",
        active ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60 hover:bg-white/5"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ActionIcon({ onClick, icon, color, bg }: { onClick: () => void, icon: React.ReactNode, color: string, bg: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-2 rounded-xl transition-all hover:scale-110 active:scale-95",
        bg, color
      )}
    >
      {icon}
    </button>
  );
}

function InsightRow({ label, value, trend }: any) {
  return (
    <div className="flex flex-row-reverse justify-between items-center text-right">
      <span className="text-xs text-white/40">{label}</span>
      <div className="flex flex-row-reverse items-center gap-2">
        <span className="font-mono font-bold text-sm tracking-tight">{value}</span>
        {trend === 'up' && <TrendingUp size={12} className="text-neon-green" />}
      </div>
    </div>
  );
}

function SkillTag({ icon, label, val, color }: any) {
  return (
    <div className="flex flex-row-reverse items-center gap-1 px-2 py-1 bg-white/5 rounded-full border border-white/10">
      <span className={cn("p-1 rounded-full", color)}>{icon}</span>
      <span className="text-[10px] font-bold text-white/60">{label}</span>
      <span className="text-[10px] font-mono text-white/40 mr-1">{val}</span>
    </div>
  );
}
