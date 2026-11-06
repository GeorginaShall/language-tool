export type UiLang = "en" | "ar";

export const translations = {
  // Nav
  "nav.dashboard": { en: "Dashboard", ar: "لوحة التحكم" },
  "nav.websites": { en: "Websites", ar: "المواقع" },
  "nav.newScan": { en: "New Scan", ar: "فحص جديد" },
  "nav.scanResults": { en: "Scan Results", ar: "نتائج الفحص" },
  "nav.translationIssues": { en: "Translation Issues", ar: "مشاكل الترجمة" },
  "nav.rtlAudit": { en: "RTL Audit", ar: "تدقيق RTL" },
  "nav.seoHreflang": { en: "SEO & hreflang", ar: "السيو وhreflang" },
  "nav.settings": { en: "Settings", ar: "الإعدادات" },
  "nav.product": { en: "Multilingual Website Checker", ar: "فاحص المواقع متعددة اللغات" },

  // Topbar
  "topbar.search": { en: "Search…", ar: "بحث…" },
  "topbar.searchShortcut": { en: "Search websites, pages, issues…", ar: "ابحث في المواقع والصفحات والمشاكل…" },

  // Common actions
  "action.newScan": { en: "New Scan", ar: "فحص جديد" },
  "action.startScan": { en: "Start Scan", ar: "بدء الفحص" },
  "action.viewPage": { en: "View page", ar: "عرض الصفحة" },
  "action.markResolved": { en: "Mark as resolved", ar: "وضع علامة كمحلول" },
  "action.ignore": { en: "Ignore", ar: "تجاهل" },
  "action.reopen": { en: "Reopen", ar: "إعادة فتح" },
  "action.copy": { en: "Copy", ar: "نسخ" },
  "action.copied": { en: "Copied", ar: "تم النسخ" },
  "action.addWebsite": { en: "Scan a Page", ar: "فحص صفحة" },
  "action.removeWebsite": { en: "Remove website", ar: "إزالة الموقع" },
  "action.addLanguage": { en: "Add language", ar: "إضافة لغة" },
  "action.cancel": { en: "Cancel", ar: "إلغاء" },
  "action.close": { en: "Close", ar: "إغلاق" },
  "action.previousIssue": { en: "Previous issue", ar: "المشكلة السابقة" },
  "action.nextIssue": { en: "Next issue", ar: "المشكلة التالية" },

  // Filters
  "filter.severity": { en: "Severity", ar: "الخطورة" },
  "filter.category": { en: "Category", ar: "الفئة" },
  "filter.language": { en: "Language", ar: "اللغة" },
  "filter.page": { en: "Page", ar: "الصفحة" },
  "filter.status": { en: "Status", ar: "الحالة" },
  "filter.all": { en: "All", ar: "الكل" },
  "filter.open": { en: "Open", ar: "مفتوح" },
  "filter.resolved": { en: "Resolved", ar: "محلول" },
  "filter.ignored": { en: "Ignored", ar: "متجاهل" },
  "filter.search": { en: "Search issues…", ar: "ابحث في المشاكل…" },

  // Dashboard
  "dashboard.title": { en: "Multilingual Website Checker", ar: "فاحص المواقع متعددة اللغات" },
  "dashboard.subtitle": {
    en: "Audit your multilingual websites for translation, RTL, SEO, and localization issues.",
    ar: "دقّق مواقعك متعددة اللغات لاكتشاف مشاكل الترجمة وRTL والسيو والتوطين.",
  },
  "dashboard.websites": { en: "Websites", ar: "المواقع" },
  "dashboard.totalScans": { en: "Total Scans", ar: "إجمالي الفحوصات" },
  "dashboard.translationIssues": { en: "Translation Issues", ar: "مشاكل الترجمة" },
  "dashboard.rtlIssues": { en: "RTL Issues", ar: "مشاكل RTL" },
  "dashboard.recentScans": { en: "Recent Scans", ar: "الفحوصات الأخيرة" },

  // Table headers
  "table.website": { en: "Website", ar: "الموقع" },
  "table.languages": { en: "Languages", ar: "اللغات" },
  "table.lastScan": { en: "Last Scan", ar: "آخر فحص" },
  "table.issues": { en: "Issues", ar: "المشاكل" },
  "table.status": { en: "Status", ar: "الحالة" },
  "table.page": { en: "Page", ar: "الصفحة" },
  "table.element": { en: "Element", ar: "العنصر" },
  "table.severity": { en: "Severity", ar: "الخطورة" },

  // Empty states
  "empty.websites.title": { en: "No pages scanned yet", ar: "لم يتم فحص أي صفحة بعد" },
  "empty.websites.body": {
    en: "Enter a page URL and its language. The checker finds the page's other language versions and audits translations, RTL, and SEO.",
    ar: "أدخل رابط الصفحة ولغتها. يعثر الفاحص على نسخ الصفحة بلغات أخرى ويدقق الترجمة وRTL والسيو.",
  },
  "empty.issues.title": { en: "No issues found", ar: "لم يتم العثور على مشاكل" },
  "empty.issues.body": { en: "Nothing matches the current filters.", ar: "لا يوجد ما يطابق عوامل التصفية الحالية." },
  "empty.scans.title": { en: "No scans yet", ar: "لا توجد فحوصات بعد" },
  "empty.search.title": { en: "No results", ar: "لا توجد نتائج" },

  // Settings
  "settings.title": { en: "Settings", ar: "الإعدادات" },
  "settings.appearance": { en: "Appearance", ar: "المظهر" },
  "settings.interfaceLanguage": { en: "Interface language", ar: "لغة الواجهة" },
} as const;

export type TranslationKey = keyof typeof translations;

export function translate(key: TranslationKey, lang: UiLang): string {
  return translations[key]?.[lang] ?? String(key);
}
