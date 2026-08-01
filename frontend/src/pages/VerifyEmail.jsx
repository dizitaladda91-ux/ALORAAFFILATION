import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { ROUTES } from '../constants/routes';

export const VerifyEmail = () => {
  const { token } = useParams();
  const [state, setState] = useState('verifying');
  const [message, setMessage] = useState('Verifying your email address…');

  useEffect(() => {
    api.post('/auth/verify-email', { token })
      .then(() => { setState('success'); setMessage('Your email has been verified. You can now sign in.'); })
      .catch((error) => { setState('error'); setMessage(error?.message || 'This verification link is invalid or has expired.'); });
  }, [token]);

  return <AuthLayout title="Email verification">
    <p style={{ color: state === 'error' ? 'var(--danger)' : 'var(--text-muted)' }}>{message}</p>
    {state !== 'verifying' && <Link to={ROUTES.LOGIN} style={{ color: 'var(--primary)', fontWeight: 700 }}>Go to Sign In</Link>}
  </AuthLayout>;
};
