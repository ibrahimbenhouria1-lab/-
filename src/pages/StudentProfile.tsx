import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Award, 
  Target, 
  Zap, 
  Cpu, 
  Code, 
  Brain, 
  CircuitBoard,
  ChevronRight,
  Star,
  Activity,
  Bot
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Student } from '../types';
import { cn, BADGES } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import AIStudyAssistant from '../components/AIStudyAssistant';

export default function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, 'students', id), (snap) => {
      if (snap.exists()) {
        setStudent({ id: snap.id, ...snap.data() } as Student);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  if (loading) return <div className="p-8 text-center animate-pulse font-sans">جاري الاتصال بالنظام...</div>;
  if (!student) return <Navigate to="/" />;

  const radarData = [
    { subject: 'الروبوتكس', value: student.grades.robotics },
    { subject: 'البرمجة', value: student.grades.programming },
    { subject: 'الأردوينو', value: student.grades.arduino },
    { subject: 'الذكاء الاصطناعي', value: student.grades.artificialIntelligence },
    { subject: 'المنطق', value: 85 },
    { subject: 'الابتكار', value: 70 },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Profile Header */}
      <div className="relative glass-card p-8 overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <CircuitBoard size={240} className="robot-glow" />
        </div>
        
        <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-start relative z-10">
           <div className="space-y-6 text-center lg:text-left">
              <div className="relative mx-auto lg:mx-0">
                <motion.img 
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  src={student.robotAvatar} 
                  alt="" 
                  className="w-48 h-48 rounded-[2rem] bg-white/5 border border-white/10 p-2 shadow-[0_0_40px_rgba(0,229,255,0.1)] robot-glow" 
                />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-neon-blue text-deep-space font-display font-black px-4 py-2 rounded-xl text-xl border-4 border-deep-space ring-2 ring-neon-blue">
                  المستوى {student.level}
                </div>
              </div>

              <div className="space-y-2 text-right">
                <h1 className="text-4xl md:text-6xl font-display font-black tracking-tighter leading-none">{student.name.toUpperCase()}</h1>
                <div className="flex flex-wrap justify-center lg:justify-end gap-4">
                  <span className="flex flex-row-reverse items-center gap-2 text-neon-green font-mono text-xs font-bold bg-neon-green/5 px-3 py-1.5 rounded-full border border-neon-green/10">
                    <Trophy size={14} /> الترتيب #{student.ranking}
                  </span>
                  <span className="flex flex-row-reverse items-center gap-2 text-white/40 font-mono text-xs font-bold bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                    <Activity size={14} /> الصف: {student.classId}
                  </span>
                </div>
              </div>
           </div>

           <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
              <BigMetric label="إجمالي الخبرة" value={student.xp} icon={<Zap />} color="text-neon-blue" />
              <BigMetric label="الاعتمادات" value={student.points} icon={<Target />} color="text-neon-yellow" />
              <BigMetric label="نسبة الحضور" value={`${student.attendancePercentage}%`} icon={<Star />} color="text-neon-green" />
              <BigMetric label="الأوسمة" value={student.badges.length} icon={<Award />} color="text-neon-red" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skills Radar */}
        <div className="glass-card p-8">
          <h3 className="text-xl font-display font-bold mb-8 flex flex-row-reverse items-center gap-2 uppercase tracking-widest text-right">
            <Cpu size={20} className="text-neon-blue" />
            مصفوفة القدرات العصبية
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#ffffff10" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff40', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar
                  name="Skills"
                  dataKey="value"
                  stroke="#00E5FF"
                  fill="#00E5FF"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Badges & Achievements */}
        <div className="glass-card p-8">
           <h3 className="text-xl font-display font-bold mb-8 flex flex-row-reverse items-center gap-2 uppercase tracking-widest text-right">
            <Award size={20} className="text-neon-yellow" />
            الجوائز الرقمية
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
             {Object.values(BADGES).map((badge) => {
               const owned = student.badges.includes(badge.id);
               return (
                 <div key={badge.id} className={cn(
                   "flex flex-col items-center gap-3 p-4 rounded-3xl border transition-all h-full",
                   owned ? "bg-white/5 border-white/10" : "bg-black/40 border-white/5 opacity-30 saturate-0"
                 )}>
                    <span className="text-4xl">{badge.icon}</span>
                    <span className="text-[10px] font-black text-center uppercase leading-tight tracking-wider">{badge.name}</span>
                    {owned && (
                       <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                    )}
                 </div>
               );
             })}
          </div>
        </div>
      </div>

      {/* Progress Bars for Subjects */}
      <div className="glass-card p-8">
         <h3 className="text-xl font-display font-bold mb-8 uppercase tracking-widest text-right">مستويات الإتقان</h3>
         <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
            <StatBar label="جوهر الروبوتات" value={student.grades.robotics} icon={<Bot size={14} />} color="bg-neon-blue" />
            <StatBar label="المنطق العصبي (AI)" value={student.grades.artificialIntelligence} icon={<Brain size={14} />} color="bg-neon-red" />
            <StatBar label="بنية الكود" value={student.grades.programming} icon={<Code size={14} />} color="bg-neon-green" />
            <StatBar label="عتاد الدوائر" value={student.grades.arduino} icon={<CircuitBoard size={14} />} color="bg-neon-yellow" />
         </div>
      </div>

      <AIStudyAssistant student={student} />
    </div>
  );
}

function BigMetric({ label, value, icon, color }: any) {
  return (
    <div className="glass-card p-4 border-white/5 flex flex-col justify-between h-full group hover:bg-white/10 transition-colors text-right items-end">
      <div className={cn("p-2 rounded-xl bg-white/5 w-fit mb-4 transition-colors", color)}>
        {icon}
      </div>
      <div>
        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.1em]">{label}</p>
        <p className="text-2xl font-display font-black truncate">{value}</p>
      </div>
    </div>
  );
}

function StatBar({ label, value, icon, color }: any) {
  return (
    <div className="space-y-2 text-right">
      <div className="flex flex-row-reverse justify-between items-center">
        <div className="flex flex-row-reverse items-center gap-2 group">
           <span className="text-white/40 group-hover:text-white transition-colors">{icon}</span>
           <span className="text-[10px] font-black text-white/40 group-hover:text-white transition-colors uppercase tracking-widest">{label}</span>
        </div>
        <span className="text-xs font-mono font-bold text-white/20">{value}%</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
        <motion.div
           initial={{ width: 0 }}
           animate={{ width: `${value}%` }}
           transition={{ delay: 0.5, duration: 1 }}
           className={cn("h-full shadow-[0_0_10px_rgba(255,255,255,0.2)]", color)}
        />
      </div>
    </div>
  );
}
