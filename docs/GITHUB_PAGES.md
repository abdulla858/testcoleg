# دليل النشر على GitHub Pages (Deployment Guide)

## 1. الإعداد الأولي للمستودع (Repository Setup)

1. تأكد من أن جميع ملفات المشروع تم رفعها إلى الفرع الأساسي (عادة `main`).
2. هيكل المسارات يجب أن يكون نسبياً بالكامل لتفادي خطأ المسار الفرعي (Subpath Routing Issue):
   - **الرابط على GitHub Pages:** `https://<USERNAME>.github.io/<REPO_NAME>/`
   - **الخطأ الشائع:** استخدام روابط تبدأ بـ `/` مثل `/css/main.css` أو `/data/questions.json`، مما يجعل المتصفح يطلبها من جذر النطاق `https://<USERNAME>.github.io/css/main.css` فيفشل التحميل (404 Not Found).
   - **الحل المعتمد في المنصة:** استخدام مسارات نسبية تبدأ بـ `./` (مثل `./css/main.css` أو `./data/questions.json` من الصفحة الرئيسية، أو `../css/main.css` من داخل مجلد `pages/`).

---

## 2. خطوات تفعيل GitHub Pages

1. افتح مستودع المشروع على GitHub في المتصفح.
2. انقر على تبويب **Settings** (الإعدادات).
3. من القائمة الجانبية، انقر على **Pages**.
4. تحت قسم **Build and deployment**:
   - **Source:** اختر `Deploy from a branch`.
   - **Branch:** حدد `main` (أو `master`) مع المسار `/ (root)`.
5. انقر على **Save**.
6. انتظر دقيقة إلى دقيقتين حتى يكتمل الـ Action، وسيظهر الرابط الأخضر المباشر:
   `Your site is live at https://<USERNAME>.github.io/<REPO_NAME>/`

---

## 3. قائمة التحقق قبل النشر (Pre-deployment Checklist)
- [ ] التأكد من أن جميع ملفات الـ JSON في المجلد `data/` صالحة نحوياً (Valid JSON).
- [ ] التأكد من عدم وجود بيانات وهمية (Demo Data) في النسخة الإنتاجية.
- [ ] التحقق من أن جميع روابط التنقل والصور والأيقونات تستخدم مسارات نسبية صحيحة.
- [ ] اختبار فتح صفحات التطبيق مباشرة والتأكد من عدم وجود أخطاء في وحدة تحكم المتصفح (Console Errors).
- [ ] تجربة حل اختبار كامل على GitHub Pages للتأكد من قراءة البيانات والتصحيح وعمل `LocalStorage`.
