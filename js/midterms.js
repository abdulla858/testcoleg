/**
 * University Interactive Quiz Platform - Midterm Exams Logic
 */

document.addEventListener('DOMContentLoaded', async function () {
  'use strict';

  const midtermsGrid = document.getElementById('midtermsGrid');
  const searchInput = document.getElementById('midtermSearchInput');
  const courseFilter = document.getElementById('midtermCourseFilter');
  const totalMidtermsBadge = document.getElementById('totalMidtermsBadge');

  const urlParams = new URLSearchParams(window.location.search);
  const preselectedCourse = urlParams.get('course');

  let allMidterms = [];
  let allCourses = [];

  try {
    allMidterms = await DataService.getMidterms();
    allCourses = await DataService.getCourses();
  } catch (e) {
    console.error('Error fetching midterms data:', e);
  }

  function setupFilters() {
    allCourses.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.title;
      if (preselectedCourse === c.id) {
        opt.selected = true;
      }
      courseFilter.appendChild(opt);
    });
  }

  function renderMidterms(filteredMidterms) {
    totalMidtermsBadge.textContent = `${filteredMidterms.length} اختبار نصفي`;

    if (!filteredMidterms || filteredMidterms.length === 0) {
      midtermsGrid.innerHTML = `
        <div class="empty-state w-100" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">📋</div>
          <h2 class="empty-state-title">لا توجد اختبارات نصفية مضافة حالياً</h2>
          <p class="empty-state-desc">
            ${allMidterms.length === 0
              ? 'سيتم إضافة نماذج الميدتيرم المتكاملة (Model A, Model B) في المرحلة السادسة فور استكمال أسئلة المحاضرات.'
              : 'لا توجد اختبارات نصفية تطابق بحثك.'}
          </p>
        </div>
      `;
      return;
    }

    midtermsGrid.innerHTML = filteredMidterms.map(exam => {
      const course = allCourses.find(c => c.id === exam.courseId) || {};

      return `
        <div class="card midterm-card p-3">
          <div class="d-flex align-center justify-between mb-2">
            <span class="badge badge-danger">${course.title || 'مقرر عام'}</span>
            <span class="badge badge-neutral">⏱️ ${exam.durationMinutes || 45} دقيقة</span>
          </div>
          <div class="card-icon-wrapper icon-purple">🎓</div>
          <h3 class="mb-1" style="font-size: 1.25rem;">${exam.title}</h3>
          <p class="text-secondary" style="font-size: 0.9rem; margin-bottom: 1.25rem; flex: 1;">
            ${exam.description || 'محاكاة رسمية شاملة لاختبار منتصف الفصل.'}
          </p>
          <div class="d-flex align-center justify-between pt-2" style="border-top: 1px solid var(--border-subtle); font-size: 0.82rem; color: var(--text-muted);">
            <span>📝 ${exam.questionsCount || 30} سؤال</span>
            <span>نسبة الاجتياز: ${exam.passingPercentage || 60}%</span>
          </div>
          <a href="./quiz.html?type=midterm&id=${exam.id}&course=${exam.courseId || ''}" class="btn btn-danger btn-sm mt-3 w-100">
            بدء الاختبار النصفي الآن ←
          </a>
        </div>
      `;
    }).join('');
  }

  function handleFilter() {
    const query = (searchInput.value || '').trim().toLowerCase();
    const selectedCourse = courseFilter.value;

    const filtered = allMidterms.filter(exam => {
      const matchQuery = !query || 
        (exam.title && exam.title.toLowerCase().includes(query)) ||
        (exam.description && exam.description.toLowerCase().includes(query));

      const matchCourse = selectedCourse === 'all' || exam.courseId === selectedCourse;

      return matchQuery && matchCourse;
    });

    renderMidterms(filtered);
  }

  setupFilters();
  handleFilter();

  searchInput.addEventListener('input', handleFilter);
  courseFilter.addEventListener('change', handleFilter);
});
