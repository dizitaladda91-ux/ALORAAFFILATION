/**
 * ALORA RADIANCE - Storefront Auto-Discount & Referral Tracking SDK
 * Automatically detects referral parameters (?ref=CODE&discount=10),
 * displays a 10% OFF partner banner, calculates discounted product prices,
 * auto-applies 10% discount in Add to Cart & Checkout forms, and persists referral context.
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
      <span>🎉 <strong>${discountPercent}% OFF Partner Discount Applied!</strong> (Ref Code: <code style="background:rgba(255,255,255,0.2);padding:2px 6px;border-radius:4px;">${activeRefCode}</code>) — Enjoy discounted shopping!</span>
      <button id="alora-close-banner" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;opacity:0.8;line-height:1;">&times;</button>
    `;

    document.body.insertBefore(banner, document.body.firstChild);

    document.getElementById('alora-close-banner')?.addEventListener('click', function () {
      banner.remove();
    });
  }

  // Helper to extract a single clean price number from raw text
  function parseSinglePrice(text) {
    if (!text) return null;
    const match = text.trim().match(/(₹|\$|Rs\.?|INR)?\s*([0-9]{2,6}(\.[0-9]{1,2})?)/i);
    if (!match || !match[2]) return null;
    const val = parseFloat(match[2]);
    if (isNaN(val) || val <= 0) return null;
    return { symbol: match[1] || '₹', amount: val };
  }

  // 5. Automatic Product Price Formatting
  function applyDiscountToPagePrices() {
    const priceSelectors = [
      '.price', '.product-price', '.current-price', '.amount', '.money',
      '[data-price]', '.price-item', '.product-single__price'
    ];

    const priceElements = document.querySelectorAll(priceSelectors.join(', '));
    priceElements.forEach(el => {
      // If already processed or contains our wrapper, skip!
      if (el.dataset.aloraProcessed === 'true' || el.querySelector('.alora-price-tag') || el.closest('.alora-price-tag')) {
        return;
      }

      let originalNum = parseFloat(el.dataset.aloraOriginalPrice || '0');
      let currencySymbol = el.dataset.aloraCurrencySymbol || '₹';

      if (!originalNum) {
        const rawText = el.innerText || el.textContent || '';
        if (rawText.includes('OFF') || rawText.includes('line-through')) {
          el.dataset.aloraProcessed = 'true';
          return;
        }

        const parsed = parseSinglePrice(rawText);
        if (!parsed) return;
        originalNum = parsed.amount;
        currencySymbol = parsed.symbol;
        el.dataset.aloraOriginalPrice = String(originalNum);
        el.dataset.aloraCurrencySymbol = currencySymbol;
      }

      if (originalNum > 0) {
        const discountedNum = Math.round(originalNum * (1 - discountPercent / 100));
        el.dataset.aloraProcessed = 'true';

        el.innerHTML = `<span class="alora-price-tag" style="display:inline-flex;align-items:center;flex-wrap:wrap;gap:4px;">
          <span style="text-decoration: line-through; opacity: 0.6; font-size: 0.88em; margin-right: 4px;">${currencySymbol}${originalNum.toLocaleString('en-IN')}</span>
          <strong style="color: #10b981; font-size: 1.05em;">${currencySymbol}${discountedNum.toLocaleString('en-IN')}</strong>
          <span style="background: #10b981; color: #fff; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${discountPercent}% OFF</span>
        </span>`;
      }
    });
  }

  // 6. Auto-Fill Coupon & Promo Code Inputs at Cart / Checkout
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

  // 7. Auto-Update Cart Forms and Price Inputs
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

      const priceInputs = form.querySelectorAll('input[name="price"], input[name="amount"], input[name="unit_price"]');
      priceInputs.forEach(input => {
        let val = parseFloat(input.dataset.aloraOriginalValue || input.value);
        if (!isNaN(val) && val > 0) {
          if (!input.dataset.aloraOriginalValue) input.dataset.aloraOriginalValue = String(val);
          const discountedVal = Math.round(val * (1 - discountPercent / 100));
          input.value = String(discountedVal);
          input.dataset.aloraDiscounted = 'true';
        }
      });
    });
  }

  // 8. Auto-Calculate Cart Subtotals & Checkout Totals
  function applyDiscountToCartTotals() {
    const cartTotalSelectors = [
      '.cart__subtotal', '.cart-subtotal', '.cart-total', '.order-total',
      '.checkout-total', '#cart-total', '#subtotal', '.subtotal-price',
      '[data-cart-subtotal]'
    ];

    const cartTotals = document.querySelectorAll(cartTotalSelectors.join(', '));
    cartTotals.forEach(el => {
      if (el.dataset.aloraProcessed === 'true' || el.querySelector('.alora-cart-tag')) return;

      const rawText = el.innerText || el.textContent || '';
      if (rawText.includes('OFF')) return;

      const parsed = parseSinglePrice(rawText);
      if (!parsed) return;

      const originalNum = parsed.amount;
      const currencySymbol = parsed.symbol;
      const discountedNum = Math.round(originalNum * (1 - discountPercent / 100));

      el.dataset.aloraProcessed = 'true';
      el.innerHTML = `<span class="alora-cart-tag" style="display:inline-flex;align-items:center;gap:6px;">
        <span style="text-decoration: line-through; opacity: 0.6; font-size: 0.88em;">${currencySymbol}${originalNum.toLocaleString('en-IN')}</span>
        <strong style="color: #10b981; font-size: 1.08em;">${currencySymbol}${discountedNum.toLocaleString('en-IN')}</strong>
        <span style="background: #10b981; color: #fff; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${discountPercent}% OFF APPLIED</span>
      </span>`;
    });
  }

  function runAllDiscountHelpers() {
    injectDiscountBanner();
    applyDiscountToPagePrices();
    autoFillCouponFields();
    updateCartFormInputs();
    applyDiscountToCartTotals();
  }

  // Run DOM injections when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllDiscountHelpers);
  } else {
    runAllDiscountHelpers();
  }

  // Periodically check for dynamically loaded elements & cart updates
  setInterval(runAllDiscountHelpers, 1500);
})();
