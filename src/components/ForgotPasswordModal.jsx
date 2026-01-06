import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography, CircularProgress, Alert } from '@mui/material';
import { FaEnvelope, FaLock, FaKey } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';

const ForgotPasswordModal = ({ open, onClose }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/forgot-password/send-otp`, {
        email: formData.email
      });

      if (response.data.status) {
        toast.success('OTP sent to your email successfully!');
        setStep(2);
      } else {
        setError(response.data.message || 'Failed to send OTP');
        toast.error(response.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to send OTP. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/forgot-password/reset-password`, {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword
      });

      if (response.data.status) {
        toast.success('Password reset successfully! You can now login with your new password.');
        handleClose();
      } else {
        setError(response.data.message || 'Failed to reset password');
        toast.error(response.data.message || 'Failed to reset password');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to reset password. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      email: '',
      otp: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError('');
    onClose();
  };

  const handleBackToEmail = () => {
    setStep(1);
    setFormData({
      ...formData,
      otp: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError('');
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 24
        }
      }}
    >
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <FaKey />
        <Typography variant="h6" component="span">
          {step === 1 ? 'Forgot Password' : 'Reset Password'}
        </Typography>
      </DialogTitle>

      <form onSubmit={step === 1 ? handleSendOTP : handleResetPassword}>
        <DialogContent dividers sx={{ py: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {step === 1 ? (
            // Step 1: Enter Email
            <Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Enter your registered email address. We'll send you an OTP to reset your password.
              </Typography>
              <TextField
                fullWidth
                type="email"
                name="email"
                label="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                autoFocus
                InputProps={{
                  startAdornment: <FaEnvelope style={{ marginRight: 8, color: '#666' }} />
                }}
              />
            </Box>
          ) : (
            // Step 2: Enter OTP and New Password
            <Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                An OTP has been sent to <strong>{formData.email}</strong>. Enter the OTP and your new password below.
              </Typography>
              
              <TextField
                fullWidth
                type="text"
                name="otp"
                label="OTP Code"
                value={formData.otp}
                onChange={handleChange}
                required
                autoFocus
                inputProps={{ maxLength: 6 }}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <FaKey style={{ marginRight: 8, color: '#666' }} />
                }}
                helperText="Enter the 6-digit OTP sent to your email"
              />

              <TextField
                fullWidth
                type="password"
                name="newPassword"
                label="New Password"
                value={formData.newPassword}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <FaLock style={{ marginRight: 8, color: '#666' }} />
                }}
                helperText="Minimum 6 characters"
              />

              <TextField
                fullWidth
                type="password"
                name="confirmPassword"
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: <FaLock style={{ marginRight: 8, color: '#666' }} />
                }}
              />

              <Button
                size="small"
                onClick={handleBackToEmail}
                sx={{ mt: 2 }}
              >
                Change Email Address
              </Button>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Processing...' : (step === 1 ? 'Send OTP' : 'Reset Password')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ForgotPasswordModal;
