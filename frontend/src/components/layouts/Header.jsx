import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Badge } from '../common/Badge';
import {
  Sun,
  Moon,
  LogOut,
  Search,
  ChevronDown,
  Settings,
  Bell,
  User,
  Shield,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';

export const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const role = user?.role_name || ROLES.AFFILIATE;
  const displayName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.email || 'User';
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'A';

  // Role portal header subtitle
  const getPortalTag = () => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return { text: 'Super Admin Portal', icon: Shield, badgeClass: 'badge-superadmin' };
      case ROLES.ADMIN:
        return { text: 'Admin Operations', icon: Shield, badgeClass: 'badge-admin' };
      case ROLES.SUPER_AFFILIATE:
        return { text: 'Super Affiliate Dashboard', icon: Sparkles, badgeClass: 'badge-superaffiliate' };
      case ROLES.AFFILIATE:
      default:
        return { text: 'Affiliate Portal', icon: Sparkles, badgeClass: 'badge-affiliate' };
    }
  };

  const portalTag = getPortalTag();
  const TagIcon = portalTag.icon;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goToProfile = () => {
    setProfileMenuOpen(false);
    navigate(ROUTES.PROFILE);
  };

  const goToSettings = () => {
    setProfileMenuOpen(false);
    if (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN) {
      navigate(ROUTES.SYSTEM_SETTINGS);
    } else {
      navigate(ROUTES.PROFILE);
    }
  };

  return (
    <header className="premium-header">
      {/* Search & Portal Indicator */}
      <div className="header-left">
        <div className="header-portal-indicator">
          <TagIcon size={16} className="portal-tag-icon" />
          <span className="portal-tag-text">{portalTag.text}</span>
        </div>

        <div className="header-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search campaigns, affiliates, reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="header-search-input"
          />
          <span className="search-kbd-badge">⌘K</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="header-right">
        {/* Notifications Bell */}
        <button className="header-action-btn" title="Notifications">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        {/* Theme Switcher */}
        <button onClick={toggleTheme} className="header-action-btn theme-toggle-btn" title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} className="theme-icon-sun" /> : <Moon size={18} className="theme-icon-moon" />}
        </button>

        {/* User Profile Pill */}
        <div className="header-profile-wrapper" ref={dropdownRef}>
          <button
            className="header-profile-trigger"
            type="button"
            onClick={() => setProfileMenuOpen((open) => !open)}
            aria-expanded={profileMenuOpen}
          >
            <div className="header-avatar-ring">
              {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : initials}
            </div>
            <div className="header-user-meta">
              <span className="header-user-name">{displayName}</span>
              <Badge status={user?.role_name}>{user?.role_name?.replace('_', ' ')}</Badge>
            </div>
            <ChevronDown size={15} className={`header-chevron ${profileMenuOpen ? 'chevron-rotated' : ''}`} />
          </button>

          {/* Profile Dropdown Menu */}
          {profileMenuOpen && (
            <div className="header-profile-dropdown">
              <div className="dropdown-user-header">
                <div className="dropdown-avatar">{initials}</div>
                <div>
                  <strong className="dropdown-user-title">{displayName}</strong>
                  <span className="dropdown-user-email">{user?.email}</span>
                </div>
              </div>

              <div className="dropdown-divider" />

              <button type="button" onClick={goToProfile} className="dropdown-item">
                <User size={16} /> Edit Profile
              </button>

              {(role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN) && (
                <button type="button" onClick={goToSettings} className="dropdown-item">
                  <Settings size={16} /> System Settings
                </button>
              )}

              <a
                href="https://aloraradiance.com/support"
                target="_blank"
                rel="noreferrer"
                className="dropdown-item"
                onClick={() => setProfileMenuOpen(false)}
              >
                <HelpCircle size={16} /> Help & Support
              </a>

              <div className="dropdown-divider" />

              <button type="button" onClick={logout} className="dropdown-item dropdown-logout">
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
