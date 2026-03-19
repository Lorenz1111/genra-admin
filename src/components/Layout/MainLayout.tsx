import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { 
  Box, AppBar, Toolbar, IconButton, Badge, InputBase, 
  Avatar, Menu, MenuItem, Typography, Paper, Collapse,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, CircularProgress, Divider
} from '@mui/material';
import { 
  Menu as MenuIcon, NotificationsNone, Search as SearchIcon, 
  ExitToApp, Person, Edit, Close as CloseIcon, 
  Dashboard, MenuBook, AddCircleOutline, RateReview, People, Category, Article
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from './Sidebar';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 80;

// Hardcoded App Navigation Links para mahanap sa Search
const APP_TABS = [
  { title: 'Author Dashboard', path: '/author/dashboard', type: 'Tab', icon: <Dashboard />, role: 'author' },
  { title: 'My Books', path: '/author/books', type: 'Tab', icon: <MenuBook />, role: 'author' },
  { title: 'Upload New Book', path: '/author/upload', type: 'Tab', icon: <AddCircleOutline />, role: 'author' },
  { title: 'Admin Dashboard', path: '/admin', type: 'Tab', icon: <Dashboard />, role: 'admin' },
  { title: 'Review Center', path: '/admin/reviews', type: 'Tab', icon: <RateReview />, role: 'admin' },
  { title: 'User Management', path: '/admin/users', type: 'Tab', icon: <People />, role: 'admin' },
  { title: 'Genre Management', path: '/admin/genres', type: 'Tab', icon: <Category />, role: 'admin' },
];

export default function MainLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- SENIOR DEV FEATURE: Spotlight Search States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchAvatar = async () => {
      if ((profile as any)?.avatar_url) {
        setAvatarUrl((profile as any).avatar_url);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      }
    };
    fetchAvatar();
  }, [profile]);

  // --- LIVE SEARCH LOGIC (Debounced) ---
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Gagamit tayo ng debounce (300ms) para hindi mag-spam request sa database habang nagta-type
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      const queryLower = searchQuery.toLowerCase();

      // 1. Hanapin ang mga Tabs (Frontend lang, mabilis ito)
      const matchedTabs = APP_TABS.filter(tab => 
        tab.title.toLowerCase().includes(queryLower) && tab.role === profile?.role
      );

      // 2. Hanapin ang Books (Database query)
      let matchedBooks: any[] = [];
      if (profile?.role === 'author') {
        const { data } = await supabase
          .from('books')
          .select('id, title')
          .eq('author_id', (await supabase.auth.getUser()).data.user?.id)
          .ilike('title', `%${queryLower}%`)
          .limit(4); // Limit to 4 results para hindi humaba ang dropdown

        matchedBooks = (data || []).map(book => ({
          title: book.title,
          // SENIOR DEV FIX: Dadalhin natin sila sa Chapter List para iwas logout bug!
          path: `/author/books/${book.id}/chapters`, 
          type: 'Book',
          icon: <Article />
        }));
      }

      setSearchResults([...matchedTabs, ...matchedBooks]);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, profile]);

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
    handleCloseMenu(); 
    await signOut(); 
    navigate('/login');
  };

  const getAvatarSource = () => {
    if (avatarUrl) return avatarUrl;
    const name = profile?.full_name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=eff6ff&color=2563eb&bold=true`;
  };

  // Function kapag may clinick sa dropdown
  const handleResultClick = (path: string) => {
    navigate(path);
    setSearchQuery('');
    setShowDropdown(false);
    setIsMobileSearchActive(false);
    searchInputRef.current?.blur();
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { xs: '100%', md: `calc(100% - ${isCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH}px)` },
          ml: { md: `${isCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH}px` },
          backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0',
          transition: 'width 0.3s ease, margin 0.3s ease',
          zIndex: (theme) => theme.zIndex.drawer - 1,
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', minHeight: '70px !important', px: { xs: 1.5, md: 4 } }}>
          
          {/* LEFT BOX */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 } }}>
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

          {/* MIDDLE BOX: Spotlight Search Bar */}
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: { xs: 'flex-end', md: 'center' }, pr: { xs: 1, md: 0 }, position: 'relative' }}>
            
            <Paper 
              elevation={0} 
              onClick={() => {
                if (!isMobileSearchActive) {
                  setIsMobileSearchActive(true);
                  setTimeout(() => searchInputRef.current?.focus(), 150);
                }
              }}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                width: { xs: isMobileSearchActive ? '200px' : '40px', sm: isMobileSearchActive ? '250px' : '40px', md: '400px' }, 
                backgroundColor: { xs: isMobileSearchActive ? '#f1f5f9' : 'transparent', md: '#f1f5f9' }, 
                borderRadius: 8, 
                px: { xs: isMobileSearchActive ? 2 : 1, md: 2 }, 
                py: 0.5, 
                border: '1px solid transparent', 
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                '&:hover': { borderColor: { md: '#cbd5e1' } },
                cursor: { xs: isMobileSearchActive ? 'default' : 'pointer', md: 'text' },
                zIndex: 10
              }}
            >
              <SearchIcon sx={{ color: '#94a3b8', mr: { xs: isMobileSearchActive ? 1 : 0, md: 1 }, fontSize: 20 }} />
              
              <InputBase 
                inputRef={searchInputRef}
                placeholder="Search tabs, books..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => {
                  // Delay closing the dropdown so click events can register
                  setTimeout(() => {
                    setShowDropdown(false);
                    if (!searchQuery) setIsMobileSearchActive(false);
                  }, 200);
                }}
                sx={{ 
                  flex: 1, 
                  fontSize: '0.9rem', 
                  color: '#0f172a',
                  width: { xs: isMobileSearchActive ? '100%' : '0px', md: '100%' },
                  opacity: { xs: isMobileSearchActive ? 1 : 0, md: 1 },
                  transition: 'width 0.3s ease, opacity 0.3s ease'
                }} 
              />
            </Paper>

            {/* --- SPOTLIGHT DROPDOWN RESULTS --- */}
            {showDropdown && searchQuery && (
              <Paper 
                elevation={4}
                sx={{ 
                  position: 'absolute', top: '120%', 
                  width: { xs: '250px', md: '400px' }, 
                  maxHeight: 350, overflowY: 'auto',
                  borderRadius: 3, border: '1px solid #e2e8f0',
                  zIndex: 20, backgroundColor: '#fff'
                }}
              >
                {isSearching ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={24} sx={{ color: '#2563eb' }} />
                  </Box>
                ) : searchResults.length > 0 ? (
                  <List disablePadding>
                    {searchResults.map((result, index) => (
                      <Box key={index}>
                        <ListItem disablePadding>
                          <ListItemButton 
                            onClick={() => handleResultClick(result.path)}
                            sx={{ py: 1.5, '&:hover': { backgroundColor: '#f8fafc' } }}
                          >
                            <ListItemIcon sx={{ minWidth: 40, color: result.type === 'Tab' ? '#64748b' : '#2563eb' }}>
                              {result.icon}
                            </ListItemIcon>
                            <ListItemText 
                              primary={result.title} 
                              secondary={result.type}
                              primaryTypographyProps={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.9rem' }}
                              secondaryTypographyProps={{ fontSize: '0.75rem', color: '#94a3b8' }}
                            />
                          </ListItemButton>
                        </ListItem>
                        {index < searchResults.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      No results found for "{searchQuery}"
                    </Typography>
                  </Box>
                )}
              </Paper>
            )}
          </Box>

          {/* RIGHT BOX */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            <IconButton sx={{ color: '#64748b' }}>
              <Badge badgeContent={3} color="error"><NotificationsNone /></Badge>
            </IconButton>

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