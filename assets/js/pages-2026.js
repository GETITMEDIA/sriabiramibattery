/* ==========================================================================
   Sri Abirami Battery — inner page helpers
   Universal openTab & tab switching + WhatsApp helpers
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  /* Universal openTab function */
  window.openTab = function (arg1, arg2) {
    var tabId = '';
    var evt = null;

    if (typeof arg1 === 'string') {
      tabId = arg1;
      if (arg2 && arg2.target && arg2.target.nodeType === 1) evt = arg2;
    } else if (typeof arg2 === 'string') {
      tabId = arg2;
      if (arg1 && arg1.target && arg1.target.nodeType === 1) evt = arg1;
    }

    if (!tabId) return;

    // 1. Hide all tab contents
    var tabContents = qsa('.tab-content');
    tabContents.forEach(function (content) {
      content.style.display = 'none';
      content.classList.remove('active', 'is-shown');
    });

    // 2. Remove active class from all tab buttons
    var tabButtons = qsa('.tabs .tab-btn');
    tabButtons.forEach(function (btn) {
      btn.classList.remove('active');
    });

    // 3. Show target tab content
    var target = doc.getElementById(tabId);
    if (target) {
      target.style.display = 'block';
      target.classList.add('active', 'is-shown');
    }

    // 4. Identify the active button safely
    var activeBtn = null;
    if (evt && evt.currentTarget && evt.currentTarget.nodeType === 1 && evt.currentTarget.classList.contains('tab-btn')) {
      activeBtn = evt.currentTarget;
    } else if (evt && evt.target && evt.target.nodeType === 1) {
      activeBtn = evt.target.closest('.tab-btn');
    }

    if (!activeBtn && tabButtons.length) {
      for (var i = 0; i < tabButtons.length; i++) {
        var btn = tabButtons[i];
        var oc = btn.getAttribute('onclick') || '';
        var dt = btn.getAttribute('data-tab') || '';
        if (dt === tabId || oc.indexOf(tabId) !== -1) {
          activeBtn = btn;
          break;
        }
      }
    }

    // Fallback: if still not found, highlight the first button
    if (!activeBtn && tabButtons.length) {
      activeBtn = tabButtons[0];
    }

    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  };

  /* Initialize default tab (Index 0) on load */
  function syncTabs() {
    var contents = qsa('.tab-content');
    if (!contents.length) return;
    var buttons = qsa('.tabs .tab-btn');

    if (!buttons.length) {
      // Single product grid without tab buttons: always show
      contents.forEach(function (c) {
        c.style.display = 'block';
        c.classList.add('is-shown', 'active');
      });
      return;
    }

    // Always find and activate the first tab (index 0)
    var firstBtn = buttons[0];
    var oc = firstBtn.getAttribute('onclick') || '';
    var match = oc.match(/['"]([^'"]+)['"]/);
    var firstTabId = match ? match[1] : (contents[0] ? contents[0].id : '');

    if (firstTabId) {
      window.openTab(firstTabId);
    } else if (contents[0]) {
      contents.forEach(function (c, idx) {
        if (idx === 0) {
          c.style.display = 'block';
          c.classList.add('active', 'is-shown');
        } else {
          c.style.display = 'none';
          c.classList.remove('active', 'is-shown');
        }
      });
      buttons.forEach(function (b, idx) {
        b.classList.toggle('active', idx === 0);
      });
    }
  }

  /* Listen for click on any tab button */
  doc.addEventListener('click', function (e) {
    var btn = e.target && e.target.nodeType === 1 ? e.target.closest('.tab-btn') : null;
    if (!btn) return;
    var oc = btn.getAttribute('onclick') || '';
    var match = oc.match(/['"]([^'"]+)['"]/);
    if (match && match[1]) {
      window.openTab(match[1], e);
      btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }
  });

  /* Stagger product cards */
  qsa('.product-grid, .product-container').forEach(function (grid) {
    qsa(':scope > .product-card, :scope > .product-item', grid).forEach(function (card, i) {
      card.style.setProperty('--i', Math.min(i, 12));
    });
  });

  // Run on parse and on DOM ready
  syncTabs();
  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', syncTabs);
  }
  window.addEventListener('load', syncTabs);

  /* WhatsApp Message Handler */
  window.sendWhatsAppMessage = function (button) {
    var card = button && button.closest ? (button.closest('.product-card') || button.closest('.product-item')) : null;
    var get = function (sel) { var el = card && card.querySelector(sel); return el ? el.textContent.trim() : ''; };
    var product = (button && button.getAttribute('data-product')) || [get('.product-name'), get('.product-id'), get('.product-title'), get('h3')].filter(Boolean).join(' ');
    var warranty = (button && button.getAttribute('data-warranty')) || get('.warranty');
    var text = "Hi, I am interested in " + (product || 'your products') + (warranty ? " (" + warranty + ")" : "") + ". Please share best price and availability.";
    window.open('https://wa.me/919894566418?text=' + encodeURIComponent(text), '_blank');
  };

  /* orderNow handler for backward compatibility */
  window.orderNow = function (button) {
    window.sendWhatsAppMessage(button);
  };
})();
