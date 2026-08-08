/**
 * ALORA RADIANCE - Storefront Auto-Discount & Referral Tracking SDK
 * Automatically detects referral parameters (?ref=CODE&discount=10),
 * displays a 10% OFF partner banner, persists referral context, and
 * auto-applies 10% discount to the bill amount at checkout before delivery charges.
 */
(function () {
  'use strict';

  // 1. Detect parameters from URL query string
  const urlParams = new URLSearchParams(window.location.search);
  const refFromUrl = urlParams.get('ref') || urlParams.get('referral') || urlParams.get('affiliate');
  const discountFromUrl = urlParams.get('discount') || urlParams.get('discountPercent');
  const clickIdFromUrl = urlParams.get('clickId') || urlParams.get('click_id');

  // 2. Save referral context in Storage & Cookie
  if (refFromUrl) {
    localStorage.setItem('alora_ref_code', refFromUrl);
    sessionStorage.setItem('alora_ref_code', refFromUrl);
    document.cookie = `alora_ref_code=${encodeURIComponent(refFromUrl)}; path=/; max-age=2592000`; // 30 days
  }

  const discountPercent = Number(
    discountFromUrl ||
    localStorage.getItem('alora_discount_percent') ||
    sessionStorage.getItem('alora_discount_percent') ||
    10
  );

  if (refFromUrl || discountFromUrl) {
    localStorage.setItem('alora_discount_percent', String(discountPercent));
    sessionStorage.setItem('alora_discount_percent', String(discountPercent));
  }

  if (clickIdFromUrl) {
    localStorage.setItem('alora_click_id', clickIdFromUrl);
    sessionStorage.setItem('alora_click_id', clickIdFromUrl);
  }

  const activeRefCode = refFromUrl || localStorage.getItem('alora_ref_code') || sessionStorage.getItem('alora_ref_code');

  // If no referral active, exit quietly
  if (!activeRefCode) return;

  // 3. Expose Global Alora SDK Helper
  window.AloraAffiliate = {
    refCode: activeRefCode,
    discountPercent: discountPercent,
    clickId: clickIdFromUrl || localStorage.getItem('alora_click_id') || '',
    calculateDiscountedPrice: function (price) {
      const numericPrice = typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.]/g, ''));
      if (isNaN(numericPrice)) return price;
      const discounted = numericPrice * (1 - discountPercent / 100);
      return Math.round(discounted * 100) / 100;
    },
  };

  // 4. Inject Top Announcement Banner for 10% OFF
  function injectDiscountBanner() {
    if (document.getElementById('alora-discount-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'alora-discount-banner';
    banner.style.cssText = `
      position: sticky;
      top: 0;
      z-index: 999999;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #ffffff;
      padding: 10px 16px;
      text-align: center;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(124, 58, 237, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    `;

    banner.innerHTML = `
      <span>🎉 <strong>${discountPercent}% Partner Discount Active!</strong> (Ref Code: <code style="background:rgba(255,255,255,0.2);padding:2px 6px;border-radius:4px;">${activeRefCode}</code>) — Auto-applied at checkout!</span>
      <button id="alora-close-banner" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;opacity:0.8;line-height:1;">&times;</button>
    `;

    document.body.insertBefore(banner, document.body.firstChild);

    document.getElementById('alora-close-banner')?.addEventListener('click', function () {
      banner.remove();
    });
  }

  // 5. Auto-Fill Coupon & Promo Code Inputs at Checkout Bill Summary
  function autoFillCouponFields() {
    const couponSelectors = [
      'input[placeholder*="COUPON" i]',
      'input[placeholder*="coupon" i]',
      'input[placeholder*="CODE" i]',
      'input[placeholder*="code" i]',
      'input[name="coupon"]', 'input[name="coupon_code"]', 'input[name="discount"]',
      'input[name="promo_code"]', 'input[name="discount_code"]', '#coupon_code',
      '#discount_code', '.checkout-discount-input', '.coupon-input'
    ];

    const couponInputs = document.querySelectorAll(couponSelectors.join(', '));
    couponInputs.forEach(input => {
      if (!input.value || input.dataset.aloraFilled !== activeRefCode) {
        input.value = activeRefCode;
        input.dataset.aloraFilled = activeRefCode;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        const parentContainer = input.parentElement || input.closest('div, form');
        const applyBtn = parentContainer?.querySelector('button, input[type="submit"], .apply-btn, #apply-coupon, [class*="apply" i]');
        if (applyBtn && !applyBtn.dataset.aloraClicked) {
          applyBtn.dataset.aloraClicked = 'true';
          setTimeout(() => applyBtn.click(), 400);
        }
      }
    });
  }

  // 6. Auto-Inject Referral Context into Cart & Checkout Forms
  function updateCartFormInputs() {
    const forms = document.querySelectorAll('form[action*="cart"], form[action*="checkout"], .product-form, #add-to-cart-form');
    forms.forEach(form => {
      if (!form.querySelector('input[name="alora_ref_code"]')) {
        const refInput = document.createElement('input');
        refInput.type = 'hidden';
        refInput.name = 'alora_ref_code';
        refInput.value = activeRefCode;
        form.appendChild(refInput);
      }
      if (!form.querySelector('input[name="alora_discount_percent"]')) {
        const discountInput = document.createElement('input');
        discountInput.type = 'hidden';
        discountInput.name = 'alora_discount_percent';
        discountInput.value = String(discountPercent);
        form.appendChild(discountInput);
      }
    });
  }

  function runCheckoutDiscountHelpers() {
    injectDiscountBanner();
    autoFillCouponFields();
    updateCartFormInputs();
  }

  // Run DOM injections when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runCheckoutDiscountHelpers);
  } else {
    runCheckoutDiscountHelpers();
  }

  // Periodically check for checkout form updates
  setInterval(runCheckoutDiscountHelpers, 1500);
})();
