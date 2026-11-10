# FARTLE

A daily word-ladder game. Get to **FART** in as few steps as possible, changing exactly one letter each move, and every step must be a real word. A new starting word is picked every day.

## Run locally

It's a static site, so any file server works:

```bash
python -m http.server 5173
```

Then open http://localhost:5173.

## Install as an app

FARTLE is a PWA. Host the folder over HTTPS (e.g. GitHub Pages, Netlify), open it in Chrome/Edge/Safari, and use **Install app** / **Add to Home Screen**. It then runs in its own window and works offline. (On localhost, Chrome also offers install.)

## Android app

The Android app is a [Capacitor](https://capacitorjs.com) wrapper around the same web files (`android/`).

Requirements: Node, JDK 17, and the Android SDK (set `sdk.dir` in `android/local.properties`, which is gitignored).

```bash
npm install
npm run sync                     # copies the game into www/ and syncs it into android/
cd android && gradlew.bat assembleDebug    # ./gradlew assembleDebug on macOS/Linux
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. It is debug-signed, which is fine for installing on your own phone; Google Play needs a release-signed build. Capacitor is pinned to v6 because v7 needs JDK 21.

## How it works

- `sw.js` and `manifest.webmanifest` make it an installable, offline PWA.
- `words.js` holds the 4-letter word list, most common first.
- `game.js` builds a word graph, runs a breadth-first search from FART to get each word's shortest distance, and picks the daily start (3 to 6 steps away) from a fixed shuffled order.
- Progress and stats are stored in the browser's `localStorage`.

## Credits

The word list in `words.js` is derived from:

- the [ENABLE](https://github.com/dolph/dictionary) word list (public domain), filtered to 4-letter words;
- [FrequencyWords](https://github.com/hermitdave/FrequencyWords) by hermitdave (CC BY-SA 4.0), used to keep only common words and order them by frequency.

Inspired by Feetle and Poople.
