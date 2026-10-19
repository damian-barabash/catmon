import type { CSSProperties } from 'react'

/**
 * Изометрические «глиняные» сцены игры (public/game/scenes, прозрачный фон).
 * Полный размер ≈1100 px + вариант 560 px (scenes/560/) для карточек и мобилы.
 * Размеры исходников нужны для width/height (без CLS) и srcset.
 */
export const SCENES = {
  ban_arena: [1100, 614], ban_catdex: [1100, 483], ban_chests: [1100, 554],
  ban_market: [1100, 408], ban_quests: [1100, 427], ban_shop: [1100, 467],
  dungeon_1: [972, 781], dungeon_2: [1013, 1000], dungeon_3: [889, 858],
  dungeon_4: [847, 944], dungeon_5: [978, 890],
  exp_cellars: [864, 880], exp_docks: [916, 892], exp_roofs: [915, 839],
  fish_abyss: [1018, 954], fish_calm: [945, 665], fish_shoal: [989, 817],
} as const satisfies Record<string, readonly [number, number]>
export type Scene = keyof typeof SCENES

type Props = {
  scene: Scene
  /** `sizes` для srcset — сколько CSS-пикселей картинка занимает. */
  sizes: string
  className?: string
  /** Цвет мягкого свечения под островом (CSS-цвет); без него свечения нет. */
  glow?: string
  /** Парение (CSS keyframes, transform). Задержка — фаза в секундах. */
  float?: boolean
  phase?: number
  /** Только для LCP-картинки hero. */
  priority?: boolean
  alt?: string
  style?: CSSProperties
}

export function Isle({ scene, sizes, className, glow, float = true, phase = 0, priority, alt = '', style }: Props) {
  const [w, h] = SCENES[scene]
  const vars = { ...(glow ? { '--g': glow } : {}), '--ph': `${-phase}s`, ...style } as CSSProperties
  return (
    <div className={`isle${float ? ' floaty' : ''}${className ? ' ' + className : ''}`} style={vars}>
      {glow && <span className="isle-glow" aria-hidden="true" />}
      <span className="isle-shadow" aria-hidden="true" />
      <span className="isle-float">
        <img
          className="isle-img"
          src={`/game/scenes/560/${scene}.webp`}
          srcSet={`/game/scenes/560/${scene}.webp 560w, /game/scenes/${scene}.webp ${w}w`}
          sizes={sizes}
          width={w}
          height={h}
          alt={alt}
          decoding="async"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          draggable={false}
        />
      </span>
    </div>
  )
}

/** Мелкие парящие кубики (как в сценах): SVG, цвет через --c. */
export type CubeSpec = { c: string; l: string; t: string; s: number; dur: number; delay: number; lg?: boolean }
export function Cubes({ items }: { items: CubeSpec[] }) {
  return (
    <div className="cubes" aria-hidden="true">
      {items.map((b, i) => (
        <svg
          key={i} viewBox="0 0 20 22" className={`cube${b.lg ? ' lg' : ''}`}
          style={{ left: b.l, top: b.t, width: b.s, '--c': b.c, animationDuration: `${b.dur}s`, animationDelay: `${-b.delay}s` } as CSSProperties}
        >
          <path className="ct" d="M10 1.5 18.5 6 10 10.5 1.5 6Z" />
          <path className="cl" d="M1.5 6 10 10.5V20.5L1.5 16Z" />
          <path className="cr" d="M18.5 6 10 10.5V20.5L18.5 16Z" />
        </svg>
      ))}
    </div>
  )
}
