import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import firebaseConfig from '../../firebase-applet-config.json';
import { Bot, Shield, GraduationCap, Users, Cpu, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function LandingPage() {
  const { user, signIn, loginWithCode } = useAuth();
  const [selectedRole, setSelectedRole] = React.useState<string | null>(null);
  const [accessCode, setAccessCode] = React.useState('');
  const [isError, setIsError] = React.useState(false);
  const [setupRequired, setSetupRequired] = React.useState(false);

  if (user) {
    return <Navigate to={`/${user.role}`} />;
  }

  const handleCodeLogin = async () => {
    try {
      const success = await loginWithCode(accessCode);
      if (!success) {
        setIsError(true);
        setTimeout(() => setIsError(false), 2000);
      }
    } catch (err: any) {
      if (err.message === 'FIREBASE_SETUP_REQUIRED') {
        setSetupRequired(true);
      } else {
        setIsError(true);
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-[120px]" />
      <div className="scan-line opacity-20" />

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl w-full text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 relative z-10"
          >
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-block px-4 py-1 rounded-full border border-neon-blue/20 bg-neon-blue/5 text-neon-blue text-[10px] font-black uppercase tracking-[0.3em] font-sans"
            >
              نظام الجيل القادم للتعليم الذكي // 2026
            </motion.div>
            <div className="relative">
              <Bot size={80} className="text-neon-blue robot-glow" />
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-neon-green rounded-full animate-ping" />
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter">
              نيوجيت<span className="text-neon-blue">روبوت</span>
            </h1>
            <p className="text-white/60 font-display text-lg tracking-[0.2em] font-medium uppercase max-w-lg text-center">
              منصة متطورة لتمكين الجيل القادم من المبدعين في مجالات البرمجة والذكاء الاصطناعي والأدوات العبقرية.
            </p>
          </motion.div>

        {!selectedRole ? (
          <div className="grid md:grid-cols-3 gap-6 w-full px-4">
            <RoleCard 
              icon={<Shield className="text-neon-red" />}
              title="المدير"
              desc="مركز القيادة والتحكم في النظام لإدارة كافة الموارد والمستخدمين"
              onClick={() => setSelectedRole('admin')}
            />
            <RoleCard 
              icon={<GraduationCap className="text-neon-green" />}
              title="المعلم"
              desc="إدارة الصفوف والطلاب وتتبع الحضور والغياب والدرجات العلمية"
              onClick={() => setSelectedRole('teacher')}
            />
            <RoleCard 
              icon={<Users className="text-neon-yellow" />}
              title="ولي الأمر"
              desc="متابعة دقيقة لتقدم الطالب التعليمي والسلوكي واستلام الإشعارات"
              onClick={() => setSelectedRole('parent')}
            />
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto glass-card p-8 border-white/10 w-full text-right"
          >
            <div className="flex flex-row-reverse items-center justify-between mb-8">
              <h3 className="text-2xl font-display font-bold">
                تسجيل الدخول - {selectedRole === 'admin' ? 'المدير' : selectedRole === 'teacher' ? 'المعلم' : 'ولي الأمر'}
              </h3>
              <button 
                onClick={() => { setSelectedRole(null); setAccessCode(''); }}
                className="text-white/40 hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest"
              >
                العودة
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2 text-right">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">مطلوب رمز الدخول الـتـقـنـي</label>
                <div className="relative">
                  <input 
                    type="password"
                    placeholder="× × × × × ×"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-xl focus:border-neon-blue outline-none transition-all font-mono text-center tracking-[0.5em] text-xl"
                  />
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none opacity-20">
                    <Cpu size={18} className="text-neon-blue animate-pulse" />
                  </div>
                </div>
                {isError && (
                  <motion.p 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-neon-red text-[10px] font-black uppercase text-center mt-2 italic"
                  >
                    × خطأ في النظام: الرمز المرفوض ×
                  </motion.p>
                )}
              </div>
              <button 
                onClick={handleCodeLogin}
                className="btn-primary w-full h-14 flex items-center justify-center gap-3 group overflow-hidden relative"
              >
                <span className="relative z-10 flex items-center gap-2">
                  بدء فحص الهوية
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-neon-blue to-neon-purple opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
                <p className="text-[9px] text-white/30 font-mono italic">
                  نظام التشفير نشط // يرجى استخدام رمز الدخول المخصص لرتبتك
                </p>
                {selectedRole === 'admin' && (
                   <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                     <p className="text-[8px] text-neon-blue/40 font-mono">المدير الافتراضي: ADMIN2026</p>
                     <button 
                       onClick={async () => {
                         localStorage.setItem('cached_auth_code', 'ADMIN2026');
                         await signIn();
                       }}
                       className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10 transition-all flex items-center justify-center gap-2"
                     >
                       <Bot size={12} className="text-neon-blue" />
                       تفعيل كمدير عبر Google
                     </button>
                   </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <div className="pt-8 flex flex-col items-center gap-4 opacity-40">
           <div className="flex gap-8">
              <Cpu size={24} />
              <Bot size={24} />
              <Shield size={24} />
           </div>
           <p className="text-[10px] font-mono tracking-tighter">اتصال آمن ومحمي</p>
        </div>

        {/* Setup Instructions Overlay - CRITICAL FOR PRODUCTION HANDOVER */}
        <AnimatePresence>
          {setupRequired && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
            >
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="max-w-md w-full glass-card p-8 border-neon-red shadow-[0_0_50px_-12px_rgba(255,51,51,0.3)] text-right space-y-6"
              >
                <div className="flex flex-row-reverse items-center justify-between">
                  <div className="flex flex-row-reverse items-center gap-3 text-neon-red">
                    <Shield size={28} className="animate-pulse" />
                    <h3 className="text-2xl font-display font-black">خطأ في إعداد الاتصال</h3>
                  </div>
                  <button onClick={() => setSetupRequired(false)} className="text-white/20 hover:text-white transition-colors">
                    <ChevronRight size={20} className="rotate-90" />
                  </button>
                </div>
                
                <div className="space-y-5 text-sm leading-relaxed">
                  <p className="text-white/90">
                    عذراً، نظام الرموز لا يعمل لأن خاصية <span className="text-neon-red font-bold">"الدخول المجهول"</span> معطلة في قاعدة بياناتك. هذا الإجراء ضروري لتسليم المشروع اليوم:
                  </p>
                  
                  <div className="space-y-3 bg-white/5 p-5 rounded-xl border border-white/10 pr-6">
                    <div className="relative">
                      <div className="absolute -right-4 top-1 w-2 h-2 rounded-full bg-neon-blue" />
                      <p className="font-bold">1. اضغط على الرابط التالي لفتح الإعدادات:</p>
                      <a 
                        href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-neon-blue/20 text-neon-blue rounded-lg text-xs font-black border border-neon-blue/20 hover:bg-neon-blue/30 transition-all"
                      >
                        فتح لوحة التحكم (Firebase Console)
                        <ChevronRight size={14} />
                      </a>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute -right-4 top-1 w-2 h-2 rounded-full bg-white/40" />
                      <p>2. ابحث عن <span className="font-bold">Anonymous</span> في قائمة المزودين.</p>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute -right-4 top-1 w-2 h-2 rounded-full bg-white/40" />
                      <p>3. قم بتفعيل الخيار (<span className="text-neon-green font-bold">Enable</span>) واضغط <span className="font-bold">Save</span>.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-neon-red/5 rounded-lg border border-neon-red/10">
                    <p className="text-[10px] text-neon-red/60 text-center uppercase font-mono">
                      Security Trigger: auth/admin-restricted-operation
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => window.location.reload()}
                  className="w-full h-14 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-neon-blue hover:text-white transition-all shadow-lg"
                >
                  إعادة تشغيل النظام بعد التفعيل
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Corporate Footer */}
      <div className="absolute bottom-8 left-0 w-full text-center text-white/20 font-mono text-[10px] tracking-widest">
        SECURE_PROTOCOL_V4.2.0 // ESTABLISHED 2026 // NEURAL_NET_ENABLED
      </div>
    </div>
  );
}

function RoleCard({ icon, title, desc, onClick }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="glass-card p-8 border-white/5 hover:border-white/20 transition-all text-right group flex flex-col items-end"
    >
      <div className="mb-6 p-4 bg-white/5 rounded-2xl w-fit group-hover:bg-white/10 transition-colors">
        {icon}
      </div>
      <h3 className="text-2xl font-display font-bold mb-2 tracking-tight">{title}</h3>
      <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
    </motion.button>
  );
}
