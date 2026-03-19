import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { RealtimeChannel, Session } from '@supabase/supabase-js';
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
  const isHandlingDeviceConflict = useRef(false);
  const hadActiveSession = useRef(false);
  const sessionChannelRef = useRef<RealtimeChannel | null>(null);
  const sessionWatchCleanupRef = useRef<(() => void) | null>(null);

  const cleanupRealtimeSessionListener = () => {
    if (sessionChannelRef.current) {
      supabase.removeChannel(sessionChannelRef.current);
      sessionChannelRef.current = null;
    }
  };

  const cleanupSessionWatchers = () => {
    cleanupRealtimeSessionListener();
    sessionWatchCleanupRef.current?.();
    sessionWatchCleanupRef.current = null;
  };

  const generateAndSaveDeviceToken = async (userId: string) => {
    const deviceToken = crypto.randomUUID();
    localStorage.setItem('device_token', deviceToken);

    const { error } = await supabase
      .from('profiles')
      .update({ session_token: deviceToken })
      .eq('id', userId);

    if (error) {
      console.error('Error saving device token:', error);
    }
  };

  const handleDeviceConflictLogout = async () => {
    if (isHandlingDeviceConflict.current) return;

    isHandlingDeviceConflict.current = true;
    isManualSignOut.current = true; // Set true para hindi lumabas ang generic expiry modal
    cleanupSessionWatchers();
    localStorage.removeItem('device_token');
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setLoading(false);
    setShowDeviceConflictModal(true); // Ilabas yung custom Single Device modal
    isHandlingDeviceConflict.current = false;
  };

  const validateCurrentSessionToken = async (userId: string) => {
    const currentLocalToken = localStorage.getItem('device_token');
    if (!currentLocalToken || isHandlingDeviceConflict.current) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('session_token')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error validating session token:', error);
      return;
    }

    if (data?.session_token && data.session_token !== currentLocalToken) {
      await handleDeviceConflictLogout();
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      hadActiveSession.current = Boolean(session);
      if (session) {
        if (!localStorage.getItem('device_token')) {
          await generateAndSaveDeviceToken(session.user.id);
        }
        fetchProfile(session.user.id);
        setupSessionWatchers(session.user.id);
      } else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(session);
        if (session) {
          if (event === 'SIGNED_IN' || !localStorage.getItem('device_token')) {
            await generateAndSaveDeviceToken(session.user.id);
          }
          fetchProfile(session.user.id);
          setupSessionWatchers(session.user.id);
        }
        hadActiveSession.current = Boolean(session);
        isManualSignOut.current = false; 
      } 
      else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setSession(null);
        setLoading(false);
        cleanupSessionWatchers();

        if (hadActiveSession.current && !isManualSignOut.current) {
          setShowExpiryModal(true);
        }
        hadActiveSession.current = false;
      }
    });

    return () => {
      cleanupSessionWatchers();
      subscription.unsubscribe();
    };
  }, []);

  // --- SD FEATURE: Realtime Device Conflict Listener ---
  const setupSessionWatchers = (userId: string) => {
    cleanupSessionWatchers();

    sessionChannelRef.current = supabase.channel(`session-limit-${userId}`)
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

    const validateSession = () => {
      void validateCurrentSessionToken(userId);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateSession();
      }
    };

    const intervalId = window.setInterval(validateSession, 30000);

    window.addEventListener('focus', validateSession);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    sessionWatchCleanupRef.current = () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', validateSession);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };

    validateSession();
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
    cleanupSessionWatchers();
    localStorage.removeItem('device_token');
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  const handleCloseModals = () => {
    setShowExpiryModal(false);
    setShowDeviceConflictModal(false);
    window.location.replace(new URL(`${import.meta.env.BASE_URL}login`, window.location.origin).toString());
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
