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

## On-device AI

Select **Load AI model** to download the quantized Gemma 3 270M web model
(about 240 MB). The model is cached in this browser after its first download.
AI inference requires a browser and device with WebGPU support. Gemma is subject
to Google's [Gemma Terms](https://ai.google.dev/gemma/terms); review and accept
the terms at the [model source](https://huggingface.co/litert-community/gemma-3-270m-it)
before loading it. If AI is unavailable, Naturequest continues to show its
built-in Tulsi care advice.

Nature log photos are resized to at most 800 pixels and stored as data URLs in
local storage with their entries. The screen/outside timer counts time while
Naturequest is visible as screen time and hidden as outside time; session
summaries remain available while the app is open.
