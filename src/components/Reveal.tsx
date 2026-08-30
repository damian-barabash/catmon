import { motion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

const v: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: .6, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 } }),
}
export function Reveal({ children, i = 0, className, as = 'div' }: { children: ReactNode; i?: number; className?: string; as?: 'div' | 'section' | 'li' | 'article' }) {
  const M = motion[as] as typeof motion.div
  return (
    <M className={className} variants={v} custom={i} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}>
      {children}
    </M>
  )
}
