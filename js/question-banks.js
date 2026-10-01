/**
 * University Interactive Quiz Platform - Question Banks Logic
 */

document.addEventListener('DOMContentLoaded', async function () {
  'use strict';

  const banksGrid = document.getElementById('banksGrid');
  const searchInput = document.getElementById('bankSearchInput');
  const courseFilter = document.getElementById('bankCourseFilter');
  const difficultyFilter = document.getElementById('bankDifficultyFilter');
  const totalBanksBadge = document.getElementById('totalBanksBadge');

  const urlParams = new URLSearchParams(window.location.search);
  const preselectedCourse = urlParams.get('course');

  let allBanks = [];
  let allCourses = [];
  let allQuestions = [];

  try {
    allBanks = await DataService.getQuestionBanks();
    allCourses = await DataService.getCourses();
    allQuestions = await DataService.getQuestions();
  } catch (e) {
    console.error('Error fetching banks data:', e);
  }

  // Setup course filter options
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

  function renderBanks(filteredBanks) {
    totalBanksBadge.textContent = `${filteredBanks.length} بنك أسئلة`;

    if (!filteredBanks || filteredBanks.length === 0) {
      banksGrid.innerHTML = `
        <div class="empty-state w-100" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">📝</div>
          <h2 class="empty-state-title">لا توجد بنوك أسئلة متاحة</h2>
          <p class="empty-state-desc">
            ${allBanks.length === 0 
              ? 'سيتم توليد بنوك الأسئلة وربطها بالمحاضرات تلقائياً بمجرد إرسال المحاضرات.' 
              : 'لا توجد بنوك تطابق خيارات البحث الحالية.'}
          </p>
        </div>
      `;
      return;
    }

    banksGrid.innerHTML = filteredBanks.map(bank => {
      const course = allCourses.find(c => c.id === bank.courseId) || {};
      const bankQuestions = allQuestions.filter(q => {
        if (bank.lectureId) {
          return q.courseId === bank.courseId && q.lectureId === bank.lectureId;
        }
        return q.courseId === bank.courseId;
      });

      return `
        <div class="card bank-card p-3">
          <div class="d-flex align-center justify-between mb-2">
            <span class="badge badge-primary">${course.title || 'مقرر عام'}</span>
            <span class="badge badge-${bank.difficulty || 'medium'}">${bank.difficulty || 'متوسط'}</span>
          </div>
          <div class="card-icon-wrapper icon-emerald">📑</div>
          <h3 class="mb-1" style="font-size: 1.2rem;">${bank.title}</h3>
          <p class="text-secondary" style="font-size: 0.9rem; margin-bottom: 1.25rem; flex: 1;">
            ${bank.description || 'بنك أسئلة تدريبي مخصص.'}
          </p>
          <div class="d-flex align-center justify-between pt-2" style="border-top: 1px solid var(--border-subtle); font-size: 0.82rem; color: var(--text-muted);">
            <span>📊 ${bankQuestions.length} سؤال متاح</span>
            <span>🎯 تدريب حر</span>
          </div>
          <a href="./quiz.html?type=bank&id=${bank.id}&course=${bank.courseId || ''}" class="btn btn-primary btn-sm mt-3 w-100">
            بدء التدريب الآن ←
          </a>
        </div>
      `;
    }).join('');
  }

  function handleFilter() {
    const query = (searchInput.value || '').trim().toLowerCase();
    const selectedCourse = courseFilter.value;
    const selectedDiff = difficultyFilter.value;

    const filtered = allBanks.filter(bank => {
      const matchQuery = !query || 
        (bank.title && bank.title.toLowerCase().includes(query)) ||
        (bank.description && bank.description.toLowerCase().includes(query));

      const matchCourse = selectedCourse === 'all' || bank.courseId === selectedCourse;
      const matchDiff = selectedDiff === 'all' || bank.difficulty === selectedDiff;

      return matchQuery && matchCourse && matchDiff;
    });

    renderBanks(filtered);
  }

  setupFilters();
  handleFilter();

  searchInput.addEventListener('input', handleFilter);
  courseFilter.addEventListener('change', handleFilter);
  difficultyFilter.addEventListener('change', handleFilter);
});
