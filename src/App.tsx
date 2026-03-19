import { Suspense, lazy } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import { motion } from 'motion/react';

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
const OAuthCallback = lazy(() => import('./pages/Auth/OAuthCallback'));

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

const dotPulse = keyframes`
  0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-2px); }
`;

const AuthLoader = () => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      background: '#ffffff',
      px: 3,
      py: 2.5
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Typography
        variant="body1"
        sx={{ color: '#0f172a', fontWeight: 900, letterSpacing: '-0.02em' }}
      >
        Please wait...
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, pt: '1px' }}>
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            sx={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: '#0f172a',
              animation: `${dotPulse} 1s ease-in-out infinite`,
              animationDelay: `${index * 0.14}s`
            }}
          />
        ))}
      </Box>
    </Box>
  </Box>
);

// --- PROTECTED ROUTE WRAPPER ---
const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode, allowedRoles: string[] }) => {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <AuthLoader />;
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
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background:
        'linear-gradient(180deg, #f8fafc 0%, #eff6ff 45%, #ffffff 100%)',
      px: 3
    }}
  >
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <motion.div
        animate={{ y: [0, -4, 0], scale: [1, 1.01, 1] }}
        transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        style={{ position: 'relative', width: 228, height: 160, marginBottom: 24, perspective: '1400px' }}
      >
        <motion.div
          animate={{ scaleX: [0.92, 1, 0.92], opacity: [0.2, 0.34, 0.2] }}
          transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -12,
            width: 150,
            height: 24,
            borderRadius: '50%',
            background: 'rgba(15, 23, 42, 0.18)',
            filter: 'blur(14px)',
            transform: 'translateX(-50%)'
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 18,
            bottom: 16,
            width: 10,
            transform: 'translateX(-50%)',
            borderRadius: 999,
            background: 'linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.08)'
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 16,
            bottom: 16,
            left: 14,
            width: 88,
            borderRadius: '14px 6px 6px 14px',
            background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            boxShadow: 'inset -10px 0 18px rgba(148, 163, 184, 0.18)'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: 16,
              right: 18,
              height: 2,
              background: 'rgba(148, 163, 184, 0.34)',
              boxShadow:
                '0 12px 0 rgba(148, 163, 184, 0.25), 0 24px 0 rgba(148, 163, 184, 0.2), 0 36px 0 rgba(148, 163, 184, 0.16), 0 48px 0 rgba(148, 163, 184, 0.13)'
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            top: 16,
            bottom: 16,
            right: 14,
            width: 88,
            borderRadius: '6px 14px 14px 6px',
            background: 'linear-gradient(180deg, #ffffff 0%, #dbeafe 100%)',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            boxShadow: 'inset 10px 0 18px rgba(148, 163, 184, 0.15)'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: 16,
              right: 18,
              height: 2,
              background: 'rgba(148, 163, 184, 0.32)',
              boxShadow:
                '0 12px 0 rgba(148, 163, 184, 0.24), 0 24px 0 rgba(148, 163, 184, 0.19), 0 36px 0 rgba(148, 163, 184, 0.15), 0 48px 0 rgba(148, 163, 184, 0.12)'
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            top: 19,
            bottom: 17,
            right: 17,
            width: 86,
            borderRadius: '6px 14px 14px 6px',
            background: 'linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)',
            boxShadow: '0 0 0 1px rgba(15, 23, 42, 0.03)'
          }}
        />

        {[
          { delay: 0.55, depth: 0 },
          { delay: 0.95, depth: 1 },
          { delay: 1.35, depth: 2 }
        ].map((page) => (
          <motion.div
            key={page.delay}
            animate={{
              rotateY: [0, 0, -170, -170],
              opacity: [0, 0, 1, 0]
            }}
            transition={{
              duration: 2.8,
              repeat: Number.POSITIVE_INFINITY,
              ease: [0.4, 0, 0.2, 1],
              times: [0, page.delay / 2.8, (page.delay + 0.7) / 2.8, (page.delay + 1.25) / 2.8]
            }}
            style={{
              position: 'absolute',
              top: 17 + page.depth,
              bottom: 17,
              right: 15,
              width: 90 - page.depth * 2,
              borderRadius: '6px 14px 14px 6px',
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
              background: 'linear-gradient(180deg, #ffffff 0%, #e0f2fe 100%)',
              borderLeft: '1px solid rgba(30, 64, 175, 0.12)',
              boxShadow: '0 0 0 1px rgba(15, 23, 42, 0.03)',
              backfaceVisibility: 'hidden',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: 14,
                right: 16,
                height: 2,
                background: 'rgba(148, 163, 184, 0.38)',
                boxShadow:
                  '0 12px 0 rgba(148, 163, 184, 0.28), 0 24px 0 rgba(148, 163, 184, 0.22), 0 36px 0 rgba(148, 163, 184, 0.18), 0 48px 0 rgba(148, 163, 184, 0.15)'
              }}
            />
          </motion.div>
        ))}

        <motion.div
          animate={{ rotateY: [0, 0, -158, -158, 0] }}
          transition={{
            duration: 2.8,
            repeat: Number.POSITIVE_INFINITY,
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.08, 0.26, 0.82, 1]
          }}
          style={{
            position: 'absolute',
            top: 16,
            bottom: 16,
            right: 14,
            width: 92,
            borderRadius: '6px 14px 14px 6px',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)',
            transformOrigin: 'left center',
            transformStyle: 'preserve-3d',
            boxShadow: '0 22px 38px rgba(37, 99, 235, 0.22)',
            overflow: 'hidden',
            backfaceVisibility: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 24,
              left: 18,
              right: 26,
              height: 3,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.72)',
              boxShadow: '0 14px 0 rgba(255,255,255,0.42), 0 28px 0 rgba(255,255,255,0.28)'
            }}
          />
        </motion.div>

        <div
          style={{
            position: 'absolute',
            top: 16,
            bottom: 16,
            left: 14,
            width: 92,
            borderRadius: '14px 6px 6px 14px',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)'
          }}
        />
      </motion.div>

      <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
        Opening your library
      </Typography>
      <Typography variant="body1" sx={{ color: '#64748b', mt: 1 }}>
        Preparing your books, chapters, and workspace
      </Typography>
    </Box>
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
          <Route path="/auth/callback" element={<OAuthCallback />} />

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
