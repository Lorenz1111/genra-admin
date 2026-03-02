import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { Dialog, DialogContent, Typography, Button, Box } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

// Define natin kung ano ang itsura ng User Profile
type Profile = {
  id: string;
  role: 'admin' | 'author' | 'reader';
  username: string | null;
  full_name: string | null;
};

// Define context shape
type AuthContextType = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthor: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // --- SENIOR DEV FIX: Session Expiry States ---
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const isManualSignOut = useRef(false); // Track kung kinlick ba ng user ang logout

  useEffect(() => {
    // 1. Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // 2. Listen for login/logout/expiry changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(session);
        if (session) fetchProfile(session.user.id);
        isManualSignOut.current = false; // Reset natin kapag nakapasok na
      } 
      else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setSession(null);
        setLoading(false);

        // Kapag hindi sinadya ang pag-logout (e.g., token expired), ilabas ang modal!
        if (!isManualSignOut.current) {
          setShowExpiryModal(true);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper: Fetch extra details from 'profiles' table
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, username, full_name')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    isManualSignOut.current = true; // Mark as intentional logout para hindi lumabas ang modal
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  // --- SENIOR DEV FIX: Modal Close Handler ---
  const handleCloseExpiryModal = () => {
    setShowExpiryModal(false);
    // Dahil nag-null na ang session, automatic na silang ibinato ng ProtectedRoute mo 
    // pabalik sa /login. Siguraduhin lang natin na clear ang cache.
    localStorage.removeItem('genra_email');
    localStorage.removeItem('genra_password');
  };

  const value = {
    session,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isAuthor: profile?.role === 'author',
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}

      {/* --- GLOBAL SESSION EXPIRY MODAL --- */}
      {/* Naka-mount ito sa buong app kaya kahit anong page ang ginagawa ng user, lalabas ito kapag na-expire sila */}
      <Dialog open={showExpiryModal} disableEscapeKeyDown PaperProps={{ sx: { borderRadius: 4, p: 2, textAlign: 'center', minWidth: 320 } }}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ErrorOutline sx={{ fontSize: 60, color: '#f59e0b', mb: 2 }} /> {/* Amber color for warning */}
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: '#0f172a' }}>
            Session Expired
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
            For your security, your GenrA portal session has timed out due to inactivity or token expiration. Please log in again to continue managing your e-books.
          </Typography>
          <Button 
            onClick={handleCloseExpiryModal} variant="contained" fullWidth disableElevation
            sx={{ py: 1.5, borderRadius: 2, backgroundColor: '#2563eb', textTransform: 'none', fontSize: '1rem', fontWeight: 'bold' }}
          >
            Back to Login
          </Button>
        </DialogContent>
      </Dialog>

    </AuthContext.Provider>
  );
}

// Custom Hook para madaling gamitin sa ibang files
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};