import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';

export const Profile = () => {
  const { user } = useAuth();
  const { showSuccess } = useNotification();

  const [firstName, setFirstName] = useState(user?.first_name || 'Alex');
  const [lastName, setLastName] = useState(user?.last_name || 'Promoter');
  const [company, setCompany] = useState(user?.company || 'Digital Media LLC');
  const [phone, setPhone] = useState(user?.phone || '+1 (555) 019-2834');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showSuccess('Profile information updated successfully!');
    }, 400);
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>My Account Profile</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Manage your contact information, company details, and preferences.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <Input
            label="Email Address"
            type="email"
            value={user?.email || 'affiliate@affiliate.com'}
            disabled
          />
          <Input
            label="Company / Brand Name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <Input
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="flex justify-end" style={{ marginTop: '1.5rem' }}>
            <Button type="submit" loading={loading}>
              Update Profile
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
