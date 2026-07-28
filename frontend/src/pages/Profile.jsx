import React, { useState } from 'react';
import { Camera, UserRound } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { updateProfile } from '../services/profileService';

export const Profile = () => {
  const { user, setUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    company: user?.company || '',
    phone: user?.phone || '',
    avatarUrl: user?.avatar_url || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const change = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('Please choose an image file.');
      return;
    }
    if (file.size > 750000) {
      showError('Please choose an image smaller than 750 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFormData((current) => ({ ...current, avatarUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      showError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        company: formData.company,
        phone: formData.phone,
        avatarUrl: formData.avatarUrl,
        currentPassword: formData.currentPassword || undefined,
        newPassword: formData.newPassword || undefined,
      });
      setUser(updatedUser);
      setFormData((current) => ({ ...current, currentPassword: '', newPassword: '', confirmPassword: '' }));
      showSuccess('Your profile has been updated.');
    } catch (error) {
      showError(error.message || 'Unable to update your profile.');
    } finally {
      setLoading(false);
    }
  };

  const initials = `${formData.firstName?.[0] || ''}${formData.lastName?.[0] || ''}`.toUpperCase() || 'A';

  return (
    <div className="profile-page">
      <div className="profile-page-heading">
        <div><h1>My profile</h1><p>Update your photo, personal details, email address, and password.</p></div>
      </div>
      <form onSubmit={handleSubmit}>
        <Card className="profile-card">
          <h2>Profile photo</h2>
          <div className="profile-photo-row">
            <div className="profile-photo-preview">
              {formData.avatarUrl ? <img src={formData.avatarUrl} alt="Your profile" /> : <span>{initials}</span>}
            </div>
            <div><label className="profile-upload-button"><Camera size={16} /> Upload photo<input type="file" accept="image/*" onChange={handleImageSelect} /></label><p>PNG, JPG, or WebP up to 750 KB.</p></div>
          </div>
          <Input label="Or use an image URL" name="avatarUrl" placeholder="https://example.com/my-photo.jpg" value={formData.avatarUrl} onChange={change} />
        </Card>

        <Card className="profile-card">
          <h2>Personal details</h2>
          <div className="profile-two-columns">
            <Input label="First name" name="firstName" value={formData.firstName} onChange={change} required />
            <Input label="Last name" name="lastName" value={formData.lastName} onChange={change} required />
          </div>
          <Input label="Email address" type="email" name="email" value={formData.email} onChange={change} required />
          <div className="profile-two-columns">
            <Input label="Company or brand name" name="company" value={formData.company} onChange={change} />
            <Input label="Phone number" name="phone" value={formData.phone} onChange={change} />
          </div>
        </Card>

        <Card className="profile-card">
          <h2>Change password</h2>
          <p className="profile-card-note">Leave these fields blank if you do not want to change your password.</p>
          <Input label="Current password" type="password" name="currentPassword" value={formData.currentPassword} onChange={change} autoComplete="current-password" />
          <div className="profile-two-columns">
            <Input label="New password" type="password" name="newPassword" placeholder="At least 8 characters" minLength="8" value={formData.newPassword} onChange={change} autoComplete="new-password" />
            <Input label="Confirm new password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={change} autoComplete="new-password" />
          </div>
        </Card>
        <div className="profile-save-row"><Button type="submit" loading={loading}><UserRound size={16} /> Save changes</Button></div>
      </form>
    </div>
  );
};
