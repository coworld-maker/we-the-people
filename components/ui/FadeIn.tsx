'use client'

import { motion } from 'framer-motion'

interface Props {
  children: React.ReactNode
  className?: string
  delay?: number          // seconds (e.g. 0.1)
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  duration?: number       // seconds (default 0.45)
  once?: boolean          // only animate once (default true)
}

const OFFSET = 18

const directionMap = {
  up:    { y: OFFSET },
  down:  { y: -OFFSET },
  left:  { x: OFFSET },
  right: { x: -OFFSET },
  none:  {},
}

export default function FadeIn({
  children,
  className,
  delay = 0,
  direction = 'up',
  duration = 0.45,
  once = true,
}: Props) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...directionMap[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: '-40px' }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}
