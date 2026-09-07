import type { ImgHTMLAttributes } from 'react'

/// `<img>` для файлов из Supabase Storage (логотипы приютов, обложки блога,
/// галереи, аватары).
///
/// `crossOrigin="anonymous"` переводит запрос в CORS-режим без кук — и это не
/// косметика: перед Supabase стоит Cloudflare, который на КАЖДЫЙ ответ шлёт
/// `Set-Cookie: __cf_bm=…; Domain=supabase.co`, а `supabase.co` внесён в Public
/// Suffix List (там регистрируются проекты-поддомены). Куку на публичный суффикс
/// поставить нельзя, поэтому Firefox её отклоняет и пишет в консоль
/// «Кука "__cf_bm" была отклонена из-за некорректного домена». В CORS-режиме без
/// учётных данных браузер `Set-Cookie` не обрабатывает вовсе — ошибки нет.
/// Бакеты отдают `access-control-allow-origin: *`, так что картинки грузятся как
/// прежде. Обычные `fetch` к API этой ошибки не дают: у них по умолчанию
/// `credentials: 'same-origin'`, и куки кросс-доменного ответа игнорируются.
export function MediaImg(props: ImgHTMLAttributes<HTMLImageElement>) {
  return <img crossOrigin="anonymous" {...props} />
}
