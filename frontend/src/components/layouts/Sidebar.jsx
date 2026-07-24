import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Percent,
  Link,
  DollarSign,
  TrendingUp,
  FileText,
  Settings,
  User,
  ShieldAlert,
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role_name;

  const getNavItems = () => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return [
          { label: 'Dashboard', path: ROUTES.SUPER_ADMIN_DASHBOARD, icon: LayoutDashboard },
          { label: 'All Users', path: ROUTES.USER_MANAGEMENT, icon: Users },
          { label: 'Commission Rules', path: ROUTES.COMMISSION_RULES, icon: Percent },
          { label: 'Audit Logs', path: ROUTES.AUDIT_LOGS, icon: ShieldAlert },
          { label: 'System Settings', path: ROUTES.SYSTEM_SETTINGS, icon: Settings },
        ];
      case ROLES.ADMIN:
        return [
          { label: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
          { label: 'Affiliates', path: ROUTES.USER_MANAGEMENT, icon: Users },
          { label: 'Commission Rules', path: ROUTES.COMMISSION_RULES, icon: Percent },
          { label: 'Audit Logs', path: ROUTES.AUDIT_LOGS, icon: FileText },
        ];
      case ROLES.SUPER_AFFILIATE:
        return [
          { label: 'Dashboard', path: ROUTES.SUPER_AFFILIATE_DASHBOARD, icon: LayoutDashboard },
          { label: 'My Team', path: ROUTES.TEAM_TRACKING, icon: Users },
          { label: 'Referral Links', path: ROUTES.REFERRAL_LINKS, icon: Link },
          { label: 'Earnings', path: ROUTES.EARNINGS, icon: DollarSign },
        ];
      case ROLES.AFFILIATE:
      default:
        return [
          { label: 'Dashboard', path: ROUTES.AFFILIATE_DASHBOARD, icon: LayoutDashboard },
          { label: 'Referral Links', path: ROUTES.REFERRAL_LINKS, icon: Link },
          { label: 'Earnings & Payouts', path: ROUTES.EARNINGS, icon: DollarSign },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--bg-sidebar)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div className="flex items-center gap-3">
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.25rem' }}>
            A
          </div>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Affiliate Cloud
            </h1>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Enterprise SaaS
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '1rem 0.75rem', flex: 1 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.4)', padding: '0 0.75rem 0.5rem', textTransform: 'uppercase' }}>
          Main Menu
        </div>
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={idx}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3`
              }
              style={({ isActive }) => ({
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                marginBottom: '0.25rem',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              })}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Profile link */}
      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <NavLink
          to={ROUTES.PROFILE}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-sm)',
            color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            textDecoration: 'none',
            fontSize: '0.875rem',
          })}
        >
          <User size={18} />
          <span>My Profile</span>
        </NavLink>
      </div>
    </aside>
  );
};
