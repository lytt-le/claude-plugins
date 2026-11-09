import { atom, read, update } from 'claude-code'
import type { Register, SessionRateLimit } from 'claude-code'

import type { FiveHour } from '../types'

const fiveHour = atom({ plugin: 'usage-band', key: 'fiveHour' } as const, null)

function pick(limits: readonly SessionRateLimit[]): FiveHour | null {
  const w = limits.find(l => l.kind === 'five_hour')
  return w ? { percent: w.percentUsed, resetsAt: w.resetsAt ?? null } : null
}

function clock(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h % 12 || 12}:${m}${h < 12 ? 'am' : 'pm'}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    const { rateLimits } = await $.session.usage()
    const v = pick(rateLimits)
    if (v) await update($, fiveHour, () => v)
    return result
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) {
      const v = pick(e.rateLimits)
      await update($, fiveHour, () => v)
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const v = await read($, fiveHour)
    if (e.props.hasSurvey || v === null) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const pct = Math.round(v.percent)
    const color = pct >= 75 ? 'red' : pct >= 50 ? 'yellow' : 'green'
    const at = v.resetsAt ? clock(v.resetsAt) : ''
    const label = `${pct}%${at ? ` · resets ${at}` : ''}`

    const width = Math.max(0, e.props.bodyColumns - label.length - 1)
    const filled = Math.min(width, Math.round((Math.min(v.percent, 100) / 100) * width))

    return (
      <Box flexDirection="row">
        <Text color={color} wrap="truncate">
          {'━'.repeat(filled)}
        </Text>
        <Text color="gray" wrap="truncate">
          {'─'.repeat(width - filled)}
        </Text>
        <Text color={color}>
          {' '}
          {label}
        </Text>
      </Box>
    )
  })
}
