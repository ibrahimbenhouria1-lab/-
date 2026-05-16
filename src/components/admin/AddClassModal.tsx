import React, { useState, useEffect } from 'react';
import { X, BookOpen, UserCheck, ChevronRight } from 'lucide-react';
import { addDoc, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User } from '../../types';

interface AddClassModalProps {
  onClose: () => void;
}

export default function AddClassModal({ onClose }: AddClassModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    teacherId: '',
  });
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTeachers, setFetchingTeachers] = useState(true);

  useEffect(() => {
    async function fetchTeachers() {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
        const snap = await getDocs(q);
        setTeachers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as User)));
      } catch (err) {
        console.error("Error fetching teachers:", err);
      } finally {
        setFetchingTeachers(false);
      }
    }
    fetchTeachers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacherId) return;
    setLoading(true);

    try {
      await addDoc(collection(db, 'classes'), {
        ...formData,
        studentIds: [],
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
           <div className="p-3 bg-neon-yellow/10 rounded-2xl text-neon-yellow shadow-lg shadow-neon-yellow/20">
              <BookOpen size={24} />
           </div>
           <div>
              <h3 className="text-2xl font-display font-black tracking-tight text-right w-full">إضافة صف دراسي جديد</h3>
              <p className="text-xs text-white/40 font-mono tracking-widest uppercase text-right">تخصيص الفوج والمعلم القائد...</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-right">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">اسم الصف (مثلاً: الروبوتات المستوى 1)</label>
            <input 
              required
              placeholder="ادخل اسم الصف"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-neon-yellow focus:bg-white/10 outline-none transition-all font-sans text-sm text-right"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">المعلم المسؤول</label>
            <select
              required
              value={formData.teacherId}
              onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-neon-yellow focus:bg-white/10 outline-none transition-all font-sans text-sm text-right appearance-none"
            >
              <option value="" disabled className="bg-deep-space">اختر معلماً</option>
              {teachers.map(teacher => (
                <option key={teacher.uid} value={teacher.uid} className="bg-deep-space">
                  {teacher.name}
                </option>
              ))}
              {fetchingTeachers && <option disabled className="bg-deep-space">جاري تحميل المعلمين...</option>}
              {!fetchingTeachers && teachers.length === 0 && <option disabled className="bg-deep-space">لا يوجد معلمون مسجلون</option>}
            </select>
          </div>

          <div className="p-4 bg-neon-yellow/5 rounded-2xl border border-neon-yellow/10 flex gap-3 text-xs text-neon-yellow/80 leading-relaxed font-sans text-right">
             <UserCheck size={16} className="mt-1 flex-shrink-0" />
             <span>سيتمكن المعلم المختار من إدارة الحضور والنقاط لهذا الصف تلقائياً.</span>
          </div>

          <button 
            disabled={loading || teachers.length === 0}
            className="w-full btn-primary bg-neon-yellow hover:bg-neon-yellow/90 text-deep-space mt-4 disabled:opacity-50 h-14 flex items-center justify-center gap-2 group font-sans"
          >
             {loading ? 'جاري المعالجة...' : (
               <>
                 تأكيد إنشاء الصف
                 <ChevronRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
               </>
             )}
          </button>
        </form>
      </div>
    </div>
  );
}
