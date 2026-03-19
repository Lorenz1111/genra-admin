import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { Dialog, DialogContent, Typography, Button } from '@mui/material';
import { ErrorOutline, Devices } from '@mui/icons-material'; // SD Fix: Added Devices icon

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

  // Modals
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [showDeviceConflictModal, setShowDeviceConflictModal] = useState(false); // SD Logic
  
  const isManualSignOut = useRef(false); 
  const hadActiveSession = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      hadActiveSession.current = Boolean(session);
      if (session) {
        fetchProfile(session.user.id);
        setupRealtimeSessionListener(session.user.id); // SD Init Listener
      } else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(session);
        if (session) {
          fetchProfile(session.user.id);
          setupRealtimeSessionListener(session.user.id);
        }
        hadActiveSession.current = Boolean(session);
        isManualSignOut.current = false; 
      } 
      else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setSession(null);
        setLoading(false);

        if (hadActiveSession.current && !isManualSignOut.current) {
          setShowExpiryModal(true);
        }
        hadActiveSession.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- SD FEATURE: Realtime Device Conflict Listener ---
  const setupRealtimeSessionListener = (userId: string) => {
    // Aabangan natin yung live changes sa mismong row mo sa profiles
    const channel = supabase.channel('custom-session-channel')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          const currentLocalToken = localStorage.getItem('device_token');
          const newDbToken = payload.new.session_token;

          // Kapag nagbago ang token sa database at iba na ito sa hawak ng device mo, I-LOGOUT!
          if (newDbToken && currentLocalToken && newDbToken !== currentLocalToken) {
            handleDeviceConflictLogout();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const handleDeviceConflictLogout = async () => {
    isManualSignOut.current = true; // Set true para hindi lumabas ang generic expiry modal
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setShowDeviceConflictModal(true); // Ilabas yung custom Single Device modal
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, username, full_name, avatar_url')
        .eq('id', userId)
        .single();

      if (error) console.error('Error fetching profile:', error);
      else setProfile(data as Profile);
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

  const handleCloseModals = () => {
    setShowExpiryModal(false);
    setShowDeviceConflictModal(false);
    window.location.replace('/login');
  };

  const value = {
    session, profile, loading, isAdmin: profile?.role === 'admin', isAuthor: profile?.role === 'author', signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}

      {/* 1. Generic Expiry Modal */}
      <Dialog open={showExpiryModal} disableEscapeKeyDown PaperProps={{ sx: { borderRadius: 4, p: 2, textAlign: 'center', minWidth: 320 } }}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ErrorOutline sx={{ fontSize: 60, color: '#f59e0b', mb: 2 }} /> 
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: '#0f172a' }}>Session Expired</Typography>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>Your session has timed out. Please log in again.</Typography>
          <Button onClick={handleCloseModals} variant="contained" fullWidth disableElevation sx={{ py: 1.5, borderRadius: 2, backgroundColor: '#2563eb', fontWeight: 'bold' }}>Back to Login</Button>
        </DialogContent>
      </Dialog>

      {/* 2. SD FEATURE: Multiple Devices Warning Modal */}
      <Dialog open={showDeviceConflictModal} disableEscapeKeyDown PaperProps={{ sx: { borderRadius: 4, p: 2, textAlign: 'center', minWidth: 320 } }}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Devices sx={{ fontSize: 60, color: '#dc2626', mb: 2 }} /> 
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: '#0f172a' }}>Logged Out</Typography>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
            Your account was just logged in from another device or browser. For security, we limit GenrA accounts to one active session at a time.
          </Typography>
          <Button onClick={handleCloseModals} variant="contained" fullWidth disableElevation sx={{ py: 1.5, borderRadius: 2, backgroundColor: '#dc2626', fontWeight: 'bold', '&:hover': { backgroundColor: '#b91c1c' } }}>
            Log in Again
          </Button>
        </DialogContent>
      </Dialog>

    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};