import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, TextField, Typography, CircularProgress, Dialog, DialogContent, InputAdornment, IconButton, Link as MuiLink
} from '@mui/material';
import { ArrowBack, CheckCircleOutline, ErrorOutline, Visibility, VisibilityOff, InfoOutlined } from '@mui/icons-material';

import logo from '../../assets/genra-logo.png'; 

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);

  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: "success" as "success" | "error",
    title: "",
    message: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const showAlert = (type: "success" | "error", title: string, message: string, onConfirm = () => {}) => {
    setModalConfig({ type, title, message, onConfirm });
    setModalVisible(true);
  };

  const handleModalConfirm = () => {
    setModalVisible(false);
    if (modalConfig.onConfirm) modalConfig.onConfirm();
  };

  const handleSendCode = async (isResend = false) => {
    if (!email) return showAlert("error", "GenrA Security", "Please enter your registered author or admin email address.");
    
    setLoading(true);
    // SENIOR DEV NOTE: Ito ang magti-trigger ng 'Reset Password' template sa Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

    if (error) {
      showAlert("error", "Access Error", error.message);
    } else {
      setCountdown(60); 
      if (!isResend) {
        showAlert("success", "Code Dispatched", "Check your inbox. We've sent a 6-digit access code to verify your GenrA account.", () => setStep(2));
      } else {
        showAlert("success", "Code Resent", "A fresh 6-digit code is on its way to your email.");
      }
    }
    setLoading(false);
  };

  const handleVerifyCode = async () => {
    if (!token || token.length < 6) return showAlert("error", "Invalid Format", "Please enter the complete 6-digit verification code.");

    setLoading(true);
    // SENIOR DEV NOTE: Ginagamit nito ang OTP method na mas secure kaysa sa direct links lang
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'recovery',
    });

    if (error) {
      showAlert("error", "Access Denied", "The code you entered doesn't match our records or has expired.");
    } else {
      showAlert("success", "Identity Verified", "You may now forge a new password for your GenrA portal access.", () => setStep(3));
    }
    setLoading(false);
  };

  const handleUpdatePassword = async () => {
    setPasswordError("");
    setConfirmError("");
    let hasError = false;

    if (!newPassword || newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      hasError = true;
    } else if (!/\d/.test(newPassword)) {
      setPasswordError("Password must contain at least one number.");
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmError("Please confirm your new password.");
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmError("Passwords do not match.");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    // SENIOR DEV NOTE: Pagkatapos ma-verify ang OTP, pwede na i-update ang user password
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError(error.message);
    } else {
      await supabase.auth.signOut();
      showAlert("success", "Password Updated", "Your new credentials are securely saved. You can now log in and manage your e-books!", () => navigate('/login'));
    }
    setLoading(false);
  };

  const handleBack = () => {
    if (step === 1) navigate('/login');
    if (step === 2) setStep(1);
    if (step === 3) navigate('/login');
  };

  const hideBrowserPasswordEye = {
    '& input::-ms-reveal': { display: 'none' },
    '& input::-ms-clear': { display: 'none' },
    '& input::-webkit-credentials-auto-fill-button': { display: 'none' }
  };

  return (
    <Box sx={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      display: 'flex', flexDirection: { xs: 'column', md: 'row' }, backgroundColor: '#fff' 
    }}>
      
      {/* LEFT SIDE: FORM */}
      <Box sx={{ 
        width: { xs: '100%', md: '45%', lg: '40%' }, height: '100%', display: 'flex', 
        flexDirection: 'column', 
        px: { xs: 4, sm: 8 }, 
        pt: { xs: 12, md: 16 }, 
        boxShadow: { md: '10px 0 30px rgba(0,0,0,0.03)' },
        zIndex: 10, backgroundColor: '#fff', position: 'relative'
      }}>
        
        <Box sx={{ position: 'absolute', top: 20, left: { xs: 20, md: 40 }, zIndex: 50 }}>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={handleBack}
            sx={{ 
              color: '#64748b', textTransform: 'none', fontWeight: 600, fontSize: '0.95rem',
              '&:hover': { color: '#0f172a', backgroundColor: 'transparent' } 
            }}
          >
            {step === 2 ? 'Back' : 'Back to Login'}
          </Button>
        </Box>

        {/* Header Section */}
        <Box sx={{ width: '100%', maxWidth: 380, alignSelf: 'center', mb: 4 }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, mb: 4 }}>
            <img src={logo} alt="GenrA Logo" style={{ width: 60, height: 60, objectFit: 'contain' }} />
          </Box>

          <Typography component="h1" variant="h4" sx={{ fontWeight: '900', color: '#0f172a', mb: 1, letterSpacing: '-0.02em' }}>
            {step === 1 && "Reset Password"}
            {step === 2 && "Enter Code"}
            {step === 3 && "New Password"}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.95rem' }}>
            {step === 1 && "Enter your GenrA account email to receive a secure reset link."}
            {step === 2 && `Enter the 6-digit access code sent to ${email}`}
            {step === 3 && "Create a secure new password for your author/admin account."}
          </Typography>
        </Box>

        {/* FORM SECTION */}
        <Box sx={{ width: '100%', maxWidth: 380, alignSelf: 'center', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          
          {step === 1 && (
            <>
              <TextField
                label="Email Address" variant="outlined" fullWidth value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={() => handleSendCode(false)} variant="contained" size="large" disabled={loading} disableElevation
                sx={{ py: 1.5, borderRadius: 2, backgroundColor: '#2563eb', textTransform: 'none', fontSize: '1rem', fontWeight: 'bold' }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Code'}
              </Button>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1 }}>
                <InfoOutlined sx={{ fontSize: 16, color: '#64748b' }} />
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                  For your security, the recovery code is only valid for 15 minutes.
                </Typography>
              </Box>
            </>
          )}

          {step === 2 && (
            <>
              <TextField
                label="6-Digit Code" variant="outlined" fullWidth value={token}
                onChange={(e) => setToken(e.target.value)} inputProps={{ maxLength: 6 }}
                sx={{ letterSpacing: '0.2em' }}
              />

              <Button onClick={handleVerifyCode} variant="contained" size="large" disabled={loading} disableElevation
                sx={{ py: 1.5, borderRadius: 2, backgroundColor: '#2563eb', textTransform: 'none', fontSize: '1rem', fontWeight: 'bold' }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify Code'}
              </Button>

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Didn't receive it?{' '}
                  {countdown > 0 ? (
                    <span style={{ fontWeight: 'bold', color: '#94a3b8' }}>Resend in {countdown}s</span>
                  ) : (
                    <MuiLink 
                      component="button" type="button" underline="hover" 
                      sx={{ color: '#2563eb', fontWeight: 'bold' }}
                      onClick={() => handleSendCode(true)}
                      disabled={loading}
                    >
                      Resend Now
                    </MuiLink>
                  )}
                </Typography>
              </Box>
            </>
          )}

          {step === 3 && (
            <>
              <Box>
                <TextField
                  label="New Password" type={showPassword ? "text" : "password"} variant="outlined" fullWidth value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }} error={!!passwordError}
                  sx={hideBrowserPasswordEye}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" tabIndex={-1}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                {passwordError && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1, display: 'block' }}>{passwordError}</Typography>}
              </Box>
              
              <Box>
                <TextField
                  label="Confirm New Password" type={showConfirmPassword ? "text" : "password"} variant="outlined" fullWidth value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setConfirmError(""); }} error={!!confirmError}
                  sx={hideBrowserPasswordEye}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" tabIndex={-1}>
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                {confirmError && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1, display: 'block' }}>{confirmError}</Typography>}
              </Box>

              <Button onClick={handleUpdatePassword} variant="contained" size="large" disabled={loading} disableElevation
                sx={{ mt: 1, py: 1.5, borderRadius: 2, backgroundColor: '#2563eb', textTransform: 'none', fontSize: '1rem', fontWeight: 'bold' }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Save New Password'}
              </Button>
            </>
          )}

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

      {/* CUSTOM SWEET ALERT MODAL */}
      <Dialog open={modalVisible} onClose={handleModalConfirm} PaperProps={{ sx: { borderRadius: 4, p: 2, textAlign: 'center', minWidth: 320 } }}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {modalConfig.type === 'success' ? (
            <CheckCircleOutline sx={{ fontSize: 60, color: '#16a34a', mb: 2 }} />
          ) : (
            <ErrorOutline sx={{ fontSize: 60, color: '#dc2626', mb: 2 }} />
          )}
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: '#0f172a' }}>
            {modalConfig.title}
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
            {modalConfig.message}
          </Typography>
          <Button 
            onClick={handleModalConfirm} variant="contained" fullWidth disableElevation
            sx={{ py: 1.5, borderRadius: 2, backgroundColor: modalConfig.type === 'success' ? '#16a34a' : '#dc2626', textTransform: 'none', fontSize: '1rem', fontWeight: 'bold' }}
          >
            Okay
          </Button>
        </DialogContent>
      </Dialog>

    </Box>
  );
}