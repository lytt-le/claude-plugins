export type Crawl = { tick: number; x: number; dir: 1 | -1 }

declare module 'claude-code' {
  interface PluginState {
    'caterpillar-pet': { crawl: Crawl }
  }
}
