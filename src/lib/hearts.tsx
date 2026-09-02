/**
 * Набор SVG-сердец донат-блока (общий для сайта и админки; те же файлы лежат
 * в приложении — CatMon/assets/hearts). Каждый файл — монохромный path с
 * fill-rule=evenodd, поэтому рисуем его CSS-маской: цвет задаётся снаружи и
 * иконка одинаково выглядит в светлой и тёмной теме.
 */
import type { CSSProperties } from 'react'

export const HEART_KEYS = [
  'cat', 'ears', 'paw', 'pawpad', 'plain', 'outline', 'double', 'ring',
  'ribbon', 'house', 'bandage', 'pulse', 'sparkle', 'wings', 'pixel',
] as const
export type HeartKey = (typeof HEART_KEYS)[number]
export const DEFAULT_HEART: HeartKey = 'cat'

/** Названия для админки (ru) — ключ хранится в world_settings. */
export const HEART_TITLES: Record<HeartKey, string> = {
  cat: 'Кот в сердце',
  ears: 'С ушками',
  paw: 'Лапка',
  pawpad: 'Лапа-сердце',
  plain: 'Классическое',
  outline: 'Контурное',
  double: 'Два сердца',
  ring: 'В кольце',
  ribbon: 'С ошейником',
  house: 'Домик',
  bandage: 'Пластырь',
  pulse: 'Пульс',
  sparkle: 'Искры',
  wings: 'Крылья',
  pixel: 'Пиксельное',
}

export const isHeart = (k: unknown): k is HeartKey => HEART_KEYS.includes(k as HeartKey)
export const heartKey = (k: unknown): HeartKey => (isHeart(k) ? k : DEFAULT_HEART)
export const heartUrl = (k: unknown) => `/game/hearts/heart_${heartKey(k)}.svg`

/** Сердце как закрашиваемая маска: цвет — любой CSS-цвет (по умолчанию текущий). */
export function HeartMark({ name, size = 32, color = 'currentColor', className, style }: {
  name?: string
  size?: number | string
  color?: string
  className?: string
  style?: CSSProperties
}) {
  const url = `url(${heartUrl(name)})`
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: 'inline-block', width: size, height: size, background: color,
        WebkitMaskImage: url, maskImage: url,
        WebkitMaskSize: 'contain', maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center', maskPosition: 'center',
        ...style,
      }}
    />
  )
}
