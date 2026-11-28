# Chakravyuh

A puzzle game inspired by the Chakravyuh, the multilayer wheel formation from the Mahabharata. The game builds a new wheel maze every time. You enter at the bottom and fight your way to the glowing core.

**Play it:** https://paricodes16.github.io/JustLearning/chakravyuh/

## Maze types

- **Spiral wheel:** a single corridor winds inward like the Halebidu temple carving. Low complexity keeps it close to one long spiral. High complexity breaks it into branches and dead ends.
- **Concentric wheel:** closed rings joined by gaps, like the other seven-layer structure described in the paper.

Set the number of layers (the classic one has 7) and the complexity: Nascent, Easy, Medium or Hard. Nascent spirals have no dead ends at all.

## Modes

- **Commander:** every 6 moves the commander opens one new passage and closes another on your route. The maze is always still solvable, but your plan stops being valid. New walls flash red, new gaps flash teal. This mirrors the paper's idea of restructuring the wheel with roadblocks.
- **Spin:** the whole board slowly rotates. Your controls follow what you see on screen. This echoes the paper's point that relative spinning motion disorients the invader.

## Controls

| Action | Keyboard | Touch or mouse |
| --- | --- | --- |
| Move | Arrow keys or WASD | Swipe, or tap where you want to go |

The Hint button shows the next few steps for 3 seconds. The Solution button toggles the full route. Without Commander mode you get up to three stars based on how close you were to the shortest route.

Each maze has a **seed**. Type a seed and press Enter to replay the exact same maze, or share it with a friend.

## How it trains your mind

Spatial planning, working memory (which branches were dead ends), and flexible thinking when the maze changes under you. Try Hard + Commander + Spin when the basic levels feel easy.

## Run locally

Open `index.html`, or run `python3 -m http.server 8000` in this folder.

## Customise it

Constants are at the top of `app.js`: `NS` (cells per turn), `BIAS` (how strongly spiral mazes follow the spiral) and the layer options in `index.html`.

## Reference

Dutta, K. (2021). Dynamics of an invincible troop formation in ancient open battlefields. *Interdisciplinary Description of Complex Systems*, 19(1), 146-159. DOI: 10.7906/indecs.19.1.12

This game is an interpretation of the paper's ideas (single entrance, spiral layers, restructuring with roadblocks, relative spinning motion). It does not reproduce the paper's equilateral triangle seed construction exactly.
