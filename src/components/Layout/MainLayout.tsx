import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Box, AppBar, Toolbar, IconButton, Badge, InputBase, 
  Avatar, Menu, MenuItem, Typography, Paper} from '@mui/material';
import { Menu as MenuIcon, NotificationsNone, Search as SearchIcon, 
  ExitToApp, Person, Edit } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from './Sidebar';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 80;

export default function MainLayout({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // SENIOR DEV FIX: State para sa avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Live Clock State
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Avatar Logic
  useEffect(() => {
    const fetchAvatar = async () => {
      // Kung nandiyan na sa profile context, gamitin na agad
      if ((profile as any)?.avatar_url) {
        setAvatarUrl((profile as any).avatar_url);
        return;
      }
      
      // Kung wala sa context, i-fetch natin manually
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      }
    };
    fetchAvatar();
  }, [profile]);

  const timeString = currentTime.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  
  const dateString = currentTime.toLocaleDateString('en-US', {
    timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric',
  });

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleCollapseToggle = () => setIsCollapsed(!isCollapsed);
  const handleProfileMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Helper para sa fallback avatar
  const getAvatarSource = () => {
    if (avatarUrl) return avatarUrl;
    const name = profile?.full_name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=eff6ff&color=2563eb&bold=true`;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${isCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH}px)` },
          ml: { md: `${isCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH}px` },
          backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0',
          transition: 'width 0.3s ease, margin 0.3s ease',
          zIndex: (theme) => theme.zIndex.drawer - 1,
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', minHeight: '70px !important', px: { xs: 2, md: 4 } }}>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={handleDrawerToggle} sx={{ color: '#64748b', display: { md: 'none' } }}>
              <MenuIcon />
            </IconButton>
            <IconButton onClick={handleCollapseToggle} sx={{ color: '#64748b', display: { xs: 'none', md: 'flex' } }}>
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#0f172a', lineHeight: 1.2 }}>{timeString}</Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>{dateString}</Typography>
            </Box>
          </Box>

          <Paper elevation={0} sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', width: 350, backgroundColor: '#f1f5f9', borderRadius: 8, px: 2, py: 0.5, border: '1px solid transparent', transition: 'border 0.2s ease', '&:hover': { borderColor: '#cbd5e1' } }}>
            <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />
            <InputBase placeholder="Search books, authors..." sx={{ ml: 1, flex: 1, fontSize: '0.9rem', color: '#0f172a' }} />
          </Paper>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton sx={{ color: '#64748b' }}>
              <Badge badgeContent={3} color="error"><NotificationsNone /></Badge>
            </IconButton>

            {/* SENIOR DEV FIX: Na-update ang Avatar para gamitin ang source natin! */}
            <IconButton onClick={handleProfileMenu} sx={{ p: 0.5 }}>
              <Avatar 
                src={getAvatarSource()}
                sx={{ width: 36, height: 36, border: '2px solid #e2e8f0' }} 
              />
            </IconButton>

            <Menu
              anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{ elevation: 0, sx: { mt: 1.5, minWidth: 180, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' } }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e2e8f0', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#0f172a' }}>{profile?.full_name || 'User'}</Typography>
                <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'capitalize' }}>{profile?.role || 'Guest'}</Typography>
              </Box>
              <MenuItem onClick={() => { handleCloseMenu(); alert('Edit Profile coming soon!'); }} sx={{ py: 1, color: '#475569', fontWeight: 500, fontSize: '0.9rem' }}><Edit sx={{ mr: 2, fontSize: 18 }} /> Edit Profile</MenuItem>
              <MenuItem onClick={handleCloseMenu} sx={{ py: 1, color: '#475569', fontWeight: 500, fontSize: '0.9rem' }}><Person sx={{ mr: 2, fontSize: 18 }} /> My Account</MenuItem>
              <MenuItem onClick={handleLogout} sx={{ py: 1, color: '#dc2626', fontWeight: 500, fontSize: '0.9rem' }}><ExitToApp sx={{ mr: 2, fontSize: 18 }} /> Sign Out</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Sidebar drawerWidth={DRAWER_WIDTH} collapsedWidth={COLLAPSED_WIDTH} mobileOpen={mobileOpen} isCollapsed={isCollapsed} handleDrawerToggle={handleDrawerToggle} />
      
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 3, md: 5 }, width: { sm: `calc(100% - ${isCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH}px)` }, mt: '70px', backgroundColor: '#f8fafc', transition: 'width 0.3s ease, margin 0.3s ease' }}>
        {children}
      </Box>
    </Box>
  );
}