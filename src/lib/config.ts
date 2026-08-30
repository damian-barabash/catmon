export const SUPABASE_URL = 'https://grdhdjksxkstahjtlqqb.supabase.co'
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZGhkamtzeGtzdGFoanRscXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NTAxMTYsImV4cCI6MjEwMDEyNjExNn0.K8CvWIW5bZJGhVJZfZEsLvbcDPoaHqLzcuSgjSknFlM'
export const SITE_API_URL = `${SUPABASE_URL}/functions/v1/site-api`
export const SITE_URL = 'https://catmongame.app'
export const SUPPORT_EMAIL = 'support@catmongame.app'
export const LANGS = ['en', 'ru', 'pl', 'fr'] as const
export type Lang = (typeof LANGS)[number]
