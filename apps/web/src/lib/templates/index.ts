export type TemplateId = 'landing' | 'saas' | 'dashboard' | 'portfolio';

export interface TemplateMeta {
  id: TemplateId;
  title: string;
  titleRu: string;
  description: string;
  seedPrompt: string;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: 'landing',
    title: 'Landing',
    titleRu: 'Лендинг',
    description: 'Hero, features, pricing',
    seedPrompt:
      'Создай современный тёмный лендинг: hero с CTA, блок фич (3 карточки), pricing (3 тарифа), footer. Next.js App Router + Tailwind.',
  },
  {
    id: 'saas',
    title: 'SaaS',
    titleRu: 'SaaS',
    description: 'Sidebar, dashboard, billing',
    seedPrompt:
      'Создай SaaS-оболочку: sidebar, dashboard с метриками, таблица пользователей-заглушка, billing. Тёмная тема, Next.js + Tailwind.',
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    titleRu: 'Дашборд',
    description: 'KPI, tables, charts',
    seedPrompt:
      'Создай admin dashboard: topbar, sidebar, KPI cards, графики-заглушки, таблица. Next.js + Tailwind.',
  },
  {
    id: 'portfolio',
    title: 'Portfolio',
    titleRu: 'Портфолио',
    description: 'Projects grid, about',
    seedPrompt:
      'Создай сайт-портфолио: about, grid проектов, contact. Минимализм, Next.js + Tailwind.',
  },
];

export function getTemplate(id: string) {
  return TEMPLATES.find((t) => t.id === id);
}
