/**
 * University Interactive Quiz Platform - Lectures Page Logic
 * Renders lectures for a specific course and links to interactive quizzes
 * strictly isolated from question banks, models, and midterms.
 */

document.addEventListener('DOMContentLoaded', async function () {
  'use strict';

  const lecturesGrid = document.getElementById('lecturesGrid');
  const searchInput = document.getElementById('lectureSearchInput');
  const countBadge = document.getElementById('lecturesCountBadge');
  const courseCodeBadge = document.getElementById('courseCodeBadge');
  const courseMainTitle = document.getElementById('courseMainTitle');
  const courseDesc = document.getElementById('courseDesc');
  const comprehensiveWrapper = document.getElementById('comprehensiveQuizBtnWrapper');

  const pillarLectures = document.getElementById('pillarLectures');
  const pillarBanks = document.getElementById('pillarBanks');
  const pillarModels = document.getElementById('pillarModels');
  const pillarMidterms = document.getElementById('pillarMidterms');

  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('course') || 'advanced-programming';

  let currentCourse = null;
  let courseLectures = [];
  let lectureQuestions = [];

  try {
    const courses = await DataService.getCourses();
    currentCourse = courses.find(c => c.id === courseId) || courses[0] || {
      id: courseId,
      title: 'المقرر الدراسي',
      code: 'CS'
    };

    // Update Pillars Links
    pillarLectures.href = `./lectures.html?course=${currentCourse.id}`;
    pillarBanks.href = `./question-banks.html?course=${currentCourse.id}`;
    pillarModels.href = `./models.html?course=${currentCourse.id}`;
    pillarMidterms.href = `./midterms.html?course=${currentCourse.id}`;

    // Update Header
    courseCodeBadge.textContent = currentCourse.code || 'مقرر';
    courseMainTitle.textContent = currentCourse.title || 'المقرر الدراسي';
    courseDesc.textContent = currentCourse.description || 'المحاضرات والأسئلة التفاعلية المستخرجة حصرياً من محتوى المحاضرات.';

    // Fetch strictly lecture questions and lectures
    courseLectures = await DataService.getLectures(currentCourse.id);
    lectureQuestions = await DataService.getLectureQuestions(currentCourse.id);

    // Setup Comprehensive Quiz button if lecture questions exist
    if (lectureQuestions && lectureQuestions.length >= 5) {
      comprehensiveWrapper.innerHTML = `
        <a href="./quiz.html?type=comprehensive&course=${currentCourse.id}" class="btn btn-primary">
          🎯 الاختبار الشامل للمحاضرات (${lectureQuestions.length} سؤال)
        </a>
      `;
    }

    renderLectures(courseLectures);
  } catch (error) {
    console.error('Error loading lectures:', error);
  }

  function renderLectures(list) {
    countBadge.textContent = `${list.length} محاضرة`;

    if (!list || list.length === 0) {
      lecturesGrid.innerHTML = `
        <div class="empty-state w-100" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">📖</div>
          <h2 class="empty-state-title">لا توجد محاضرات متاحة حالياً لمقرر ${currentCourse ? currentCourse.title : ''}</h2>
          <p class="empty-state-desc">
            لم يتم رفع أو استخراج أي أسئلة محاضرات بعد. بمجرد إرسال وتصنيف ملفات المحاضرات، ستظهر هنا فوراً مع اختباراتها التفاعلية.
          </p>
        </div>
      `;
      return;
    }

    lecturesGrid.innerHTML = list.map(lecture => {
      const qCount = lectureQuestions.filter(q => q.lectureId === lecture.id).length;

      return `
        <div class="card p-3 d-flex flex-column justify-between">
          <div>
            <div class="d-flex align-center justify-between mb-2">
              <span class="badge badge-primary">المحاضرة ${lecture.number || '#'}</span>
              <span class="badge badge-neutral">${qCount} أسئلة تفاعلية</span>
            </div>
            <h3 class="mb-2" style="font-size: 1.15rem; line-height: 1.4;">${lecture.title}</h3>
            ${lecture.titleEn ? `<div class="text-muted mb-2" style="font-size: 0.85rem; font-family: var(--font-family-en);">${lecture.titleEn}</div>` : ''}
            <p class="text-secondary mb-3" style="font-size: 0.9rem;">
              ${lecture.description || 'أسئلة تفاعلية مبنية مباشرة على محتوى المحاضرة.'}
            </p>
          </div>
          <div>
            <div class="d-flex align-center justify-between pt-2 mb-3" style="border-top: 1px solid var(--border-subtle); font-size: 0.82rem; color: var(--text-muted);">
              <span>📄 المصدر: ${lecture.sourceFile || 'ملف المحاضرة'}</span>
              <span>⏱ بدون مؤقت (مذاكرة)</span>
            </div>
            <a href="./quiz.html?type=lecture&id=${lecture.id}&course=${currentCourse.id}" class="btn btn-primary w-100">
              ابدأ الاختبار التفاعلي (${qCount} سؤال)
            </a>
          </div>
        </div>
      `;
    }).join('');
  }

  // Filter Search
  if (searchInput) {
    searchInput.addEventListener('input', function (e) {
      const q = e.target.value.trim().toLowerCase();
      const filtered = courseLectures.filter(lec => {
        return (lec.title && lec.title.toLowerCase().includes(q)) ||
               (lec.titleEn && lec.titleEn.toLowerCase().includes(q)) ||
               (lec.description && lec.description.toLowerCase().includes(q));
      });
      renderLectures(filtered);
    });
  }
});
