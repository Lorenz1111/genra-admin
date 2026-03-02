import { Suspense, lazy } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

// --- NORMAL IMPORTS ---
// Importante: Hindi natin ila-lazy load ang Layout at AuthContext dahil 
// kailangan agad ito ng system bago pa man mag-load ang mga pahina.
import { useAuth } from './context/AuthContext';
import MainLayout from './components/Layout/MainLayout';

// --- LAZY LOADED PAGES (Code Splitting) ---
// SENIOR DEV FIX: Imbes na i-load lahat nang sabay-sabay, 
// idi-download lang ng browser ang page na ito kapag binisita ng user.

// Public Pages
const LandingPage = lazy(() => import('./pages/LandingPage')); 
const Login = lazy(() => import('./pages/Auth/Login'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const ReviewCenter = lazy(() => import('./pages/Admin/ReviewCenter'));
const UserManagement = lazy(() => import('./pages/Admin/UserManagement'));
const GenreManagement = lazy(() => import('./pages/Admin/GenreManagement'));

// Author Pages
const AuthorDashboard = lazy(() => import('./pages/Author/Dashboard'));
const AuthorBooks = lazy(() => import('./pages/Author/MyBooks')); 
const UploadBook = lazy(() => import('./pages/Author/UploadBook'));
const ChapterList = lazy(() => import('./pages/Author/ChapterList'));
const ChapterEditor = lazy(() => import('./pages/Author/ChapterEditor'));

// --- PROTECTED ROUTE WRAPPER ---
const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode, allowedRoles: string[] }) => {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <Box className="flex items-center justify-center h-screen">
        <CircularProgress />
      </Box>
    );
  }

  if (!session || !profile) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(profile.role)) return <Navigate to="/login" replace />;

  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
};

// --- GLOBAL LOADER ---
// Ito ang makikita ng user habang dina-download ang specific page split (chunk)
const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {/* SENIOR DEV FIX: Binalot natin ang buong Routes ng Suspense */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          
          {/* ============================== */}
          {/* PUBLIC ROUTES                  */}
          {/* ============================== */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* ============================== */}
          {/* ADMIN ROUTES                   */}
          {/* ============================== */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute allowedRoles={['admin']}><ReviewCenter /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/genres" element={<ProtectedRoute allowedRoles={['admin']}><GenreManagement /></ProtectedRoute>} />

          {/* ============================== */}
          {/* AUTHOR ROUTES                  */}
          {/* ============================== */}
          <Route path="/author" element={<Navigate to="/author/dashboard" replace />} />
          <Route path="/author/dashboard" element={<ProtectedRoute allowedRoles={['author']}><AuthorDashboard /></ProtectedRoute>} />
          <Route path="/author/books" element={<ProtectedRoute allowedRoles={['author']}><AuthorBooks /></ProtectedRoute>} />
          <Route path="/author/upload" element={<ProtectedRoute allowedRoles={['author']}><UploadBook /></ProtectedRoute>} />
          <Route path="/author/books/:bookId/chapters" element={<ProtectedRoute allowedRoles={['author']}><ChapterList /></ProtectedRoute>} />
          <Route path="/author/books/:bookId/chapters/new" element={<ProtectedRoute allowedRoles={['author']}><ChapterEditor /></ProtectedRoute>} />
          <Route path="/author/books/:bookId/chapters/:chapterId/edit" element={<ProtectedRoute allowedRoles={['author']}><ChapterEditor /></ProtectedRoute>} />

          {/* ============================== */}
          {/* FALLBACK ROUTE                 */}
          {/* ============================== */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;