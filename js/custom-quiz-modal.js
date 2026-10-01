/**
 * University Interactive Quiz Platform - Custom Random Quiz Generator Modal
 * Enables students to generate customized random practice sessions from:
 * 1. Lectures only
 * 2. Question Banks only
 * 3. Models only
 * 4. Midterm exams only
 * 5. Or a comprehensive mix of all pillars
 * With configurable question counts, difficulty levels, and timer durations.
 */

(function () {
  'use strict';

  function initCustomQuizModal() {
    if (document.getElementById('customQuizModalBackdrop')) return;

    const modalHtml = `
      <div id="customQuizModalBackdrop" class="custom-quiz-modal-backdrop" style="display: none;">
        <div class="custom-quiz-modal-card" role="dialog" aria-modal="true" aria-labelledby="customQuizModalTitle">
          
          <!-- Header -->
          <div class="custom-quiz-modal-header">
            <div class="d-flex align-center gap-2">
              <span style="font-size: 1.5rem;">🎲</span>
              <div>
                <h3 id="customQuizModalTitle" style="margin: 0; font-size: 1.25rem;">مولّد الاختبار العشوائي المخصص</h3>
                <p class="text-muted mb-0" style="font-size: 0.82rem;">خصص جلستك التدريبية حسب رغبتك وابدأ فوراً</p>
              </div>
            </div>
            <button type="button" class="btn btn-ghost" id="btnCloseCustomQuizModal" style="font-size: 1.25rem; padding: 0.25rem 0.6rem;" aria-label="إغلاق">✕</button>
          </div>

          <!-- Body Form -->
          <div class="custom-quiz-modal-body">
            
            <!-- 1. Course Selection -->
            <div class="form-group-custom">
              <label class="form-label-custom" for="customQuizCourseSelect">
                <span>📚</span> اختر المقرر الدراسي:
              </label>
              <select id="customQuizCourseSelect" class="filter-select w-100" style="padding: 0.65rem 1rem;">
                <option value="all">🌐 جميع المقررات الدراسية (شامل)</option>
              </select>
            </div>

            <!-- 2. Source Pillar Selection -->
            <div class="form-group-custom">
              <label class="form-label-custom">
                <span>📂</span> نوع المصدر الأكاديمي:
              </label>
              <div class="btn-choice-group" id="groupSourcePillar">
                <button type="button" class="btn-choice-item active" data-source="all">🌐 الكل (شامل)</button>
                <button type="button" class="btn-choice-item" data-source="lectures">📚 المحاضرات فقط</button>
                <button type="button" class="btn-choice-item" data-source="banks">🏦 بنوك الأسئلة</button>
                <button type="button" class="btn-choice-item" data-source="models">📋 النماذج التدريبية</button>
                <button type="button" class="btn-choice-item" data-source="midterms">🎓 الاختبارات النصفية</button>
              </div>
            </div>

            <!-- 3. Questions Count -->
            <div class="form-group-custom">
              <label class="form-label-custom">
                <span>🔢</span> عدد الأسئلة:
              </label>
              <div class="btn-choice-group" id="groupQuestionCount">
                <button type="button" class="btn-choice-item" data-count="10">10 أسئلة (سريع)</button>
                <button type="button" class="btn-choice-item active" data-count="20">20 سؤالاً (قياسي)</button>
                <button type="button" class="btn-choice-item" data-count="30">30 سؤالاً (شامل)</button>
                <button type="button" class="btn-choice-item" data-count="50">50 سؤالاً (ماراثون)</button>
              </div>
            </div>

            <!-- 4. Difficulty -->
            <div class="form-group-custom">
              <label class="form-label-custom">
                <span>⚡</span> مستوى الصعوبة:
              </label>
              <div class="btn-choice-group" id="groupDifficulty">
                <button type="button" class="btn-choice-item active" data-diff="all">جميع المستويات</button>
                <button type="button" class="btn-choice-item" data-diff="easy">سهل</button>
                <button type="button" class="btn-choice-item" data-diff="medium">متوسط</button>
                <button type="button" class="btn-choice-item" data-diff="hard">صعب/متقدم</button>
              </div>
            </div>

            <!-- 5. Timer Duration -->
            <div class="form-group-custom">
              <label class="form-label-custom">
                <span>⏱️</span> المؤقت الزمني:
              </label>
              <div class="btn-choice-group" id="groupTimer">
                <button type="button" class="btn-choice-item active" data-timer="0">بدون مؤقت (حر)</button>
                <button type="button" class="btn-choice-item" data-timer="15">15 دقيقة</button>
                <button type="button" class="btn-choice-item" data-timer="30">30 دقيقة</button>
                <button type="button" class="btn-choice-item" data-timer="45">45 دقيقة</button>
              </div>
            </div>

            <!-- 6. Quiz Language -->
            <div class="form-group-custom">
              <label class="form-label-custom">
                <span>🌐</span> لغة الاختبار:
              </label>
              <div class="btn-choice-group" id="groupQuizLang">
                <button type="button" class="btn-choice-item" data-lang="ar">عربي</button>
                <button type="button" class="btn-choice-item" data-lang="en">English</button>
                <button type="button" class="btn-choice-item active" data-lang="both">🌐 كلاهما (Bilingual)</button>
              </div>
            </div>

          </div>

          <!-- Footer Actions -->
          <div class="custom-quiz-modal-footer">
            <button type="button" class="btn btn-outline" id="btnCancelCustomQuiz">إلغاء</button>
            <button type="button" class="btn btn-primary" id="btnStartCustomQuiz" style="font-weight: 700; padding: 0.65rem 1.5rem;">
              🚀 ابدأ الاختبار الآن
            </button>
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const backdrop = document.getElementById('customQuizModalBackdrop');
    const btnClose = document.getElementById('btnCloseCustomQuizModal');
    const btnCancel = document.getElementById('btnCancelCustomQuiz');
    const btnStart = document.getElementById('btnStartCustomQuiz');
    const courseSelect = document.getElementById('customQuizCourseSelect');

    let selectedSource = 'all';
    let selectedCount = '20';
    let selectedDiff = 'all';
    let selectedTimer = '0';
    let selectedLang = localStorage.getItem('uqp_quiz_lang') || 'both';

    // Populate Courses
    if (typeof DataService !== 'undefined' && DataService.getCourses) {
      DataService.getCourses().then(courses => {
        courses.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = `${c.title} (${c.code || ''})`;
          courseSelect.appendChild(opt);
        });
      }).catch(err => console.warn('Could not load courses in modal:', err));
    }

    // Bind choice group button clicks
    function setupChoiceGroup(containerId, onSelect) {
      const group = document.getElementById(containerId);
      if (!group) return;
      const items = group.querySelectorAll('.btn-choice-item');
      items.forEach(btn => {
        btn.addEventListener('click', function () {
          items.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          onSelect(btn);
        });
      });
    }

    setupChoiceGroup('groupSourcePillar', btn => { selectedSource = btn.getAttribute('data-source'); });
    setupChoiceGroup('groupQuestionCount', btn => { selectedCount = btn.getAttribute('data-count'); });
    setupChoiceGroup('groupDifficulty', btn => { selectedDiff = btn.getAttribute('data-diff'); });
    setupChoiceGroup('groupTimer', btn => { selectedTimer = btn.getAttribute('data-timer'); });
    setupChoiceGroup('groupQuizLang', btn => {
      selectedLang = btn.getAttribute('data-lang');
      localStorage.setItem('uqp_quiz_lang', selectedLang);
    });

    // Sync initial active state for language
    const langBtns = document.querySelectorAll('#groupQuizLang .btn-choice-item');
    langBtns.forEach(btn => {
      if (btn.getAttribute('data-lang') === selectedLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Close handlers
    function closeModal() {
      backdrop.style.display = 'none';
    }

    btnClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && backdrop.style.display !== 'none') {
        closeModal();
      }
    });

    // Start Quiz
    btnStart.addEventListener('click', function () {
      const courseId = courseSelect.value || 'all';
      const isPagesDir = window.location.pathname.includes('/pages/');
      const quizUrl = isPagesDir ? './quiz.html' : './pages/quiz.html';
      const targetUrl = `${quizUrl}?type=custom&course=${encodeURIComponent(courseId)}&source=${encodeURIComponent(selectedSource)}&count=${selectedCount}&diff=${selectedDiff}&timer=${selectedTimer}&lang=${selectedLang}`;
      closeModal();
      window.location.href = targetUrl;
    });

    // Global opener
    window.openCustomQuizModal = function (preselectedCourseId = null, preselectedSource = null) {
      if (preselectedCourseId && courseSelect) {
        courseSelect.value = preselectedCourseId;
      }
      if (preselectedSource) {
        const sourceBtn = document.querySelector(`#groupSourcePillar [data-source="${preselectedSource}"]`);
        if (sourceBtn) sourceBtn.click();
      }
      backdrop.style.display = 'flex';
    };

    // Bind all buttons with class .btn-open-random-quiz
    document.querySelectorAll('.btn-open-random-quiz').forEach(btn => {
      btn.addEventListener('click', function () {
        const course = btn.getAttribute('data-course-id') || null;
        const source = btn.getAttribute('data-source-type') || null;
        window.openCustomQuizModal(course, source);
      });
    });
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomQuizModal);
  } else {
    initCustomQuizModal();
  }

})();
