import { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let isActive = true;

    const resolveOAuthLogin = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (!isActive) return;

      if (sessionError || !session) {
        navigate('/login?oauth=failed', { replace: true });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!isActive) return;

      if (profileError || !profile) {
        await supabase.auth.signOut();
        navigate('/login?oauth=failed', { replace: true });
        return;
      }

      if (profile.role === 'admin') {
        navigate('/admin', { replace: true });
        return;
      }

      if (profile.role === 'author') {
        navigate('/author', { replace: true });
        return;
      }

      await supabase.auth.signOut();
      navigate('/login?access=reader-only', { replace: true });
    };

    resolveOAuthLogin();

    return () => {
      isActive = false;
    };
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        background: 'linear-gradient(180deg, #f8fafc 0%, #eff6ff 45%, #ffffff 100%)',
        px: 3
      }}
    >
      <CircularProgress />
      <Typography variant="body1" sx={{ color: '#475569', fontWeight: 600 }}>
        Completing your sign in...
      </Typography>
    </Box>
  );
}
