export type FiveHour = { percent: number; resetsAt: string | null }

declare module 'claude-code' {
  interface PluginState {
    'usage-band': { fiveHour: FiveHour | null }
  }
}
