import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Crawl } from '../types'

const TICK_MS = 200
const LEN = 8 // flat body length in cells
const STRIDE = 2 // cells gained per cycle
const GREEN = '#7CB342'

const crawlAtom = atom({ plugin: 'caterpillar-pet', key: 'crawl' } as const, { tick: 0, x: 0, dir: 1 } as Crawl)

/**
 * One inchworm cycle heading right, as [offset from x, shape]. The rear pulls in
 * as the back arches (▞▀▚ is the hump), then the hump rolls forward and flattens
 * as the front reaches out. After the cycle the whole body sits STRIDE further on.
 */
const CYCLE: readonly (readonly [number, string])[] = [
  [0, '▄▄▄▄▄▄▄▄'], // flat
  [0, '▄▄▄▄▄▄▄▄'], // flat (rest)
  [1, '▄▄▞▀▚▄▄'], // back lifts, rear inches in
  [2, '▄▞▀▀▚▄'], // fully arched, rear caught up
  [2, '▄▞▀▀▚▄'], // hold the arch
  [2, '▄▄▄▞▀▚▄'], // arch rolls forward and lowers, front reaches out
]

const mirror = (s: string) =>
  [...s].reverse().map(ch => (ch === '▞' ? '▚' : ch === '▚' ? '▞' : ch)).join('')

/** Where the body starts and what it looks like this tick. Pure, for tests. */
export function pose(c: Crawl): { start: number; shape: string } {
  const [off, shape] = CYCLE[c.tick % CYCLE.length]!
  if (c.dir === 1) return { start: c.x + off, shape }
  // Heading left: same gait mirrored, the front end at the left.
  const rightEnd = off + shape.length - 1
  return { start: c.x + (LEN - 1) - rightEnd, shape: mirror(shape) }
}

/** One tick: at the end of each cycle the body moves on a stride, turning at the edges. */
export function step(c: Crawl, maxX: number): Crawl {
  const tick = c.tick + 1
  let { x, dir } = c
  if (tick % CYCLE.length === 0) {
    x += STRIDE * dir
    if (dir === 1 && x + STRIDE > maxX) dir = -1
    else if (dir === -1 && x - STRIDE < 0) dir = 1
  }
  return { tick, x: Math.max(0, Math.min(x, maxX)), dir }
}

export const register: Register = on => {
  let cols = 60
  let timer: { cancel: () => void } | undefined
  // Leave room for the front end to reach out a stride past the flat body.
  const maxX = () => Math.max(0, cols - LEN - STRIDE)

  on('session.start', async ($, e, next) => {
    timer?.cancel()
    timer = $.clock.every(TICK_MS, () => {
      void update($, crawlAtom, c => step(c, maxX()))
    })
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    cols = e.props.bodyColumns
    const c = await read($, crawlAtom)
    const { start, shape } = pose({ ...c, x: Math.min(c.x, maxX()) })
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="row">
        <Text wrap="clip">{' '.repeat(Math.max(0, start))}</Text>
        <Text color={GREEN} wrap="clip">{shape}</Text>
      </Box>
    )
  })
}
