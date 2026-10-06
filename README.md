# 🌱 Naturequest

> Quests for your hands, eyes, and ears. Phone stays in your pocket.

Naturequest gives you small daily quests for your plants (touch the soil,
check the leaves, listen for a bird), then helps you log what you found.
An open-weight Gemma model runs in your browser, so it works offline and
your notes never leave your device.

Built for the DEV Hacktoberfest Open-Source AI Challenge: Week 1 (Touch Grass).

## Why open-source AI?

- Works with no signal
- Your garden data stays on your device
- Swap models or change quest style freely

## Tech

React + Vite, Gemma (in-browser), SQLite/local storage, optional PWA

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`.

## Local AI with Ollama

Naturequest uses the locally installed `gemma3:4b` model through Ollama's API
at `http://localhost:11434`. Install and start Ollama, then download the model:

```sh
ollama pull gemma3:4b
ollama serve
```

In another terminal, run `npm run dev` and choose **Connect to local Gemma**.
If the browser blocks the request because of CORS, allow the local Vite origin
in Ollama's `OLLAMA_ORIGINS` setting (for example,
`http://localhost:5173,http://127.0.0.1:5173`) and restart Ollama. Naturequest
continues to use built-in Tulsi care advice and quests when Ollama is unavailable.

Nature log photos are resized to at most 800 pixels and stored as data URLs in
local storage with their entries. The screen/outside timer counts time while
Naturequest is visible as screen time and hidden as outside time; session
summaries remain available while the app is open.
