import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Crown, TrendingUp, Search, Filter } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { Student } from '../types';
import { cn } from '../lib/utils';

const MotionLink = motion(Link);

export default function Leaderboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'students'),
      orderBy('points', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
      setLoading(false);
    }, (error) => {
      console.warn("Leaderboard permission denied:", error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Podium for Top 3 */}
      {students.length >= 3 ? (
        <div className="grid grid-cols-3 gap-4 items-end max-w-2xl mx-auto pt-16 pb-8 px-4">
          {/* Silver - 2nd */}
          <PodiumMember 
            member={students[1]} 
            rank={2} 
            height="h-48" 
            borderColor="border-slate-400" 
            glowColor="shadow-slate-400/20"
            icon={<Medal size={24} className="text-slate-400" />}
          />
          {/* Gold - 1st */}
          <PodiumMember 
            member={students[0]} 
            rank={1} 
            height="h-64" 
            borderColor="border-neon-yellow" 
            glowColor="shadow-neon-yellow/30"
            icon={<Crown size={32} className="text-neon-yellow" />}
            isFirst
          />
          {/* Bronze - 3rd */}
          <PodiumMember 
            member={students[2]} 
            rank={3} 
            height="h-32" 
            borderColor="border-amber-700" 
            glowColor="shadow-amber-700/20"
            icon={<Medal size={20} className="text-amber-700" />}
          />
        </div>
      ) : (
        <div className="py-20 text-center text-white/20 italic font-sans flex flex-col items-center gap-4">
          <Trophy size={48} className="opacity-10" />
          <p>لا يوجد بيانات كافية لعرض المتصدرين حالياً</p>
        </div>
      )}

      {/* Main List */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-row-reverse items-center justify-between bg-white/2">
          <div className="flex flex-row-reverse items-center gap-3">
            <Trophy size={20} className="text-neon-yellow" />
            <h3 className="text-xl font-display font-bold">ترتيب جميع الطلاب</h3>
          </div>
          <div className="flex flex-row-reverse gap-4">
             <div className="flex flex-row-reverse items-center gap-2 px-3 py-1.5 glass-card border-white/5 text-white/40">
                <Search size={14} />
                <span className="text-xs uppercase font-bold tracking-widest hidden sm:inline">بحث...</span>
             </div>
             <div className="flex flex-row-reverse items-center gap-2 px-3 py-1.5 glass-card border-white/5 text-white/40">
                <Filter size={14} />
                <span className="text-xs uppercase font-bold tracking-widest hidden sm:inline">تصفية</span>
             </div>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {students.map((student, index) => (
            <MotionLink
              to={`/student/${student.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={student.id}
              className="flex flex-row-reverse items-center gap-4 px-6 py-4 hover:bg-white/2 transition-colors group cursor-pointer border-b border-white/5 last:border-0"
            >
              <div className="w-8 font-mono text-white/20 font-black text-lg text-left">
                {index + 1 < 10 ? `0${index + 1}` : index + 1}
              </div>

              <div className="relative">
                <img src={student.robotAvatar} alt="" className="w-12 h-12 rounded-xl bg-white/5 p-1 robot-glow" />
                {index < 3 && (
                   <div className="absolute -top-1 -right-1">
                      <StarBadge index={index} />
                   </div>
                )}
              </div>

              <div className="flex-1">
                <h4 className="font-display font-bold truncate group-hover:text-neon-blue transition-colors text-right">
                  {student.name.toUpperCase()}
                </h4>
                <p className="text-[10px] text-white/40 font-mono tracking-widest uppercase text-right">
                  الصف: {student.classId} // المستوى {student.level}
                </p>
              </div>

              <div className="text-left">
                <div className="flex items-center gap-2 justify-start">
                   <span className="text-xl font-display font-black text-white/80">{student.points.toLocaleString()}</span>
                   <span className="text-[10px] font-mono text-neon-blue font-bold tracking-tighter">XP</span>
                </div>
                <div className="flex items-center gap-1 justify-start text-[10px] text-neon-green font-bold">
                  <TrendingUp size={10} /> +0 RADS
                </div>
              </div>
            </MotionLink>
          ))}
        </div>
      </div>
    </div>
  );
}

function PodiumMember({ member, rank, height, borderColor, glowColor, icon, isFirst }: any) {
  if (!member) return null;
  return (
    <Link to={`/student/${member.id}`} className="flex flex-col items-center gap-4 group cursor-pointer hover:scale-105 transition-transform">
      <div className="relative flex flex-col items-center">
        {isFirst && (
          <motion.div
            animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-12"
          >
            {icon}
          </motion.div>
        )}
        <div className={cn(
          "relative rounded-full p-1 border-2 transition-all group-hover:scale-110",
          borderColor, glowColor, "bg-deep-space"
        )}>
          <img src={member.robotAvatar} alt="" className="w-16 h-16 md:w-24 md:h-24 rounded-full" />
          <div className={cn(
            "absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm",
            isFirst ? "bg-neon-yellow text-deep-space" : "bg-white/10"
          )}>
            {rank}
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <h4 className="font-display font-black text-sm md:text-base tracking-tight truncate max-w-[120px]">
          {member.name}
        </h4>
        <p className="text-[10px] md:text-xs font-mono text-white/40">{member.points} XP</p>
      </div>

      <motion.div
        initial={{ height: 0 }}
        animate={{ height: isFirst ? 200 : 120 }}
        className={cn(
          "w-full glass-card border-b-0 rounded-t-2xl min-h-[40px] flex flex-col items-center justify-start pt-4",
          isFirst ? "bg-neon-blue/10 border-neon-blue/20" : ""
        )}
      >
        <span className="font-display font-black text-2xl opacity-10">{rank}</span>
      </motion.div>
    </Link>
  );
}

function StarBadge({ index }: { index: number }) {
  const colors = ["text-neon-yellow", "text-slate-400", "text-amber-700"];
  return (
    <div className={cn("p-1 bg-deep-space rounded-full border border-white/10 shadow-lg", colors[index])}>
      {index === 0 ? <Crown size={12} /> : <Trophy size={12} />}
    </div>
  );
}
