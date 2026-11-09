# مشروع Shbace Medical — Capacitor Android

هذا المشروع يضع ملف Shbace Medical الذي أرسلته داخل مجلد `www`، ويجهّزه للتشغيل كتطبيق Android باستخدام Capacitor 8. تم الاحتفاظ بنسخة المصدر الأصلية دون تعديل داخل `source/`.

## محتويات المشروع

- `www/index.html`: ملف التطبيق الذي سيُحمّل داخل التطبيق. التغيير الوحيد مقارنة بالأصل هو إضافة تحميل جسر الاهتزاز المحلي داخل `<head>`.
- `source/SHBACE_MEDICAL_original.html`: نسخة احتياطية مطابقة للملف الأصلي الذي أرسلته.
- `src/native-bridge.js`: يربط الاهتزاز الموجود أصلًا في HTML بإضافة Capacitor Haptics.
- `capacitor.config.ts`: إعدادات Capacitor واسم التطبيق ومعرّفه.
- `setup-android.bat`: إعداد تلقائي على Windows.
- `setup-android.sh`: إعداد تلقائي على macOS / Linux.

## طريقة التشغيل على Windows

1. فك ضغط الملف ZIP على الكمبيوتر.
2. ثبّت Node.js 22 أو أحدث، وثبّت Android Studio مع Android SDK.
3. افتح مجلد `ShbaceMedical_Capacitor_Project`.
4. اضغط مرتين على `setup-android.bat`.
5. بعد فتح المشروع في Android Studio، انتظر اكتمال Gradle Sync، ثم اختر **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

السكربت ينفذ تثبيت المكتبات، وبناء جسر الاهتزاز، وإنشاء مجلد Android إذا لم يكن موجودًا، وإضافة إذن الاهتزاز، ومزامنة المشروع، ثم فتحه في Android Studio.

## أوامر التشغيل يدويًا

من Terminal داخل مجلد المشروع نفّذ الأوامر التالية:

```bash
npm install
npm run build
npx cap add android
node scripts/ensure-vibrate-permission.mjs
npx cap sync android
npx cap open android
```

إذا كان مجلد `android` موجودًا مسبقًا، تخطَّ أمر `npx cap add android` واستخدم `npx cap sync android`.

## بيانات التطبيق الافتراضية

- الاسم: `Shbace Medical`
- Android application ID: `com.shbace.medical`
- مجلد ملفات الويب: `www`
- Capacitor: الإصدار الرئيسي 8

يمكن تغيير الاسم أو المعرّف من `capacitor.config.ts`، لكن إذا تغيّر المعرّف بعد إنشاء مجلد Android فيجب أيضًا تحديث إعدادات المشروع الأصلي.

## ملاحظات مهمة عن الحماية

تغليف HTML داخل APK لا يمنع استخراج الملفات من APK بشكل مطلق. هذا المشروع يمنع الحاجة إلى إرسال ملف HTML منفصل للطلاب، لكنه لا يقدّم حماية تشفير كاملة للكود أو بنك الأسئلة. للحماية الأقوى، يجب نقل بنك الأسئلة أو المحتوى المراد حمايته إلى خادم، وإرساله بعد التحقق من صلاحية المستخدم.

## ما لم يتم إنجازه داخل هذه الحزمة

هذه حزمة مشروع Capacitor الجاهزة للتهيئة، وليست APK مبنيًا. لم يتم إنشاء مجلد `android` الأصلي أو توقيع APK داخل بيئة الإنشاء هذه لأنها تحتاج إلى تنزيل حزم Capacitor وإلى إعداد Android SDK / Android Studio على جهاز البناء. ملف `setup-android.bat` ينفّذ إنشاء مشروع Android ومزامنته تلقائيًا على جهازك.
