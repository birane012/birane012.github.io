/* -----------------------------------------------------------------------------
   b012_data — docs interactions
   Localization, theme switching, copy-to-clipboard, nav, active TOC, reveal.
   ----------------------------------------------------------------------------- */

(() => {
  'use strict';

  // English lives in index.html; i18n.js holds the other locales, plus the
  // few English strings that are not in the page (copy-button labels).
  const I18N = window.B012_I18N || { supportedLocales: ['en'], translations: { en: {} } };
  const root = document.documentElement;
  const textNodes = Array.from(document.querySelectorAll('[data-i18n]'));
  const attrNodes = Array.from(document.querySelectorAll('[data-i18n-attr]'));
  const originalText = new Map(textNodes.map((el) => [el, el.tagName === 'TITLE' ? el.textContent : el.innerHTML]));
  const originalAttrs = new Map(attrNodes.map((el) => [el, parseAttrBindings(el).map(([attr]) => el.getAttribute(attr))]));
  const localeSelect = document.getElementById('locale-select');
  const themeSelect = document.getElementById('theme-select');
  const STORAGE_LOCALE = 'b012_data.locale';
  const STORAGE_THEME = 'b012_data.theme';
  const RTL_LOCALES = new Set(['ar', 'ur']);
  let currentLocale = 'en';

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  initLocalization();
  initTheme();
  initMobileNav();
  initCopyButtons();
  initActiveToc();
  initReveal();

  function initLocalization() {
    if (!localeSelect) return;

    const savedPreference = localStorage.getItem(STORAGE_LOCALE) || 'auto';
    const detectedLocale = detectLocale();
    currentLocale = savedPreference === 'auto' ? detectedLocale : normalizeLocale(savedPreference);
    applyLocale(currentLocale);
    localeSelect.value = savedPreference === 'auto' ? 'auto' : currentLocale;

    localeSelect.addEventListener('change', () => {
      const preference = localeSelect.value;
      localStorage.setItem(STORAGE_LOCALE, preference);
      const nextLocale = preference === 'auto' ? detectLocale() : normalizeLocale(preference);
      applyLocale(nextLocale);
    });
  }

  function initTheme() {
    if (!themeSelect) return;

    const savedTheme = localStorage.getItem(STORAGE_THEME) || 'dark';
    applyTheme(savedTheme);
    themeSelect.value = savedTheme;

    themeSelect.addEventListener('change', () => {
      const theme = themeSelect.value;
      localStorage.setItem(STORAGE_THEME, theme);
      applyTheme(theme);
    });
  }

  function detectLocale() {
    const langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
    for (const lang of langs) {
      const normalized = normalizeLocale(lang);
      if (I18N.supportedLocales.includes(normalized)) return normalized;
    }
    return 'en';
  }

  function normalizeLocale(locale) {
    if (!locale) return 'en';
    const lower = String(locale).toLowerCase();
    if (lower.startsWith('zh')) {
      if (lower.includes('hant') || lower.includes('tw') || lower.includes('hk') || lower.includes('mo')) {
        return 'zh-Hant';
      }
      return 'zh-Hans';
    }
    const base = lower.split('-')[0];
    return I18N.supportedLocales.includes(base) ? base : 'en';
  }

  // data-i18n-attr="aria-label:navToggle;title:otherKey" → [['aria-label', 'navToggle'], ...]
  function parseAttrBindings(el) {
    return el.dataset.i18nAttr.split(';').map((pair) => pair.split(':').map((s) => s.trim()));
  }

  function applyLocale(locale) {
    currentLocale = locale;
    const table = (locale !== 'en' && I18N.translations?.[locale]) || {};
    const pick = (key, fallback) => (typeof table[key] === 'string' ? table[key] : fallback);

    textNodes.forEach((el) => {
      const value = pick(el.dataset.i18n, originalText.get(el));
      if (el.tagName === 'TITLE') el.textContent = value;
      else el.innerHTML = value;
    });
    attrNodes.forEach((el) => {
      const fallbacks = originalAttrs.get(el);
      parseAttrBindings(el).forEach(([attr, key], i) => el.setAttribute(attr, pick(key, fallbacks[i])));
    });

    updateCopyLabels(getMessages(locale));
    root.lang = locale === 'zh-Hans' ? 'zh-CN' : locale === 'zh-Hant' ? 'zh-TW' : locale;
    root.dir = RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
  }

  function getMessages(locale) {
    return new Proxy({}, {
      get(_, key) {
        const local = I18N.translations?.[locale]?.[key];
        if (typeof local === 'string') return local;
        const fallback = I18N.translations?.en?.[key];
        return typeof fallback === 'string' ? fallback : '';
      }
    });
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    // Browser chrome (mobile address bar) follows the page background.
    const meta = document.querySelector('meta[name="theme-color"]');
    const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
    if (meta && bg) meta.setAttribute('content', bg);
  }

  function initMobileNav() {
    const topbar = document.querySelector('.topbar');
    const toggle = document.querySelector('.nav-toggle');
    if (toggle && topbar) {
      const close = () => {
        topbar.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      };
      toggle.addEventListener('click', () => {
        const open = topbar.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
      });
      document.querySelectorAll('.nav a').forEach((a) => {
        a.addEventListener('click', close);
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && topbar.classList.contains('is-open')) {
          close();
          toggle.focus();
        }
      });
    }
  }

  function initCopyButtons() {
    const installCmd = document.querySelector('.install__cmd');
    if (installCmd) {
      const btn = installCmd.querySelector('.copy-btn');
      const payload = installCmd.getAttribute('data-copy') || '';
      btn?.addEventListener('click', () => copyTo(btn, payload));
    }

    document.querySelectorAll('pre').forEach((pre) => {
      attachCopyButton(pre, () => {
        const codeEl = pre.querySelector('code');
        return codeEl ? codeEl.innerText : pre.innerText;
      });
    });

    document.querySelectorAll('.files__run').forEach((codeEl) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'copy-inline';
      codeEl.parentNode.insertBefore(wrapper, codeEl);
      wrapper.appendChild(codeEl);

      attachCopyButton(wrapper, () => codeEl.innerText, {
        buttonClass: 'code-copy code-copy--inline',
      });
    });

    updateCopyLabels(getMessages(currentLocale));
  }

  function attachCopyButton(container, getText, options = {}) {
    if (!container || container.querySelector('.code-copy')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = options.buttonClass || 'code-copy';
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    container.appendChild(btn);

    btn.addEventListener('click', () => {
      copyTo(btn, getText());
    });
  }

  function updateCopyLabels(messages) {
    document.querySelectorAll('.copy-btn, .code-copy').forEach((button) => {
      button.dataset.copyLabel = messages.copy;
      button.dataset.copiedLabel = messages.copied;
      button.setAttribute('aria-label', messages.copyAria);
      if (!button.classList.contains('is-copied')) {
        button.textContent = messages.copy;
      }
    });
  }

  function copyTo(button, text) {
    const original = button.dataset.copyLabel || 'Copy';
    const copied = button.dataset.copiedLabel || 'Copied';
    const done = () => {
      button.textContent = copied;
      button.classList.add('is-copied');
      setTimeout(() => {
        button.textContent = original;
        button.classList.remove('is-copied');
      }, 1400);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallback(text, done));
    } else {
      fallback(text, done);
    }
  }

  function fallback(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-999em';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (_) {}
    document.body.removeChild(ta);
  }

  function initActiveToc() {
    const tocLinks = Array.from(document.querySelectorAll('.toc__list a[href^="#"]'));
    const watched = tocLinks
      .map((a) => {
        const id = a.getAttribute('href').slice(1);
        const el = document.getElementById(id);
        return el ? { link: a, el } : null;
      })
      .filter(Boolean);

    if (watched.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const match = watched.find((w) => w.el === entry.target);
              if (match) {
                tocLinks.forEach((l) => l.classList.remove('is-active'));
                match.link.classList.add('is-active');
              }
            }
          });
        },
        { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
      );
      watched.forEach((w) => io.observe(w.el));
    }
  }

  function initReveal() {
    const revealTargets = [
      '.feature',
      '.steps > li',
      '.subsection',
      '.note',
      '.files li',
      '.plat-grid li',
      '.cta__card',
    ];
    const nodes = document.querySelectorAll(revealTargets.join(','));
    nodes.forEach((n, i) => {
      n.setAttribute('data-reveal', '');
      n.style.transitionDelay = `${Math.min(i, 6) * 60}ms`;
    });

    if ('IntersectionObserver' in window) {
      const revealIO = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
      );
      nodes.forEach((n) => revealIO.observe(n));
    } else {
      nodes.forEach((n) => n.classList.add('is-visible'));
    }
  }
})();
