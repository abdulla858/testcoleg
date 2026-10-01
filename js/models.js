/**
 * University Interactive Quiz Platform - Training Models Logic
 */

document.addEventListener('DOMContentLoaded', async function () {
  'use strict';

  const modelsGrid = document.getElementById('modelsGrid');
  const searchInput = document.getElementById('modelSearchInput');
  const courseFilter = document.getElementById('modelCourseFilter');
  const totalModelsBadge = document.getElementById('totalModelsBadge');

  const urlParams = new URLSearchParams(window.location.search);
  const preselectedCourse = urlParams.get('course');

  let allModels = [];
  let allCourses = [];

  try {
    allModels = await DataService.getModels();
    allCourses = await DataService.getCourses();
  } catch (e) {
    console.error('Error fetching models data:', e);
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

  function renderModels(filteredModels) {
    totalModelsBadge.textContent = `${filteredModels.length} نموذج جاهز`;

    if (!filteredModels || filteredModels.length === 0) {
      modelsGrid.innerHTML = `
        <div class="empty-state w-100" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">⏱️</div>
          <h2 class="empty-state-title">لا توجد نماذج تدريبية حالياً</h2>
          <p class="empty-state-desc">
            ${allModels.length === 0
              ? 'سيتم إتاحة النماذج التدريبية الجاهزة في المرحلة السادسة فور استكمال أسئلة المحاضرات.'
              : 'لا توجد نماذج تطابق بحثك.'}
          </p>
        </div>
      `;
      return;
    }

    modelsGrid.innerHTML = filteredModels.map(model => {
      const course = allCourses.find(c => c.id === model.courseId) || {};

      return `
        <div class="card model-card p-3">
          <div class="d-flex align-center justify-between mb-2">
            <span class="badge badge-warning">${course.title || 'مقرر عام'}</span>
            <span class="badge badge-neutral">⏱️ ${model.durationMinutes || 30} دقيقة</span>
          </div>
          <div class="card-icon-wrapper icon-amber">🎯</div>
          <h3 class="mb-1" style="font-size: 1.2rem;">${model.title}</h3>
          <p class="text-secondary" style="font-size: 0.9rem; margin-bottom: 1.25rem; flex: 1;">
            ${model.description || 'نموذج تدريبي شامل محدد بوقت وعدد أسئلة.'}
          </p>
          <div class="d-flex align-center justify-between pt-2" style="border-top: 1px solid var(--border-subtle); font-size: 0.82rem; color: var(--text-muted);">
            <span>📝 ${model.questionsCount || 20} سؤال</span>
            <span>نسبة النجاح: ${model.passingPercentage || 60}%</span>
          </div>
          <a href="./quiz.html?type=model&id=${model.id}&course=${model.courseId || ''}" class="btn btn-primary btn-sm mt-3 w-100">
            بدء هذا النموذج ←
          </a>
        </div>
      `;
    }).join('');
  }

  function handleFilter() {
    const query = (searchInput.value || '').trim().toLowerCase();
    const selectedCourse = courseFilter.value;

    const filtered = allModels.filter(model => {
      const matchQuery = !query || 
        (model.title && model.title.toLowerCase().includes(query)) ||
        (model.description && model.description.toLowerCase().includes(query));

      const matchCourse = selectedCourse === 'all' || model.courseId === selectedCourse;

      return matchQuery && matchCourse;
    });

    renderModels(filtered);
  }

  setupFilters();
  handleFilter();

  searchInput.addEventListener('input', handleFilter);
  courseFilter.addEventListener('change', handleFilter);
});
