# claude-plugins

Claude Code plugins by lytt-le.

## usage-band

A single unobtrusive line above the Claude Code prompt showing your 5-hour usage limit: a progress bar that fills the width of the window, with the percentage used and the time the window resets at the far right.

```
━━━━━━━━━━━━━━━──────────────────────────────────────────── 23% · resets 3:40pm
```

The used part of the bar and the text are green below 50%, yellow from 50% and red from 75%; the unused part stays grey. The line appears after the first response of a session, on a Claude Pro or Max subscription, in the terminal and the desktop app.

### Install

```
claude plugin install usage-band --marketplace lytt-le/claude-plugins
```

Answer `y` to add the marketplace, then pick the user scope.
