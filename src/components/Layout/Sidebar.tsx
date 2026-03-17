import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Tooltip, Typography } from '@mui/material';
import { Dashboard, MenuBook, RateReview, People, AddCircle, Category } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/genra-logo.png';

interface SidebarProps {
  drawerWidth: number;
  collapsedWidth: number;
  mobileOpen: boolean;
  isCollapsed: boolean;
  handleDrawerToggle: () => void;
}

export default function Sidebar({ drawerWidth, collapsedWidth, mobileOpen, isCollapsed, handleDrawerToggle }: SidebarProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: profile?.role === 'admin' ? '/admin' : '/author/dashboard', allowed: ['admin', 'author'] },
    { text: 'My Books', icon: <MenuBook />, path: '/author/books', allowed: ['author'] },
    { text: 'Upload New', icon: <AddCircle />, path: '/author/upload', allowed: ['author'] },
    { text: 'Review Center', icon: <RateReview />, path: '/admin/reviews', allowed: ['admin'] },
    { text: 'Genres', icon: <Category />, path: '/admin/genres', allowed: ['admin'] },
    { text: 'Users', icon: <People />, path: '/admin/users', allowed: ['admin'] },
  ];

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* SENIOR DEV FIX: Dynamic alignment and padding for the Logo area */}
      <Box sx={{ 
        px: isCollapsed ? 2 : 3, 
        display: 'flex', alignItems: 'center', 
        justifyContent: isCollapsed ? 'center' : 'flex-start', 
        height: '70px', borderBottom: '1px solid #e2e8f0',
        flexShrink: 0,
        transition: 'padding 0.3s ease, justify-content 0.3s ease'
      }}>
        <img src={logo} alt="GenrA Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
        
        {/* Magpapakita ang Text kapag open ang sidebar */}
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 'bold', color: '#0f172a', letterSpacing: 1, ml: 1.5,
            opacity: isCollapsed ? 0 : 1, display: isCollapsed ? 'none' : 'block',
            transition: 'opacity 0.2s ease'
          }}
        >
          GenrA
        </Typography>
      </Box>
      
      {/* 2. MIDDLE: Navigation Links */}
      <List sx={{ px: isCollapsed ? 1 : 2, pt: 3, flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {menuItems.map((item) => {
          if (!profile?.role || !item.allowed.includes(profile.role)) return null;
          
          const isActive = (item.path === '/admin' || item.path === '/author/dashboard')
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);

          return (
            <Tooltip key={item.text} title={isCollapsed ? item.text : ''} placement="right" arrow>
              <ListItem disablePadding sx={{ mb: 1, display: 'block' }}>
                <ListItemButton 
                  onClick={() => navigate(item.path)}
                  sx={{
                    minHeight: 48,
                    borderRadius: 2,
                    justifyContent: isCollapsed ? 'center' : 'initial',
                    px: 2.5,
                    backgroundColor: isActive ? '#eff6ff' : 'transparent',
                    color: isActive ? '#2563eb' : '#64748b',
                    '&:hover': {
                      backgroundColor: isActive ? '#eff6ff' : '#f8fafc',
                      color: isActive ? '#2563eb' : '#0f172a',
                    }
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: 'inherit', 
                    minWidth: 0, 
                    mr: isCollapsed ? 0 : 2, 
                    justifyContent: 'center' 
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  
                  <ListItemText 
                    primary={item.text} 
                    sx={{ 
                      opacity: isCollapsed ? 0 : 1, 
                      display: isCollapsed ? 'none' : 'block',
                      transition: 'opacity 0.2s ease',
                      m: 0
                    }}
                    primaryTypographyProps={{ fontWeight: isActive ? 700 : 500, fontSize: '0.95rem', whiteSpace: 'nowrap' }} 
                  />
                </ListItemButton>
              </ListItem>
            </Tooltip>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: isCollapsed ? collapsedWidth : drawerWidth }, flexShrink: { sm: 0 }, transition: 'width 0.3s ease' }}>
      
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundColor: '#ffffff' },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: isCollapsed ? collapsedWidth : drawerWidth, 
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            transition: 'width 0.3s ease',
            overflowX: 'hidden'
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
      
    </Box>
  );
}