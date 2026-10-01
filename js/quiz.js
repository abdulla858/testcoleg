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

    // Controls Buttons with localized text
    btnPrev.disabled = currentIndex === 0;
    if (currentQuizLang === 'en') {
      btnPrev.innerHTML = '← Previous';
      btnNext.innerHTML = 'Next →';
      btnSubmit.innerHTML = '✓ Submit Quiz';
    } else if (currentQuizLang === 'both') {
      btnPrev.innerHTML = '← السابق (Previous)';
      btnNext.innerHTML = 'التالي (Next) →';
      btnSubmit.innerHTML = '✓ تسليم الاختبار (Submit)';
    } else {
      btnPrev.innerHTML = '← السابق';
      btnNext.innerHTML = 'التالي →';
      btnSubmit.innerHTML = '✓ تسليم الاختبار';
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
