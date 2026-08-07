# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: landing.spec.js >> landing page renders
- Location: tests\e2e\landing.spec.js:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /Grow with ALORA affiliate network/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /Grow with ALORA affiliate network/i })

```

```yaml
- main:
  - link "ALORA Radiance":
    - /url: /
    - img "ALORA Radiance"
  - link "Sign in":
    - /url: /login
  - link "Join program":
    - /url: /register
    - text: Join program
    - img
  - region "Welcome banner":
    - text: New · Complete Affiliate & Partner Dashboard
    - heading "Grow your revenue with ALORA affiliate network" [level=1]
    - paragraph: ALORA gives ambitious affiliates and team leaders one beautiful place to share, track, and grow their partnerships.
    - link "Become an affiliate":
      - /url: /register
      - text: Become an affiliate
      - img
    - link "Login to your account":
      - /url: /login
    - img
    - text: Your links, commissions, and network — all in one place. A Overview JD
    - paragraph: This month
    - paragraph: ₹8,420.50
    - text: Clicks
    - strong: 12.8k
    - text: Conversions
    - strong: "842"
    - img
    - strong: "+24"
    - text: new partners
    - strong: Commission earned
    - text: +₹1,280.00
  - region "Choose your role":
    - article:
      - img
      - paragraph: For team builders
      - heading "Super Affiliate" [level=2]
      - text: Lead your network, see team performance, and grow together with every referral.
      - link "Create Super Affiliate account":
        - /url: /register
        - text: Create Super Affiliate account
        - img
    - article:
      - img
      - paragraph: For independent partners
      - heading "Affiliate" [level=2]
      - text: Share your referral links, track conversions, and see your earnings grow in real time.
      - link "Create Affiliate account":
        - /url: /register
        - text: Create Affiliate account
        - img
  - article:
    - img
    - heading "Instant conversion tracking" [level=2]
    - paragraph: Every click and sale tracked instantly with your personal referral links.
  - article:
    - img
    - heading "Multi-tier network earnings" [level=2]
    - paragraph: Build your team and earn secondary commissions from your sub-affiliate network.
  - article:
    - img
    - heading "Fast, reliable payouts" [level=2]
    - paragraph: Transparent wallet balances, withdrawal requests, and automated direct payouts.
  - article:
    - img
    - heading "Clear analytics dashboard" [level=2]
    - paragraph: Simple, modern reports so you always know your exact earnings and progress.
```

# Test source

```ts
  1 | import { test, expect } from '@playwright/test';
  2 | 
  3 | test('landing page renders', async ({ page }) => {
  4 |   await page.goto('/');
> 5 |   await expect(page.getByRole('heading', { name: /Grow with ALORA affiliate network/i })).toBeVisible();
    |                                                                                           ^ Error: expect(locator).toBeVisible() failed
  6 | });
  7 | 
```