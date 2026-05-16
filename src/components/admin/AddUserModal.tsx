import React, { useState } from 'react';
import { X, UserPlus, GraduationCap, Users } from 'lucide-react';
import { addDoc, collection, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ROBOT_AVATARS } from '../../lib/utils';
import { UserRole } from '../../types';

interface AddUserModalProps {
  onClose: () => void;
  role: UserRole;
}

export default function AddUserModal({ onClose, role }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    classId: '',
    parentCode: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let userId = '';
      let parentCode = '';

      if (role === 'admin' || role === 'teacher') {
        const userRef = await addDoc(collection(db, 'users'), {
          ...formData,
          role,
          status: 'active',
          createdAt: serverTimestamp(),
          photoUrl: '',
          robotAvatar: ROBOT_AVATARS[Math.floor(Math.random() * ROBOT_AVATARS.length)]
        });
        userId = userRef.id;
        // Generate a code for teachers/admins too for protocol login
        parentCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await setDoc(doc(db, 'users', userId), { parentCode }, { merge: true });
      } else if (role === 'parent') {
        parentCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const userRef = await addDoc(collection(db, 'users'), {
          ...formData,
          role: 'parent',
          status: 'active',
          createdAt: serverTimestamp(),
          studentIds: [],
          parentCode
        });
        userId = userRef.id;
      }

      // Create lookup for code-based login
      if (userId && parentCode) {
        await setDoc(doc(db, 'access_codes', parentCode), {
          userId,
          role
        });
        alert(`تم إنشاء رمز الدخول بنجاح: ${parentCode}`);
      }

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
           <div className="p-3 bg-neon-blue/10 rounded-2xl text-neon-blue">
              {role === 'teacher' ? <GraduationCap size={24} /> : role === 'admin' ? <UserPlus size={24} /> : <Users size={24} />}
           </div>
           <div>
              <h3 className="text-2xl font-display font-black tracking-tight text-right w-full">
                إضافة {role === 'teacher' ? 'معلم' : role === 'admin' ? 'مدير' : 'ولي أمر'}
              </h3>
              <p className="text-xs text-white/40 font-mono tracking-widest uppercase text-right">إعداد ملف تعريف جديد للهوية...</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="الاسم الكامل" 
            placeholder="مثال: أحمد محمد" 
            value={formData.name} 
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
            required 
          />
          <Input 
            label="البريد الإلكتروني" 
            placeholder="example@nexus.edu" 
            type="email"
            value={formData.email} 
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} 
            required 
          />
          
          {role === 'teacher' && (
             <Input 
              label="الفصل الدراسي" 
              placeholder="رمز الفصل (مثلاً ROB-01)" 
              value={formData.classId} 
              onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value }))} 
            />
          )}

          <button 
            disabled={loading}
            className="btn-primary w-full mt-4 disabled:opacity-50 font-sans"
          >
            {loading ? 'جاري المعالجة...' : `تفعيل حساب ال${role === 'teacher' ? 'معلم' : role === 'admin' ? 'مدير' : 'ولي أمر'}`}
          </button>
        </form>
      </div>
    </div>
  );
}

function Input({ label, ...props }: any) {
  return (
    <div className="space-y-2 text-right">
      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">{label}</label>
      <input 
        {...props}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-neon-blue focus:bg-white/10 outline-none transition-all font-sans text-sm text-right"
      />
    </div>
  );
}
