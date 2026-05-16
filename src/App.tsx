import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import ParentDashboard from './pages/parent/ParentDashboard';
import StudentProfile from './pages/StudentProfile';
import Leaderboard from './pages/Leaderboard';

const PrivateRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-deep-space">
    <div className="animate-pulse text-neon-blue font-display text-2xl tracking-widest font-sans">جاري تهيئة النظام...</div>
  </div>;
  
  if (!user) return <Navigate to="/" />;
  
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to their own dashboard if role doesn't match
    return <Navigate to={`/${user.role}`} />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-deep-space text-neon-blue font-sans">تحميل...</div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <PrivateRoute requiredRole="admin">
                <DashboardLayout title="لوحة المدير">
                  <AdminDashboard />
                </DashboardLayout>
              </PrivateRoute>
            } />

            {/* Teacher Routes */}
            <Route path="/teacher/*" element={
              <PrivateRoute requiredRole="teacher">
                <DashboardLayout title="بوابة المعلم">
                  <TeacherDashboard />
                </DashboardLayout>
              </PrivateRoute>
            } />

            {/* Parent Routes */}
            <Route path="/parent/*" element={
              <PrivateRoute requiredRole="parent">
                <DashboardLayout title="بوابة ولي الأمر">
                  <ParentDashboard />
                </DashboardLayout>
              </PrivateRoute>
            } />

            <Route path="/leaderboard" element={
              <PrivateRoute>
                <DashboardLayout title="قاعة المتصدرين">
                  <Leaderboard />
                </DashboardLayout>
              </PrivateRoute>
            } />

            <Route path="/student/:id" element={
              <PrivateRoute>
                <DashboardLayout title="ملف الطالب">
                  <StudentProfile />
                </DashboardLayout>
              </PrivateRoute>
            } />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
