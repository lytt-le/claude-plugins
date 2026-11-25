import { expect, test } from 'claude-code/testing'

import { pose, step } from '../hooks/register'
import type { Crawl } from '../types'

test('crawls back and forth within bounds', async () => {
  let c: Crawl = { tick: 0, x: 0, dir: 1 }
  const dirs = new Set<number>()
  for (let i = 0; i < 400; i++) {
    c = step(c, 20)
    const { start, shape } = pose(c)
    expect(start >= 0 && start + [...shape].length <= 20 + 8 + 2).toBe(true)
    dirs.add(c.dir)
  }
  expect(dirs.size).toBe(2)
})

test('the front end stays put while the rear inches in, both ways', async () => {
  for (const dir of [1, -1] as const) {
    const front = (tick: number) => {
      const { start, shape } = pose({ tick, x: 10, dir })
      return dir === 1 ? start + [...shape].length - 1 : start
    }
    expect(front(2)).toBe(front(0))
    expect(front(3)).toBe(front(0))
    expect(front(5)).toBe(front(0) + dir)
  }
})

test('the back arches mid-cycle and lies flat at rest', async () => {
  expect(pose({ tick: 0, x: 0, dir: 1 }).shape).not.toContain('▀')
  expect(pose({ tick: 3, x: 0, dir: 1 }).shape).toContain('▞▀▀▚')
})

test('draws above the prompt', async $ => {
  for (const surface of ['terminal', 'desktop'] as const) {
    const props = { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 20, bodyColumns: 80 }
    const ui = await $.ui.mount({ plugin: 'caterpillar-pet', surface, component: 'AbovePrompt', props: props as never })
    expect(await ui.find({ type: 'Text' })).toBeDefined()
    await ui.unmount()
  }
})
