import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from './context/AuthContext';
import MainLayout from './components/Layout/MainLayout';

// --- PUBLIC PAGES ---
import LandingPage from './pages/LandingPage'; 
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';

// --- ADMIN PAGES ---
import AdminDashboard from './pages/Admin/Dashboard';
import ReviewCenter from './pages/Admin/ReviewCenter';
import UserManagement from './pages/Admin/UserManagement';
import GenreManagement from './pages/Admin/GenreManagement';

// --- AUTHOR PAGES ---
import AuthorDashboard from './pages/Author/Dashboard';
import AuthorBooks from './pages/Author/MyBooks'; 
import UploadBook from './pages/Author/UploadBook';
import ChapterList from './pages/Author/ChapterList';
import ChapterEditor from './pages/Author/ChapterEditor';

// Protected Route Wrapper
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

function App() {
  return (
    <BrowserRouter>
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
        
        {/* SENIOR DEV FIX: Tinanggal ang sobrang '}' at binalot sa ProtectedRoute */}
        <Route path="/author/books/:bookId/chapters/:chapterId/edit" element={<ProtectedRoute allowedRoles={['author']}><ChapterEditor /></ProtectedRoute>} />


        {/* ============================== */}
        {/* FALLBACK ROUTE                 */}
        {/* ============================== */}
        {/* Dapat laging nasa pinakababa ito para saluhin lang yung mga invalid URLs */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;