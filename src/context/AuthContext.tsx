import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { Dialog, DialogContent, Typography, Button } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

type Profile = {
  id: string;
  role: 'admin' | 'author' | 'reader';
  username: string | null;
  full_name: string | null;
  avatar_url: string | null; 
};

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

  // Session Expiry States
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const isManualSignOut = useRef(false); 
  const hadActiveSession = useRef(false);

  useEffect(() => {
    // 1. Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      hadActiveSession.current = Boolean(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // 2. Listen for login/logout/expiry changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(session);
        if (session) fetchProfile(session.user.id);
        hadActiveSession.current = Boolean(session);
        isManualSignOut.current = false; 
      } 
      else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setSession(null);
        setLoading(false);

        // Kapag hindi sinadya ang pag-logout (e.g., token expired), ilabas ang modal!
        if (hadActiveSession.current && !isManualSignOut.current) {
          setShowExpiryModal(true);
        }
        hadActiveSession.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, username, full_name, avatar_url')
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
    isManualSignOut.current = true; 
    hadActiveSession.current = false;
    setShowExpiryModal(false);
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  const handleCloseExpiryModal = () => {
    setShowExpiryModal(false);
    window.location.replace(new URL(`${import.meta.env.BASE_URL}login`, window.location.origin).toString());
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

      <Dialog open={showExpiryModal} disableEscapeKeyDown PaperProps={{ sx: { borderRadius: 4, p: 2, textAlign: 'center', minWidth: 320 } }}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ErrorOutline sx={{ fontSize: 60, color: '#f59e0b', mb: 2 }} /> 
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: '#0f172a' }}>
            Session Expired
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
            For your security, your GenrA portal session has timed out due to inactivity or token expiration. Please log in again to continue managing your account.
          </Typography>
          <Button 
            onClick={handleCloseExpiryModal} variant="contained" fullWidth disableElevation
            sx={{ py: 1.5, borderRadius: 2, backgroundColor: '#2563eb', textTransform: 'none', fontSize: '1rem', fontWeight: 'bold', '&:hover': { backgroundColor: '#1d4ed8' } }}
          >
            Back to Login
          </Button>
        </DialogContent>
      </Dialog>

    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};