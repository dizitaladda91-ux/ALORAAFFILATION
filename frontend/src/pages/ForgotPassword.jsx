import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useNotification } from '../hooks/useNotification';
import { ROUTES } from '../constants/routes';
import api from '../services/api';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      showError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSubmitted(true);
      showSuccess('Password reset link sent to your official email inbox! 📩');
    } catch (err) {
      showError(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your Login Email ID or Official Email to receive recovery instructions">
      {!submitted ? (
        <form onSubmit={handleSubmit}>
          <Input
            label="Email Address (Login ID or Official Email)"
            type="email"
            placeholder="yourname@gmail.com or yourrealinbox@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '1rem' }}>
            Send Password Reset Link 🔑
          </Button>
        </form>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ marginBottom: '1.5rem', lineHeight: '1.5', color: '#10b981', fontWeight: 600 }}>
            We've sent password reset instructions to <strong>{email}</strong>. Please check your email inbox! 📩
          </p>
        </div>
      )}
      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
        <Link to={ROUTES.LOGIN} style={{ color: 'var(--primary)', fontWeight: 700 }}>
          Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
};
