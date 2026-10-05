/* ==========================================================================
   Sri Abirami Battery — inner page helpers
   Works alongside each page's own openTab / WhatsApp scripts.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  /* Stagger product cards inside each grid */
  qsa('.product-grid, .product-container').forEach(function (grid) {
    qsa(':scope > .product-card, :scope > .product-item', grid).forEach(function (card, i) {
      card.style.setProperty('--i', Math.min(i, 12));
    });
  });

  /* Tabs: pages use two styles (class "active" or inline display).
     Keep the clicked button highlighted and make sure one tab is visible. */
  function isShown(el) { return el.classList.contains('active') || el.style.display === 'block'; }

  function syncTabs() {
    var contents = qsa('.tab-content');
    if (!contents.length) return;
    var buttons = qsa('.tab-btn');
    if (!buttons.length) {
      // single product list without tab buttons: always visible
      contents.forEach(function (c) { c.classList.add('is-shown'); });
      return;
    }
    if (!contents.some(isShown)) {
      contents[0].classList.add('active');
      contents[0].style.display = 'block';
      buttons[0].classList.add('active');
    }
    if (!buttons.some(function (b) { return b.classList.contains('active'); })) buttons[0].classList.add('active');
  }

  doc.addEventListener('click', function (e) {
    var btn = e.target.closest('.tab-btn');
    if (!btn) return;
    // run after the page's own handler
    setTimeout(function () {
      var group = btn.parentElement;
      qsa('.tab-btn', group).forEach(function (b) { b.classList.toggle('active', b === btn); });
      btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }, 0);
  });

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { setTimeout(syncTabs, 0); });
  else setTimeout(syncTabs, 0);

  /* orderNow(): exidesolarpanal buttons call it; it used to live in the old template script.js */
  if (typeof window.orderNow !== 'function') {
    window.orderNow = function (button) {
      if (typeof window.sendWhatsAppMessage === 'function') return window.sendWhatsAppMessage(button);
      var card = button && button.closest ? button.closest('.product-card') : null;
      var get = function (sel) { var el = card && card.querySelector(sel); return el ? el.textContent.trim() : ''; };
      var product = (button && button.getAttribute('data-product')) || [get('.product-name'), get('.product-id')].filter(Boolean).join(' ');
      var message = "Hi, I'm interested in ordering this product: " + (product || 'your products');
      window.open('https://wa.me/918012555111?text=' + encodeURIComponent(message), '_blank');
    };
  }
})();
