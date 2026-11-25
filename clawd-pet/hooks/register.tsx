import { atom, read, update } from 'claude-code'
import type { Register, StateDollar } from 'claude-code'

import type { Mood, Pet } from '../types'

const ORANGE = '#D97757'
const TICK_MS = 250
const BUBBLE_ROOM = 14
const SLEEP_AFTER = (2 * 60 * 1000) / TICK_MS

const INITIAL: Pet = {
  tick: 0,
  x: 2,
  dir: 1,
  mood: 'idle',
  moodUntil: 0,
  bubble: '',
  bubbleUntil: 0,
  lastActive: 0,
}

const petAtom = atom({ plugin: 'clawd-pet', key: 'pet' } as const, INITIAL)
const hiddenAtom = atom({ plugin: 'clawd-pet', key: 'isHidden' } as const, false)

// ── Sizes ────────────────────────────────────────────────────────────────────
export const SIZES = ['tiny', 'small', 'normal', 'large'] as const
export type Size = (typeof SIZES)[number]
export const WIDTH: Record<Size, number> = { tiny: 5, small: 5, normal: 9, large: 18 }

// ── Normal sprite pieces (9 cells wide, the welcome-logo Clawd) ───────────────
const HEAD = {
  open: ' ▐▛███▜▌ ',
  blink: ' ▐█████▌ ',
  sleepy: ' ▐▀███▀▌ ',
  happy: '▝▐▙███▟▌▘',
}
const BODY = {
  rest: '▝▜█████▛▘',
  raised: ' ▜█████▛ ',
  typeL: '▗▜█████▛▘',
  typeR: '▝▜█████▛▖',
}
const LEGS = {
  stand: '  ▘▘ ▝▝  ',
  stepA: '  ▘▘  ▝▝ ',
  stepB: ' ▘▘  ▝▝  ',
  tuck: '   ▘▘▝▝  ',
}

// ── Small pieces (5 cells: head row, then arms+legs in one row) ───────────────
const S_HEAD = { open: '▐▛█▜▌', blink: '▐███▌', sleepy: '▐▀█▀▌', happy: '▐▙█▟▌' }
const S_BODY = {
  rest: '▀▛▀▜▀',
  stepB: '▀▜▀▛▀',
  typeL: '▄▛▀▜▀',
  typeR: '▀▛▀▜▄',
  tucked: '▝▛▀▜▘',
}

const blank = (w: number) => ' '.repeat(w)
const isBlinking = (t: number) => t % 24 === 0 || t % 24 === 2
const isJumpUp = (t: number) => t % 4 < 2

function normalFrame(p: Pet): string[] {
  const t = p.tick
  const B = blank(9)
  switch (p.mood) {
    case 'sleep':
      return [B, HEAD.sleepy, BODY.raised, LEGS.tuck]
    case 'happy':
    case 'loved':
      return isJumpUp(t)
        ? [HEAD.happy, BODY.raised, LEGS.tuck, '  ▔▔▔▔▔  ']
        : [B, HEAD.happy, BODY.raised, LEGS.stand]
    case 'sad':
      return [B, HEAD.sleepy, BODY.rest, LEGS.stand]
    case 'working':
      return [B, t % 16 === 0 ? HEAD.blink : HEAD.open, t % 2 === 0 ? BODY.typeL : BODY.typeR, LEGS.stand]
    default: {
      const walking = (t >> 1) % 2 === 0
      return [
        B,
        isBlinking(t) ? HEAD.blink : HEAD.open,
        BODY.rest,
        walking ? (t % 4 < 2 ? LEGS.stepA : LEGS.stepB) : LEGS.stand,
      ]
    }
  }
}

function smallFrame(p: Pet): string[] {
  const t = p.tick
  const B = blank(5)
  switch (p.mood) {
    case 'sleep':
      return [B, S_HEAD.sleepy, S_BODY.tucked]
    case 'happy':
    case 'loved':
      return isJumpUp(t) ? [S_HEAD.happy, S_BODY.tucked, ' ▔▔▔ '] : [B, S_HEAD.happy, S_BODY.rest]
    case 'sad':
      return [B, S_HEAD.sleepy, S_BODY.rest]
    case 'working':
      return [B, t % 16 === 0 ? S_HEAD.blink : S_HEAD.open, t % 2 === 0 ? S_BODY.typeL : S_BODY.typeR]
    default: {
      const walking = (t >> 1) % 2 === 0
      return [B, isBlinking(t) ? S_HEAD.blink : S_HEAD.open, walking && t % 4 >= 2 ? S_BODY.stepB : S_BODY.rest]
    }
  }
}

function tinyFrame(p: Pet): string[] {
  const t = p.tick
  switch (p.mood) {
    case 'sleep':
    case 'sad':
      return [S_HEAD.sleepy]
    case 'happy':
    case 'loved':
      return [S_HEAD.happy]
    case 'working':
      return [t % 16 === 0 ? S_HEAD.blink : S_HEAD.open]
    default:
      return [isBlinking(t) ? S_HEAD.blink : S_HEAD.open]
  }
}

// Quadrant glyph → [upper-left, upper-right, lower-left, lower-right].
const QUAD: Record<string, string> = {
  ' ': '0000', '▘': '1000', '▝': '0100', '▖': '0010', '▗': '0001',
  '▀': '1100', '▄': '0011', '▌': '1010', '▐': '0101', '▚': '1001',
  '▞': '0110', '▛': '1110', '▜': '1101', '▙': '1011', '▟': '0111', '█': '1111',
}

/** Doubles a quadrant-block sprite: each quarter-cell pixel becomes a full cell. */
export function upscale(rows: string[]): string[] {
  const out: string[] = []
  for (const row of rows) {
    let top = ''
    let bottom = ''
    for (const ch of row) {
      const q = QUAD[ch]
      if (q === undefined) {
        top += ch + ch
        bottom += '  '
        continue
      }
      top += (q[0] === '1' ? '█' : ' ') + (q[1] === '1' ? '█' : ' ')
      bottom += (q[2] === '1' ? '█' : ' ') + (q[3] === '1' ? '█' : ' ')
    }
    out.push(top, bottom)
  }
  return out
}

/** Clawd's rows at a size: every row is WIDTH[size] cells. Pure, so it can be tested. */
export function frame(p: Pet, size: Size = 'normal'): string[] {
  switch (size) {
    case 'tiny':
      return tinyFrame(p)
    case 'small':
      return smallFrame(p)
    case 'large':
      return upscale(normalFrame(p))
    default:
      return normalFrame(p)
  }
}

export function asSize(v: unknown): Size {
  return (SIZES as readonly unknown[]).includes(v) ? (v as Size) : 'normal'
}

/** Advance one tick. `rnd` is injectable for tests. */
export function step(p: Pet, busy: boolean, maxX: number, rnd: () => number = Math.random): Pet {
  const tick = p.tick + 1
  let { x, dir, mood, moodUntil, bubble, bubbleUntil } = p

  const isTemporary = mood === 'happy' || mood === 'sad' || mood === 'loved'
  if (isTemporary && tick >= moodUntil) mood = busy ? 'working' : 'idle'
  if (!isTemporary && busy) mood = 'working'
  if (mood === 'working' && !busy) mood = 'idle'
  if (mood === 'idle' && tick - p.lastActive > SLEEP_AFTER) mood = 'sleep'

  if (bubble && bubbleUntil && tick >= bubbleUntil) {
    bubble = ''
    bubbleUntil = 0
  }

  if (mood === 'idle' && tick % 2 === 0) {
    const r = rnd()
    if (r < 0.04) dir = dir === 1 ? -1 : 1
    else if (r < 0.75) x += dir
    if (x <= 0) (x = 0), (dir = 1)
    if (x >= maxX) (x = maxX), (dir = -1)
  }
  x = Math.max(0, Math.min(x, maxX))

  if (mood === 'working' && !bubbleUntil) bubble = '.'.repeat((tick >> 1) % 4)
  if (mood === 'sleep' && !bubbleUntil) bubble = ['z', 'zZ', 'zZz', ''][(tick >> 2) % 4]!
  if (mood === 'idle' && !bubbleUntil) bubble = ''

  return { ...p, tick, x, dir, mood, moodUntil, bubble, bubbleUntil }
}

function shortTool(name: string): string {
  const base = name.startsWith('mcp__') ? name.split('__').pop() ?? name : name
  return base.length > 12 ? base.slice(0, 11) + '…' : base
}

function feel($: StateDollar, mood: Mood, ticks: number, bubble: string) {
  return update($, petAtom, p => ({
    ...p,
    mood,
    moodUntil: p.tick + ticks,
    bubble,
    bubbleUntil: bubble ? p.tick + ticks : 0,
    lastActive: p.tick,
  }))
}

export const register: Register = on => {
  let busy = false
  let cols = 60
  let spriteW = WIDTH.normal
  let timer: { cancel: () => void } | undefined

  const maxX = () => Math.max(0, cols - spriteW - BUBBLE_ROOM)

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'pet',
      description: 'Pet Clawd, or /pet hide | show | size <tiny|small|normal|large>',
      argumentHint: '[hide|show|size <tiny|small|normal|large>]',
    })
    timer?.cancel()
    timer = $.clock.every(TICK_MS, () => {
      void update($, petAtom, p => step(p, busy, maxX()))
    })
    return next(e)
  })

  on('command.run', { command: 'pet' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === 'hide') {
      await update($, hiddenAtom, () => true)
      return { text: 'Clawd is hiding. /pet show to bring them back.' }
    }
    if (arg === 'size' || arg.startsWith('size ') || (SIZES as readonly string[]).includes(arg)) {
      const want = arg.replace(/^size\s*/, '')
      if (!(SIZES as readonly string[]).includes(want)) {
        const now = asSize(await $.store.get('size'))
        return { text: `Clawd is ${now}. Sizes: ${SIZES.join(', ')} (e.g. /pet size small).` }
      }
      await $.store.set('size', want)
      await update($, hiddenAtom, () => false)
      return { text: `Clawd is now ${want}.` }
    }
    if (arg === 'show') {
      await update($, hiddenAtom, () => false)
      return { text: 'Clawd is back!' }
    }
    if (arg !== '') {
      return { text: `Unknown option "${arg}". Try /pet, /pet hide, /pet show or /pet size <${SIZES.join('|')}>.` }
    }
    await update($, hiddenAtom, () => false)
    await feel($, 'loved', 16, '♥ ♥')
    return { text: 'You pet Clawd. They wiggle happily.' }
  })

  on('prompt.submit', async ($, e, next) => {
    busy = true
    await update($, petAtom, (p): Pet => ({ ...p, mood: 'working', bubble: '', bubbleUntil: 0, lastActive: p.tick })).catch(() => {})
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    await update($, petAtom, p => ({
      ...p,
      bubble: `~ ${shortTool(String(e.tool))}`,
      bubbleUntil: p.tick + 10,
      lastActive: p.tick,
    })).catch(() => {})
    const result = await next(e)
    if ('deny' in result && result.deny !== undefined) await feel($, 'sad', 8, '!').catch(() => {})
    else if (result.isError) await feel($, 'sad', 8, '?!').catch(() => {})
    return result
  })

  on('turn.complete', async ($, e, next) => {
    busy = false
    await feel($, 'happy', 12, '♥')
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, hiddenAtom))) return next(e)

    cols = e.props.bodyColumns
    const size = asSize(await $.store.get('size'))
    spriteW = WIDTH[size]
    const p = await read($, petAtom)
    const rows = frame(p, size)
    const { Box, Text } = $.ui.resolve(e)
    const x = Math.min(p.x, maxX())
    const pad = ' '.repeat(x)
    // Bubble sits beside the topmost drawn row (the head, wherever it is).
    const bubbleRow = Math.max(0, rows.findIndex(r => r.trim() !== ''))

    return (
      <Box flexDirection="column">
        {rows.map((line, i) => (
          <Box key={`r${i}`} flexDirection="row">
            <Text wrap="clip">{pad}</Text>
            <Text color={line.includes('▔') ? undefined : ORANGE} dimColor={line.includes('▔')} wrap="clip">
              {line}
            </Text>
            {i === bubbleRow && p.bubble ? (
              <Text dimColor wrap="clip">
                {' '}
                {p.bubble}
              </Text>
            ) : null}
          </Box>
        ))}
      </Box>
    )
  })
}
