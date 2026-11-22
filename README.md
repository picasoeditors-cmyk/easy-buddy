# Easy Buddy — emotionally intelligent AI sales agents

Easy Buddy is a zero-code platform prototype. A small business owner can create a human-like sales chatbot and email marketing agent in about 60 seconds, then deploy it to WhatsApp, Instagram DM, a website and email.

It's a static React app. There's no backend and you don't need an API key. It runs fully offline in **Instant Demo Mode**, so a live pitch can't fail because of Wi-Fi.

---

## Deploy to GitHub Pages in 3 steps

1. **Create a repo and push this folder.**
   ```bash
   git init && git add . && git commit -m "Easy Buddy prototype"
   git branch -M main
   git remote add origin https://github.com/<you>/easy-buddy.git
   git push -u origin main
   ```
2. **Turn on Pages.** On GitHub, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. **Wait about 1 minute.** The included workflow (`.github/workflows/deploy.yml`) builds and publishes the site to `https://<you>.github.io/easy-buddy/`. Every later push to `main` redeploys it.

> Alternative (no Actions): run `npm install && npm run deploy`. This pushes `dist/` to a `gh-pages` branch. Then set Pages → Source to that branch.

`vite.config.js` uses `base: './'`, so the build works under any repo name or subpath without changes.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
```

---

## Architecture

```
src/
├─ main.jsx / App.jsx          App shell, page transitions, hash routing (#launchpad, #persona …)
├─ store/AppStore.jsx          Global state (persona, business, channels, plan, limbic, chat, LLM settings)
├─ engine/                     ── the "brain" (pure JS, no UI) ──
│  ├─ limbic.js                Limbic System Simulation Engine
│  │                             • Amygdala: valence / arousal / friction from intent cues
│  │                             • Hippocampus: extracts personal context (life events, cash timing, names…)
│  │                             • Prefrontal cortex: picks PITCH / LISTEN / HUMOR / STEP_BACK / CLOSE / DISCOVER
│  │                             • Nucleus accumbens: trust & delight reward update
│  ├─ responder.js             Instant Demo reply composer (persona-weighted, memory recall, bubble splitting, typing cadence)
│  ├─ preview.js               Persona Studio live reply + outcome forecast
│  ├─ emails.js                Day 1 / 14 / 30 follow-up campaign generator
│  ├─ analyzer.js              CSV/JSON chat-log parser + behavioural win/loss analytics
│  └─ llm.js                   Optional Live LLM mode (Anthropic / OpenAI) + system prompt compiled from sliders & limbic state
├─ data/                       Business presets, persona presets, nav, demo database (1,240 chats), fine-tune pipeline
├─ components/                 Sidebar, TopBar, Quick Setup Wizard, Pricing/Activation modal, Settings, UI kit
│  └─ chat/                    ChatSimulator (WhatsApp + web skins), BrainHUD (live neural visualisation)
└─ modules/                    The 5 product modules
   ├─ SetupHub.jsx             1 · Zero-code setup and one-click channel deployment
   ├─ PersonaStudio.jsx        2 · Emotional calibration sliders + live preview
   ├─ LimbicLab.jsx            3+5 · Limbic Engine HUD + omnichannel simulator
   ├─ TrainingLab.jsx          4 · Historical data ingestion and fine-tuning lab
   └─ EmailStudio.jsx          5 · AI email marketing studio
```

**Dual-mode AI brain**
- **Instant Demo Mode (default):** a keyword and sentiment engine, weighted by the persona sliders and the limbic state. It's deterministic and works offline.
- **Live LLM Mode:** click the ⚙️ icon, paste an Anthropic or OpenAI key, and turn on *Live LLM*. The key is stored only in this browser's `localStorage` and is sent straight to the provider. The limbic HUD keeps running locally. If a call fails, the app quietly falls back to Instant Demo Mode.
  - Anthropic calls from the browser use the `anthropic-dangerous-direct-browser-access` header. Use a key with a low spend limit for demos.

**Sample data:** `public/sample-chats.csv` is an upload-ready chat log. You can also download it from the Training Lab.

---

## 3-minute investor demo script

| Time | Click | What to say |
|---|---|---|
| **0:00** | Click **60-sec Quick Setup** (top right). Pick **Coffee Roastery**, or type `brewandbloom.co` and click **Scan**. | "A shop owner with zero tech skills. They paste their website, and we learn their products." |
| 0:20 | **Next** → pick **Warm Friend** → drag **Sales Style** left and right. | "No prompts. Just *how should customers feel?* Watch the reply change live." |
| 0:40 | **Next** → keep WhatsApp, Website and Email → **Launch my buddy** → **Continue with Growth** → **Activate & go live**. | "Sign up, pay, go live. Under two minutes." *(confetti)* |
| 1:00 | Click **Test Mia live** → **Run the No-Budget Magic Moment**. | "Here's the customer every chatbot fails: one who *can't afford it*." |
| 1:10 | Point at the HUD as it fires: the **Amygdala** detects *Budget stress*, the **Hippocampus** logs *"Opening a bakery next month"* and *"Tight on cash until Q2"*. | "It's reading emotion and remembering her life, like a person would." |
| 1:30 | The coral **Relationship Preservation Mode** banner appears. Read Mia's reply aloud: validation, a free masterclass, and a check-in scheduled for *early April*. | "It *declines the sale*… and **trust goes up**, to about 90%. Every other bot pushes a discount here. Ours earns a customer for life." |
| 1:55 | Open **Email Studio** in the sidebar → **Generate Follow-Up Email Campaign** → click **Day 30**. | "Thirty days later, at the start of Q2, it remembers. *'Q2 is around the corner…'* No marketer wrote this." |
| 2:20 | Open **Training Lab** → **Connect Demo Store Database** → **Optimize & Fine-Tune My Bot**. | "Plug in your past chats. It finds *why* sales died: pushing price too early, sounding robotic. Then it retrains itself." |
| 2:45 | The uplift card lands: **18.4% → ~28% conversion**, return rate **22% → 34%**. | "Same traffic, about 50% more sales. That's Easy Buddy: AI that sells like a friend." |

**Tips:** Use the sidebar (not the browser's back button or refresh) during the pitch, so the chat memory carries into Email Studio. Toggle **Fast pacing** in the simulator if you're short on time. Presets like *Too expensive*, *Just browsing*, *Bad experience with a competitor* and *Ready to buy* each trigger a different strategy in the prefrontal cortex.
