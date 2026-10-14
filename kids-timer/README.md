# Time Buddy: a kid-friendly timer

A colorful but calm timer built with plain HTML, CSS and JavaScript. No installs, no build tools.

## Features

- **Three modes**
  - **Countdown:** pick an activity (brush teeth, reading, homework...) or set your own minutes
  - **Focus + Break:** choose focus minutes, break minutes and rounds, and it switches automatically
  - **Stopwatch:** counts up, and the ring fills once every minute
- **Mascot** that changes mood: happy, cheering, sleepy on breaks and pauses, and celebrating at the end
- **Ring color changes** as time runs out: teal, then amber, then coral. Breaks are violet.
- **Big plus and minus buttons** instead of typing numbers
- **Stars** earned for every finished session (saved in the browser)
- **Sound, voice and confetti** when time is up (the sound switch turns off both sound and voice)
- Keeps the screen awake while running (on browsers that support it)
- Light and dark mode, keyboard friendly, and respects "reduce motion" settings

## How to run

Open `index.html` in your browser.

## Put it on GitHub Pages

Put these files in a folder called `kids-timer` inside your repo. After GitHub Pages is on, the app will be at:

```
https://YOUR-USERNAME.github.io/YOUR-REPO/kids-timer/
```

## Project structure

```
kids-timer/
├── index.html   # page structure
├── style.css    # colors, layout, animation
├── script.js    # timer logic (commented in numbered sections)
└── README.md
```

## Where to change things

| I want to... | Edit this |
|---|---|
| Add or change an activity | `ACTIVITIES` list at the top of `script.js` |
| Change the limits (max minutes, rounds) | `SETTING_DEFS` in `script.js` |
| Change the colors | The variables at the top of `style.css` |
| Change the messages the mascot says | The `describe()` function in `script.js` |
| Change the victory tune | The `FANFARE` list in `script.js` |
| Change when the ring turns amber or coral | The `left > ...` numbers in `describe()` |

## Ideas for next steps

- Add a "lap" button to the stopwatch
- Let kids pick the mascot's color
- Add a "hold to repeat" action on the plus and minus buttons
- Add a weekly star chart
- Add a new mode, like "Quiet time" with calming sounds

## License

MIT
