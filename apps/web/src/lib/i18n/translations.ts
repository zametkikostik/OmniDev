export type Locale = 'en' | 'ru' | 'bg' | 'uk' | 'th';

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'ru', label: 'Русский', flag: 'RU' },
  { code: 'bg', label: 'Български', flag: 'BG' },
  { code: 'uk', label: 'Українська', flag: 'UA' },
  { code: 'th', label: 'ไทย', flag: 'TH' },
];

export type Dict = {
  appName: string;
  tagline: string;
  statusReady: string;
  statusGenerating: string;
  statusBooting: string;
  statusInstalling: string;
  statusStarting: string;
  statusHealing: string;
  statusEditing: string;
  statusError: string;
  statusBusy: string;
  greeting: string;
  placeholderCreate: string;
  placeholderEdit: string;
  projects: string;
  settings: string;
  team: string;
  admin: string;
  preview: string;
  previewEmpty: string;
  github: string;
  share: string;
  generating: string;
  editing: string;
  doneHmr: string;
  errorPrefix: string;
  readyPreview: string;
  signIn: string;
  templates: { landing: string; saas: string; dashboard: string; portfolio: string };
  settingsTitle: string;
  settingsHint: string;
  backToChat: string;
  adminTitle: string;
  adminHint: string;
  tabLlm: string;
  tabCredits: string;
  tabStats: string;
  tabAudit: string;
  save: string;
  saved: string;
  credits: string;
  apply: string;
  list: string;
  refresh: string;
  load: string;
  empty: string;
  language: string;
  workspaceTitle: string;
  workspaceCreate: string;
  workspaceList: string;
  workspaceInvite: string;
  workspaceReset: string;
  create: string;
  name: string;
};

const en: Dict = {
  appName: 'OmniDev',
  tagline: 'Build apps with AI',
  statusReady: 'Ready',
  statusGenerating: 'Generating...',
  statusBooting: 'WebContainer...',
  statusInstalling: 'npm install...',
  statusStarting: 'dev server...',
  statusHealing: 'Fixing...',
  statusEditing: 'Editing...',
  statusError: 'Error',
  statusBusy: '...',
  greeting: 'Hi! OmniDev: create an app, edit, share, GitHub, team.',
  placeholderCreate: 'Create an app...',
  placeholderEdit: 'Edit...',
  projects: 'Projects',
  settings: 'Settings',
  team: 'Team',
  admin: 'Admin',
  preview: 'Preview',
  previewEmpty: 'Create or upload a screenshot',
  github: 'GitHub',
  share: 'Share',
  generating: 'Generating...',
  editing: 'Editing...',
  doneHmr: 'Done (HMR).',
  errorPrefix: 'Error',
  readyPreview: 'Preview on the right. Edit / Share / GitHub.',
  signIn: 'Sign-In',
  templates: { landing: 'Landing', saas: 'SaaS', dashboard: 'Dashboard', portfolio: 'Portfolio' },
  settingsTitle: 'Settings',
  settingsHint: 'Account & preferences. LLM is configured by admin.',
  backToChat: '← Chat',
  adminTitle: 'Admin',
  adminHint: 'LLM · credits · stats · audit',
  tabLlm: 'LLM',
  tabCredits: 'Credits',
  tabStats: 'Stats',
  tabAudit: 'Audit',
  save: 'Save',
  saved: 'Saved',
  credits: 'Credits',
  apply: 'Apply',
  list: 'List',
  refresh: 'Refresh',
  load: 'Load',
  empty: 'Empty',
  language: 'Language',
  workspaceTitle: 'Teams',
  workspaceCreate: 'Create',
  workspaceList: 'List',
  workspaceInvite: 'Invite',
  workspaceReset: 'Clear active',
  create: 'Create',
  name: 'Name',
};

const ru: Dict = {
  appName: 'OmniDev',
  tagline: 'Создавай приложения с ИИ',
  statusReady: 'Готов',
  statusGenerating: 'Генерирую...',
  statusBooting: 'WebContainer...',
  statusInstalling: 'npm install...',
  statusStarting: 'dev server...',
  statusHealing: 'Исправляю...',
  statusEditing: 'Правки...',
  statusError: 'Ошибка',
  statusBusy: '...',
  greeting: 'Привет! OmniDev: создай приложение, правь, шаринг, GitHub, команда.',
  placeholderCreate: 'Создай приложение...',
  placeholderEdit: 'Правка...',
  projects: 'Проекты',
  settings: 'Настройки',
  team: 'Команда',
  admin: 'Admin',
  preview: 'Превью',
  previewEmpty: 'Создай или загрузи скрин',
  github: 'GitHub',
  share: 'Шаринг',
  generating: 'Генерирую...',
  editing: 'Правки...',
  doneHmr: 'Готово (HMR).',
  errorPrefix: 'Ошибка',
  readyPreview: 'Превью справа. Правь / Шаринг / GitHub.',
  signIn: 'Sign-In',
  templates: { landing: 'Лендинг', saas: 'SaaS', dashboard: 'Дашборд', portfolio: 'Портфолио' },
  settingsTitle: 'Настройки',
  settingsHint: 'Аккаунт и предпочтения. LLM настраивает администратор.',
  backToChat: '← Чат',
  adminTitle: 'Admin',
  adminHint: 'LLM · кредиты · stats · audit',
  tabLlm: 'LLM',
  tabCredits: 'Кредиты',
  tabStats: 'Stats',
  tabAudit: 'Audit',
  save: 'Сохранить',
  saved: 'Сохранено',
  credits: 'Кредиты',
  apply: 'Применить',
  list: 'Список',
  refresh: 'Обновить',
  load: 'Загрузить',
  empty: 'Пусто',
  language: 'Язык',
  workspaceTitle: 'Команды',
  workspaceCreate: 'Создать',
  workspaceList: 'Список',
  workspaceInvite: 'Пригласить',
  workspaceReset: 'Сбросить активную',
  create: 'Создать',
  name: 'Название',
};

const bg: Dict = {
  appName: 'OmniDev',
  tagline: 'Създавай приложения с AI',
  statusReady: 'Готов',
  statusGenerating: 'Генерирам...',
  statusBooting: 'WebContainer...',
  statusInstalling: 'npm install...',
  statusStarting: 'dev server...',
  statusHealing: 'Поправям...',
  statusEditing: 'Редакция...',
  statusError: 'Грешка',
  statusBusy: '...',
  greeting: 'Здравей! OmniDev: създай приложение, редактирай, сподели, GitHub, екип.',
  placeholderCreate: 'Създай приложение...',
  placeholderEdit: 'Редакция...',
  projects: 'Проекти',
  settings: 'Настройки',
  team: 'Екип',
  admin: 'Admin',
  preview: 'Преглед',
  previewEmpty: 'Създай или качи скрийншот',
  github: 'GitHub',
  share: 'Сподели',
  generating: 'Генерирам...',
  editing: 'Редакция...',
  doneHmr: 'Готово (HMR).',
  errorPrefix: 'Грешка',
  readyPreview: 'Преглед вдясно. Редакция / Споделяне / GitHub.',
  signIn: 'Sign-In',
  templates: { landing: 'Лендинг', saas: 'SaaS', dashboard: 'Табло', portfolio: 'Портфолио' },
  settingsTitle: 'Настройки',
  settingsHint: 'Акаунт и предпочитания. LLM се настройва от админ.',
  backToChat: '← Чат',
  adminTitle: 'Admin',
  adminHint: 'LLM · кредити · stats · audit',
  tabLlm: 'LLM',
  tabCredits: 'Кредити',
  tabStats: 'Stats',
  tabAudit: 'Audit',
  save: 'Запази',
  saved: 'Запазено',
  credits: 'Кредити',
  apply: 'Приложи',
  list: 'Списък',
  refresh: 'Обнови',
  load: 'Зареди',
  empty: 'Празно',
  language: 'Език',
  workspaceTitle: 'Екипи',
  workspaceCreate: 'Създай',
  workspaceList: 'Списък',
  workspaceInvite: 'Покани',
  workspaceReset: 'Изчисти активния',
  create: 'Създай',
  name: 'Име',
};

const uk: Dict = {
  appName: 'OmniDev',
  tagline: 'Створюй застосунки з ШІ',
  statusReady: 'Готовий',
  statusGenerating: 'Генерую...',
  statusBooting: 'WebContainer...',
  statusInstalling: 'npm install...',
  statusStarting: 'dev server...',
  statusHealing: 'Виправляю...',
  statusEditing: 'Правки...',
  statusError: 'Помилка',
  statusBusy: '...',
  greeting: 'Привіт! OmniDev: створи застосунок, редагуй, шаринг, GitHub, команда.',
  placeholderCreate: 'Створи застосунок...',
  placeholderEdit: 'Правка...',
  projects: 'Проєкти',
  settings: 'Налаштування',
  team: 'Команда',
  admin: 'Admin',
  preview: 'Превʼю',
  previewEmpty: 'Створи або завантаж скрін',
  github: 'GitHub',
  share: 'Поділитись',
  generating: 'Генерую...',
  editing: 'Правки...',
  doneHmr: 'Готово (HMR).',
  errorPrefix: 'Помилка',
  readyPreview: 'Превʼю справа. Правки / Шаринг / GitHub.',
  signIn: 'Sign-In',
  templates: { landing: 'Лендінг', saas: 'SaaS', dashboard: 'Дашборд', portfolio: 'Портфоліо' },
  settingsTitle: 'Налаштування',
  settingsHint: 'Акаунт і налаштування. LLM налаштовує адміністратор.',
  backToChat: '← Чат',
  adminTitle: 'Admin',
  adminHint: 'LLM · кредити · stats · audit',
  tabLlm: 'LLM',
  tabCredits: 'Кредити',
  tabStats: 'Stats',
  tabAudit: 'Audit',
  save: 'Зберегти',
  saved: 'Збережено',
  credits: 'Кредити',
  apply: 'Застосувати',
  list: 'Список',
  refresh: 'Оновити',
  load: 'Завантажити',
  empty: 'Порожньо',
  language: 'Мова',
  workspaceTitle: 'Команди',
  workspaceCreate: 'Створити',
  workspaceList: 'Список',
  workspaceInvite: 'Запросити',
  workspaceReset: 'Скинути активну',
  create: 'Створити',
  name: 'Назва',
};

const th: Dict = {
  appName: 'OmniDev',
  tagline: 'สร้างแอปด้วย AI',
  statusReady: 'พร้อม',
  statusGenerating: 'กำลังสร้าง...',
  statusBooting: 'WebContainer...',
  statusInstalling: 'npm install...',
  statusStarting: 'dev server...',
  statusHealing: 'กำลังแก้...',
  statusEditing: 'กำลังแก้ไข...',
  statusError: 'ข้อผิดพลาด',
  statusBusy: '...',
  greeting: 'สวัสดี! OmniDev: สร้างแอป แก้ไข แชร์ GitHub ทีม',
  placeholderCreate: 'สร้างแอป...',
  placeholderEdit: 'แก้ไข...',
  projects: 'โปรเจกต์',
  settings: 'ตั้งค่า',
  team: 'ทีม',
  admin: 'Admin',
  preview: 'พรีวิว',
  previewEmpty: 'สร้างหรืออัปโหลดสกรีนช็อต',
  github: 'GitHub',
  share: 'แชร์',
  generating: 'กำลังสร้าง...',
  editing: 'กำลังแก้ไข...',
  doneHmr: 'เสร็จ (HMR)',
  errorPrefix: 'ข้อผิดพลาด',
  readyPreview: 'พรีวิวด้านขวา แก้ไข / แชร์ / GitHub',
  signIn: 'Sign-In',
  templates: { landing: 'แลนดิง', saas: 'SaaS', dashboard: 'แดชบอร์ด', portfolio: 'พอร์ตโฟลิโอ' },
  settingsTitle: 'ตั้งค่า',
  settingsHint: 'บัญชีและการตั้งค่า LLM ตั้งโดยแอดมิน',
  backToChat: '← แชท',
  adminTitle: 'Admin',
  adminHint: 'LLM · เครดิต · stats · audit',
  tabLlm: 'LLM',
  tabCredits: 'เครดิต',
  tabStats: 'Stats',
  tabAudit: 'Audit',
  save: 'บันทึก',
  saved: 'บันทึกแล้ว',
  credits: 'เครดิต',
  apply: 'ใช้',
  list: 'รายการ',
  refresh: 'รีเฟรช',
  load: 'โหลด',
  empty: 'ว่าง',
  language: 'ภาษา',
  workspaceTitle: 'ทีม',
  workspaceCreate: 'สร้าง',
  workspaceList: 'รายการ',
  workspaceInvite: 'เชิญ',
  workspaceReset: 'ล้างทีมที่เลือก',
  create: 'สร้าง',
  name: 'ชื่อ',
};

export const DICTS: Record<Locale, Dict> = { en, ru, bg, uk, th };

export function t(locale: Locale): Dict {
  return DICTS[locale] || DICTS.en;
}
