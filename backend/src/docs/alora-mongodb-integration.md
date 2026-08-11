# Alora Storefront (MongoDB) Integration

The Alora shopping application and this affiliate API keep separate databases:

```text
Alora backend + MongoDB  -- server-to-server HTTPS -->  Affiliate API + Neon PostgreSQL
```

Never connect Alora directly to Neon. The shared `STOREFRONT_API_KEY` belongs
only in the two backend deployment environments.

## 1. Configure both backends

Set these values in the Affiliate API environment:

```env
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
DB_SSL_REJECT_UNAUTHORIZED=true
STOREFRONT_URL=https://shop.example.com
STOREFRONT_API_KEY=<a-unique-random-secret-of-at-least-32-characters>
AFFILIATE_DISCOUNT_PERCENT=10
```

Set the same API key in the Alora backend, never in its browser environment:

```env
AFFILIATE_API_URL=https://affiliate-api.example.com
STOREFRONT_API_KEY=<the-exact-same-secret>
```

## 2. Referral visit

Affiliates share the portal link `https://affiliate-portal.example.com/ref/<code>`.
The portal calls `GET /referrals/click/:code`, then redirects the visitor to
Alora with `ref` and `clickId`. Alora should save both values in its session
and MongoDB cart. Query-string discount values are display hints only and must
not be trusted for checkout pricing.

## 3. Validate a cart before payment

Alora's **backend** must call this endpoint after it derives the customer email
and cart subtotal from MongoDB:

```http
GET /referrals/coupon-status/AFF-123?customerEmail=buyer%40example.com
X-Storefront-Api-Key: <STOREFRONT_API_KEY>
```

Apply the returned `discountPercent` only if `data.valid` and `data.eligible`
are both true. Store the validated referral code, click ID, discount percentage,
and discount value on Alora's immutable order record.

## 4. Send a paid order conversion

After Alora verifies its Razorpay payment or trusted Razorpay webhook, its
backend calls:

```http
POST /referrals/conversion
Content-Type: application/json
X-Storefront-Api-Key: <STOREFRONT_API_KEY>

{
  "referralCode": "AFF-123",
  "clickId": "<click-event-uuid>",
  "orderId": "<alora-mongodb-order-id>",
  "customerEmail": "buyer@example.com",
  "grossAmount": 2000,
  "discountAmount": 200,
  "eligibleAmount": 1800,
  "amount": 1800,
  "currency": "INR"
}
```

`orderId` must be Alora's immutable MongoDB order ID. This API is idempotent:
retries for the same order return the recorded conversion and do not create an
additional commission. Alora should mark its order `conversionStatus` as
`SYNCED` only after it receives a success response; retry `PENDING` or `FAILED`
paid orders from a backend worker.

## 5. Security requirements

- Do not call coupon validation or conversion APIs from React/browser code.
- Do not expose `STOREFRONT_API_KEY`, Neon credentials, or Razorpay secrets.
- Calculate every amount from Alora's server-side product/cart/order data.
- Do not send conversions for unpaid, cancelled, or refunded orders.
- Configure refunds as an auditable commission-reversal workflow before launch.
