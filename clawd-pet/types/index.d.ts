export type Mood = 'idle' | 'working' | 'happy' | 'sad' | 'sleep' | 'loved'

export type Pet = {
  tick: number
  x: number
  dir: 1 | -1
  mood: Mood
  /** Tick at which a temporary mood (happy/sad/loved) ends. */
  moodUntil: number
  /** Short text shown beside Clawd's head, or empty. */
  bubble: string
  bubbleUntil: number
  /** Tick of the last activity, for falling asleep. */
  lastActive: number
}

declare module 'claude-code' {
  interface PluginState {
    'clawd-pet': { pet: Pet; isHidden: boolean }
  }
}
