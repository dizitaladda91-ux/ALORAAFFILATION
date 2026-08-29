import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import api from '../services/api';

export const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    officialEmail: '',
    company: '',
    password: '',
    role: 'affiliate',
  });
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const { register } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async () => {
    const targetEmail = (formData.officialEmail || formData.email || '').trim();
    if (!targetEmail || !/^\S+@\S+\.\S+$/.test(targetEmail)) {
      showError('Please enter a valid email address first.');
      return;
    }
    setOtpSending(true);
    try {
      await api.post(API_ENDPOINTS.AUTH.SEND_OTP, { email: targetEmail });
      setOtpSent(true);
      showSuccess(`6-Digit OTP Code sent to ${targetEmail}. Please check your inbox!`);
    } catch (err) {
      showError(err.message || 'Failed to send OTP code.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    const targetEmail = (formData.officialEmail || formData.email || '').trim();
    if (!otpCode || otpCode.trim().length !== 6) {
      showError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }
    setOtpVerifying(true);
    try {
      await api.post(API_ENDPOINTS.AUTH.VERIFY_OTP, { email: targetEmail, otp: otpCode.trim() });
      setOtpVerified(true);
      showSuccess('Official Email address verified successfully! ✅');
    } catch (err) {
      showError(err.message || 'Invalid OTP code. Please check your email or click Resend OTP.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== confirmPassword) {
      showError('Passwords do not match. Please try again.');
      return;
    }
    setLoading(true);
    try {
      const recruitmentCode = searchParams.get('ref');
      const user = await register({ ...formData, ...(recruitmentCode && { recruitmentCode }) });
      showSuccess('Account created successfully!');

      switch (user.role_name) {
        case ROLES.SUPER_ADMIN:
          navigate(ROUTES.SUPER_ADMIN_DASHBOARD);
          break;
        case ROLES.ADMIN:
          navigate(ROUTES.ADMIN_DASHBOARD);
          break;
        case ROLES.SUPER_AFFILIATE:
          navigate(ROUTES.SUPER_AFFILIATE_DASHBOARD);
          break;
        case ROLES.AFFILIATE:
        default:
          navigate(ROUTES.AFFILIATE_DASHBOARD);
          break;
      }
    } catch (err) {
      showError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Set up your partner profile in less than a minute." showAffiliateGuide>
      <form className="register-form" onSubmit={handleSubmit}>
        <div className="register-name-grid">
          <Input
            label="First name"
            name="firstName"
            placeholder="Enter your first name"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <Input
            label="Last name"
            name="lastName"
            placeholder="Enter your last name"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <Input
          label="Login Email ID"
          type="email"
          name="email"
          placeholder="yourname@gmail.com (Login ID)"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <div style={{ marginBottom: '1.25rem' }}>
          <Input
            label="Official Email for Payment Receipts & Notifications"
            type="email"
            name="officialEmail"
            placeholder="yourrealinbox@gmail.com (All payment receipts & reset links go here)"
            autoComplete="email"
            value={formData.officialEmail}
            onChange={handleChange}
            required
          />

          {!otpVerified ? (
            <div style={{ marginTop: '0.5rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {!otpSent ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={otpSending}
                  onClick={handleSendOtp}
                  style={{ width: '100%', background: '#4f46e5', color: '#ffffff', fontWeight: 600 }}
                >
                  📩 Send 6-Digit Email Verification OTP
                </Button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter 6-Digit OTP"
                      maxLength="6"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      style={{ letterSpacing: '4px', fontSize: '1rem', fontWeight: 700, textAlign: 'center' }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      loading={otpVerifying}
                      onClick={handleVerifyOtp}
                      style={{ background: '#10b981', color: '#ffffff', fontWeight: 600 }}
                    >
                      Verify OTP
                    </Button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                    <span>Didn't receive code?</span>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpSending}
                      style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Resend OTP 🔄
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginTop: '0.4rem', color: '#10b981', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Check size={16} /> Official Email Verified Successfully!
            </div>
          )}
        </div>

        <Input
          label="Company or brand name"
          name="company"
          placeholder="Optional - e.g. Acme Growth"
          onChange={handleChange}
        />

        <div className="form-group register-role-group">
          <div className="register-field-heading">
            <label className="form-label" htmlFor="account-role">How will you use Alora?</label>
            <span>Choose the option that fits you best</span>
          </div>
          <select
            id="account-role"
            name="role"
            className="form-select"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="affiliate">I'll promote offers and earn commissions</option>
            <option value="super_affiliate">I'll lead a team of affiliates</option>
          </select>
        </div>

        <div className="register-password-grid">
          <div className="form-group password-field">
            <label className="form-label" htmlFor="password">Create password</label>
            <div className="password-input-wrap">
              <input
                id="password"
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                minLength="8"
                required
              />
              <button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div className="form-group password-field">
            <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
            <div className="password-input-wrap">
              <input
                id="confirmPassword"
                className="form-input"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength="8"
                required
              />
              <button className="password-toggle" type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
        </div>

        <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '1rem' }}>
          Create Partner Account
        </Button>
      </form>
    </AuthLayout>
  );
};
