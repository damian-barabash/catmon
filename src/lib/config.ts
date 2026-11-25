export const SUPABASE_URL = 'https://grdhdjksxkstahjtlqqb.supabase.co'
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZGhkamtzeGtzdGFoanRscXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NTAxMTYsImV4cCI6MjEwMDEyNjExNn0.K8CvWIW5bZJGhVJZfZEsLvbcDPoaHqLzcuSgjSknFlM'
export const SITE_API_URL = `${SUPABASE_URL}/functions/v1/site-api`
export const SITE_URL = 'https://catmongame.app'
export const SUPPORT_EMAIL = 'dbdcstudio@gmail.com'
/** Студия-разработчик и фирма, которая обслуживает данные (футер, политики, JSON-LD). */
export const COMPANY = {
  brand: 'DBDC Studio',
  site: 'https://dbdcstudio.pl/',
  legalName: 'Maksym Yehorov Maksikon',
  address: 'ul. Zamiany 18 lok. 46',
  city: '02-786 Warszawa',
  nip: '9512594289',
  regon: '528375783',
} as const
export const LANGS = ['en', 'ru', 'pl', 'fr'] as const
export type Lang = (typeof LANGS)[number]
/** Ссылки на соцсети в футере. Пустая строка — иконка скрыта; если пусты все — блок «Соцсети» не показывается. */
export const SOCIAL_LINKS: { x: string; ig: string; tt: string; yt: string } = { x: '', ig: '', tt: '', yt: '' }
