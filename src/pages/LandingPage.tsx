import { useState } from 'react';
import { Box, Typography, Button, Container, Dialog, 
  DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Android, Close, MenuBook, Explore, AutoAwesome, InfoOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/genra-logo.png'; 

export default function LandingPage() {
  const navigate = useNavigate();
  
  const [openPrivacy, setOpenPrivacy] = useState(false);
  const [openTerms, setOpenTerms] = useState(false);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      
      {/* --- NAVBAR --- */}
      <Box sx={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        px: { xs: 2, md: 8 }, py: 2, backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
          {/* SENIOR DEV FIX: Disabled image dragging */}
          <img 
            src={logo} 
            alt="GenrA Logo" 
            draggable="false" 
            style={{ width: 40, height: 40, objectFit: 'contain', userSelect: 'none' }} 
          />
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0f172a', letterSpacing: 1 }}>
            GenrA
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/login')}
          sx={{ 
            borderRadius: 6, textTransform: 'none', fontWeight: 'bold', 
            borderColor: '#cbd5e1', color: '#475569',
            fontSize: { xs: '0.8rem', md: '0.875rem' }, // Scaled down slightly for mobile
            px: { xs: 2, md: 3 }
          }}
        >
          Author / Admin Login
        </Button>
      </Box>

      {/* --- HERO SECTION --- */}
      <Container maxWidth="lg" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', py: { xs: 6, md: 12 } }}>
        <Grid container spacing={{ xs: 6, md: 6 }} alignItems="center" direction={{ xs: 'column-reverse', md: 'row' }}>
          
          {/* SENIOR DEV FIX: Centered text on mobile (xs), Left aligned on desktop (md) */}
          <Grid size={{ xs: 12, md: 5 }} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Typography variant="h2" sx={{ fontWeight: '900', color: '#0f172a', mb: 2, fontSize: { xs: '2.2rem', sm: '3rem', md: '3.5rem' }, lineHeight: 1.2 }}>
              Your Reading Journey <Box component="span" sx={{ color: '#2563eb', display: 'block' }}>Starts Here.</Box>
            </Typography>
            <Typography variant="h6" sx={{ color: '#64748b', mb: 4, fontWeight: 'normal', lineHeight: 1.6, fontSize: { xs: '1rem', md: '1.25rem' }, px: { xs: 2, md: 0 } }}>
              Discover personalized e-books, explore thousands of genres, and immerse yourself in stories crafted just for you. Download the GenrA mobile app today.
            </Typography>
            
            {/* SENIOR DEV FIX: Centered buttons on mobile, Left on desktop */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: { xs: 'center', md: 'flex-start' } }}>
              
              <Button 
                component="a" 
                href="/GenrA.apk" 
                download="GenrA.apk"
                variant="contained" 
                draggable="false" 
                size="large"
                startIcon={<Android />}
                sx={{ 
                  py: 1.5, px: 4, borderRadius: 8, backgroundColor: '#2563eb', 
                  textTransform: 'none', fontSize: '1.1rem', fontWeight: 'bold',
                  boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)',
                  '&:hover': { backgroundColor: '#1d4ed8' },
                  width: { xs: '100%', sm: 'auto' }, // Full width on tiny screens
                  maxWidth: '300px'
                }}
              >
                Download for Android
              </Button>

              <Box sx={{ 
                backgroundColor: '#f1f5f9', 
                border: '1px solid #e2e8f0', 
                borderRadius: 3, 
                p: 3, 
                mt: 1,
                textAlign: 'left', // Keep the note text left-aligned even on mobile for readability
                width: '100%'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <InfoOutlined sx={{ color: '#475569', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#334155' }}>
                    How to install this build on Android
                  </Typography>
                </Box>
                
                <Typography variant="body2" sx={{ color: '#475569', mb: 1.5, lineHeight: 1.6 }}>
                  • On devices running <strong>Android 8.0 (API level 26) and higher</strong>, you must navigate to the <em>Install unknown apps</em> system settings screen to enable app installations from a particular location (i.e. the web browser you are downloading the app from).
                </Typography>
                
                <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
                  • On devices running <strong>Android 7.1.1 (API level 25) and lower</strong>, you should enable the <em>Unknown sources</em> system setting, found in <strong>Settings &gt; Security</strong> on your device.
                </Typography>
              </Box>

            </Box>  
          </Grid>

          {/* RIGHT SIDE GRAPHIC / LOGO SHOWCASE */}
          <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
             {/* SENIOR DEV FIX: Smoother scaling for the circle container */}
             <Box sx={{ 
                width: { xs: 260, sm: 350, md: 450 }, height: { xs: 260, sm: 350, md: 450 }, 
                backgroundColor: '#fff', borderRadius: '50%', 
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.08)', position: 'relative'
             }}>
                <Box sx={{ position: 'absolute', top: -10, right: { xs: 10, md: 30 }, p: { xs: 1.5, md: 2 }, backgroundColor: '#dbeafe', borderRadius: '50%' }}><AutoAwesome sx={{ color: '#2563eb', fontSize: { xs: 20, md: 24 } }}/></Box>
                <Box sx={{ position: 'absolute', bottom: 30, left: { xs: -10, md: -20 }, p: { xs: 1.5, md: 2 }, backgroundColor: '#fef3c7', borderRadius: '50%' }}><MenuBook sx={{ color: '#d97706', fontSize: { xs: 20, md: 24 } }}/></Box>
                <Box sx={{ position: 'absolute', bottom: -10, right: { xs: 20, md: 60 }, p: { xs: 1.5, md: 2 }, backgroundColor: '#d1fae5', borderRadius: '50%' }}><Explore sx={{ color: '#059669', fontSize: { xs: 20, md: 24 } }}/></Box>
                
                {/* SENIOR DEV FIX: Disabled image dragging & highlighting */}
                <img 
                  src={logo} 
                  alt="GenrA App" 
                  draggable="false" 
                  style={{ width: '60%', height: '60%', objectFit: 'contain', userSelect: 'none' }} 
                />
             </Box>
          </Grid>

        </Grid>
      </Container>

      {/* --- FOOTER --- */}
      <Box sx={{ backgroundColor: '#0f172a', py: 4, mt: 'auto' }}>
        <Container maxWidth="lg" sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center' }}>
            © {new Date().getFullYear()} GenrA. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: { xs: 2, md: 3 }, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button variant="text" onClick={() => setOpenPrivacy(true)} sx={{ color: '#cbd5e1', textTransform: 'none', minWidth: 0, p: 0 }}>
              Privacy Policy
            </Button>
            <Button variant="text" onClick={() => setOpenTerms(true)} sx={{ color: '#cbd5e1', textTransform: 'none', minWidth: 0, p: 0 }}>
              Terms of Service
            </Button>
          </Box>
        </Container>
      </Box>

      {/* --- PRIVACY POLICY MODAL --- */}
      <Dialog open={openPrivacy} onClose={() => setOpenPrivacy(false)} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
          Data Privacy Policy
          <IconButton onClick={() => setOpenPrivacy(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ color: '#475569', lineHeight: 1.7 }}>
          <Typography variant="h6" gutterBottom color="textPrimary">1. Information Collection</Typography>
          <Typography paragraph>We collect personal information such as your email address and preferred reading genres when you register an account. We do not share your reading history with third parties without your consent.</Typography>
          
          <Typography variant="h6" gutterBottom color="textPrimary">2. Data Security</Typography>
          <Typography paragraph>Your account passwords and sensitive data are securely encrypted using industry-standard protocols. We utilize Supabase for our backend infrastructure to ensure data integrity and security.</Typography>

          <Typography variant="h6" gutterBottom color="textPrimary">3. User Rights</Typography>
          <Typography paragraph>You have the right to access, modify, or delete your personal data at any time through the GenrA mobile application settings.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPrivacy(false)} variant="contained" sx={{ textTransform: 'none' }}>I Understand</Button>
        </DialogActions>
      </Dialog>

      {/* --- TERMS OF SERVICE MODAL --- */}
      <Dialog open={openTerms} onClose={() => setOpenTerms(false)} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
          Terms of Service
          <IconButton onClick={() => setOpenTerms(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ color: '#475569', lineHeight: 1.7 }}>
          <Typography variant="h6" gutterBottom color="textPrimary">1. Acceptance of Terms</Typography>
          <Typography paragraph>By downloading and using the GenrA mobile application, you agree to comply with and be bound by these Terms of Service.</Typography>
          
          <Typography variant="h6" gutterBottom color="textPrimary">2. Content Guidelines</Typography>
          <Typography paragraph>Authors are responsible for the content they upload. Plagiarism, hate speech, and explicit content without proper warnings are strictly prohibited and may result in account termination.</Typography>

          <Typography variant="h6" gutterBottom color="textPrimary">3. Service Availability</Typography>
          <Typography paragraph>We strive to maintain high uptime for GenrA, but we do not guarantee uninterrupted access to the service. We reserve the right to perform maintenance as needed.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTerms(false)} variant="contained" sx={{ textTransform: 'none' }}>Accept</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
