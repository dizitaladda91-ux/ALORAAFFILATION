import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { trackReferralClick } from '../services/referralService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const RedirectRef = () => {
  const { code } = useParams();
  const storefrontUrl = (import.meta.env.VITE_STOREFRONT_URL || 'https://aloraradiance.com').replace(/\/$/, '');

  useEffect(() => {
    const processClick = async () => {
      try {
        if (code) {
          localStorage.setItem('affiliate_ref_code', code);
          const result = await trackReferralClick(code);
          if (result.targetUrl && result.targetUrl.startsWith('http')) {
            window.location.href = result.targetUrl;
          } else {
            window.location.href = storefrontUrl;
          }
        } else {
          window.location.href = storefrontUrl;
        }
      } catch (err) {
        console.error('Failed to record click event', err);
        // Do not strand a potential customer on the affiliate portal if
        // click tracking is temporarily unavailable.
        window.location.href = storefrontUrl;
      }
    };
    processClick();
  }, [code, storefrontUrl]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner />
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Redirecting via referral partner...
      </p>
    </div>
  );
};
