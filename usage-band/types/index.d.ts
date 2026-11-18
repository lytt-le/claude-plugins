export type FiveHour = {
  window?: 'five_hour' | 'seven_day'
  percent: number; resetsAt: string | null; weekly?: number | null }

declare module 'claude-code' {
  interface PluginState {
    'usage-band': { fiveHour: FiveHour | null }
  }
}
