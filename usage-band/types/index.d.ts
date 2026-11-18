export type FiveHour = { percent: number; resetsAt: string | null; weekly?: number | null }

declare module 'claude-code' {
  interface PluginState {
    'usage-band': { fiveHour: FiveHour | null }
  }
}
