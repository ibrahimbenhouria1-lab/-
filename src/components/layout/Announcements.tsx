import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, X, Clock, Pin, Plus, Trash2 } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'urgent' | 'alert';
  authorId: string;
  authorName: string;
  timestamp: any;
  pinned: boolean;
}

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', type: 'info' as any });

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
    });
    return () => unsubscribe();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'announcements'), {
        ...newAnnouncement,
        authorId: user.uid,
        authorName: user.name,
        timestamp: serverTimestamp(),
        pinned: false
      });
      setShowAddModal(false);
      setNewAnnouncement({ title: '', content: '', type: 'info' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-row-reverse items-center justify-between">
        <div className="flex flex-row-reverse items-center gap-2">
          <Megaphone className="text-neon-blue" size={20} />
          <h3 className="font-display font-bold text-lg uppercase">إعلانات النظام</h3>
        </div>
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="p-2 bg-neon-blue/20 text-neon-blue rounded-lg border border-neon-blue/20 hover:bg-neon-blue/30 transition-all text-[10px] font-black uppercase flex items-center gap-2"
          >
            <Plus size={14} />
            إعلان جديد
          </button>
        )}
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pb-4">
        <AnimatePresence mode="popLayout">
          {announcements.length > 0 ? announcements.map((ann) => (
            <motion.div
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={ann.id}
              className={cn(
                "glass-card p-4 border-l-4 text-right relative group",
                ann.type === 'info' ? "border-neon-blue" : 
                ann.type === 'urgent' ? "border-neon-yellow" : "border-neon-red"
              )}
            >
              {(user?.role === 'admin' || (user?.role === 'teacher' && ann.authorId === user.uid)) && (
                <button 
                  onClick={() => handleDelete(ann.id)}
                  className="absolute top-2 left-2 p-2 text-white/10 hover:text-neon-red opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              )}
              
              <div className="flex flex-row-reverse items-center gap-2 mb-2 text-white/40">
                <Clock size={12} className="font-mono" />
                <span className="text-[10px] font-mono">
                  {ann.timestamp?.toDate ? ann.timestamp.toDate().toLocaleDateString('ar-EG') : 'جاري النشر...'}
                </span>
                <span className="mx-1 opacity-20 text-[10px]">//</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">{ann.authorName}</span>
              </div>

              <h4 className={cn(
                "font-display font-black text-sm mb-1",
                ann.type === 'urgent' && "text-neon-yellow",
                ann.type === 'alert' && "text-neon-red"
              )}>
                {ann.title}
              </h4>
              <p className="text-xs text-white/60 leading-relaxed">{ann.content}</p>
            </motion.div>
          )) : (
            <div className="py-12 glass-card border-dashed border-white/10 flex flex-col items-center justify-center text-white/10 text-xs italic">
              لا توجد إعلانات حالياً
            </div>
          )}
        </AnimatePresence>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full glass-card p-8 border-neon-blue"
          >
            <div className="flex flex-row-reverse items-center justify-between mb-8">
              <h3 className="text-xl font-display font-black">إضافة إعلان جديد</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/20 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-6 text-right">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest block">العنوان</label>
                <input 
                  required
                  value={newAnnouncement.title}
                  onChange={e => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-blue text-right"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest block">المحتوى</label>
                <textarea 
                  required
                  rows={4}
                  value={newAnnouncement.content}
                  onChange={e => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-blue text-right resize-none"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest block">نوع الإعلان</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['info', 'urgent', 'alert'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewAnnouncement(prev => ({ ...prev, type }))}
                      className={cn(
                        "py-2 rounded-lg text-[10px] font-black uppercase transition-all border",
                        newAnnouncement.type === type 
                          ? type === 'info' ? "bg-neon-blue/20 text-neon-blue border-neon-blue" :
                            type === 'urgent' ? "bg-neon-yellow/20 text-neon-yellow border-neon-yellow" :
                            "bg-neon-red/20 text-neon-red border-neon-red"
                          : "bg-white/5 text-white/40 border-white/10"
                      )}
                    >
                      {type === 'info' ? 'عادي' : type === 'urgent' ? 'هام' : 'تنبيه'}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full h-14 bg-neon-blue text-deep-space font-black uppercase tracking-widest rounded-xl hover:bg-neon-blue/80 transition-all shadow-lg"
              >
                نشر الإعلان
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
