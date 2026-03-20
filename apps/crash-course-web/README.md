# Crash Course Learning — Web App

A simple browser-based learning app powered by the Claude API. Designed for comfort: large text, clean layout, no clutter.

## What it does

Type a question or topic and choose:

- **Quick Answer** — compiled summary with sources (or interactive Q&A that narrows down your specific situation)
- **Full Crash Course** — structured modules (1–12) from basics to advanced, generated in real time

## How to run

### Option 1: Open directly (simplest)

Just open `index.html` in your browser. Note: due to browser CORS restrictions on local files, you may need to use a local server.

### Option 2: Local server (recommended)

```bash
# Using Node.js (npx)
cd apps/crash-course-web
npx serve .

# Or using Python
python3 -m http.server 8080
```

Then open `http://localhost:3000` (or `:8080`) in your browser.

## Setup

1. Open the app
2. Click the ⚙️ gear icon (top right)
3. Paste your Claude API key (get one at console.anthropic.com)
4. Click Save — your key is stored only in your browser

## Features

- **Two main modes**: Quick Answer and Full Crash Course
- **Interactive mode**: Ask follow-up questions to narrow down your specific situation
- **Module sidebar**: Jump between modules in a crash course
- **Module filter**: Search within module titles
- **Modify module**: Add context to any module and regenerate it
- **Export**: Print or save as PDF
- **Streaming**: Content appears as it's written — no waiting

## API Key

Your API key is stored in `localStorage` and only ever sent to `api.anthropic.com`. It is never stored on any server.

You'll need a Claude API key. Sign up at [console.anthropic.com](https://console.anthropic.com).

## Requirements

- Modern browser (Chrome, Firefox, Safari, Edge)
- A Claude API key

No build step, no npm install, no server required beyond a basic file server.
