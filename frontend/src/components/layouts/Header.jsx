import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Badge } from '../common/Badge';
import { Sun, Moon, LogOut, Search, ChevronDown, Settings } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const displayName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.email;
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'A';

  const goToProfile = () => {
    setProfileMenuOpen(false);
    navigate(ROUTES.PROFILE);
  };

  return (
    <header
      style={{
        height: '64px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
      }}
    >
      {/* Search Input */}
      <div className="flex items-center gap-2" style={{ position: 'relative', width: '320px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search campaigns, affiliates, reports..."
          className="form-input"
          style={{ paddingLeft: '36px', width: '100%', fontSize: '0.8125rem' }}
        />
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--neutral-100)',
            border: 'none',
            padding: '0.5rem',
            borderRadius: 'var(--radius-full)',
            cursor: 'pointer',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Toggle Dark/Light Mode"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Pill */}
        <div className="header-profile-menu">
          <button className="header-profile-trigger" type="button" onClick={() => setProfileMenuOpen((open) => !open)} aria-expanded={profileMenuOpen}>
            <span className="header-avatar">{user?.avatar_url ? <img src={user.avatar_url} alt="" /> : initials}</span>
            <span className="header-profile-name"><strong>{displayName}</strong><Badge status={user?.role_name}>{user?.role_name?.replace('_', ' ')}</Badge></span>
            <ChevronDown size={16} />
          </button>
          {profileMenuOpen && <div className="header-profile-dropdown">
            <div className="header-profile-summary"><strong>{displayName}</strong><span>{user?.email}</span></div>
            <button type="button" onClick={goToProfile}><Settings size={16} /> Edit profile</button>
            <button type="button" onClick={logout} className="header-logout"><LogOut size={16} /> Sign out</button>
          </div>}
        </div>
      </div>
    </header>
  );
};
