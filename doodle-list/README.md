# Doodle List

A colorful, mobile-first to-do app built with plain HTML, CSS and JavaScript. No installs, no build tools.

## Features

- **Swipe gestures:** swipe a card right to finish it, left to delete it (with Undo)
- **Tap the circle** to finish a task, or **tap the card** to edit it
- **Auto icons:** type "buy milk" and a cart appears, "call mom" gives a phone (edit the word list in `script.js`)
- **Color-coded cards:** six colors, with a live preview while you type
- **Today, Later and Done** views with thumb-friendly bottom navigation
- **Progress ring and streak counter** to keep you motivated
- **Focus mode:** shows one task at a time
- **Sparkles and a tiny vibration** when you finish something
- Saves in your browser, works offline, and can be **installed on your phone's home screen**
- Light and dark mode, big tap targets, and respects "reduce motion" settings

## How to run

Open `index.html` in a browser. For the best experience, open it on a phone through GitHub Pages (below).

## Put it on GitHub Pages

Put these files in a folder called `doodle-list` inside your repo. After GitHub Pages is on, your app will be at:

```
https://YOUR-USERNAME.github.io/YOUR-REPO/doodle-list/
```

### Install it on your phone

- **Android (Chrome):** open the link, tap the menu (three dots), then **Install app** or **Add to Home screen**
- **iPhone (Safari):** open the link, tap the Share button, then **Add to Home Screen**

## Project structure

```
doodle-list/
├── index.html      # page structure
├── style.css       # colors, layout, animation
├── script.js       # app logic (commented in numbered sections)
├── manifest.json   # tells phones how to install the app
├── sw.js           # saves a copy for offline use
├── icon-192.png    # app icon
├── icon-512.png    # app icon (large)
└── README.md
```

## Where to change things

| I want to... | Edit this |
|---|---|
| Add icons or keyword matches | `EMOJIS` and `KEYWORDS` at the top of `script.js` |
| Change the colors | The variables at the top of `style.css` |
| Make swipes easier or harder | `SWIPE_DISTANCE` in `script.js` |
| Change the friendly messages | `renderHeader()` in `script.js` |
| Add a seventh task color | `COLORS` in `script.js` and a `[data-color]` rule in `style.css` |

## Troubleshooting

- **My changes don't show up on the live site:** the offline cache is holding the old version. In `sw.js`, change `doodle-list-v1` to `doodle-list-v2`, commit, and reload the page twice.
- **Swiping scrolls the page instead:** drag more sideways than up and down.

## Ideas for next steps

- Due dates and reminders
- Drag to reorder tasks
- Sub-tasks or checklists inside a task
- Export and import your tasks as a file
- Share a list with a friend

## License

MIT
