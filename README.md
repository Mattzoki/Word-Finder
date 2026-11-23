# Word Finder

A browser-based word search game built with plain HTML, CSS and JavaScript. No install, build step or backend needed.

## How to play

1. Open `wordsearch.html` in any modern browser.
2. Click (or touch) and drag across the letters to select a word. Selections can run in any of 8 directions: horizontal, vertical and diagonal, forwards or backwards.
3. Found words are highlighted and crossed off the word list.
4. Find all the words to win. A timer and progress bar track how you're doing.
5. Press **New puzzle** to generate a fresh grid.

## Features

- Randomly generated 10x10 grid with 8 hidden words per puzzle
- Words placed in all 8 directions
- Drag-to-select input using pointer events, so it works with mouse and touch
- Live timer and "found / total" progress bar
- Confetti when you finish
- Error dialog if a grid can't be generated

## Run it locally

```bash
git clone https://github.com/Mattzoki/Word-Finder.git
cd Word-Finder
```

Then open `wordsearch.html` in your browser. The Fredoka font loads from Google Fonts, so an internet connection is needed for the intended look. The game still works without it.

## Project structure

| File | Purpose |
| --- | --- |
| `wordsearch.html` | Page markup |
| `style.css` | Styling |
| `logic.js` | Puzzle generation, word placement, selection handling and game state |

## Customising

At the top of `logic.js`:

- `SIZE`: grid dimensions (default `10`)
- `WORDS_PER_PUZZLE`: how many words are hidden (default `8`)
- `WORD_POOL`: the list of words to draw from. Each word must be no longer than `SIZE` letters.

## License

MIT. See [LICENSE](LICENSE).
