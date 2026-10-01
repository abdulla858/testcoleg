/**
 * University Interactive Quiz Platform - Results & Review Module
 * Renders score summary, performance metrics, and detailed question review
 * with documented lecture sources and explanations.
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // --- DOM Elements ---
  const resultScorePercentage = document.getElementById('resultScorePercentage');
  const resultScoreFraction = document.getElementById('resultScoreFraction');
  const resultEvaluationTitle = document.getElementById('resultEvaluationTitle');
  const resultQuizTitle = document.getElementById('resultQuizTitle');

  const statCorrectCount = document.getElementById('statCorrectCount');
  const statWrongCount = document.getElementById('statWrongCount');
  const statSkippedCount = document.getElementById('statSkippedCount');
  const statTimeSpent = document.getElementById('statTimeSpent');

  const reviewQuestionsContainer = document.getElementById('reviewQuestionsContainer');
  const filterButtons = document.querySelectorAll('#reviewFilterButtons button');
  const btnRetakeQuiz = document.getElementById('btnRetakeQuiz');

  // --- Load Latest Result ---
  const rawResult = sessionStorage.getItem('uqp_latest_result');
  if (!rawResult) {
    reviewQuestionsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h2 class="empty-state-title">لا توجد نتيجة اختبار حديثة لعرضها</h2>
        <p class="empty-state-desc">يرجى بدء جلسة اختبار أولاً لمشاهدة النتائج والمراجعة التفصيلية.</p>
        <a href="./models.html" class="btn btn-primary">تصفح النماذج التدريبية</a>
      </div>
    `;
    return;
  }

  const result = JSON.parse(rawResult);

  // --- 1. Populate Hero & Metrics ---
  resultScorePercentage.textContent = `${result.scorePercentage}%`;
  resultScoreFraction.textContent = `${result.correctCount} / ${result.totalQuestions}`;
  resultQuizTitle.textContent = `${result.quizTitle} • ${result.courseTitle || 'مقرر عام'}`;

  if (result.passed) {
    resultEvaluationTitle.textContent = '🎉 ممتاز! تم اجتياز الاختبار بنجاح';
    resultEvaluationTitle.style.color = 'var(--success)';
  } else {
    resultEvaluationTitle.textContent = '📖 بحاجة لمزيد من المذاكرة والمراجعة';
    resultEvaluationTitle.style.color = 'var(--warning)';
  }

  statCorrectCount.textContent = result.correctCount;
  statWrongCount.textContent = result.wrongCount;
  statSkippedCount.textContent = result.skippedCount;

  // Format Time Spent
  const mins = Math.floor((result.timeSpentSeconds || 0) / 60);
  const secs = (result.timeSpentSeconds || 0) % 60;
  statTimeSpent.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Retake button
  btnRetakeQuiz.addEventListener('click', function () {
    window.location.href = `./quiz.html?type=${result.quizType}&id=${result.quizId || ''}&course=${result.courseId || ''}`;
  });

  let currentFilter = 'all';
  const savedQuizLang = result.quizLang || localStorage.getItem('uqp_quiz_lang') || 'both';
  let currentResultLang = savedQuizLang;

  function updateResultsHeroText() {
    if (currentResultLang === 'en') {
      resultEvaluationTitle.textContent = result.passed
        ? '🎉 Outstanding! You passed the quiz successfully'
        : '📖 Needs more practice and review';
      resultEvaluationTitle.style.color = result.passed ? 'var(--success)' : 'var(--warning)';
      resultQuizTitle.textContent = `${result.quizTitleEn || result.quizTitle} • ${result.courseTitleEn || result.courseTitle || 'Course'}`;
      btnRetakeQuiz.textContent = '🔄 Retake Quiz';
      const filterAll = document.querySelector('[data-filter="all"]');
      const filterWrong = document.querySelector('[data-filter="wrong"]');
      if (filterAll) filterAll.textContent = 'All Questions';
      if (filterWrong) filterWrong.textContent = 'Mistakes Only';
    } else if (currentResultLang === 'both') {
      resultEvaluationTitle.textContent = result.passed
        ? '🎉 ممتاز! تم اجتياز الاختبار بنجاح (Passed)'
        : '📖 بحاجة لمزيد من المذاكرة والمراجعة (Needs Review)';
      resultEvaluationTitle.style.color = result.passed ? 'var(--success)' : 'var(--warning)';
      resultQuizTitle.textContent = `${result.quizTitle} • ${result.courseTitle || 'مقرر عام'}`;
      btnRetakeQuiz.textContent = '🔄 إعادة المحاولة (Retake)';
      const filterAll = document.querySelector('[data-filter="all"]');
      const filterWrong = document.querySelector('[data-filter="wrong"]');
      if (filterAll) filterAll.textContent = 'الكل (All)';
      if (filterWrong) filterWrong.textContent = 'الأخطاء فقط (Mistakes)';
    } else {
      resultEvaluationTitle.textContent = result.passed
        ? '🎉 ممتاز! تم اجتياز الاختبار بنجاح'
        : '📖 بحاجة لمزيد من المذاكرة والمراجعة';
      resultEvaluationTitle.style.color = result.passed ? 'var(--success)' : 'var(--warning)';
      resultQuizTitle.textContent = `${result.quizTitle} • ${result.courseTitle || 'مقرر عام'}`;
      btnRetakeQuiz.textContent = '🔄 إعادة المحاولة';
      const filterAll = document.querySelector('[data-filter="all"]');
      const filterWrong = document.querySelector('[data-filter="wrong"]');
      if (filterAll) filterAll.textContent = 'الكل';
      if (filterWrong) filterWrong.textContent = 'الأخطاء فقط';
    }
  }

  // --- Setup Language Switcher in Results ---
  const resultLangControl = document.getElementById('resultLangControl');
  if (resultLangControl) {
    const langBtns = resultLangControl.querySelectorAll('.lang-segment-btn');
    langBtns.forEach(btn => {
      if (btn.getAttribute('data-lang') === currentResultLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }

      btn.addEventListener('click', function () {
        const selected = this.getAttribute('data-lang');
        if (selected === currentResultLang) return;
        currentResultLang = selected;
        localStorage.setItem('uqp_quiz_lang', selected);
        langBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        updateResultsHeroText();
        renderReview(currentFilter);
      });
    });
  }

  updateResultsHeroText();

  // --- 2. Render Review Items with Bilingual Support ---
  function renderReview(filter = 'all') {
    currentFilter = filter;
    reviewQuestionsContainer.innerHTML = '';
    const questions = result.questions || [];
    const answers = result.userAnswers || {};

    let visibleCount = 0;

    questions.forEach((q, idx) => {
      const userAnswer = answers[q.id];
      const isSkipped = userAnswer === undefined || userAnswer === '' || (Array.isArray(userAnswer) && userAnswer.length === 0);

      let isCorrect = false;
      if (!isSkipped) {
        if (q.type === 'multiple_select') {
          const correctSet = new Set(Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]);
          const userSet = new Set(userAnswer);
          isCorrect = correctSet.size === userSet.size && [...correctSet].every(x => userSet.has(x));
        } else if (q.type === 'fill_blank') {
          isCorrect = String(q.correctAnswer).trim().toLowerCase() === String(userAnswer).trim().toLowerCase();
        } else {
          isCorrect = userAnswer === q.correctAnswer;
        }
      }

      if (filter === 'wrong' && isCorrect) {
        return; // skip correct answers when filter is wrong only
      }

      visibleCount++;

      const itemCard = document.createElement('div');
      itemCard.className = `review-item ${isCorrect ? 'is-correct' : isSkipped ? 'is-skipped' : 'is-wrong'}`;

      // Status Badges & Labels based on currentResultLang
      let statusHtml = '';
      let qNumText = '';
      let yourAnsLabel = '';
      let correctAnsLabel = '';
      let explanationLabel = '';
      let sourceLabel = '';

      if (currentResultLang === 'en') {
        qNumText = `Question #${idx + 1}`;
        yourAnsLabel = 'Your Answer:';
        correctAnsLabel = 'Correct Answer:';
        explanationLabel = '💡 Explanation:';
        sourceLabel = '📚 Source:';

        if (isCorrect) statusHtml = `<span class="badge badge-success">✓ Correct</span>`;
        else if (isSkipped) statusHtml = `<span class="badge badge-warning">⊘ Skipped</span>`;
        else statusHtml = `<span class="badge badge-danger">✕ Incorrect</span>`;
      } else if (currentResultLang === 'both') {
        qNumText = `سؤال #${idx + 1} • Question #${idx + 1}`;
        yourAnsLabel = 'إجابتك (Your Answer):';
        correctAnsLabel = 'الإجابة الصحيحة (Correct Answer):';
        explanationLabel = '💡 الشرح والتوضيح (Explanation):';
        sourceLabel = '📚 المصدر (Source):';

        if (isCorrect) statusHtml = `<span class="badge badge-success">✓ إجابة صحيحة (Correct)</span>`;
        else if (isSkipped) statusHtml = `<span class="badge badge-warning">⊘ لم يُجب (Skipped)</span>`;
        else statusHtml = `<span class="badge badge-danger">✕ إجابة غير صحيحة (Incorrect)</span>`;
      } else {
        // Arabic
        qNumText = `سؤال #${idx + 1}`;
        yourAnsLabel = 'إجابتك:';
        correctAnsLabel = 'الإجابة الصحيحة:';
        explanationLabel = '💡 الشرح والتوضيح:';
        sourceLabel = '📚 المصدر:';

        if (isCorrect) statusHtml = `<span class="badge badge-success">✓ إجابة صحيحة</span>`;
        else if (isSkipped) statusHtml = `<span class="badge badge-warning">⊘ لم يتم الإجابة</span>`;
        else statusHtml = `<span class="badge badge-danger">✕ إجابة غير صحيحة</span>`;
      }

      // Format Option text
      function formatOptionVal(val) {
        if (val === undefined || val === '' || val === null) return '—';
        if (q.type === 'fill_blank') return val;

        const optionsAr = q.options || [];
        const optionsEn = q.optionsEn || [];

        function formatSingle(itemVal) {
          if (itemVal === undefined || itemVal === null) return '—';
          const arText = optionsAr[itemVal] !== undefined ? optionsAr[itemVal] : itemVal;
          const enText = optionsEn[itemVal] !== undefined ? optionsEn[itemVal] : arText;

          if (currentResultLang === 'en') {
            return `<span dir="ltr" style="font-family: var(--font-family-en);">${enText}</span>`;
          } else if (currentResultLang === 'both') {
            if (enText && enText !== arText) {
              return `${arText} <span class="text-muted" dir="ltr" style="font-size: 0.9em; font-family: var(--font-family-en);">(${enText})</span>`;
            }
            return `${arText}`;
          } else {
            return `${arText}`;
          }
        }

        if (q.type === 'multiple_select' && Array.isArray(val)) {
          return val.map(formatSingle).join('، ');
        }
        return formatSingle(val);
      }

      const userDisplay = formatOptionVal(userAnswer);
      const correctDisplay = formatOptionVal(q.correctAnswer);

      // Question Text formatting
      const qAr = q.questionAr || q.question || '';
      const qEn = q.questionEn || '';
      let questionHtml = '';

      if (currentResultLang === 'en') {
        questionHtml = `<h4 class="mb-3" style="font-size: 1.15rem; line-height: 1.6; direction: ltr; text-align: left; font-family: var(--font-family-en);">${qEn || qAr}</h4>`;
      } else if (currentResultLang === 'both') {
        questionHtml = `
          <div class="question-text-bilingual mb-3">
            <div class="question-text-ar" style="font-size: 1.15rem; line-height: 1.6; font-weight: 700;">${qAr}</div>
            ${qEn && qEn !== qAr ? `<div class="question-text-en" style="font-size: 0.95rem; margin-top: 4px; direction: ltr; text-align: left;">${qEn}</div>` : ''}
          </div>
        `;
      } else {
        questionHtml = `<h4 class="mb-3" style="font-size: 1.15rem; line-height: 1.6;">${qAr}</h4>`;
      }

      // Source Info
      const source = q.source || {};
      const sourceHtml = source.lecture ? `
        <div class="source-pill">
          <span>${sourceLabel}</span>
          <strong>${source.lecture}</strong>
          ${source.page ? `• ص ${source.page}` : ''}
          ${source.section ? `• قسم: ${source.section}` : ''}
        </div>
      ` : '';

      // Explanation formatting
      let explanationHtml = '';
      if (q.explanation) {
        let expContent = q.explanation;
        if (currentResultLang === 'en' && q.explanationEn) {
          expContent = q.explanationEn;
        } else if (currentResultLang === 'both' && q.explanationEn && q.explanationEn !== q.explanation) {
          expContent = `${q.explanation} <div dir="ltr" class="mt-1 text-muted" style="font-family: var(--font-family-en); font-size: 0.88rem;">${q.explanationEn}</div>`;
        }
        explanationHtml = `
          <div class="p-2 mt-2" style="background-color: var(--bg-surface-subtle); border-radius: var(--radius-sm); font-size: 0.9rem; color: var(--text-secondary);">
            <strong>${explanationLabel}</strong> ${expContent}
          </div>
        `;
      }

      itemCard.innerHTML = `
        <div class="d-flex align-center justify-between mb-2">
          <span class="font-bold text-muted" style="font-size: 0.9rem;">${qNumText}</span>
          ${statusHtml}
        </div>
        ${questionHtml}

        <div class="mb-2" style="font-size: 0.95rem;">
          <span class="text-muted">${yourAnsLabel}</span>
          <span class="font-bold ${isCorrect ? 'text-success' : isSkipped ? 'text-warning' : 'text-danger'}">
            ${userDisplay}
          </span>
        </div>

        ${!isCorrect ? `
          <div class="mb-2" style="font-size: 0.95rem;">
            <span class="text-muted">${correctAnsLabel}</span>
            <span class="font-bold text-success">${correctDisplay}</span>
          </div>
        ` : ''}

        ${explanationHtml}
        ${sourceHtml}
      `;

      reviewQuestionsContainer.appendChild(itemCard);
    });

    if (visibleCount === 0) {
      reviewQuestionsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🌟</div>
          <h3 class="empty-state-title">${currentResultLang === 'en' ? 'Excellent! No mistakes found' : 'رائع جداً! لا توجد أي أخطاء في هذا الاختبار'}</h3>
          <p class="empty-state-desc">${currentResultLang === 'en' ? 'You answered all questions correctly (100%).' : 'لقد أجبت عن جميع الأسئلة بصورة صحيحة بنسبة 100%.'}</p>
        </div>
      `;
    }
  }

  // --- 3. Filter Handlers ---
  filterButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      filterButtons.forEach(b => {
        b.classList.remove('active');
        b.classList.remove('btn-outline');
        b.classList.add('btn-ghost');
      });
      btn.classList.add('active');
      btn.classList.remove('btn-ghost');
      btn.classList.add('btn-outline');

      const filterType = btn.getAttribute('data-filter');
      renderReview(filterType);
    });
  });

  renderReview('all');
});
