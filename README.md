# Roblox AI Dev

An AI-powered web app that takes your text prompt, generates Roblox Luau code using NVIDIA's Nemotron model, saves it to a Neon Postgres database, and publishes it live to your Roblox experience via Open Cloud — all from a clean mobile-friendly dark UI.

## Stack
- **Runtime**: Node.js + Express
- **AI**: NVIDIA Nemotron (`nvidia/llama-3.1-nemotron-ultra-253b-v1`) via OpenAI-compatible API
- **Database**: Neon PostgreSQL (via `pg`)
- **Publish**: Roblox Open Cloud API
- **Hosting**: Railway

## How it works
1. You type a prompt (e.g. "Add a spinning part that plays a sound")
2. The server fetches the existing Luau script from the DB
3. Sends existing code + your prompt to Nemotron
4. Saves the new code back to the DB
5. Wraps it in a valid `.rbxlx` XML template
6. POSTs it to Roblox Open Cloud → your place is updated live

## Environment variables (in `.env`)
```
NEON_DATABASE_URL=...
NVIDIA_API_KEY=...
ROBLOX_API_KEY=...
PORT=3000
```

## Run locally
```bash
npm install
npm start
```

## Deploy on Railway
1. Push to GitHub
2. Connect repo in Railway → it auto-detects Node and runs `npm start`
3. All env vars are already in `.env` committed to the repo
