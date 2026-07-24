-- =========================================================
-- Seed Data for Enterprise Affiliate Management System
-- Standard bcrypt hash for password 'password123':
-- $2a$10$w/x/R5eGZ9K5D6x8o7N4e.8Y9U1o2P3Q4R5S6T7U8V9W0X1Y2Z3a4
-- =========================================================

-- Seed Roles
INSERT INTO roles (id, name, description) VALUES
('11111111-1111-4111-a111-111111111111', 'super_admin', 'Full system access and administrative management'),
('22222222-2222-4222-a222-222222222222', 'admin', 'Manages affiliates, approvals, and commission rules'),
('33333333-3333-4333-a333-333333333333', 'super_affiliate', 'Team leader managing multi-level sub-affiliates'),
('44444444-4444-4444-a444-444444444444', 'affiliate', 'Standard referral affiliate')
ON CONFLICT (name) DO NOTHING;

-- Seed Default Commission Rules
INSERT INTO commission_rules (id, name, type, value, is_active) VALUES
('a1111111-1111-4111-a111-111111111111', 'Default Standard Commission Rate', 'percentage', 15.00, true),
('a2222222-2222-4222-a222-222222222222', 'Super Affiliate VIP Bonus Rate', 'percentage', 25.00, true)
ON CONFLICT (id) DO NOTHING;

-- Seed System Settings
INSERT INTO system_settings (key, value, description) VALUES
('general_settings', '{"site_name": "Antigravity Affiliate SaaS", "support_email": "support@affiliatesaas.com", "currency": "USD"}', 'Global system configuration'),
('commission_settings', '{"default_rate": 15.0, "auto_approve_threshold": 100.0, "payout_schedule": "monthly"}', 'Global commission defaults')
ON CONFLICT (key) DO NOTHING;

-- Seed Demo Users (Password: password123)
-- Super Admin
INSERT INTO users (id, email, password_hash, role_id, status, is_email_verified) VALUES
('b1111111-1111-4111-a111-111111111111', 'superadmin@affiliate.com', '$2a$10$w/x/R5eGZ9K5D6x8o7N4e.8Y9U1o2P3Q4R5S6T7U8V9W0X1Y2Z3a4', '11111111-1111-4111-a111-111111111111', 'active', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (user_id, first_name, last_name, company) VALUES
('b1111111-1111-4111-a111-111111111111', 'Super', 'Admin', 'Enterprise HQ')
ON CONFLICT (user_id) DO NOTHING;

-- Admin
INSERT INTO users (id, email, password_hash, role_id, status, is_email_verified) VALUES
('b2222222-2222-4222-a222-222222222222', 'admin@affiliate.com', '$2a$10$w/x/R5eGZ9K5D6x8o7N4e.8Y9U1o2P3Q4R5S6T7U8V9W0X1Y2Z3a4', '22222222-2222-4222-a222-222222222222', 'active', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (user_id, first_name, last_name, company) VALUES
('b2222222-2222-4222-a222-222222222222', 'Operations', 'Admin', 'Enterprise Ops')
ON CONFLICT (user_id) DO NOTHING;

-- Super Affiliate
INSERT INTO users (id, email, password_hash, role_id, status, is_email_verified) VALUES
('b3333333-3333-4333-a333-333333333333', 'superaffiliate@affiliate.com', '$2a$10$w/x/R5eGZ9K5D6x8o7N4e.8Y9U1o2P3Q4R5S6T7U8V9W0X1Y2Z3a4', '33333333-3333-4333-a333-333333333333', 'active', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (user_id, first_name, last_name, company) VALUES
('b3333333-3333-4333-a333-333333333333', 'Sarah', 'LeadPartner', 'Growth Labs Inc')
ON CONFLICT (user_id) DO NOTHING;

-- Affiliate
INSERT INTO users (id, email, password_hash, role_id, status, is_email_verified) VALUES
('b4444444-4444-4444-a444-444444444444', 'affiliate@affiliate.com', '$2a$10$w/x/R5eGZ9K5D6x8o7N4e.8Y9U1o2P3Q4R5S6T7U8V9W0X1Y2Z3a4', '44444444-4444-4444-a444-444444444444', 'active', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (user_id, first_name, last_name, company) VALUES
('b4444444-4444-4444-a444-444444444444', 'Alex', 'Promoter', 'Digital Media LLC')
ON CONFLICT (user_id) DO NOTHING;

-- Seed Sample Affiliate Link
INSERT INTO affiliate_links (id, user_id, referral_code, target_url, title, click_count) VALUES
('c1111111-1111-4111-a111-111111111111', 'b4444444-4444-4444-a444-444444444444', 'AFF-HJ72KS', 'https://yourdomain.com/landing', 'Primary Growth Campaign', 42)
ON CONFLICT (referral_code) DO NOTHING;
