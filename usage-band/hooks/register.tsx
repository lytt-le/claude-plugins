import { atom, read, update } from 'claude-code'
import type { Register, SessionRateLimit } from 'claude-code'

import type { FiveHour } from '../types'

const fiveHour = atom({ plugin: 'usage-band', key: 'fiveHour' } as const, null)

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Plans with a 5-hour window: bar tracks the 5-hour limit, weekly % shown in grey.
// Plans without one: bar tracks the weekly limit and the reset is shown as a day.
function pick(limits: readonly SessionRateLimit[]): FiveHour | null {
  const five = limits.find(l => l.kind === 'five_hour')
  const week = limits.find(l => l.kind === 'seven_day')
  if (five) {
    return {
      window: 'five_hour',
      percent: five.percentUsed,
      resetsAt: five.resetsAt ?? null,
      weekly: week ? week.percentUsed : null,
    }
  }
  if (week) {
    return { window: 'seven_day', percent: week.percentUsed, resetsAt: week.resetsAt ?? null, weekly: null }
  }
  return null
}

function clock(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h % 12 || 12}:${m}${h < 12 ? 'am' : 'pm'}`
}

function day(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return DAYS[d.getDay()] ?? ''
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
    const weeklyOnly = v.window === 'seven_day'
    const pct = Math.round(v.percent)
    const color = pct >= 75 ? 'red' : pct >= 50 ? 'yellow' : 'green'
    const at = v.resetsAt ? (weeklyOnly ? day(v.resetsAt) : clock(v.resetsAt)) : ''
    const label = `${pct}%${at ? ` · resets ${at}` : ''}`
    const weekly = !weeklyOnly && typeof v.weekly === 'number' ? ` · ${Math.round(v.weekly)}%` : ''

    const width = Math.max(0, e.props.bodyColumns - label.length - weekly.length - 1)
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
        {weekly ? <Text color="gray">{weekly}</Text> : null}
      </Box>
    )
  })
}
