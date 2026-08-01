# Storefront Integration Guide

## Authentication
- Use POST /auth/login to obtain access tokens for partner-only endpoints.
- For storefront checkout, submit referral context through POST /referrals/conversion after payment confirmation.

## Referral flow
1. Redirect visitors through POST /referrals/:code/click to create a tracking click.
2. Append the returned `clickId` and `referralCode` to the order payload when the storefront completes a purchase.
3. Call POST /referrals/conversion to register the sale and create the commission.

## Webhooks
- Razorpay webhooks must be signed with the configured webhook secret.
- The service rejects duplicate webhook deliveries by event id.
