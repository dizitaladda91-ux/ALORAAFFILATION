import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Badge } from '../common/Badge';
import { Sun, Moon, LogOut, Search, User } from 'lucide-react';

export const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
        <div className="flex items-center gap-3" style={{ paddingLeft: '0.75rem', borderLeft: '1px solid var(--border-color)' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
            </div>
            <Badge status={user?.role_name}>{user?.role_name?.replace('_', ' ')}</Badge>
          </div>

          <button
            onClick={logout}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.75rem' }}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
