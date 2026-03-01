import { useState } from 'react';
import { Box, Typography, Button, Container, Dialog, 
  DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Android, Close, MenuBook, Explore, AutoAwesome } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/genra-logo.png'; 

export default function LandingPage() {
  const navigate = useNavigate();
  
  // States para sa Modals (Privacy & Terms)
  const [openPrivacy, setOpenPrivacy] = useState(false);
  const [openTerms, setOpenTerms] = useState(false);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      
      {/* --- NAVBAR --- */}
      <Box sx={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        px: { xs: 3, md: 8 }, py: 2, backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <img src={logo} alt="GenrA Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0f172a', letterSpacing: 1 }}>
            GenrA
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/login')}
          sx={{ borderRadius: 6, textTransform: 'none', fontWeight: 'bold', borderColor: '#cbd5e1', color: '#475569' }}
        >
          Author / Admin Login
        </Button>
      </Box>

      {/* --- HERO SECTION --- */}
      <Container maxWidth="lg" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', py: { xs: 8, md: 12 } }}>
        <Grid container spacing={6} alignItems="center">
          
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h2" sx={{ fontWeight: '900', color: '#0f172a', mb: 2, fontSize: { xs: '2.5rem', md: '3.5rem' }, lineHeight: 1.2 }}>
              Your Reading Journey <span className="text-blue-600">Starts Here.</span>
            </Typography>
            <Typography variant="h6" sx={{ color: '#64748b', mb: 4, fontWeight: 'normal', lineHeight: 1.6 }}>
              Discover personalized e-books, explore thousands of genres, and immerse yourself in stories crafted just for you. Download the GenrA mobile app today.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {/* DOWNLOAD APK BUTTON */}
              {/* TANDAAN: Ilagay ang GenrA.apk file sa loob ng 'public' folder ng web project mo */}
              <Button 
                component="a" 
                href="/GenrA.apk" 
                download="GenrA.apk"
                variant="contained" 
                size="large"
                startIcon={<Android />}
                sx={{ 
                  py: 1.5, px: 4, borderRadius: 8, backgroundColor: '#2563eb', 
                  textTransform: 'none', fontSize: '1.1rem', fontWeight: 'bold',
                  boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)',
                  '&:hover': { backgroundColor: '#1d4ed8' }
                }}
              >
                Download for Android
              </Button>
            </Box>  
          </Grid>

          {/* RIGHT SIDE GRAPHIC / LOGO SHOWCASE */}
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', justifyContent: 'center' }}>
             <Box sx={{ 
                width: { xs: 280, md: 400 }, height: { xs: 280, md: 400 }, 
                backgroundColor: '#fff', borderRadius: '50%', 
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.08)', position: 'relative'
             }}>
                {/* Decorative Elements */}
                <Box sx={{ position: 'absolute', top: -20, right: 20, p: 2, backgroundColor: '#dbeafe', borderRadius: '50%' }}><AutoAwesome sx={{ color: '#2563eb' }}/></Box>
                <Box sx={{ position: 'absolute', bottom: 20, left: -10, p: 2, backgroundColor: '#fef3c7', borderRadius: '50%' }}><MenuBook sx={{ color: '#d97706' }}/></Box>
                <Box sx={{ position: 'absolute', bottom: -10, right: 40, p: 2, backgroundColor: '#d1fae5', borderRadius: '50%' }}><Explore sx={{ color: '#059669' }}/></Box>
                
                <img src={logo} alt="GenrA App" style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
             </Box>
          </Grid>

        </Grid>
      </Container>

      {/* --- FOOTER --- */}
      <Box sx={{ backgroundColor: '#0f172a', py: 4, mt: 'auto' }}>
        <Container maxWidth="lg" sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            © {new Date().getFullYear()} GenrA. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
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
          {/* Pwede mo itong dagdagan bro ng totoong privacy policy niyo */}
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