# Fartle

A daily word-ladder game. Get to **FART** in as few steps as possible, changing exactly one letter each move, and every step must be a real word. A new starting word is picked every day.

## Run locally

It's a static site, so any file server works:

```bash
python -m http.server 5173
```

Then open http://localhost:5173.

## How it works

- `words.js` holds the 4-letter word list, most common first.
- `game.js` builds a word graph, runs a breadth-first search from FART to get each word's shortest distance, and picks the daily start (3 to 6 steps away) from a fixed shuffled order.
- Progress and stats are stored in the browser's `localStorage`.

## Credits

The word list in `words.js` is derived from:

- the [ENABLE](https://github.com/dolph/dictionary) word list (public domain), filtered to 4-letter words;
- [FrequencyWords](https://github.com/hermitdave/FrequencyWords) by hermitdave (CC BY-SA 4.0), used to keep only common words and order them by frequency.

Inspired by Feetle and Poople.
