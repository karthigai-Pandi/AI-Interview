import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute, AuthHydrator } from '@/components/layout/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/ResetPasswordPage';
import VerifyEmailPage from '@/features/auth/VerifyEmailPage';
import AuthCallbackPage from '@/features/auth/AuthCallbackPage';

import CandidateDashboard from '@/features/candidate/CandidateDashboard';
import CandidateProfile from '@/features/candidate/CandidateProfile';
import CandidateApplications from '@/features/candidate/CandidateApplications';
import CandidateJobs from '@/features/candidate/CandidateJobs';

import AptitudeTest from '@/features/assessment/AptitudeTest';
import TechnicalTest from '@/features/assessment/TechnicalTest';
import AIInterviewRoom from '@/features/interview/AIInterviewRoom';

import RecruiterDashboard from '@/features/recruiter/RecruiterDashboard';
import RecruiterJobs from '@/features/recruiter/RecruiterJobs';
import RecruiterCandidates from '@/features/recruiter/RecruiterCandidates';
import RecruiterReport, { RecruiterAnalytics } from '@/features/recruiter/RecruiterReport';

import AdminDashboard, { AdminUsers, AdminQuestions, AdminAIConfig } from '@/features/admin/AdminPages';

function DashboardWrapper({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

export default function App() {
  return (
    <AuthHydrator>
      <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route path="/candidate/dashboard" element={<ProtectedRoute allowedRoles={['candidate']}><DashboardWrapper><CandidateDashboard /></DashboardWrapper></ProtectedRoute>} />
      <Route path="/candidate/profile" element={<ProtectedRoute allowedRoles={['candidate']}><DashboardWrapper><CandidateProfile /></DashboardWrapper></ProtectedRoute>} />
      <Route path="/candidate/applications" element={<ProtectedRoute allowedRoles={['candidate']}><DashboardWrapper><CandidateApplications /></DashboardWrapper></ProtectedRoute>} />
      <Route path="/candidate/jobs" element={<ProtectedRoute allowedRoles={['candidate']}><DashboardWrapper><CandidateJobs /></DashboardWrapper></ProtectedRoute>} />
      <Route path="/candidate/assessment/aptitude" element={<ProtectedRoute allowedRoles={['candidate']}><DashboardWrapper><AptitudeTest /></DashboardWrapper></ProtectedRoute>} />
      <Route path="/candidate/assessment/technical" element={<ProtectedRoute allowedRoles={['candidate']}><DashboardWrapper><TechnicalTest /></DashboardWrapper></ProtectedRoute>} />
      <Route path="/candidate/interview/:id" element={<ProtectedRoute allowedRoles={['candidate']}><DashboardWrapper><AIInterviewRoom /></DashboardWrapper></ProtectedRoute>} />

      <Route path="/recruiter/dashboard" element={<ProtectedRoute allowedRoles={['recruiter', 'admin']}><DashboardWrapper><RecruiterDashboard /></DashboardWrapper></ProtectedRoute>} />
      <Route path="/recruiter/jobs" element={<ProtectedRoute allowedRoles={['recruiter', 'admin']}><DashboardWrapper><RecruiterJobs /></DashboardWrapper></ProtectedRoute>} />
      <Route path="/recruiter/candidates" element={<ProtectedRoute allowedRoles={['recruiter', 'admin']}><DashboardWrapper><RecruiterCandidates /></DashboardWrapper></ProtectedRoute>} />
      <Route path="/recruiter/analytics" element={<ProtectedRoute allowedRoles={['recruiter', 'admin']}><DashboardWrapper><RecruiterAnalytics /></DashboardWrapper></ProtectedRoute>} />
      <Route path="/recruiter/reports/:id" element={<ProtectedRoute allowedRoles={['recruiter', 'admin']}><DashboardWrapper><RecruiterReport /></DashboardWrapper></ProtectedRoute>} />

      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><DashboardWrapper><AdminDashboard /></DashboardWrapper></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><DashboardWrapper><AdminUsers /></DashboardWrapper></ProtectedRoute>} />
      <Route path="/admin/questions" element={<ProtectedRoute allowedRoles={['admin']}><DashboardWrapper><AdminQuestions /></DashboardWrapper></ProtectedRoute>} />
      <Route path="/admin/ai-config" element={<ProtectedRoute allowedRoles={['admin']}><DashboardWrapper><AdminAIConfig /></DashboardWrapper></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthHydrator>
  );
}
