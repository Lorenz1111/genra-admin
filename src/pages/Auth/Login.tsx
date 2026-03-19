import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, TextField, Typography, CircularProgress, 
  Checkbox, FormControlLabel, Link as MuiLink, Alert, Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';

import logo from '../../assets/genra-logo.png'; 

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds in milliseconds

export default function Login() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // --- RATE LIMITING STATES ---
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  // --- SD FEATURE: OAuth Redirect Handler & Role Checker ---
  // Sasalubungin nito ang user pagbalik nila galing Google/Facebook
  useEffect(() => {
    const checkOAuthSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setLoading(true);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          if (profile.role === 'admin') {
            navigate('/admin');
          } else if (profile.role === 'author') {
            navigate('/author');
          } else {
            // SD Security: Kung Reader siya na nakalusot via Google, i-logout agad!
            await supabase.auth.signOut();
            setAuthError('Access Denied: Readers are restricted to the GenrA Mobile App. Please download the app to read books.');
            setLoading(false);
          }
        }
      }
    };

    checkOAuthSession();
  }, [navigate]);

  // --- Load credentials & lockout state on mount ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessMessage = params.get('access');
    const oauthMessage = params.get('oauth');

    if (accessMessage === 'reader-only') {
      setAuthError('Access Denied: Readers are restricted to the GenrA Mobile App. Please download the app to read books.');
    } else if (oauthMessage === 'failed') {
      setAuthError('OAuth login could not be completed. Please try again.');
    }

    const savedEmail = localStorage.getItem('genra_email');
    const savedPassword = localStorage.getItem('genra_password');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }

    const savedAttempts = parseInt(localStorage.getItem('login_attempts') || '0', 10);
    const savedLockoutTime = parseInt(localStorage.getItem('login_lockout_time') || '0', 10);
    
    setAttempts(savedAttempts);

    if (savedLockoutTime) {
      const now = Date.now();
      if (now < savedLockoutTime) {
        setLockoutTime(savedLockoutTime);
      } else {
        resetAttempts();
      }
    }
  }, []);

  // --- Handle Countdown Timer ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (lockoutTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const timeRemaining = Math.ceil((lockoutTime - now) / 1000);
        
        if (timeRemaining <= 0) {
          clearInterval(interval);
          resetAttempts();
        } else {
          setCountdown(timeRemaining);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [lockoutTime]);

  const resetAttempts = () => {
    setAttempts(0);
    setLockoutTime(null);
    setCountdown(0);
    setAuthError(null);
    localStorage.removeItem('login_attempts');
    localStorage.removeItem('login_lockout_time');
  };

  const handleFailedAttempt = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    localStorage.setItem('login_attempts', newAttempts.toString());

    if (newAttempts >= MAX_ATTEMPTS) {
      const unlockTime = Date.now() + LOCKOUT_DURATION_MS;
      setLockoutTime(unlockTime);
      localStorage.setItem('login_lockout_time', unlockTime.toString());
      setAuthError(`Too many failed attempts. Please wait 60 seconds.`);
    } else {
      setAuthError(`Invalid email or password. (${newAttempts}/${MAX_ATTEMPTS} attempts)`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lockoutTime && Date.now() < lockoutTime) return;

    setAuthError(null);

    if (!email.trim() || !password) {
      setAuthError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) throw new Error("Invalid email or password.");

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) throw new Error('Profile not found.');

      resetAttempts();

      if (rememberMe) {
        localStorage.setItem('genra_email', email.trim());
        localStorage.setItem('genra_password', password);
      } else {
        localStorage.removeItem('genra_email');
        localStorage.removeItem('genra_password');
      }

      if (profile.role === 'admin') {
        setTimeout(() => navigate('/admin'), 400); 
      } else if (profile.role === 'author') {
        setTimeout(() => navigate('/author'), 400);
      } else {
        // SD Security: Error for normal email/password readers
        await supabase.auth.signOut();
        setAuthError('Access Denied: Readers are restricted to the GenrA Mobile App. Please download the app to read books.');
        setLoading(false);
      }

    } catch (err: any) {
      handleFailedAttempt();
      setLoading(false);
    }
  };

  // --- SD FEATURE: OAuth Login Handler ---
  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    setAuthError(null);
    setLoading(true);
    try {
      const redirectTo = new URL(`${import.meta.env.BASE_URL}auth/callback`, window.location.origin).toString();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setAuthError(`Failed to login with ${provider}. Please try again.`);
      setLoading(false);
    }
  };

  const isLockedOut = lockoutTime !== null && countdown > 0;

  return (
    <Box sx={{ 
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0, 
      display: 'flex', 
      flexDirection: { xs: 'column', md: 'row' },
      backgroundColor: '#fff' 
    }}>
      
      {/* BACK BUTTON */}
      <Box sx={{ position: 'absolute', top: 20, left: { xs: 20, md: 40 }, zIndex: 50 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/')}
          sx={{ 
            color: '#64748b', 
            textTransform: 'none', 
            fontWeight: 600,
            fontSize: '0.95rem',
            '&:hover': { color: '#0f172a', backgroundColor: 'transparent' } 
          }}
        >
          Back to Home
        </Button>
      </Box>

      {/* LEFT SIDE: LOGIN FORM */}
      <Box sx={{ 
        width: { xs: '100%', md: '45%', lg: '40%' }, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        px: { xs: 4, sm: 8 },
        boxShadow: { md: '10px 0 30px rgba(0,0,0,0.03)' },
        zIndex: 10,
        backgroundColor: '#fff'
      }}>
        <Box sx={{ width: '100%', maxWidth: 380 }}>
          
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 4, mt: 4 }}>
            <img src={logo} alt="GenrA Logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
          </Box>

          <Typography component="h1" variant="h4" sx={{ fontWeight: '900', color: '#0f172a', mb: 1, letterSpacing: '-0.02em' }}>
            Welcome Back
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 4, fontSize: '0.95rem' }}>
            Please enter your details to access the portal.
          </Typography>

          {isLockedOut && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontWeight: 'bold' }}>
              Too many failed attempts. Try again in {countdown} seconds.
            </Alert>
          )}

          {/* SD FEATURE: General Error Alert para madaling basahin yung Reader warning */}
          {authError && !isLockedOut && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontWeight: 'bold', lineHeight: 1.4 }}>
              {authError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Email Address" variant="outlined" fullWidth value={email}
              onChange={(e) => { setEmail(e.target.value); if (authError && !isLockedOut) setAuthError(null); }}
              disabled={isLockedOut || loading}
            />
            
            <Box>
              <TextField
                label="Password" type="password" variant="outlined" fullWidth value={password}
                onChange={(e) => { setPassword(e.target.value); if (authError && !isLockedOut) setAuthError(null); }}
                disabled={isLockedOut || loading}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: -1 }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                    color="primary" 
                    size="small"
                    disabled={isLockedOut} 
                  />
                }
                label={<Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>Remember me</Typography>}
              />
              <MuiLink 
                component="button" type="button" variant="body2" underline="hover" 
                sx={{ color: isLockedOut ? '#94a3b8' : '#2563eb', fontWeight: 600 }}
                onClick={() => !isLockedOut && navigate('/forgot-password')}
                disabled={isLockedOut}
              >
                Forgot password?
              </MuiLink>
            </Box>
            
            <Button 
              type="submit" variant="contained" size="large" disableElevation
              disabled={loading || isLockedOut}
              sx={{ 
                mt: 1, py: 1.5, borderRadius: 2, backgroundColor: '#2563eb', 
                textTransform: 'none', fontSize: '1rem', fontWeight: 'bold',
                '&:hover': { backgroundColor: '#1d4ed8' },
                '&.Mui-disabled': { backgroundColor: isLockedOut ? '#cbd5e1' : '#93c5fd', color: '#fff' }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : (isLockedOut ? `Locked (${countdown}s)` : 'Sign In')}
            </Button>
          </Box>

          {/* SD FEATURE: OAUTH BUTTONS */}
          <Divider sx={{ my: 3, typography: 'body2', color: '#94a3b8', fontWeight: 'bold' }}>OR CONTINUE WITH</Divider>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<GoogleIcon sx={{ color: '#db4437' }} />}
              onClick={() => handleOAuthLogin('google')}
              disabled={loading || isLockedOut}
              sx={{ 
                py: 1.2, borderRadius: 2, borderColor: '#cbd5e1', color: '#0f172a', fontWeight: 'bold', textTransform: 'none',
                '&:hover': { backgroundColor: '#f8fafc', borderColor: '#94a3b8' }
              }}
            >
              Google
            </Button>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<FacebookIcon sx={{ color: '#1877f2' }} />}
              onClick={() => handleOAuthLogin('facebook')}
              disabled={loading || isLockedOut}
              sx={{ 
                py: 1.2, borderRadius: 2, borderColor: '#cbd5e1', color: '#0f172a', fontWeight: 'bold', textTransform: 'none',
                '&:hover': { backgroundColor: '#f8fafc', borderColor: '#94a3b8' }
              }}
            >
              Facebook
            </Button>
          </Box>

        </Box>
      </Box>

      {/* RIGHT SIDE: BRANDING */}
      <Box sx={{ 
        display: { xs: 'none', md: 'flex' }, width: { md: '55%', lg: '60%' }, height: '100%', 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
        flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 8
      }}>
        <Box sx={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 480 }}>
          <img src={logo} alt="GenrA Logo" draggable="false" style={{ width: 200, height: 200, objectFit: 'contain', marginBottom: 24, filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.08))' }} />
          <Typography variant="h3" sx={{ fontWeight: '900', color: '#0f172a', mb: 2, letterSpacing: '-0.02em' }}>GenrA Portal</Typography>
          <Typography variant="body1" sx={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.6 }}>
            The central hub for authors to manage e-books and for administrators to oversee the GenrA reading ecosystem.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
