-- =========================================================
-- Random Test Data Generator for Affiliate SaaS Testing
-- Populates Realistic Analytics, Clicks, Conversions, Wallets,
-- Bank Accounts, Withdrawals, Payouts, and Activity Logs
-- =========================================================

-- 1. Create Additional Test Affiliate Users & Profiles
INSERT INTO users (id, email, password_hash, role_id, status, is_email_verified) VALUES
('d1111111-1111-4111-a111-111111111111', 'john.doe@example.com', '$2a$10$oVNlzNusWmZf0HejJSzcO.ED98S91N16F1BMqBlUwSyDzCZhzWZlO', '44444444-4444-4444-a444-444444444444', 'active', true),
('d2222222-2222-4222-a222-222222222222', 'jane.smith@example.com', '$2a$10$oVNlzNusWmZf0HejJSzcO.ED98S91N16F1BMqBlUwSyDzCZhzWZlO', '44444444-4444-4444-a444-444444444444', 'active', true),
('d3333333-3333-4333-a333-333333333333', 'rahul.sharma@example.com', '$2a$10$oVNlzNusWmZf0HejJSzcO.ED98S91N16F1BMqBlUwSyDzCZhzWZlO', '44444444-4444-4444-a444-444444444444', 'active', true),
('d4444444-4444-4444-a444-444444444444', 'priya.patel@example.com', '$2a$10$oVNlzNusWmZf0HejJSzcO.ED98S91N16F1BMqBlUwSyDzCZhzWZlO', '33333333-3333-4333-a333-333333333333', 'active', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (user_id, first_name, last_name, company, phone) VALUES
('d1111111-1111-4111-a111-111111111111', 'John', 'Doe', 'Doe Marketing LLC', '+15550192831'),
('d2222222-2222-4222-a222-222222222222', 'Jane', 'Smith', 'Smith Digital', '+15550192832'),
('d3333333-3333-4333-a333-333333333333', 'Rahul', 'Sharma', 'Sharma Media India', '+919876543210'),
('d4444444-4444-4444-a444-444444444444', 'Priya', 'Patel', 'Patel Global Affiliates', '+919876543211')
ON CONFLICT (user_id) DO NOTHING;

-- 2. Initialize Wallets for All Users
INSERT INTO wallets (user_id, available_balance, pending_balance, lifetime_earnings, total_withdrawn, status) VALUES
('b4444444-4444-4444-a444-444444444444', 1250.50, 320.00, 2450.50, 880.00, 'ACTIVE'),
('d1111111-1111-4111-a111-111111111111', 840.00, 150.00, 1440.00, 450.00, 'ACTIVE'),
('d2222222-2222-4222-a222-222222222222', 2150.75, 450.00, 4100.75, 1500.00, 'ACTIVE'),
('d3333333-3333-4333-a333-333333333333', 350.00, 90.00, 650.00, 210.00, 'ACTIVE'),
('d4444444-4444-4444-a444-444444444444', 3400.00, 800.00, 6700.00, 2500.00, 'ACTIVE')
ON CONFLICT (user_id) DO UPDATE SET 
  available_balance = EXCLUDED.available_balance,
  pending_balance = EXCLUDED.pending_balance,
  lifetime_earnings = EXCLUDED.lifetime_earnings,
  total_withdrawn = EXCLUDED.total_withdrawn;

-- 3. Seed Verified Bank Accounts
INSERT INTO affiliate_bank_accounts (id, user_id, account_holder_name, bank_name, account_number, ifsc_code, branch_name, upi_id, account_type, is_default, verification_status) VALUES
('e1111111-1111-4111-a111-111111111111', 'b4444444-4444-4444-a444-444444444444', 'Alex Promoter', 'HDFC Bank', '50100239481234', 'HDFC0001234', 'Connaught Place', 'alex@hdfcbank', 'BANK', true, 'VERIFIED'),
('e2222222-2222-4222-a222-222222222222', 'd1111111-1111-4111-a111-111111111111', 'John Doe', 'ICICI Bank', '000401582910', 'ICIC0000004', 'MG Road Branch', 'john@icici', 'BANK', true, 'VERIFIED'),
('e3333333-3333-4333-a333-333333333333', 'd2222222-2222-4222-a222-222222222222', 'Jane Smith', 'State Bank of India', '30918239481', 'SBIN0000300', 'Main Branch', 'jane@sbi', 'BANK', true, 'VERIFIED'),
('e4444444-4444-4444-a444-444444444444', 'd3333333-3333-4333-a333-333333333333', 'Rahul Sharma', 'Axis Bank', '9180200192837', 'UTIB0000123', 'Indiranagar', 'rahul@axisbank', 'UPI', true, 'VERIFIED')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Active Referral Links
INSERT INTO affiliate_links (id, user_id, referral_code, target_url, title, link_type, is_system_link, click_count) VALUES
('f1111111-1111-4111-a111-111111111111', 'b4444444-4444-4444-a444-444444444444', 'ALORA-SUMMER-25', 'https://aloraradiance.com/collections/summer', 'Summer Beauty Campaign', 'SHOPPING', false, 142),
('f2222222-2222-4222-a222-222222222222', 'd1111111-1111-4111-a111-111111111111', 'JD-GLOW-SERUM', 'https://aloraradiance.com/products/glow-serum', 'Glow Serum Promotion', 'SHOPPING', false, 89),
('f3333333-3333-4333-a333-333333333333', 'd2222222-2222-4222-a222-222222222222', 'JS-RECRUIT-PARTNER', 'https://affiliation.aloraradiance.com/register?ref=JS-RECRUIT-PARTNER', 'Affiliate Partner Recruitment', 'RECRUITMENT', false, 67),
('f4444444-4444-4444-a444-444444444444', 'd3333333-3333-4333-a333-333333333333', 'RAHUL-INDIA-FEST', 'https://aloraradiance.com/festival-sale', 'Festive Offer Campaign', 'SHOPPING', false, 210)
ON CONFLICT (referral_code) DO NOTHING;

-- 5. Seed Click Events
INSERT INTO click_events (affiliate_link_id, referral_code, ip_address, user_agent, country, link_type, created_at) VALUES
('c1111111-1111-4111-a111-111111111111', 'AFF-HJ72KS', '103.21.244.11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0', 'IN', 'SHOPPING', CURRENT_TIMESTAMP - INTERVAL '10 days'),
('f1111111-1111-4111-a111-111111111111', 'ALORA-SUMMER-25', '172.56.21.89', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/17.0', 'US', 'SHOPPING', CURRENT_TIMESTAMP - INTERVAL '8 days'),
('f2222222-2222-4222-a222-222222222222', 'JD-GLOW-SERUM', '86.12.90.4', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X)', 'GB', 'SHOPPING', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('f3333333-3333-4333-a333-333333333333', 'JS-RECRUIT-PARTNER', '49.37.192.12', 'Mozilla/5.0 (Linux; Android 14; Pixel 8)', 'IN', 'RECRUITMENT', CURRENT_TIMESTAMP - INTERVAL '3 days'),
('f4444444-4444-4444-a444-444444444444', 'RAHUL-INDIA-FEST', '152.57.12.99', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0', 'IN', 'SHOPPING', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- 6. Seed Referrals
INSERT INTO referrals (referrer_id, referral_code, status, created_at) VALUES
('b4444444-4444-4444-a444-444444444444', 'AFF-HJ72KS', 'converted', CURRENT_TIMESTAMP - INTERVAL '10 days'),
('d1111111-1111-4111-a111-111111111111', 'JD-GLOW-SERUM', 'converted', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('d2222222-2222-4222-a222-222222222222', 'JS-RECRUIT-PARTNER', 'converted', CURRENT_TIMESTAMP - INTERVAL '3 days'),
('d3333333-3333-4333-a333-333333333333', 'RAHUL-INDIA-FEST', 'pending', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- 7. Seed Conversion Events & Commissions
INSERT INTO conversion_events (id, affiliate_id, order_id, amount, gross_amount, discount_amount, eligible_amount, currency, status, created_at) VALUES
('11111111-9999-4111-a111-111111111111', 'b4444444-4444-4444-a444-444444444444', 'ORD-2026-901', 150.00, 165.00, 15.00, 150.00, 'INR', 'completed', CURRENT_TIMESTAMP - INTERVAL '10 days'),
('22222222-9999-4222-a222-222222222222', 'd1111111-1111-4111-a111-111111111111', 'ORD-2026-902', 280.00, 310.00, 30.00, 280.00, 'INR', 'completed', CURRENT_TIMESTAMP - INTERVAL '8 days'),
('33333333-9999-4333-a333-333333333333', 'd2222222-2222-4222-a222-222222222222', 'ORD-2026-903', 420.00, 460.00, 40.00, 420.00, 'INR', 'completed', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('44444444-9999-4444-a444-444444444444', 'd3333333-3333-4333-a333-333333333333', 'ORD-2026-904', 95.00, 105.00, 10.00, 95.00, 'INR', 'completed', CURRENT_TIMESTAMP - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO commissions (id, affiliate_id, conversion_id, amount, rate, status, created_at) VALUES
('77777777-1111-4111-a111-111111111111', 'b4444444-4444-4444-a444-444444444444', '11111111-9999-4111-a111-111111111111', 22.50, 15.00, 'approved', CURRENT_TIMESTAMP - INTERVAL '10 days'),
('77777777-2222-4222-a222-222222222222', 'd1111111-1111-4111-a111-111111111111', '22222222-9999-4222-a222-222222222222', 42.00, 15.00, 'approved', CURRENT_TIMESTAMP - INTERVAL '8 days'),
('77777777-3333-4333-a333-333333333333', 'd2222222-2222-4222-a222-222222222222', '33333333-9999-4333-a333-333333333333', 63.00, 15.00, 'pending', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('77777777-4444-4444-a444-444444444444', 'd3333333-3333-4333-a333-333333333333', '44444444-9999-4444-a444-444444444444', 14.25, 15.00, 'pending', CURRENT_TIMESTAMP - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- 8. Seed Withdrawal Requests
INSERT INTO withdraw_requests (id, user_id, withdrawal_number, amount, payment_method, bank_account_id, status, notes, created_at) VALUES
('88888888-1111-4111-a111-111111111111', 'b4444444-4444-4444-a444-444444444444', 'WD-2026-001', 500.00, 'bank_transfer', 'e1111111-1111-4111-a111-111111111111', 'paid', 'Monthly payout approved by admin', CURRENT_TIMESTAMP - INTERVAL '15 days'),
('88888888-2222-4222-a222-222222222222', 'd2222222-2222-4222-a222-222222222222', 'WD-2026-002', 1000.00, 'bank_transfer', 'e3333333-3333-4333-a333-333333333333', 'approved', 'Verified and scheduled for transfer', CURRENT_TIMESTAMP - INTERVAL '3 days'),
('88888888-3333-4333-a333-333333333333', 'd1111111-1111-4111-a111-111111111111', 'WD-2026-003', 200.00, 'bank_transfer', 'e2222222-2222-4222-a222-222222222222', 'pending', 'Awaiting admin review', CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- 9. Seed Notifications
INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES
('b4444444-4444-4444-a444-444444444444', 'Withdrawal Processed', 'Your withdrawal request WD-2026-001 of ₹500.00 has been transferred to your HDFC bank account.', 'success', true, CURRENT_TIMESTAMP - INTERVAL '15 days'),
('b4444444-4444-4444-a444-444444444444', 'New Commission Earned!', 'You earned ₹22.50 commission on order #ORD-2026-901.', 'info', false, CURRENT_TIMESTAMP - INTERVAL '10 days'),
('d2222222-2222-4222-a222-222222222222', 'Withdrawal Approved', 'Your withdrawal request WD-2026-002 of ₹1,000.00 was approved by admin.', 'success', false, CURRENT_TIMESTAMP - INTERVAL '3 days');

-- 10. Seed Activity & Audit Logs
INSERT INTO activity_logs (user_id, action, entity_type, metadata, ip_address, created_at) VALUES
('b4444444-4444-4444-a444-444444444444', 'USER_LOGIN', 'user', '{"device": "Chrome / Windows"}', '103.21.244.11', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
('d1111111-1111-4111-a111-111111111111', 'BANK_ACCOUNT_ADD', 'bank_account', '{"bank": "ICICI Bank"}', '172.56.21.89', CURRENT_TIMESTAMP - INTERVAL '8 days'),
('b2222222-2222-4222-a222-222222222222', 'WITHDRAWAL_APPROVE', 'withdraw_request', '{"withdrawal_number": "WD-2026-002"}', '103.21.244.100', CURRENT_TIMESTAMP - INTERVAL '3 days');
