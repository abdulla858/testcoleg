/**
 * University Interactive Quiz Platform - Quiz Engine Module
 * Manages active quiz session, questions rendering, timer, answers selection,
 * navigation palette, and submission handling.
 */

document.addEventListener('DOMContentLoaded', async function () {
  'use strict';

  // --- DOM Elements ---
  const quizMainTitle = document.getElementById('quizMainTitle');
  const quizCourseSubtitle = document.getElementById('quizCourseSubtitle');
  const quizTimerWrapper = document.getElementById('quizTimerWrapper');
  const quizTimerDisplay = document.getElementById('quizTimerDisplay');
  const btnExitQuiz = document.getElementById('btnExitQuiz');

  const quizProgressLabel = document.getElementById('quizProgressLabel');
  const quizProgressPercentage = document.getElementById('quizProgressPercentage');
  const quizProgressBar = document.getElementById('quizProgressBar');

  const questionCard = document.getElementById('questionCard');
  const questionNumberBadge = document.getElementById('questionNumberBadge');
  const questionTypeBadge = document.getElementById('questionTypeBadge');
  const questionDifficultyBadge = document.getElementById('questionDifficultyBadge');
  const questionText = document.getElementById('questionText');
  const optionsContainer = document.getElementById('optionsContainer');

  const btnPrev = document.getElementById('btnPrevQuestion');
  const btnNext = document.getElementById('btnNextQuestion');
  const btnSubmit = document.getElementById('btnSubmitQuiz');
  const btnCheckAnswer = document.getElementById('btnCheckAnswer');
  const instantFeedbackBox = document.getElementById('instantFeedbackBox');

  const paletteGrid = document.getElementById('paletteGrid');
  const answeredCountBadge = document.getElementById('answeredCountBadge');

  // --- Query Params & State ---
  const urlParams = new URLSearchParams(window.location.search);
  const quizType = urlParams.get('type') || 'bank'; // 'bank', 'model', 'midterm'
  const targetId = urlParams.get('id');
  const courseIdParam = urlParams.get('course');

  let activeQuizMeta = null;
  let activeQuestions = [];
  let currentIndex = 0;
  let userAnswers = {}; // { [questionId]: answerValue }
  let timerInterval = null;
  let secondsRemaining = 0;
  let timeSpentSeconds = 0;
  let currentQuizLang = localStorage.getItem('uqp_quiz_lang') || 'both'; // 'ar', 'en', 'both'

  const quizLangControl = document.getElementById('quizLangControl');
  function setupLanguageControl() {
    if (!quizLangControl) return;
    const btns = quizLangControl.querySelectorAll('.lang-segment-btn');
    btns.forEach(btn => {
      const l = btn.getAttribute('data-lang');
      if (l === currentQuizLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }

      btn.addEventListener('click', function () {
        currentQuizLang = l;
        localStorage.setItem('uqp_quiz_lang', l);
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderCurrentQuestion();
      });
    });
  }

  // --- 1. Load Quiz Data ---
  async function loadQuizSession() {
    try {
      const courses = await DataService.getCourses();
      const allQuestions = await DataService.getQuestions();

      if (quizType === 'lecture') {
        const lectures = await DataService.getLectures();
        activeQuizMeta = lectures.find(l => l.id === targetId) || {
          title: 'اختبار المحاضرة التفاعلي',
          durationMinutes: 0,
          courseId: courseIdParam
        };
        const course = courses.find(c => c.id === (activeQuizMeta.courseId || courseIdParam)) || {};
        quizMainTitle.textContent = activeQuizMeta.title;
        quizCourseSubtitle.textContent = course.title || 'مقرر عام';

        // Load strictly from lecture questions
        activeQuestions = await DataService.getLectureQuestions(activeQuizMeta.courseId, targetId);

      } else if (quizType === 'comprehensive') {
        // Comprehensive quiz: strictly selected from lecture questions ONLY (Rule #15)
        const course = courses.find(c => c.id === courseIdParam) || {};
        activeQuizMeta = {
          title: `الاختبار الشامل لمقرر ${course.title || ''}`,
          courseId: courseIdParam,
          durationMinutes: 45
        };
        quizMainTitle.textContent = activeQuizMeta.title;
        quizCourseSubtitle.textContent = course.title || 'مقرر عام';

        const lectureQs = await DataService.getLectureQuestions(courseIdParam);
        // Shuffle and pick 30 questions
        activeQuestions = [...lectureQs].sort(() => 0.5 - Math.random()).slice(0, 30);

      } else if (quizType === 'model') {
        const models = await DataService.getModels();
        activeQuizMeta = models.find(m => m.id === targetId) || {
          title: 'نموذج تدريبي',
          durationMinutes: 30,
          questionsCount: 20
        };
        const course = courses.find(c => c.id === activeQuizMeta.courseId) || {};
        quizMainTitle.textContent = activeQuizMeta.title;
        quizCourseSubtitle.textContent = course.title || 'مقرر عام';

        // Load strictly from model-questions.json
        activeQuestions = await DataService.getModelQuestions(activeQuizMeta.courseId, targetId);

      } else if (quizType === 'midterm') {
        const midterms = await DataService.getMidterms();
        activeQuizMeta = midterms.find(m => m.id === targetId) || {
          title: 'اختبار نصفي',
          durationMinutes: 45,
          questionsCount: 30
        };
        const course = courses.find(c => c.id === activeQuizMeta.courseId) || {};
        quizMainTitle.textContent = activeQuizMeta.title;
        quizCourseSubtitle.textContent = course.title || 'مقرر عام';

        // Load strictly from midterm-questions.json
        activeQuestions = await DataService.getMidtermQuestions(activeQuizMeta.courseId, targetId);

      } else if (quizType === 'custom') {
        const sourceParam = urlParams.get('source') || 'all';
        const countParam = parseInt(urlParams.get('count'), 10) || 20;
        const diffParam = urlParams.get('diff') || 'all';
        const timerParam = parseInt(urlParams.get('timer'), 10) || 0;
        const langParam = urlParams.get('lang');

        if (langParam && ['ar', 'en', 'both'].includes(langParam)) {
          currentQuizLang = langParam;
          localStorage.setItem('uqp_quiz_lang', langParam);
        }

        const course = courses.find(c => c.id === courseIdParam) || {};

        const sourceLabels = {
          'all': 'شامل لجميع الأقسام',
          'lectures': 'أسئلة المحاضرات فقط',
          'banks': 'بنوك الأسئلة المعتمدة',
          'models': 'النماذج التدريبية',
          'midterms': 'الاختبارات النصفية'
        };

        const courseTitle = (!courseIdParam || courseIdParam === 'all') ? 'جميع المقررات الدراسية' : (course.title || 'مقرر مخصص');

        activeQuizMeta = {
          title: `اختبار عشوائي مخصص (${sourceLabels[sourceParam] || 'شامل'})`,
          courseId: courseIdParam || 'all',
          durationMinutes: timerParam,
          questionsCount: countParam
        };

        quizMainTitle.textContent = activeQuizMeta.title;
        quizCourseSubtitle.textContent = `${courseTitle} • ${countParam} سؤالاً`;

        activeQuestions = await DataService.getCustomRandomQuestions({
          courseId: courseIdParam,
          source: sourceParam,
          count: countParam,
          difficulty: diffParam
        });

      } else {
        // Question Bank
        const banks = await DataService.getQuestionBanks();
        activeQuizMeta = banks.find(b => b.id === targetId) || {
          title: 'بنك أسئلة',
          durationMinutes: 0
        };
        const course = courses.find(c => c.id === (activeQuizMeta.courseId || courseIdParam)) || {};
        quizMainTitle.textContent = activeQuizMeta.title;
        quizCourseSubtitle.textContent = course.title || 'مقرر عام';

        // Load strictly from bank-questions.json
        activeQuestions = await DataService.getBankQuestions(activeQuizMeta.courseId || courseIdParam, targetId);
      }

      if (!activeQuestions || activeQuestions.length === 0) {
        showEmptyQuizState();
        return;
      }

      // Initialize Timer if duration specified
      if (activeQuizMeta.durationMinutes && activeQuizMeta.durationMinutes > 0) {
        secondsRemaining = activeQuizMeta.durationMinutes * 60;
        quizTimerWrapper.style.display = 'inline-flex';
        updateTimerDisplay();
        startTimer();
      }

      setupLanguageControl();
      buildPalette();
      renderCurrentQuestion();

    } catch (err) {
      console.error('Failed to load quiz session:', err);
      showEmptyQuizState();
    }
  }

  function showEmptyQuizState() {
    questionCard.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h2 class="empty-state-title">لا توجد أسئلة متاحة في هذا القسم حالياً</h2>
        <p class="empty-state-desc">
          لم يتم بعد إضافة أسئلة من المحاضرات لهذا القسم. سيتم تزويد المنصة بالأسئلة تلقائياً في المرحلة الخامسة.
        </p>
        <a href="../index.html" class="btn btn-primary">الرجوع للرئيسية</a>
      </div>
    `;
    paletteGrid.innerHTML = '';
    btnPrev.style.display = 'none';
    btnNext.style.display = 'none';
  }

  // --- 2. Timer Logic ---
  function startTimer() {
    timerInterval = setInterval(() => {
      secondsRemaining--;
      timeSpentSeconds++;
      updateTimerDisplay();

      if (secondsRemaining <= 300) { // 5 minutes remaining
        quizTimerWrapper.classList.add('urgent');
      }

      if (secondsRemaining <= 0) {
        clearInterval(timerInterval);
        alert('انتهى الوقت المحدد للاختبار! سيتم تسليم إجاباتك الآن.');
        submitQuiz();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    quizTimerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // --- 3. Render Question ---
  function renderCurrentQuestion() {
    if (activeQuestions.length === 0) return;

    const question = activeQuestions[currentIndex];
    const total = activeQuestions.length;

    // Update Progress according to language
    const percentage = Math.round(((currentIndex + 1) / total) * 100);
    if (currentQuizLang === 'en') {
      quizProgressLabel.textContent = `Question ${currentIndex + 1} of ${total}`;
      questionNumberBadge.textContent = `Question #${currentIndex + 1}`;
    } else if (currentQuizLang === 'both') {
      quizProgressLabel.textContent = `السؤال ${currentIndex + 1} من ${total} • Q${currentIndex + 1}/${total}`;
      questionNumberBadge.textContent = `سؤال #${currentIndex + 1} • Q#${currentIndex + 1}`;
    } else {
      quizProgressLabel.textContent = `السؤال ${currentIndex + 1} من ${total}`;
      questionNumberBadge.textContent = `سؤال #${currentIndex + 1}`;
    }
    quizProgressPercentage.textContent = `${percentage}%`;
    quizProgressBar.style.width = `${percentage}%`;

    // Update Header Badges
    questionDifficultyBadge.textContent = formatDifficulty(question.difficulty);
    questionTypeBadge.textContent = formatType(question.type);

    // Question Text according to currentQuizLang
    const qAr = question.questionAr || question.question || '';
    const qEn = question.questionEn || '';

    if (currentQuizLang === 'en') {
      questionText.innerHTML = `<div class="question-text-en" style="border: none; padding: 0; font-family: var(--font-family-en); font-size: 1.2rem; line-height: 1.6;">${qEn || qAr}</div>`;
      questionText.style.direction = 'ltr';
      questionText.style.textAlign = 'left';
    } else if (currentQuizLang === 'both') {
      questionText.innerHTML = `
        <div class="question-text-bilingual">
          <div class="question-text-ar">${qAr}</div>
          ${qEn && qEn !== qAr ? `<div class="question-text-en">${qEn}</div>` : ''}
        </div>
      `;
      questionText.style.direction = 'rtl';
      questionText.style.textAlign = 'right';
    } else {
      // 'ar'
      questionText.innerHTML = `<div class="question-text-ar">${qAr}</div>`;
      questionText.style.direction = 'rtl';
      questionText.style.textAlign = 'right';
    }

    // Render Options
    renderOptions(question);

    // Reset instant feedback on question change
    if (instantFeedbackBox) {
      instantFeedbackBox.style.display = 'none';
      instantFeedbackBox.innerHTML = '';
      instantFeedbackBox.className = 'instant-feedback-box';
    }

    // Controls Buttons with localized text
    btnPrev.disabled = currentIndex === 0;
    if (currentQuizLang === 'en') {
      btnPrev.innerHTML = '← Previous';
      btnNext.innerHTML = 'Next →';
      btnSubmit.innerHTML = '✓ Submit Quiz';
      if (btnCheckAnswer) btnCheckAnswer.innerHTML = '💡 Check Answer';
    } else if (currentQuizLang === 'both') {
      btnPrev.innerHTML = '← السابق (Previous)';
      btnNext.innerHTML = 'التالي (Next) →';
      btnSubmit.innerHTML = '✓ تسليم الاختبار (Submit)';
      if (btnCheckAnswer) btnCheckAnswer.innerHTML = '💡 تحقق من الإجابة (Check)';
    } else {
      btnPrev.innerHTML = '← السابق';
      btnNext.innerHTML = 'التالي →';
      btnSubmit.innerHTML = '✓ تسليم الاختبار';
      if (btnCheckAnswer) btnCheckAnswer.innerHTML = '💡 تحقق من الإجابة';
    }

    if (currentIndex === total - 1) {
      btnNext.style.display = 'none';
      btnSubmit.style.display = 'inline-flex';
    } else {
      btnNext.style.display = 'inline-flex';
      btnSubmit.style.display = 'none';
    }

    updatePalette();
  }

  function renderOptions(question) {
    optionsContainer.innerHTML = '';
    const currentAnswer = userAnswers[question.id];

    if (question.type === 'fill_blank') {
      const inputEl = document.createElement('input');
      inputEl.type = 'text';
      inputEl.className = 'search-input mt-2';
      inputEl.placeholder = currentQuizLang === 'en' ? 'Type your answer here...' : 'اكتب الإجابة هنا...';
      inputEl.value = currentAnswer !== undefined ? currentAnswer : '';
      if (currentQuizLang === 'en') {
        inputEl.style.direction = 'ltr';
      }
      inputEl.addEventListener('input', function (e) {
        userAnswers[question.id] = e.target.value.trim();
        updatePalette();
      });
      optionsContainer.appendChild(inputEl);
      return;
    }

    const options = question.options || [];
    const optionsEn = question.optionsEn || [];
    const letters = currentQuizLang === 'en' ? ['A', 'B', 'C', 'D', 'E'] : ['أ', 'ب', 'ج', 'د', 'هـ'];

    options.forEach((optText, optIdx) => {
      const optCard = document.createElement('div');
      optCard.className = 'quiz-option';

      const isSelected = question.type === 'multiple_select'
        ? Array.isArray(currentAnswer) && currentAnswer.includes(optIdx)
        : currentAnswer === optIdx;

      if (isSelected) {
        optCard.classList.add('selected');
      }

      const optAr = optText || '';
      const optEn = optionsEn[optIdx] || '';

      let optionBodyHtml = '';
      if (currentQuizLang === 'en') {
        optionBodyHtml = `<span class="quiz-option-text" style="direction: ltr; text-align: left; font-family: var(--font-family-en);">${optEn || optAr}</span>`;
      } else if (currentQuizLang === 'both') {
        optionBodyHtml = `
          <div class="option-text-bilingual">
            <span class="option-text-ar">${optAr}</span>
            ${optEn && optEn !== optAr ? `<span class="option-text-en">${optEn}</span>` : ''}
          </div>
        `;
      } else {
        optionBodyHtml = `<span class="quiz-option-text">${optAr || optEn}</span>`;
      }

      optCard.innerHTML = `
        <div class="quiz-option-indicator">
          ${isSelected ? '✓' : ''}
        </div>
        <span class="quiz-option-label">${letters[optIdx] || optIdx + 1}</span>
        ${optionBodyHtml}
      `;

      optCard.addEventListener('click', function () {
        selectOption(question, optIdx);
      });

      optionsContainer.appendChild(optCard);
    });
  }

  function selectOption(question, optIdx) {
    if (question.type === 'multiple_select') {
      let selectedList = Array.isArray(userAnswers[question.id]) ? [...userAnswers[question.id]] : [];
      if (selectedList.includes(optIdx)) {
        selectedList = selectedList.filter(i => i !== optIdx);
      } else {
        selectedList.push(optIdx);
      }
      userAnswers[question.id] = selectedList;
    } else {
      userAnswers[question.id] = optIdx;
    }

    renderOptions(question);
    updatePalette();
  }

  // --- 4. Palette Navigation ---
  function buildPalette() {
    paletteGrid.innerHTML = '';
    activeQuestions.forEach((_, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'palette-btn';
      btn.textContent = idx + 1;
      btn.addEventListener('click', function () {
        currentIndex = idx;
        renderCurrentQuestion();
      });
      paletteGrid.appendChild(btn);
    });
    updatePalette();
  }

  function updatePalette() {
    const buttons = paletteGrid.querySelectorAll('.palette-btn');
    let answeredCount = 0;

    activeQuestions.forEach((q, idx) => {
      const btn = buttons[idx];
      if (!btn) return;

      const hasAnswer = userAnswers[q.id] !== undefined && userAnswers[q.id] !== '' &&
        (!Array.isArray(userAnswers[q.id]) || userAnswers[q.id].length > 0);

      btn.classList.toggle('current', idx === currentIndex);
      btn.classList.toggle('answered', hasAnswer);

      if (hasAnswer) answeredCount++;
    });

    if (currentQuizLang === 'en') {
      answeredCountBadge.textContent = `${answeredCount} of ${activeQuestions.length} answered`;
    } else if (currentQuizLang === 'both') {
      answeredCountBadge.textContent = `${answeredCount} من ${activeQuestions.length} مجاب (${answeredCount}/${activeQuestions.length})`;
    } else {
      answeredCountBadge.textContent = `${answeredCount} من ${activeQuestions.length} مجاب`;
    }
  }

  // --- 5. Navigation Controls ---
  btnPrev.addEventListener('click', function () {
    if (currentIndex > 0) {
      currentIndex--;
      renderCurrentQuestion();
    }
  });

  btnNext.addEventListener('click', function () {
    if (currentIndex < activeQuestions.length - 1) {
      currentIndex++;
      renderCurrentQuestion();
    }
  });

  btnSubmit.addEventListener('click', function () {
    const answeredCount = Object.keys(userAnswers).length;
    const total = activeQuestions.length;

    if (answeredCount < total) {
      const diff = total - answeredCount;
      const msg = currentQuizLang === 'en'
        ? `You have ${diff} unanswered question(s). Are you sure you want to submit the quiz now?`
        : `لديك ${diff} أسئلة لم تقم بالإجابة عليها بعد. هل تريد تسليم الاختبار الآن؟`;
      if (!confirm(msg)) {
        return;
      }
    }

    submitQuiz();
  });

  // --- Instant Answer Verification ---
  function checkCurrentAnswer() {
    if (!activeQuestions || activeQuestions.length === 0) return;
    const question = activeQuestions[currentIndex];
    const currentAnswer = userAnswers[question.id];

    const hasAnswer = currentAnswer !== undefined && currentAnswer !== '' &&
      (!Array.isArray(currentAnswer) || currentAnswer.length > 0);

    if (!hasAnswer) {
      if (instantFeedbackBox) {
        instantFeedbackBox.style.display = 'block';
        instantFeedbackBox.className = 'instant-feedback-box is-wrong';
        const noAnsMsg = currentQuizLang === 'en'
          ? '⚠️ Please select or type an answer first to verify!'
          : (currentQuizLang === 'both'
            ? '⚠️ يرجى اختيار إجابة أولاً للتحقق منها (Please select an answer first)'
            : '⚠️ يرجى اختيار إجابة أولاً للتحقق منها!');
        instantFeedbackBox.innerHTML = `
          <div class="feedback-status-title" style="color: var(--danger); font-size: 0.95rem;">
            ${noAnsMsg}
          </div>
        `;
      }
      return;
    }

    // Determine correctness
    let isCorrect = false;
    if (question.type === 'multiple_select') {
      const correctSet = new Set(Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer]);
      const userSet = new Set(currentAnswer);
      isCorrect = correctSet.size === userSet.size && [...correctSet].every(x => userSet.has(x));
    } else if (question.type === 'fill_blank') {
      isCorrect = String(question.correctAnswer).trim().toLowerCase() === String(currentAnswer).trim().toLowerCase();
    } else {
      isCorrect = currentAnswer === question.correctAnswer;
    }

    // Highlight options visually
    const optCards = optionsContainer.querySelectorAll('.quiz-option');
    optCards.forEach((card, idx) => {
      card.classList.remove('reveal-correct', 'reveal-wrong');
      const isThisCorrect = question.type === 'multiple_select'
        ? (Array.isArray(question.correctAnswer) && question.correctAnswer.includes(idx))
        : question.correctAnswer === idx;

      const isThisSelected = question.type === 'multiple_select'
        ? (Array.isArray(currentAnswer) && currentAnswer.includes(idx))
        : currentAnswer === idx;

      if (isThisCorrect) {
        card.classList.add('reveal-correct');
      } else if (isThisSelected && !isThisCorrect) {
        card.classList.add('reveal-wrong');
      }
    });

    // Format Answer representation
    const optionsAr = question.options || [];
    const optionsEn = question.optionsEn || [];

    function formatAnswerVal(ansVal) {
      if (ansVal === undefined || ansVal === '') return '—';
      if (question.type === 'fill_blank') return ansVal;
      if (question.type === 'multiple_select' && Array.isArray(ansVal)) {
        return ansVal.map(i => {
          const ar = optionsAr[i] || i;
          const en = optionsEn[i] || ar;
          if (currentQuizLang === 'en') return en;
          if (currentQuizLang === 'both' && en !== ar) return `${ar} (${en})`;
          return ar;
        }).join('، ');
      }
      const ar = optionsAr[ansVal] || ansVal;
      const en = optionsEn[ansVal] || ar;
      if (currentQuizLang === 'en') return en;
      if (currentQuizLang === 'both' && en !== ar) return `${ar} (${en})`;
      return ar;
    }

    const correctDisplay = formatAnswerVal(question.correctAnswer);

    let statusTitle = '';
    if (isCorrect) {
      statusTitle = currentQuizLang === 'en'
        ? '✓ Correct Answer! Well done.'
        : (currentQuizLang === 'both'
          ? '✓ إجابة صحيحة وممتازة! (Correct Answer)'
          : '✓ إجابة صحيحة وممتازة!');
    } else {
      statusTitle = currentQuizLang === 'en'
        ? '✕ Incorrect Answer'
        : (currentQuizLang === 'both'
          ? '✕ إجابة غير صحيحة (Incorrect Answer)'
          : '✕ إجابة غير صحيحة');
    }

    let correctAnswerHtml = '';
    if (!isCorrect) {
      const label = currentQuizLang === 'en'
        ? 'Correct Answer:'
        : (currentQuizLang === 'both' ? 'الإجابة الصحيحة هي (Correct Answer):' : 'الإجابة الصحيحة هي:');
      correctAnswerHtml = `
        <div class="feedback-correct-answer">
          <strong>${label}</strong> <span class="font-bold text-success">${correctDisplay}</span>
        </div>
      `;
    }

    // Explanation
    let explanationHtml = '';
    if (question.explanation) {
      const label = currentQuizLang === 'en' ? '💡 Explanation:' : '💡 الشرح والتوضيح:';
      let expText = question.explanation;
      if (currentQuizLang === 'en' && question.explanationEn) {
        expText = question.explanationEn;
      } else if (currentQuizLang === 'both' && question.explanationEn && question.explanationEn !== question.explanation) {
        expText = `${question.explanation} <div dir="ltr" class="mt-1 text-muted" style="font-family: var(--font-family-en);">${question.explanationEn}</div>`;
      }
      explanationHtml = `
        <div class="feedback-explanation">
          <strong>${label}</strong> ${expText}
        </div>
      `;
    }

    // Source info
    const source = question.source || {};
    let sourceHtml = '';
    if (source.lecture || source.file) {
      const label = currentQuizLang === 'en' ? '📚 Source:' : '📚 المصدر الموثق:';
      const lectureText = source.lecture || source.file || '';
      sourceHtml = `
        <div class="mt-2 text-muted" style="font-size: 0.85rem;">
          <span>${label}</span> <strong>${lectureText}</strong>
          ${source.page ? `• ص ${source.page}` : ''}
          ${source.section ? `• قسم: ${source.section}` : ''}
        </div>
      `;
    }

    if (instantFeedbackBox) {
      instantFeedbackBox.style.display = 'block';
      instantFeedbackBox.className = `instant-feedback-box ${isCorrect ? 'is-correct' : 'is-wrong'}`;
      instantFeedbackBox.innerHTML = `
        <div class="feedback-status-title" style="color: ${isCorrect ? 'var(--success)' : 'var(--danger)'};">
          ${statusTitle}
        </div>
        ${correctAnswerHtml}
        ${explanationHtml}
        ${sourceHtml}
      `;
    }

    if (btnCheckAnswer) {
      btnCheckAnswer.innerHTML = currentQuizLang === 'en' ? '🔄 Checked' : '🔄 تم التحقق';
    }
  }

  if (btnCheckAnswer) {
    btnCheckAnswer.addEventListener('click', checkCurrentAnswer);
  }

  btnExitQuiz.addEventListener('click', function () {
    const exitMsg = currentQuizLang === 'en'
      ? 'Are you sure you want to exit the quiz session? Your current answers will not be saved.'
      : 'هل أنت متأكد من رغبتك بالخروج من جلسة الاختبار؟ لن يتم حفظ إجاباتك الحالية.';
    if (confirm(exitMsg)) {
      if (timerInterval) clearInterval(timerInterval);
      window.location.href = '../index.html';
    }
  });

  // --- 6. Grading & Submit ---
  function submitQuiz() {
    if (timerInterval) clearInterval(timerInterval);

    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    activeQuestions.forEach(q => {
      const answer = userAnswers[q.id];

      if (answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
        skippedCount++;
        return;
      }

      if (q.type === 'multiple_select') {
        const correctSet = new Set(Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]);
        const userSet = new Set(answer);
        if (correctSet.size === userSet.size && [...correctSet].every(x => userSet.has(x))) {
          correctCount++;
        } else {
          wrongCount++;
        }
      } else if (q.type === 'fill_blank') {
        const expected = String(q.correctAnswer).trim().toLowerCase();
        const userText = String(answer).trim().toLowerCase();
        if (expected === userText) {
          correctCount++;
        } else {
          wrongCount++;
        }
      } else {
        // multiple_choice & true_false
        if (answer === q.correctAnswer) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }
    });

    const totalQuestions = activeQuestions.length;
    const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = scorePercentage >= (activeQuizMeta.passingPercentage || 60);

    const resultPayload = {
      quizId: targetId,
      quizTitle: activeQuizMeta.title,
      quizType: quizType,
      courseId: activeQuizMeta.courseId || courseIdParam,
      courseTitle: quizCourseSubtitle.textContent,
      totalQuestions,
      correctCount,
      wrongCount,
      skippedCount,
      scorePercentage,
      passed,
      timeSpentSeconds,
      completedAt: new Date().toISOString(),
      quizLang: currentQuizLang,
      questions: activeQuestions,
      userAnswers: userAnswers
    };

    // Store in SessionStorage for immediate review in result.html
    sessionStorage.setItem('uqp_latest_result', JSON.stringify(resultPayload));

    // Save to persistent LocalStorage history
    DataService.saveQuizResult(resultPayload);

    // Redirect to Result Page
    window.location.href = './result.html';
  }

  // --- Formatters ---
  function formatDifficulty(diff) {
    if (currentQuizLang === 'en') {
      if (diff === 'easy') return 'Easy';
      if (diff === 'hard') return 'Hard';
      return 'Medium';
    } else if (currentQuizLang === 'both') {
      if (diff === 'easy') return 'سهل (Easy)';
      if (diff === 'hard') return 'صعب (Hard)';
      return 'متوسط (Medium)';
    }
    if (diff === 'easy') return 'سهل';
    if (diff === 'hard') return 'صعب';
    return 'متوسط';
  }

  function formatType(type) {
    if (currentQuizLang === 'en') {
      if (type === 'true_false') return 'True / False';
      if (type === 'multiple_select') return 'Multiple Select';
      if (type === 'fill_blank') return 'Fill in Blank';
      return 'Multiple Choice';
    } else if (currentQuizLang === 'both') {
      if (type === 'true_false') return 'صح أو خطأ (T/F)';
      if (type === 'multiple_select') return 'اختيار متعدد (Multi)';
      if (type === 'fill_blank') return 'ملء الفراغ (Fill)';
      return 'اختيار من متعدد (MCQ)';
    }
    if (type === 'true_false') return 'صح أو خطأ';
    if (type === 'multiple_select') return 'اختيار متعدد';
    if (type === 'fill_blank') return 'ملء الفراغ';
    return 'اختيار من متعدد';
  }

  // Initialize
  loadQuizSession();
});
