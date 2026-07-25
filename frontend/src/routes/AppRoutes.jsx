import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';

import { Login } from '../pages/Login';
import { Landing } from '../pages/Landing';
import { Register } from '../pages/Register';
import { ForgotPassword } from '../pages/ForgotPassword';
import { RedirectRef } from '../pages/RedirectRef';
import { Unauthorized } from '../pages/Unauthorized';
import { NotFound } from '../pages/NotFound';

import { SuperAdminDashboard } from '../pages/SuperAdminDashboard';
import { AdminDashboard } from '../pages/AdminDashboard';
import { SuperAffiliateDashboard } from '../pages/SuperAffiliateDashboard';
import { AffiliateDashboard } from '../pages/AffiliateDashboard';

import { UserManagement } from '../pages/UserManagement';
import { CommissionRules } from '../pages/CommissionRules';
import { ReferralLinks } from '../pages/ReferralLinks';
import { Earnings } from '../pages/Earnings';
import { TeamManagement } from '../pages/TeamManagement';
import { AuditLogs } from '../pages/AuditLogs';
import { SystemSettings } from '../pages/SystemSettings';
import { Profile } from '../pages/Profile';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
      <Route path={ROUTES.REF_REDIRECT} element={<RedirectRef />} />
      <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />

      {/* Super Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
        <Route path={ROUTES.SUPER_ADMIN_DASHBOARD} element={<SuperAdminDashboard />} />
        <Route path={ROUTES.SYSTEM_SETTINGS} element={<SystemSettings />} />
      </Route>

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]} />}>
        <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
        <Route path={ROUTES.USER_MANAGEMENT} element={<UserManagement />} />
        <Route path={ROUTES.COMMISSION_RULES} element={<CommissionRules />} />
        <Route path={ROUTES.AUDIT_LOGS} element={<AuditLogs />} />
      </Route>

      {/* Super Affiliate Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_AFFILIATE]} />}>
        <Route path={ROUTES.SUPER_AFFILIATE_DASHBOARD} element={<SuperAffiliateDashboard />} />
        <Route path={ROUTES.TEAM_TRACKING} element={<TeamManagement />} />
      </Route>

      {/* Shared Affiliate Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUPER_AFFILIATE, ROLES.AFFILIATE]} />}>
        <Route path={ROUTES.AFFILIATE_DASHBOARD} element={<AffiliateDashboard />} />
        <Route path={ROUTES.REFERRAL_LINKS} element={<ReferralLinks />} />
        <Route path={ROUTES.EARNINGS} element={<Earnings />} />
        <Route path={ROUTES.PROFILE} element={<Profile />} />
      </Route>

      <Route path={ROUTES.HOME} element={<Landing />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
