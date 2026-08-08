/**
 * ALORA RADIANCE - Storefront Auto-Discount & Referral Tracking SDK
 * Automatically detects referral parameters (?ref=CODE&discount=10),
 * displays a 10% OFF partner banner, calculates discounted product prices,
 * and persists referral context across shopping sessions.
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

  // 5. Automatic Price Formatting on Webpage
  function applyDiscountToPagePrices() {
    const priceSelectors = [
      '.price', '.product-price', '.current-price', '.amount', '.money',
      '[data-price]', '.price-item', '.product-single__price'
    ];

    const priceElements = document.querySelectorAll(priceSelectors.join(', '));
    priceElements.forEach(el => {
      if (el.dataset.aloraProcessed) return;

      const rawText = el.innerText || el.textContent;
      const match = rawText.match(/(₹|\$|Rs\.?|INR)?\s*([0-9,]+(\.[0-9]{1,2})?)/i);

      if (match && match[2]) {
        const originalNum = parseFloat(match[2].replace(/,/g, ''));
        if (!isNaN(originalNum) && originalNum > 0) {
          const currencySymbol = match[1] || '₹';
          const discountedNum = Math.round(originalNum * (1 - discountPercent / 100));

          el.dataset.aloraProcessed = 'true';
          el.innerHTML = `
            <span style="text-decoration: line-through; opacity: 0.6; font-size: 0.88em; margin-right: 6px;">${currencySymbol}${originalNum.toLocaleString('en-IN')}</span>
            <strong style="color: #10b981; font-size: 1.05em;">${currencySymbol}${discountedNum.toLocaleString('en-IN')}</strong>
            <span style="background: #10b981; color: #fff; font-size: 11px; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">${discountPercent}% OFF</span>
          `;
        }
      }
    });
  }

  // Run DOM injections when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectDiscountBanner();
      applyDiscountToPagePrices();
    });
  } else {
    injectDiscountBanner();
    applyDiscountToPagePrices();
  }

  // Periodically check for dynamically loaded products
  setInterval(applyDiscountToPagePrices, 2000);
})();
