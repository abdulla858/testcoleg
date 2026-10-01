/**
 * University Interactive Quiz Platform - Core Application Logic
 * Manages Theme Toggle (Dark/Light), Mobile Navigation, Active Links & Shared Helpers.
 */

(function () {
  'use strict';

  // --- 1. Theme Manager (Dark / Light) ---
  const THEME_STORAGE_KEY = 'uqp_theme';

  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    applyTheme(initialTheme);

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', toggleTheme);
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    updateThemeIcon(theme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  }

  function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (!themeIcon) return;
    if (theme === 'dark') {
      themeIcon.textContent = '☀️';
      themeIcon.setAttribute('title', 'التبديل إلى الوضع النهاري');
    } else {
      themeIcon.textContent = '🌙';
      themeIcon.setAttribute('title', 'التبديل إلى الوضع الليلي');
    }
  }

  // --- 2. Mobile Navigation Toggle ---
  function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');

    if (!mobileMenuBtn || !navLinks) return;

    mobileMenuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      navLinks.classList.toggle('show');
    });

    document.addEventListener('click', function (e) {
      if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        navLinks.classList.remove('show');
      }
    });
  }

  // --- 3. Active Link Highlighter ---
  function highlightActiveNavLink() {
    const currentPath = window.location.pathname.toLowerCase();
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      const pageName = href.split('/').pop().toLowerCase();
      if (
        (currentPath.endsWith('/') || currentPath.endsWith('index.html')) &&
        (pageName === 'index.html' || href === './' || href === '../index.html')
      ) {
        link.classList.add('active');
      } else if (pageName && currentPath.includes(pageName)) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // --- 4. Global Init on DOM Ready ---
  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initMobileMenu();
    highlightActiveNavLink();
  });
})();
