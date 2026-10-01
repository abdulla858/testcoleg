/**
 * University Interactive Quiz Platform - Data Service Layer
 * Central module for fetching JSON data using relative paths with memory caching
 * and managing LocalStorage keys.
 * Strictly separates:
 * 1. Lecture Questions (lecture-questions.json)
 * 2. Question Banks (bank-questions.json)
 * 3. Models (model-questions.json)
 * 4. Midterms (midterm-questions.json)
 */

const DataService = (function () {
  'use strict';

  // Base relative path detection depending on whether we are in root or in /pages/
  const isPagesDir = window.location.pathname.includes('/pages/');
  const DATA_BASE_URL = isPagesDir ? '../data/' : './data/';

  // Memory Cache
  const cache = {};

  // Storage Keys
  const STORAGE_KEYS = {
    THEME: 'uqp_theme',
    HISTORY: 'uqp_quiz_history',
    PREFERENCES: 'uqp_user_prefs'
  };

  /**
   * Fetch a JSON file safely with automatic fallback to static bundle for file:/// protocol
   * @param {string} filename - e.g. 'lecture-questions.json'
   * @returns {Promise<Array|Object>}
   */
  async function fetchJson(filename) {
    if (cache[filename]) {
      return cache[filename];
    }

    const keyMap = {
      'courses.json': 'courses',
      'lectures.json': 'lectures',
      'lecture-questions.json': 'lectureQuestions',
      'question-banks.json': 'questionBanks',
      'bank-questions.json': 'bankQuestions',
      'models.json': 'models',
      'model-questions.json': 'modelQuestions',
      'midterms.json': 'midterms',
      'midterm-questions.json': 'midtermQuestions',
      'settings.json': 'settings'
    };
    const staticKey = keyMap[filename];

    // 1. Try standard fetch (works on GitHub Pages & web servers)
    if (window.location.protocol !== 'file:') {
      try {
        const response = await fetch(`${DATA_BASE_URL}${filename}?v=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          cache[filename] = data;
          return data;
        }
      } catch (error) {
        console.warn(`[DataService] Fetch attempt failed for ${filename}:`, error.message);
      }
    }

    // 2. Fallback to pre-bundled data (guarantees offline support when opened directly via file:///)
    const staticBundle = window.UQP_STATIC_DATA || window.STATIC_DATA;
    if (staticBundle && staticKey && staticBundle[staticKey]) {
      cache[filename] = staticBundle[staticKey];
      return cache[filename];
    }

    // 3. Fallback fetch attempt if on file:/// and browser allows it
    try {
      const response = await fetch(`${DATA_BASE_URL}${filename}`);
      if (response.ok) {
        const data = await response.json();
        cache[filename] = data;
        return data;
      }
    } catch (e) {}

    return [];
  }

  // --- Specific Data Getters ---
  async function getCourses() {
    return await fetchJson('courses.json');
  }

  async function getLectures(courseId = null) {
    const lectures = await fetchJson('lectures.json');
    if (!courseId) return lectures;
    return lectures.filter(l => l.courseId === courseId);
  }

  /**
   * 1. Lecture Questions (منفصلة تماماً ومصدرها المحاضرات فقط)
   */
  async function getLectureQuestions(courseId = null, lectureId = null) {
    const questions = await fetchJson('lecture-questions.json');
    return questions.filter(q => {
      const matchCourse = !courseId || q.courseId === courseId;
      const matchLecture = !lectureId || q.lectureId === lectureId;
      return matchCourse && matchLecture;
    });
  }

  /**
   * 2. Question Bank Questions (منفصلة تماماً ومصدرها بنوك الأسئلة في الملفات)
   */
  async function getBankQuestions(courseId = null, bankId = null) {
    const questions = await fetchJson('bank-questions.json');
    return questions.filter(q => {
      const matchCourse = !courseId || q.courseId === courseId;
      const matchBank = !bankId || q.bankId === bankId;
      return matchCourse && matchBank;
    });
  }

  /**
   * 3. Model Questions (نماذج مستقلة غير مخلطة)
   */
  async function getModelQuestions(courseId = null, modelId = null) {
    const questions = await fetchJson('model-questions.json');
    return questions.filter(q => {
      const matchCourse = !courseId || q.courseId === courseId;
      const matchModel = !modelId || q.modelId === modelId;
      return matchCourse && matchModel;
    });
  }

  /**
   * 4. Midterm Questions (اختبارات نصفية مستقلة غير مخلطة)
   */
  async function getMidtermQuestions(courseId = null, midtermId = null) {
    const questions = await fetchJson('midterm-questions.json');
    return questions.filter(q => {
      const matchCourse = !courseId || q.courseId === courseId;
      const matchMidterm = !midtermId || q.midtermId === midtermId;
      return matchCourse && matchMidterm;
    });
  }

  /**
   * General getter alias (points to lecture questions by default)
   */
  async function getQuestions(courseId = null, lectureId = null) {
    return await getLectureQuestions(courseId, lectureId);
  }

  async function getQuestionBanks(courseId = null) {
    const banks = await fetchJson('question-banks.json');
    if (!courseId) return banks;
    return banks.filter(b => b.courseId === courseId);
  }

  async function getModels(courseId = null) {
    const models = await fetchJson('models.json');
    if (!courseId) return models;
    return models.filter(m => m.courseId === courseId);
  }

  async function getMidterms(courseId = null) {
    const midterms = await fetchJson('midterms.json');
    if (!courseId) return midterms;
    return midterms.filter(m => m.courseId === courseId);
  }

  async function getSettings() {
    return await fetchJson('settings.json');
  }

  /**
   * 5. Custom Random Questions Generator
   * Generates a custom randomized question pool based on user preferences
   * (course, source pillar, count, difficulty).
   */
  async function getCustomRandomQuestions(options = {}) {
    const {
      courseId = 'all',
      source = 'all', // 'all', 'lectures', 'banks', 'models', 'midterms'
      count = 20,
      difficulty = 'all' // 'all', 'easy', 'medium', 'hard'
    } = options;

    let pool = [];

    if (source === 'lectures' || source === 'all') {
      const lqs = await fetchJson('lecture-questions.json');
      pool = pool.concat(lqs);
    }
    if (source === 'banks' || source === 'all') {
      const bqs = await fetchJson('bank-questions.json');
      pool = pool.concat(bqs);
    }
    if (source === 'models' || source === 'all') {
      const mqs = await fetchJson('model-questions.json');
      pool = pool.concat(mqs);
    }
    if (source === 'midterms' || source === 'all') {
      const mtqs = await fetchJson('midterm-questions.json');
      pool = pool.concat(mtqs);
    }

    // Filter by course if specified
    if (courseId && courseId !== 'all') {
      pool = pool.filter(q => q.courseId === courseId);
    }

    // Filter by difficulty if specified
    if (difficulty && difficulty !== 'all') {
      pool = pool.filter(q => q.difficulty === difficulty);
    }

    // Shuffle pool (Fisher-Yates)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const targetCount = parseInt(count, 10) || 20;
    return pool.slice(0, targetCount);
  }

  // --- LocalStorage History Management ---
  function getHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('[DataService] Error parsing history:', e);
      return [];
    }
  }

  function saveQuizResult(resultRecord) {
    try {
      const history = getHistory();
      history.push({
        id: `res_${Date.now()}`,
        completedAt: new Date().toISOString(),
        ...resultRecord
      });
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('[DataService] Failed to save result to LocalStorage:', e);
    }
  }

  function clearHistory() {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  }

  return {
    getCourses,
    getLectures,
    getQuestions,
    getLectureQuestions,
    getBankQuestions,
    getModelQuestions,
    getMidtermQuestions,
    getQuestionBanks,
    getModels,
    getMidterms,
    getSettings,
    getCustomRandomQuestions,
    getHistory,
    saveQuizResult,
    clearHistory,
    STORAGE_KEYS
  };
})();
