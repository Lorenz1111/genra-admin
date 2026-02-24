import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, TextField, Typography, CircularProgress, 
  Checkbox, FormControlLabel, Link as MuiLink, Grid, Paper
} from '@mui/material';

import logo from '../../assets/genra-logo.png'; 

export default function Login() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // --- DAGDAG: Load credentials from localStorage pag open ng page ---
  useEffect(() => {
    const savedEmail = localStorage.getItem('genra_email');
    const savedPassword = localStorage.getItem('genra_password');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email.trim() || !password) {
      setAuthError("Invalid email or password.");
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

      // --- DAGDAG: Save or Delete sa localStorage depende sa checkbox ---
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
        await supabase.auth.signOut();
        setAuthError('Readers are restricted to the GenrA Mobile App.');
        setLoading(false);
      }

    } catch (err: any) {
      setAuthError(err.message || 'Invalid email or password.');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0, 
      display: 'flex', 
      flexDirection: { xs: 'column', md: 'row' },
      backgroundColor: '#fff' 
    }}>
      
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
          
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 4 }}>
            <img src={logo} alt="GenrA Logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
          </Box>

          <Typography component="h1" variant="h4" sx={{ fontWeight: '900', color: '#0f172a', mb: 1, letterSpacing: '-0.02em' }}>
            Welcome Back
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 5, fontSize: '0.95rem' }}>
            Please enter your details to access the portal.
          </Typography>

          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Email Address" variant="outlined" fullWidth value={email}
              onChange={(e) => { setEmail(e.target.value); if (authError) setAuthError(null); }}
              error={!!authError}
            />
            
            <Box>
              <TextField
                label="Password" type="password" variant="outlined" fullWidth value={password}
                onChange={(e) => { setPassword(e.target.value); if (authError) setAuthError(null); }}
                error={!!authError}
              />
              {authError && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1, display: 'block', fontWeight: 500 }}>
                  {authError}
                </Typography>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: -1 }}>
              <FormControlLabel
                control={
                  <Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} color="primary" size="small" />
                }
                label={<Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>Remember me</Typography>}
              />
              <MuiLink 
                component="button" type="button" variant="body2" underline="hover" 
                sx={{ color: '#2563eb', fontWeight: 600 }}
                onClick={() => navigate('/forgot-password')}
              >
                Forgot password?
              </MuiLink>
            </Box>
            
            <Button 
              type="submit" variant="contained" size="large" disabled={loading} disableElevation
              sx={{ 
                mt: 1, py: 1.5, borderRadius: 2, backgroundColor: '#2563eb', 
                textTransform: 'none', fontSize: '1rem', fontWeight: 'bold',
                '&:hover': { backgroundColor: '#1d4ed8' }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
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
          <img src={logo} alt="GenrA Logo" style={{ width: 200, height: 200, objectFit: 'contain', marginBottom: 24, filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.08))' }} />
          <Typography variant="h3" sx={{ fontWeight: '900', color: '#0f172a', mb: 2, letterSpacing: '-0.02em' }}>GenrA Portal</Typography>
          <Typography variant="body1" sx={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.6 }}>
            The central hub for authors to manage e-books and for administrators to oversee the GenrA reading ecosystem.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}