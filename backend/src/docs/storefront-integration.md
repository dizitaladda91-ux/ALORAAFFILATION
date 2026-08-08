# Storefront Integration Guide

## Authentication

- Use `POST /auth/login` to obtain access tokens for partner-only portal endpoints.
- The storefront must use its **server** to call payment and conversion APIs.
  Never expose `STOREFRONT_API_KEY` to browser JavaScript.

## Referral flow
1. An affiliate shares `https://<affiliate-portal>/ref/<code>`.
2. The portal calls `GET /referrals/click/:code`, records the click, and redirects
   the visitor to the storefront with `ref`, `clickId`, and `discount=10`.
3. Add this script to the storefront layout, using the deployed affiliate API URL:

```html
<script src="https://<affiliate-api>/alora-storefront-discount.js" defer></script>
```

4. The script shows the 10% offer and emits `alora:referral-ready`. Persist its
   data in the storefront cart/session; it is not proof that the discount is valid.

```js
window.addEventListener('alora:referral-ready', ({ detail }) => {
  sessionStorage.setItem('aloraReferral', JSON.stringify(detail));
});
```

5. Before calculating the checkout total, the storefront backend validates the
   referral code with `GET /referrals/discount/:code`. Apply the returned
   `discountPercent` only when `data.valid === true`.
6. After a successful payment, the storefront backend calls `POST /referrals/conversion`
   with `X-Storefront-Api-Key`, `referralCode`, `clickId`, its own immutable
   `orderId`, and the final paid amount. This creates exactly one pending commission.
7. An admin uses **Settle Matured Commissions** (or runs `npm run settle:commissions`)
   after the hold window; settled commission value is credited to the affiliate wallet.
8. The affiliate requests a withdrawal from a verified bank account. An admin approves
   it, creates a payout, then records the bank-transfer result.

## Server-side conversion example

```js
await fetch(`${process.env.AFFILIATE_API_URL}/referrals/conversion`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Storefront-Api-Key': process.env.STOREFRONT_API_KEY,
  },
  body: JSON.stringify({
    referralCode,
    clickId,
    orderId: order.id,
    amount: order.finalPaidAmount,
    grossAmount: order.subtotal,
    discountAmount: order.affiliateDiscount,
    eligibleAmount: order.finalPaidAmount,
    currency: order.currency,
  }),
});
```

## Webhooks
- Razorpay webhooks must be signed with the configured webhook secret.
- The service rejects duplicate webhook deliveries by event id.
