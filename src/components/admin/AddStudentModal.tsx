import React, { useState, useEffect } from 'react';
import { X, Bot, Sparkles, ChevronRight } from 'lucide-react';
import { addDoc, collection, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ROBOT_AVATARS } from '../../lib/utils';
import { Class } from '../../types';

interface AddStudentModalProps {
  onClose: () => void;
}

export default function AddStudentModal({ onClose }: AddStudentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    classId: '',
  });
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingClasses, setFetchingClasses] = useState(true);

  useEffect(() => {
    async function fetchClasses() {
      try {
        const snap = await getDocs(collection(db, 'classes'));
        setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Class)));
      } catch (err) {
        console.error("Error fetching classes:", err);
      } finally {
        setFetchingClasses(false);
      }
    }
    fetchClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classId) return;
    setLoading(true);

    try {
      await addDoc(collection(db, 'students'), {
        ...formData,
        points: 0,
        xp: 0,
        level: 1,
        attendancePercentage: 100,
        ranking: 0,
        badges: [],
        grades: {
          robotics: 0,
          programming: 0,
          arduino: 0,
          artificialIntelligence: 0
        },
        photoUrl: '',
        robotAvatar: ROBOT_AVATARS[Math.floor(Math.random() * ROBOT_AVATARS.length)],
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-deep-space/90 flex items-center justify-center p-6 backdrop-blur-md">
      <div className="w-full max-w-md glass-card p-8 border-white/20 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <div className="flex items-center gap-4 mb-8">
           <div className="p-3 bg-neon-green/10 rounded-2xl text-neon-green shadow-lg shadow-neon-green/20">
              <Bot size={24} className="robot-glow" />
           </div>
           <div>
              <h3 className="text-2xl font-display font-black tracking-tight text-right w-full">إضافة طالب جديد</h3>
              <p className="text-xs text-white/40 font-mono tracking-widest uppercase text-right">إعداد مصفوفة البيانات الجديدة...</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 text-right">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">اسم الطالب</label>
            <input 
              required
              placeholder="مثال: أحمد محمد"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-neon-green focus:bg-white/10 outline-none transition-all font-mono text-sm text-right"
            />
          </div>

          <div className="space-y-2 text-right">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">الصف الدراسي</label>
            <select
              required
              value={formData.classId}
              onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-neon-green focus:bg-white/10 outline-none transition-all font-sans text-sm text-right appearance-none"
            >
              <option value="" disabled className="bg-deep-space text-white/40">اختر الصف</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id} className="bg-deep-space">
                  {cls.name}
                </option>
              ))}
              {fetchingClasses && <option disabled className="bg-deep-space">جاري تحميل الصفوف...</option>}
              {!fetchingClasses && classes.length === 0 && <option disabled className="bg-deep-space">لا يوجد صفوف مسجلة</option>}
            </select>
          </div>

          <div className="p-4 bg-neon-green/5 rounded-2xl border border-neon-green/10 flex gap-3 text-xs text-neon-green/80 leading-relaxed font-sans text-right">
             <Sparkles size={16} className="mt-1 flex-shrink-0" />
             <span>سيتم إنشاء صورة رمزية ونظام نقاط تلقائي بمجرد التأكيد.</span>
          </div>

          <button 
            disabled={loading}
            className="w-full btn-primary bg-neon-green hover:bg-neon-green/90 text-deep-space mt-4 disabled:opacity-50 h-14 flex items-center justify-center gap-2 group font-sans"
          >
             {loading ? 'جاري المعالجة...' : (
               <>
                 تفعيل حساب الطالب
                 <ChevronRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
               </>
             )}
          </button>
        </form>
      </div>
    </div>
  );
}
