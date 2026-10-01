# توثيق هيكل البيانات (DATA_STRUCTURE.md)

## 1. الفصل الصارم لمصادر البيانات
تطبيقاً لقاعدة عدم خلط مصادر الأسئلة، تم فصل ملفات البيانات داخل مجلد `data/` إلى 9 ملفات أساسية:

```text
data/
│
├── courses.json              # المقررات الدراسية الأساسية
├── lectures.json             # المحاضرات الأكاديمية لكل مقرر
├── lecture-questions.json    # أسئلة تفاعلية مستخرجة حصرياً من المحاضرات
│
├── question-banks.json       # تعريف بنوك الأسئلة المستقلة
├── bank-questions.json       # أسئلة بنوك الأسئلة الأصلية
│
├── models.json               # تعريف النماذج التدريبية المستقلة
├── model-questions.json      # أسئلة النماذج التدريبية
│
├── midterms.json             # تعريف الاختبارات النصفية الرسمية
├── midterm-questions.json    # أسئلة الاختبارات النصفية
│
└── settings.json             # إعدادات النظام والمظهر
```

---

## 2. مخطط كل ملف بيانات

### أ. ملف أسئلة المحاضرات (`lecture-questions.json`)
```json
{
  "id": "adv-l1-q001",
  "sourceType": "lecture",
  "courseId": "advanced-programming",
  "lectureId": "adv-l1",
  "question": "ما هي الميزة الأساسية لـ...",
  "type": "multiple_choice",
  "options": [
    "الخيار الأول",
    "الخيار الثاني",
    "الخيار الثالث",
    "الخيار الرابع"
  ],
  "correctAnswer": 0,
  "explanation": "وفقاً للمحاضرة الأولى: ...",
  "difficulty": "medium",
  "source": {
    "file": "Lecture1.pdf",
    "page": 8,
    "section": "مقدمة البرمجة الشيئية"
  }
}
```

### ب. ملف أسئلة بنوك الأسئلة (`bank-questions.json`)
```json
{
  "id": "adv-bank1-q001",
  "sourceType": "question_bank",
  "courseId": "advanced-programming",
  "bankId": "bank-adv-01",
  "question": "نص السؤال من بنك الأسئلة كما هو",
  "type": "multiple_choice",
  "options": ["أ", "ب", "ج", "د"],
  "correctAnswer": 1,
  "explanation": "حسب حل البنك الأصلي",
  "source": {
    "file": "Advanced_Prog_Bank_2026.pdf",
    "questionNumber": 1
  }
}
```

### ج. ملف أسئلة النماذج (`model-questions.json`)
```json
{
  "id": "adv-model-a-q001",
  "sourceType": "model",
  "courseId": "advanced-programming",
  "modelId": "model-adv-a",
  "question": "سؤال النموذج كما ورد",
  "type": "multiple_choice",
  "options": ["أ", "ب", "ج", "د"],
  "correctAnswer": 2,
  "explanation": "توضيح النموذج الأصلي"
}
```

### د. ملف أسئلة الاختبارات النصفية (`midterm-questions.json`)
```json
{
  "id": "adv-mid-01-q001",
  "sourceType": "midterm",
  "courseId": "advanced-programming",
  "midtermId": "midterm-adv-01",
  "question": "نص سؤال الاختبار النصفي",
  "type": "multiple_choice",
  "options": ["أ", "ب", "ج", "د"],
  "answerStatus": "confirmed", 
  "correctAnswer": 0,
  "source": {
    "file": "Midterm_2026_Actual.pdf"
  }
}
```
*ملاحظة هامة:* إذا كان الاختبار النصفي بدون إجابات رسمية مؤكدة، يوضع `answerStatus: "unknown"` و `correctAnswer: null` احتراماً للأمانة العلمية.
