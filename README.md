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

### Using a phone on your Wi-Fi

Start Vite with `npm run dev -- --host 0.0.0.0`, then open
`http://<computer-LAN-IP>:5173` on the phone. Naturequest sends Ollama requests
to port `11434` on the same host used for the app; `localhost` on the phone
would refer to the phone itself. Find the computer's LAN IP with `ipconfig`.

Ollama must listen on the LAN and allow the exact origin shown in the phone's
address bar. For example, in PowerShell, after quitting the Ollama tray app,
start it with:

```powershell
$env:OLLAMA_HOST = "0.0.0.0:11434"
$env:OLLAMA_ORIGINS = "http://192.168.1.25:5173"
ollama serve
```

Replace `192.168.1.25` with the computer's actual LAN IP. Keep this setup on a
trusted private network, and allow the Ollama port through Windows Firewall
only on the private network profile.

Nature log photos are resized to at most 800 pixels and stored as data URLs in
local storage with their entries. The screen/outside timer counts time while
Naturequest is visible as screen time and hidden as outside time; session
summaries remain available while the app is open.

Nature log entries can also include a short written bird-listening note or an
optional recording of up to 10 seconds. Audio recordings are stored with the
entry in local storage; microphone access is requested only when recording.
