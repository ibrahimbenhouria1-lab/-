import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { QrCode, Trash2, User as UserIcon, Shield, GraduationCap, Users, Plus, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function AccessCodeList() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newRole, setNewRole] = useState<'teacher' | 'parent'>('teacher');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'access_codes'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setCodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const generateCode = async () => {
    if (!newName.trim()) return alert('يرجى إدخال اسم صاحب الرمز');
    
    setIsGenerating(true);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await setDoc(doc(db, 'access_codes', code), {
        role: newRole,
        name: newName,
        createdAt: serverTimestamp()
      });
      setNewName('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`هل أنت متأكد من حذف الرمز ${id}؟ لن يتمكن المستخدم من الدخول بعد الآن.`)) {
      try {
        await deleteDoc(doc(db, 'access_codes', id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List Column */}
      <div className="lg:col-span-2 glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-row-reverse items-center justify-between">
          <div className="flex items-center gap-2 flex-row-reverse">
            <QrCode size={20} className="text-neon-blue" />
            <h3 className="text-xl font-display font-bold">إدارة رموز الدخول</h3>
          </div>
        </div>
        
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-right min-w-[500px]">
            <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                <th className="px-6 py-4">الرمز</th>
                <th className="px-6 py-4 text-center">الرتبة</th>
                <th className="px-6 py-4">الاسم المستهدف</th>
                <th className="px-6 py-4 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {codes.length > 0 ? codes.map((code) => (
                <tr key={code.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono text-lg font-black tracking-widest text-neon-blue bg-neon-blue/5 px-3 py-1 rounded-lg border border-neon-blue/10">
                      {code.id}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={cn(
                        "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter flex items-center gap-1",
                        code.role === 'admin' ? "bg-neon-red/10 text-neon-red" :
                        code.role === 'teacher' ? "bg-neon-green/10 text-neon-green" :
                        "bg-neon-yellow/10 text-neon-yellow"
                      )}>
                        {code.role === 'admin' ? <Shield size={10} /> : code.role === 'teacher' ? <GraduationCap size={10} /> : <Users size={10} />}
                        {code.role === 'admin' ? 'مدير' : code.role === 'teacher' ? 'معلم' : 'ولي أمر'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-white/60">
                    {code.name || 'غير محدد'}
                  </td>
                  <td className="px-6 py-4 text-left font-mono">
                    <button 
                      onClick={() => handleDelete(code.id)}
                      className="p-2 text-white/20 hover:text-neon-red transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-white/10 italic">
                    {loading ? 'جاري تحميل الرموز...' : 'لا يوجد رموز دخول نشطة حالياً'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generator Column */}
      <div className="glass-card p-6 flex flex-col gap-6">
        <div className="flex items-center gap-2 flex-row-reverse border-b border-white/5 pb-4">
          <Plus size={20} className="text-neon-green" />
          <h3 className="text-xl font-display font-bold">توليد رمز جديد</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2 text-right">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">الرتبة</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setNewRole('teacher')}
                className={cn(
                  "p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-2",
                  newRole === 'teacher' ? "bg-neon-green/10 border-neon-green text-neon-green" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                )}
              >
                <GraduationCap size={20} />
                معلم
              </button>
              <button 
                onClick={() => setNewRole('parent')}
                className={cn(
                  "p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-2",
                  newRole === 'parent' ? "bg-neon-yellow/10 border-neon-yellow text-neon-yellow" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                )}
              >
                <Users size={20} />
                ولي أمر
              </button>
            </div>
          </div>

          <div className="space-y-2 text-right">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">الاسم (للمتابعة)</label>
            <input 
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="مثال: أ. محمد / والد علي"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-right focus:border-neon-blue outline-none transition-all"
            />
          </div>

          <button 
            onClick={generateCode}
            disabled={isGenerating || !newName.trim()}
            className="w-full btn-primary h-14 flex items-center justify-center gap-2 mt-4"
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            توليد رمز الدخول
          </button>
        </div>

        <div className="mt-auto p-4 bg-neon-blue/5 rounded-xl border border-neon-blue/10">
          <p className="text-[10px] text-neon-blue/60 leading-relaxed text-right">
            * سيتم ربط هذا الرمز بشكل دائم بالجهاز الذي يتم استخدامه فيه أول مرة.
          </p>
        </div>
      </div>
    </div>
  );
}
