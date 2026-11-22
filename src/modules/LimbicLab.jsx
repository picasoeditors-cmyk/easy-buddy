import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, RotateCcw, Gauge, Mail, Play, Wallet, Eye, HeartCrack, ShoppingBag } from 'lucide-react'
import { useStore } from '../store/AppStore'
import ChatSimulator, { useConversation } from '../components/chat/ChatSimulator'
import BrainHUD from '../components/chat/BrainHUD'
import { cn, sleep } from '../lib/utils'

const PRESETS = [
  { label: 'Too expensive', icon: Wallet, text: 'Hmm, honestly this is a bit too expensive for me 😕' },
  { label: 'Just browsing', icon: Eye, text: 'Just browsing for now, thanks' },
  { label: 'Bad experience with a competitor', icon: HeartCrack, text: 'I had a bad experience with a competitor — they took my money and the quality was awful' },
  { label: 'Ready to buy', icon: ShoppingBag, text: "Love it! I'm ready to buy — where do I pay?" },
]

const MAGIC_SCRIPT = [
  "Hi! I'm opening a little bakery next month and I'd love something special for it ☕",
  "Honestly it looks amazing, but cash is really tight until Q2. I can't afford it right now 😔",
  "Wow. That's genuinely so kind of you, thank you 🥹",
]

export default function LimbicLab() {
  const { limbic, resetConversation, setPage, toast, business, liveLLM, trained, setSettingsOpen, settings } = useStore()
  const { send, busy, typing } = useConversation()
  const [input, setInput] = useState('')
  const [skin, setSkin] = useState('wa')
  const [pace, setPace] = useState('human')
  const [scenario, setScenario] = useState(false)

  const typeAndSend = async (text, p = pace) => {
    for (let i = 1; i <= text.length; i += 2) {
      setInput(text.slice(0, i))
      await sleep(p === 'fast' ? 6 : 16)
    }
    setInput('')
    await sleep(120)
    await send(text, p)
  }

  const runMagic = async () => {
    if (busy || scenario) return
    setScenario(true)
    resetConversation()
    await sleep(900)
    for (const line of MAGIC_SCRIPT) {
      await typeAndSend(line)
      await sleep(pace === 'fast' ? 500 : 1400)
    }
    setScenario(false)
    toast('Sale declined → trust went UP. That’s the Limbic Engine. ✨', 'success')
  }

  const preset = async (text) => {
    if (busy || scenario) return
    await typeAndSend(text)
  }

  const hasConversation = limbic.turn > 0

  return (
    <div className="space-y-5 pt-4">
      {/* Scenario bar */}
      <div className="card flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={runMagic}
          disabled={busy || scenario}
          className="relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-coral-500 via-coral-400 to-amber-400 px-5 py-3.5 text-left text-white shadow-[0_14px_34px_-14px_rgba(249,105,74,.9)] disabled:opacity-70"
        >
          <motion.span className="absolute inset-0 bg-white/20" animate={{ x: ['-100%', '120%'] }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.2 }} style={{ skewX: -20 }} />
          <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-white/20">{scenario ? <Play size={18} /> : <Sparkles size={18} />}</span>
          <span className="relative">
            <span className="block text-sm font-extrabold">{scenario ? 'Scenario playing…' : 'Run the No-Budget Magic Moment'}</span>
            <span className="block text-xs text-white/85">Investor test · customer can’t afford it</span>
          </span>
        </motion.button>

        <div className="flex-1">
          <div className="label mb-2">Or try a buyer objection</div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => preset(p.text)} disabled={busy || scenario} className="chip border border-slate-200 bg-white px-3 py-1.5 text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50">
                <p.icon size={13} /> {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPace((p) => (p === 'human' ? 'fast' : 'human'))}
            className="chip border border-slate-200 bg-white px-3 py-1.5 text-slate-600"
            title="Toggle reply pacing"
          >
            <Gauge size={13} /> {pace === 'human' ? 'Human pacing' : 'Fast pacing'}
          </button>
          <button
            onClick={() => {
              if (busy || scenario) return
              resetConversation()
              setInput('')
            }}
            disabled={busy || scenario}
            className="chip border border-slate-200 bg-white px-3 py-1.5 text-slate-600 disabled:opacity-50"
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <div>
          <ChatSimulator send={(t) => send(t, pace)} busy={busy} typing={typing} input={input} setInput={setInput} skin={skin} setSkin={setSkin} locked={scenario} />
          <div className="mx-auto mt-3 flex max-w-[380px] flex-wrap justify-center gap-2 text-[11px] text-slate-500">
            {liveLLM ? (
              <button onClick={() => setSettingsOpen(true)} className="chip bg-indigo-50 text-indigo-700" title="Claude settings">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" /> Live Claude brain · {settings.model}
              </button>
            ) : (
              <>
                <span className="chip bg-emerald-50 text-emerald-700">Instant Demo brain · offline-safe</span>
                <button onClick={() => setSettingsOpen(true)} className="chip bg-slate-900 text-white hover:bg-slate-700">
                  <Sparkles size={12} /> Connect Claude
                </button>
              </>
            )}
            {trained && <span className="chip bg-emerald-50 text-emerald-700">Fine-tuned on 1,240 chats</span>}
          </div>
        </div>
        <div className="space-y-4">
          <BrainHUD limbic={limbic} thinking={busy} />
          <motion.div
            initial={false}
            animate={{ opacity: hasConversation ? 1 : 0.6 }}
            className="card flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center"
          >
            <div>
              <div className="text-sm font-bold text-slate-800">Turn this chat into a follow-up campaign</div>
              <div className="text-xs text-slate-500">
                {limbic.hippocampus.length
                  ? `${limbic.hippocampus.length} memory note${limbic.hippocampus.length > 1 ? 's' : ''} ready — ${business.botName} will write emails that remember them.`
                  : 'Chat first — the hippocampus will collect personal notes to personalise the emails.'}
              </div>
            </div>
            <button onClick={() => setPage('email')} className="btn-primary shrink-0">
              <Mail size={15} /> Generate follow-up emails
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
