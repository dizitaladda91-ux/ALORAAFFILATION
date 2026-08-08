/**
 * ALORA RADIANCE - Storefront Auto-Discount & Referral Tracking SDK
 * Automatically detects referral parameters, shows the 10% partner price on
 * product cards, and applies the partner coupon at checkout.
 */
(function () {
  'use strict';

  // 1. Detect parameters from URL query string
  const urlParams = new URLSearchParams(window.location.search);
  const refFromUrl = urlParams.get('ref') || urlParams.get('referral') || urlParams.get('affiliate') || urlParams.get('coupon') || urlParams.get('coupon_code');
  const clickIdFromUrl = urlParams.get('clickId') || urlParams.get('click_id');
  const PARTNER_DISCOUNT_PERCENT = 10;

  // 2. Save referral context in Storage & Cookie
  if (refFromUrl) {
    localStorage.setItem('alora_ref_code', refFromUrl);
    sessionStorage.setItem('alora_ref_code', refFromUrl);
    document.cookie = `alora_ref_code=${encodeURIComponent(refFromUrl)}; path=/; max-age=2592000`; // 30 days
  }

  // The storefront display must always use the approved affiliate discount.
  // Do not trust a discount value supplied in a shared URL.
  const discountPercent = PARTNER_DISCOUNT_PERCENT;

  if (refFromUrl) {
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
      const numericPrice = typeof price === 'number' ? price : parseFloat(Intl.NumberFormat().format(price).replace(/[^0-9.]/g, ''));
      if (isNaN(numericPrice)) return price;
      const discounted = numericPrice * (1 - discountPercent / 100);
      return Math.round(discounted * 100) / 100;
    },
  };

  // The ecommerce storefront can use this event to persist referral data in
  // its cart/session and send the final paid order from its server.
  window.dispatchEvent(new CustomEvent('alora:referral-ready', {
    detail: { ...window.AloraAffiliate },
  }));

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

    const message = document.createElement('span');
    const code = document.createElement('code');
    code.textContent = activeRefCode;
    code.style.cssText = 'background:rgba(255,255,255,0.2);padding:2px 6px;border-radius:4px;';
    message.append('🎉 ', `${discountPercent}% Partner Discount Active! (Ref Code: `);
    message.append(code, ') — Auto-applied at checkout!');

    const closeButton = document.createElement('button');
    closeButton.id = 'alora-close-banner';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close partner discount banner');
    closeButton.textContent = '×';
    closeButton.style.cssText = 'background:none;border:none;color:#fff;font-size:18px;cursor:pointer;opacity:0.8;line-height:1;';
    banner.append(message, closeButton);

    document.body.insertBefore(banner, document.body.firstChild);

    document.getElementById('alora-close-banner')?.addEventListener('click', function () {
      banner.remove();
    });
  }

  // 5. Silent Zero-Click Auto-Fill & Auto-Submit Coupon at Checkout
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

        // Trigger input, change, and keypress events for React/Vue frameworks
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));

        const parentContainer = input.parentElement || input.closest('div, form');
        const applyBtn = parentContainer?.querySelector('button, input[type="submit"], .apply-btn, #apply-coupon, [class*="apply" i]');
        if (applyBtn && !applyBtn.dataset.aloraClicked) {
          applyBtn.dataset.aloraClicked = 'true';
          setTimeout(() => applyBtn.click(), 300);
        }
      }
    });
  }

  // 6. Show the partner price wherever a storefront renders a product price.
  // Keep only one numeric value inside the price element. Some storefront carts
  // read textContent to calculate totals; rendering MRP and sale price together
  // turns “499” + “449.10” into the invalid “499449.10” amount.
  const priceSelectors = [
    '[data-product-price]', '[data-price]', '.product-price', '.price', '.money',
    '.woocommerce-Price-amount', '[class*="product-price"]', '[class*="sale-price"]'
  ];

  function getNumericPrice(value) {
    const normalized = String(value).replace(/[^0-9.,]/g, '').replace(/,/g, '');
    const amount = Number.parseFloat(normalized);
    return Number.isFinite(amount) && amount > 0 ? amount : null;
  }

  function formatDiscountedPrice(originalText, amount) {
    const currency = originalText.match(/₹|Rs\.?|INR|\$|€|£/i)?.[0] || '₹';
    const discounted = Math.round(amount * (1 - discountPercent / 100) * 100) / 100;
    return `${currency}${discounted.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function showDiscountedProductPrices() {
    const candidates = Array.from(document.querySelectorAll(priceSelectors.join(', ')));
    candidates
      .filter((element) => !element.dataset.aloraPriceApplied)
      // Never process the price elements injected by this SDK. The storefront
      // can re-render the cart after Add to Cart, which otherwise caused the
      // old and discounted values to be concatenated repeatedly.
      .filter((element) => !element.closest('[data-alora-price-applied]'))
      .filter((element) => !element.classList.contains('alora-original-price'))
      .filter((element) => !element.classList.contains('alora-discounted-price'))
      .filter((element) => !candidates.some((candidate) => candidate !== element && element.contains(candidate)))
      .forEach((element) => {
        const originalText = element.textContent.trim();
        const amount = getNumericPrice(originalText);
        if (!amount) return;

        element.dataset.aloraOriginalPrice = originalText;
        element.textContent = formatDiscountedPrice(originalText, amount);
        element.style.color = '#c026d3';
        element.style.fontWeight = '700';
        element.dataset.aloraPriceApplied = 'true';
      });
  }

  // 7. Auto-inject referral context into cart and checkout forms.
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
    showDiscountedProductPrices();
    autoFillCouponFields();
    updateCartFormInputs();
  }

  // Run DOM injections when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runCheckoutDiscountHelpers);
  } else {
    runCheckoutDiscountHelpers();
  }

  // Storefronts commonly render products after page load. Observe those changes
  // instead of continuously polling every second.
  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      runCheckoutDiscountHelpers();
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
