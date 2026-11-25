import { expect, test } from 'claude-code/testing'

import { frame, SIZES, step, WIDTH } from '../hooks/register'
import type { Pet } from '../types'

const base: Pet = { tick: 0, x: 5, dir: 1, mood: 'idle', moodUntil: 0, bubble: '', bubbleUntil: 0, lastActive: 0 }

test('every size keeps a steady width and height', async () => {
  for (const size of SIZES) {
    const heights = new Set<number>()
    for (const mood of ['idle', 'working', 'happy', 'sad', 'sleep', 'loved'] as const)
      for (let tick = 0; tick < 8; tick++) {
        const rows = frame({ ...base, mood, tick }, size)
        heights.add(rows.length)
        for (const row of rows) expect([...row].length).toBe(WIDTH[size])
      }
    expect(heights.size).toBe(1)
  }
})

test('wanders and stays in bounds', async () => {
  let p = base
  for (let i = 0; i < 400; i++) {
    p = step(p, false, 10, () => 0.5)
    expect(p.x >= 0 && p.x <= 10).toBe(true)
  }
})

test('works while busy, then celebrates and falls asleep later', async () => {
  let p = step(base, true, 10)
  expect(p.mood).toBe('working')
  p = step({ ...p, mood: 'happy', moodUntil: p.tick + 2 }, false, 10)
  expect(p.mood).toBe('happy')
  p = step(step(p, false, 10), false, 10)
  expect(p.mood).toBe('idle')
  p = step({ ...p, tick: 10_000 }, false, 10)
  expect(p.mood).toBe('sleep')
})

test('draws Clawd above the prompt on terminal and desktop, at every size', async ($, on) => {
  let stored: unknown = 'large'
  on('store.get', () => ({ value: stored }) as never)
  for (const size of SIZES) for (const surface of ['terminal', 'desktop'] as const) {
    const props = { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 20, bodyColumns: 80 }
    stored = size
    const ui = await $.ui.mount({ plugin: 'clawd-pet', surface, component: 'AbovePrompt', props: props as never })
    expect(await ui.find({ type: 'Text' })).toBeDefined()
    await ui.unmount()
  }
})
