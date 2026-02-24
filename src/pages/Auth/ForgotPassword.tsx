import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, TextField, Typography, CircularProgress, Dialog, DialogContent, IconButton
} from '@mui/material';
import { ArrowBack, CheckCircleOutline, ErrorOutline } from '@mui/icons-material';

import logo from '../../assets/genra-logo.png'; 

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);

  // Inline Validation States para sa Step 3
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  // Sweet Alert Modal Config
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: "success" as "success" | "error",
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showAlert = (type: "success" | "error", title: string, message: string, onConfirm = () => {}) => {
    setModalConfig({ type, title, message, onConfirm });
    setModalVisible(true);
  };

  const handleModalConfirm = () => {
    setModalVisible(false);
    if (modalConfig.onConfirm) modalConfig.onConfirm();
  };

  // --- STEP 1: SEND CODE ---
  const handleSendCode = async () => {
    if (!email) return showAlert("error", "Notice", "Please enter your email address.");
    
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

    if (error) {
      showAlert("error", "Error", error.message);
    } else {
      showAlert("success", "Code Sent", "Check your email for the 6-digit recovery code.", () => setStep(2));
    }
    setLoading(false);
  };

  // --- STEP 2: VERIFY CODE ---
  const handleVerifyCode = async () => {
    if (!token || token.length < 6) return showAlert("error", "Notice", "Please enter the valid 6-digit code.");

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'recovery',
    });

    if (error) {
      showAlert("error", "Invalid Code", "The code you entered is incorrect or expired.");
    } else {
      showAlert("success", "Verified", "Code verified! You can now change your password.", () => setStep(3));
    }
    setLoading(false);
  };

  // --- STEP 3: UPDATE PASSWORD ---
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
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError(error.message);
    } else {
      await supabase.auth.signOut();
      showAlert("success", "Success", "Password changed successfully! Please login.", () => navigate('/login'));
    }
    setLoading(false);
  };

  // Handle Back Button
  const handleBack = () => {
    if (step === 1) navigate('/login');
    if (step === 2) setStep(1);
    if (step === 3) navigate('/login');
  };

  return (
    <Box sx={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      display: 'flex', flexDirection: { xs: 'column', md: 'row' }, backgroundColor: '#fff' 
    }}>
      
      {/* LEFT SIDE: FORM */}
      <Box sx={{ 
        width: { xs: '100%', md: '45%', lg: '40%' }, height: '100%', display: 'flex', 
        flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        px: { xs: 4, sm: 8 }, boxShadow: { md: '10px 0 30px rgba(0,0,0,0.03)' },
        zIndex: 10, backgroundColor: '#fff', position: 'relative'
      }}>
        
        {/* Back Button */}
        <IconButton onClick={handleBack} sx={{ position: 'absolute', top: 40, left: 40, color: '#334155' }}>
          <ArrowBack />
        </IconButton>

        <Box sx={{ width: '100%', maxWidth: 380 }}>
          
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 4 }}>
            <img src={logo} alt="GenrA Logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
          </Box>

          <Typography component="h1" variant="h4" sx={{ fontWeight: '900', color: '#0f172a', mb: 1, letterSpacing: '-0.02em' }}>
            {step === 1 && "Reset Password"}
            {step === 2 && "Enter Code"}
            {step === 3 && "New Password"}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 5, fontSize: '0.95rem' }}>
            {step === 1 && "Enter your email to receive a reset code."}
            {step === 2 && `Enter the 6-digit code sent to ${email}`}
            {step === 3 && "Create a secure new password for your account."}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            
            {/* STEP 1 */}
            {step === 1 && (
              <>
                <TextField
                  label="Email Address" variant="outlined" fullWidth value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button onClick={handleSendCode} variant="contained" size="large" disabled={loading} disableElevation
                  sx={{ py: 1.5, borderRadius: 2, backgroundColor: '#2563eb', textTransform: 'none', fontSize: '1rem', fontWeight: 'bold' }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Code'}
                </Button>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <TextField
                  label="6-Digit Code" variant="outlined" fullWidth value={token}
                  onChange={(e) => setToken(e.target.value)} inputProps={{ maxLength: 6 }}
                />
                <Button onClick={handleVerifyCode} variant="contained" size="large" disabled={loading} disableElevation
                  sx={{ py: 1.5, borderRadius: 2, backgroundColor: '#2563eb', textTransform: 'none', fontSize: '1rem', fontWeight: 'bold' }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify Code'}
                </Button>
              </>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <>
                <Box>
                  <TextField
                    label="New Password" type="password" variant="outlined" fullWidth value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }} error={!!passwordError}
                  />
                  {passwordError && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1, display: 'block' }}>{passwordError}</Typography>}
                </Box>
                
                <Box>
                  <TextField
                    label="Confirm New Password" type="password" variant="outlined" fullWidth value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setConfirmError(""); }} error={!!confirmError}
                  />
                  {confirmError && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1, display: 'block' }}>{confirmError}</Typography>}
                </Box>

                <Button onClick={handleUpdatePassword} variant="contained" size="large" disabled={loading} disableElevation
                  sx={{ mt: 1, py: 1.5, borderRadius: 2, backgroundColor: '#2563eb', textTransform: 'none', fontSize: '1rem', fontWeight: 'bold' }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Password'}
                </Button>
              </>
            )}

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

      {/* --- CUSTOM SWEET ALERT MODAL --- */}
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