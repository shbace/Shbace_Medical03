# Shbace Medical — حزمة تجهيز iPhone PWA

هذه الإضافة لا تستبدل التطبيق الحالي ولا تلمس بنك الأسئلة أو ملفات Android.

## الملفات

- \`www/manifest.webmanifest\`: هوية التطبيق وسلوك فتحه كتطبيق مستقل.
- \`www/service-worker.js\`: يخزن صفحة التطبيق والملفات المحلية المستخدمة بعد أول تشغيل متصل.
- \`www/pwa-boot.html\`: صفحة تثبيت وتشغيل؛ أيقونة الشاشة الرئيسية تفتح التطبيق الحقيقي بعد تهيئة Service Worker.
- \`.github/workflows/deploy-pwa.yml\`: ينشر محتويات \`www\` على GitHub Pages عند دمج التغييرات في \`main\`.

## النشر

1. ادمج Pull Request الخاص بـ PWA في \`main\`.
2. في GitHub افتح Settings → Pages واجعل Source = GitHub Actions.
3. افتح Actions وتحقق من نجاح **Deploy Shbace Medical PWA**.
4. رابط التطبيق المتوقع:
   \`https://shbace.github.io/Shbace_Medical03/pwa-boot.html\`

## الصلاحيات

تكامل GitHub يحتاج Metadata: Read، Contents: Read and write، Pull requests: Read and write، وWorkflows: Read and write حتى يتمكن من إنشاء الفرع وتعديل ملفات Workflow وفتح PR. وقد تتطلب الإدارة المباشرة لبعض إعدادات Pages صلاحية Pages أو تعديل المصدر من Settings → Pages.

داخل Workflow تُمنح عملية النشر \`contents: read\` و\`pages: write\` و\`id-token: write\` فقط، وهي صلاحيات النشر المطلوبة في GitHub Pages.

## التثبيت على iPhone

افتح رابط \`pwa-boot.html\` في Safari ثم Share → Add to Home Screen، واترك خيار Open as Web App مفعلاً ثم اختر Add.

## الوضع دون إنترنت

افتح التطبيق مرة واحدة والاتصال متاح، وانتظر رسالة Offline support is ready. تُخزّن ملفات JavaScript وCSS والصور والبيانات المحلية عندما يطلبها التطبيق. اختبر وضع الطيران بعد اكتمال أول تحميل.

## حدود معروفة

- إشعارات Capacitor المحلية في Android لا تتحول تلقائياً إلى Web Push على iPhone؛ هذا يحتاج خدمة Push وخادماً.
- العمل دون إنترنت لا يضمن وظائف تعتمد على خدمات خارجية أو روابط PDF خارجية لم تُخزّن مسبقاً.
- يجب اختبار التطبيق على iPhone فعلياً بعد النشر، لأن المحاكاة لا تثبت تجربة Safari وAdd to Home Screen.
