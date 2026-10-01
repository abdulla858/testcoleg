/**
 * University Interactive Quiz Platform - Courses Page Logic
 * Supports multi-stage filtering (Years 1, 2, 3, 4) and 4-pillar navigation
 */

document.addEventListener('DOMContentLoaded', async function () {
  'use strict';

  const coursesGrid = document.getElementById('coursesGrid');
  const searchInput = document.getElementById('courseSearchInput');
  const levelFilter = document.getElementById('courseLevelFilter');
  const totalCoursesBadge = document.getElementById('totalCoursesBadge');
  const stageTabs = document.getElementById('stageTabs');

  let allCourses = [];
  let allLectures = [];
  let allQuestions = [];
  let allBanks = [];
  let allModels = [];
  let allMidterms = [];

  let currentStage = 'all';

  try {
    allCourses = await DataService.getCourses();
    allLectures = await DataService.getLectures();
    allQuestions = await DataService.getQuestions();
    allBanks = await DataService.getQuestionBanks();
    allModels = await DataService.getModels();
    allMidterms = await DataService.getMidterms();
  } catch (e) {
    console.error('Error fetching course data:', e);
  }

  // Check URL parameters for pre-selected stage
  const urlParams = new URLSearchParams(window.location.search);
  const stageParam = urlParams.get('stage');
  if (stageParam) {
    currentStage = stageParam;
  }

  // Populate level filter options dynamically
  function setupFilters() {
    const levels = [...new Set(allCourses.map(c => c.level).filter(Boolean))];
    levels.forEach(lvl => {
      const opt = document.createElement('option');
      opt.value = lvl;
      opt.textContent = lvl;
      levelFilter.appendChild(opt);
    });

    if (currentStage !== 'all') {
      levelFilter.value = currentStage;
      updateActiveTab(currentStage);
    }
  }

  function updateActiveTab(stage) {
    if (!stageTabs) return;
    const tabs = stageTabs.querySelectorAll('.stage-tab');
    tabs.forEach(tab => {
      if (tab.getAttribute('data-stage') === stage) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  // Render course cards
  function renderCourses(filteredCourses) {
    totalCoursesBadge.textContent = `${filteredCourses.length} مادة معروضة`;

    if (!filteredCourses || filteredCourses.length === 0) {
      coursesGrid.innerHTML = `
        <div class="empty-state w-100" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">📚</div>
          <h2 class="empty-state-title">لا توجد مواد تطابق خيارات التصفية</h2>
          <p class="empty-state-desc">
            ${allCourses.length === 0 
              ? 'سيتم ظهور المواد وتفاصيلها هنا تلقائياً بمجرد استيراد ملفات المقررات.' 
              : 'جرب اختيار مرحلة دراسية أخرى أو إزالة نص البحث.'}
          </p>
        </div>
      `;
      return;
    }

    coursesGrid.innerHTML = filteredCourses.map(course => {
      const lecturesCount = allLectures.filter(l => l.courseId === course.id).length;
      const questionsCount = allQuestions.filter(q => q.courseId === course.id).length;
      const banksCount = allBanks.filter(b => b.courseId === course.id).length;
      const modelsCount = allModels.filter(m => m.courseId === course.id).length;
      const midtermsCount = allMidterms.filter(m => m.courseId === course.id).length;

      const isActive = course.active !== false;

      return `
        <div class="card course-card p-3 d-flex flex-column justify-between ${!isActive ? 'opacity-90' : ''}">
          <div>
            <div class="d-flex align-center justify-between mb-2">
              <span class="badge badge-primary">${course.code || 'مقرر'}</span>
              <div class="d-flex align-center gap-1">
                <span class="badge badge-neutral">${course.level || 'عام'}</span>
                ${isActive ? '<span class="badge badge-easy">نشط</span>' : '<span class="badge badge-warning">قيد الإعداد</span>'}
              </div>
            </div>
            
            <h3 class="mb-1" style="font-size: 1.25rem;">${course.title}</h3>
            <div class="text-muted mb-2" style="font-size: 0.85rem; font-family: var(--font-family-en);">${course.titleEn || ''}</div>
            
            <p class="text-secondary" style="font-size: 0.92rem; margin-bottom: 1.25rem;">
              ${course.description || 'لا يوجد وصف متاح للمادة حالياً.'}
            </p>
          </div>

          <div>
            <div class="d-flex align-center justify-between pt-2 mb-3" style="border-top: 1px solid var(--border-subtle); font-size: 0.82rem; color: var(--text-muted); flex-wrap: wrap; gap: 0.5rem;">
              <span>📖 ${lecturesCount} محاضرات (${questionsCount} سؤال)</span>
              <span>🗂️ ${banksCount} بنوك</span>
              <span>📝 ${modelsCount} نماذج</span>
              <span>🎯 ${midtermsCount} نصفي</span>
            </div>

            ${isActive ? `
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                <a href="./lectures.html?course=${course.id}" class="btn btn-primary btn-sm" style="text-align: center;">
                  📖 المحاضرات
                </a>
                <a href="./question-banks.html?course=${course.id}" class="btn btn-outline btn-sm" style="text-align: center;">
                  🗂️ بنوك الأسئلة
                </a>
                <a href="./models.html?course=${course.id}" class="btn btn-outline btn-sm" style="text-align: center;">
                  📝 النماذج
                </a>
                <a href="./midterms.html?course=${course.id}" class="btn btn-outline btn-sm" style="text-align: center;">
                  🎯 النصفية
                </a>
              </div>
            ` : `
              <div class="p-2 text-center" style="background-color: var(--bg-surface-subtle); border-radius: var(--radius-md); font-size: 0.85rem; color: var(--text-muted);">
                ⏳ مقرر في الخطة الدراسية، سيتم تفعيل أسئلته فور توفر ملفات الدفعة.
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  function handleFilter() {
    const query = (searchInput.value || '').trim().toLowerCase();
    const selectedLevel = levelFilter.value;

    const filtered = allCourses.filter(course => {
      const matchQuery = !query || 
        (course.title && course.title.toLowerCase().includes(query)) ||
        (course.titleEn && course.titleEn.toLowerCase().includes(query)) ||
        (course.code && course.code.toLowerCase().includes(query));
      
      const matchLevel = selectedLevel === 'all' || course.level === selectedLevel;

      return matchQuery && matchLevel;
    });

    renderCourses(filtered);
  }

  // Handle stage tab clicks
  if (stageTabs) {
    stageTabs.addEventListener('click', function (e) {
      const tab = e.target.closest('.stage-tab');
      if (!tab) return;
      const stage = tab.getAttribute('data-stage');
      currentStage = stage;
      levelFilter.value = stage;
      updateActiveTab(stage);
      handleFilter();
    });
  }

  setupFilters();
  handleFilter();

  searchInput.addEventListener('input', handleFilter);
  levelFilter.addEventListener('change', function () {
    currentStage = levelFilter.value;
    updateActiveTab(currentStage);
    handleFilter();
  });
});
