import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';

export const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    password: '',
    role: 'affiliate',
  });
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(formData);
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
    <AuthLayout title="Get Started" subtitle="Join the Enterprise Affiliate SaaS Platform">
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Input
            label="First Name"
            name="firstName"
            placeholder="John"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <Input
            label="Last Name"
            name="lastName"
            placeholder="Doe"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
        <Input
          label="Email Address"
          type="email"
          name="email"
          placeholder="name@company.com"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <Input
          label="Company Name"
          name="company"
          placeholder="Acme Growth Inc"
          value={formData.company}
          onChange={handleChange}
        />
        <div className="form-group">
          <label className="form-label">Register As</label>
          <select
            name="role"
            className="form-select"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="affiliate">Standard Affiliate</option>
            <option value="super_affiliate">Super Affiliate (Team Manager)</option>
          </select>
        </div>
        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="At least 8 characters"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
          Create Account
        </Button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} style={{ color: 'var(--primary)', fontWeight: 700 }}>
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
};
