import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import {
  LayoutDashboard,
  Users,
  Percent,
  Link,
  DollarSign,
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
    <aside className="premium-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="flex items-center gap-3">
          <div className="sidebar-brand-mark">
            A
          </div>
          <div>
            <h1 className="sidebar-brand-title">
              Affiliate Cloud
            </h1>
            <span className="sidebar-brand-subtitle">
              Enterprise SaaS
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-navigation">
        <div className="sidebar-menu-label">
          Main Menu
        </div>
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={idx}
              to={item.path}
              className={({ isActive }) => `sidebar-nav-link ${isActive ? 'sidebar-nav-link-active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Profile link */}
      <div className="sidebar-footer">
        <NavLink
          to={ROUTES.PROFILE}
          className={({ isActive }) => `sidebar-profile-link ${isActive ? 'sidebar-profile-link-active' : ''}`}
        >
          <User size={18} />
          <span>My Profile</span>
        </NavLink>
      </div>
    </aside>
  );
};
