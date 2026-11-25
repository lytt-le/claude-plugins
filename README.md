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

## clawd-pet

A little orange Clawd who lives in the band above the Claude Code prompt, like a desktop pet.

```
 ▐▛███▜▌  ~ Bash
▝▜█████▛▘
  ▘▘ ▝▝
```

- **Idle:** wanders left and right, blinking.
- **Working:** stands still and types while Claude runs a turn, with a bubble naming each tool it calls.
- **Errors:** looks glum with a `!` when a tool fails or is denied.
- **Done:** hops with a ♥ when the turn finishes.
- **Bored:** dozes off (`zZz`) after two minutes with nothing happening.

Commands: `/pet` to pet Clawd, `/pet hide`, `/pet show`, and `/pet size <tiny|small|normal|large>` (remembered across sessions). Collapse the band with ctrl+x ctrl+a.

### Install

```
claude plugin install clawd-pet --marketplace lytt-le/claude-plugins
```

Or at the Claude Code prompt: `/plugin install clawd-pet --marketplace lytt-le/claude-plugins`. Answer `y` to add the marketplace, then pick the user scope.

## caterpillar-pet

A tiny green caterpillar that inches back and forth along the band above the prompt, the way a real inchworm moves: it arches its back to pull its rear end in, then rolls the hump forward and flattens out as its front end reaches ahead. It turns around at each edge.

```
▄▄▄▄▄▄▄▄   →   ▄▞▀▀▚▄   →   ▄▄▄▞▀▚▄   →   ▄▄▄▄▄▄▄▄
```

### Install

```
claude plugin install caterpillar-pet --marketplace lytt-le/claude-plugins
```

Or at the Claude Code prompt: `/plugin install caterpillar-pet --marketplace lytt-le/claude-plugins`. Answer `y` to add the marketplace, then pick the user scope.
