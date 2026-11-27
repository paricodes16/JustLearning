# Pac-Man

A classic Pac-Man clone in plain HTML, CSS and JavaScript. No build step, no dependencies.

## Features

- Four ghosts with their own behaviour: Blinky chases, Pinky ambushes, Inky flanks, Clyde keeps his distance
- Scatter and chase phases, power pellets, frightened ghosts and combo scoring (200, 400, 800, 1600)
- Wrap-around tunnel, instant U-turns, extra life every 10,000 points
- Levels that get faster, with shorter power pellet time
- Best score saved in your browser
- Keyboard and swipe controls, works on phones

## Controls

| Action | Keys | Touch |
| --- | --- | --- |
| Move | Arrow keys or WASD | Swipe |
| Start or retry | Enter or Space | Tap |
| Pause | P or Esc | (pauses when the tab loses focus) |

## Run it locally

Option 1: open `index.html` in your browser.

Option 2: serve the folder (recommended):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Put it on GitHub

1. Create an empty repository on GitHub (for example `pacman`). Leave "Add a README" unchecked.
2. In this folder, run:

```bash
git init
git add .
git commit -m "Add Pac-Man game"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/pacman.git
git push -u origin main
```

## Publish it with GitHub Pages

1. Open your repository on GitHub and go to **Settings > Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Choose branch **main** and folder **/ (root)**, then click **Save**.
4. After a minute, your game is live at `https://YOUR-USERNAME.github.io/pacman/`.

Add that link to your repository description so people can play right away.

## Project structure

```
.
├── index.html   page and HUD markup
├── style.css    layout and arcade styling
├── game.js      game logic, ghost AI and rendering
├── LICENSE      MIT license (put your name in it)
└── README.md
```

## Customise it

- **Maze:** edit the `MAP` array at the top of `game.js`. `#` wall, `.` dot, `o` power pellet, `-` ghost door, `G` ghost house, `P` start. Keep every row the same length.
- **Speed:** tweak the tiles-per-second numbers in `update()` (Pac-Man 6.5, ghosts 5.6, frightened 3.4).
- **Lives and power pellet time:** `newGame()` and the `eat()` function.
- **Colours:** `COLORS` in `game.js` and the variables at the top of `style.css`.

## License

MIT. See [LICENSE](LICENSE). This is a fan project and is not affiliated with Bandai Namco.
