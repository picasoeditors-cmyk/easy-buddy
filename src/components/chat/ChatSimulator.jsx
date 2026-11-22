import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, CheckCheck, MoreVertical, Paperclip, Phone, Send, Smile, Video, Mic, Globe, MessageCircle, X } from 'lucide-react'
import { useStore } from '../../store/AppStore'
import { perceive, reward } from '../../engine/limbic'
import { generateReply, typingDelay } from '../../engine/responder'
import { callLLM, compileSystemPrompt, toBubbles } from '../../engine/llm'
import { cn, sleep, timeNow, uid } from '../../lib/utils'

const Ticks = ({ status }) => {
  if (status === 'sent') return <Check size={14} className="text-slate-400" />
  if (status === 'delivered') return <CheckCheck size={14} className="text-slate-400" />
  return <CheckCheck size={14} className="text-sky-500" />
}

const TypingBubble = ({ skin }) => (
  <motion.div
    initial={{ opacity: 0, y: 6, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className={cn('flex w-fit items-center gap-1 rounded-2xl px-4 py-3 shadow-sm', skin === 'wa' ? 'rounded-tl-sm bg-white' : 'rounded-bl-sm bg-slate-100')}
  >
    {[0, 1, 2].map((i) => (
      <span key={i} className="typing-dot h-2 w-2 rounded-full bg-slate-400" />
    ))}
  </motion.div>
)

export function useConversation() {
  const { persona, business, limbic, setLimbic, messages, setMessages, liveLLM, settings, toast, trained } = useStore()
  const [busy, setBusy] = useState(false)
  const [typing, setTyping] = useState(false)
  const limbicRef = useRef(limbic)
  const messagesRef = useRef(messages)
  const busyRef = useRef(false)

  useEffect(() => {
    limbicRef.current = limbic
  }, [limbic])
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const setStatus = (id, status) => setMessages((m) => m.map((x) => (x.id === id ? { ...x, status } : x)))

  const send = useCallback(
    async (text, pace = 'human') => {
      const clean = text.trim()
      if (!clean || busyRef.current) return
      busyRef.current = true
      setBusy(true)
      const userMsg = { id: uid(), from: 'user', text: clean, time: timeNow(), status: 'sent' }
      setMessages((m) => [...m, userMsg])
      messagesRef.current = [...messagesRef.current, userMsg]

      await sleep(pace === 'fast' ? 150 : 380)
      setStatus(userMsg.id, 'delivered')

      // 1. Perception: amygdala + hippocampus + prefrontal cortex fire immediately
      const { limbic: perceived, intent } = perceive(clean, limbicRef.current, persona)
      limbicRef.current = perceived
      setLimbic(perceived)

      await sleep(pace === 'fast' ? 250 : 650 + Math.random() * 600)
      setStatus(userMsg.id, 'read')

      // 2. Compose reply (live LLM if configured, otherwise the local engine)
      let bubbles
      let recalled = []
      const local = () => generateReply({ text: clean, intent, limbic: perceived, persona, business })
      if (liveLLM) {
        try {
          setTyping(true)
          const out = await callLLM({
            settings,
            system: compileSystemPrompt({ persona, business, limbic: perceived }),
            messages: messagesRef.current,
          })
          bubbles = toBubbles(out)
          if (!bubbles.length) throw new Error('Empty reply')
        } catch (e) {
          toast(`Live LLM unavailable (${e.message.slice(0, 60)}) — using Instant Demo engine`, 'warn')
          ;({ bubbles, recalled } = local())
        }
      } else {
        ;({ bubbles, recalled } = local())
      }

      // 3. Reward: nucleus accumbens updates trust & delight
      const rewarded = reward(perceived, { intent, persona, recalled, trained: !!trained })
      limbicRef.current = rewarded

      // 4. Deliver with human pacing, split into natural micro-messages
      for (let i = 0; i < bubbles.length; i++) {
        setTyping(true)
        await sleep(typingDelay(bubbles[i], pace))
        setTyping(false)
        const botMsg = { id: uid(), from: 'bot', text: bubbles[i], time: timeNow() }
        setMessages((m) => [...m, botMsg])
        messagesRef.current = [...messagesRef.current, botMsg]
        if (i === 0) setLimbic(rewarded)
        if (i < bubbles.length - 1) await sleep(pace === 'fast' ? 120 : 350 + Math.random() * 300)
      }
      setTyping(false)
      busyRef.current = false
      setBusy(false)
      return intent
    },
    [persona, business, setLimbic, setMessages, liveLLM, settings, toast, trained],
  )

  return { send, busy, typing }
}

export default function ChatSimulator({ send, busy, typing, input, setInput, skin, setSkin, locked }) {
  const { messages, setMessages, business } = useStore()
  const scrollRef = useRef(null)

  // Opening greeting from the bot
  useEffect(() => {
    if (messages.length === 0) {
      const t = setTimeout(() => {
        setMessages((m) =>
          m.length ? m : [{ id: uid(), from: 'bot', text: `Hi! I'm ${business.botName} from ${business.brand} 👋 How can I help you today?`, time: timeNow() }],
        )
      }, 250)
      return () => clearTimeout(t)
    }
  }, [messages.length, business, setMessages])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  const submit = (e) => {
    e?.preventDefault()
    if (!input.trim() || busy || locked) return
    const t = input
    setInput('')
    send(t)
  }

  const isWA = skin === 'wa'

  return (
    <div className="flex flex-col items-center">
      <div className="mb-3 inline-flex rounded-xl bg-white p-1 text-xs font-semibold shadow-soft">
        {[
          ['wa', 'WhatsApp', MessageCircle],
          ['web', 'Website chat', Globe],
        ].map(([id, label, I]) => (
          <button key={id} onClick={() => setSkin(id)} className={cn('relative flex items-center gap-1.5 rounded-lg px-3 py-1.5', skin === id ? 'text-slate-900' : 'text-slate-500')}>
            {skin === id && <motion.span layoutId="skin" className="absolute inset-0 rounded-lg bg-slate-100" />}
            <I size={13} className="relative" />
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      <div className={cn('relative w-full max-w-[380px] overflow-hidden shadow-[0_30px_80px_-30px_rgba(15,23,42,.55)]', isWA ? 'rounded-[2.6rem] border-[10px] border-slate-900 bg-slate-900' : 'rounded-3xl border border-slate-200 bg-white')}>
        {isWA && <div className="absolute left-1/2 top-1.5 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-900" />}

        {/* Header */}
        {isWA ? (
          <div className="flex items-center gap-2 bg-[#075E54] px-3 pb-2.5 pt-7 text-white">
            <ArrowLeft size={18} />
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-coral-300 text-sm font-bold">{business.botName[0]}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-semibold leading-tight">{business.brand}</div>
              <div className="text-[11px] text-white/75">{typing ? 'typing…' : 'online'}</div>
            </div>
            <Video size={18} className="opacity-90" />
            <Phone size={16} className="ml-2 opacity-90" />
            <MoreVertical size={18} className="ml-1 opacity-90" />
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-white">
            <div className="relative grid h-10 w-10 place-items-center rounded-full bg-white/20 text-sm font-bold">
              {business.botName[0]}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-indigo-600 bg-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{business.botName} · {business.brand}</div>
              <div className="text-[11px] text-white/75">{typing ? `${business.botName} is typing…` : 'Typically replies instantly'}</div>
            </div>
            <X size={18} className="opacity-80" />
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className={cn('scroll-thin h-[470px] space-y-1.5 overflow-y-auto px-3 py-3', isWA ? 'wa-bg' : 'bg-white')}>
          {isWA && (
            <div className="mx-auto mb-2 w-fit rounded-lg bg-[#fff5c4] px-3 py-1.5 text-center text-[10.5px] leading-snug text-slate-600 shadow-sm">
              🔒 Messages are end-to-end encrypted. Powered by Easy Buddy.
            </div>
          )}
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const mine = m.from === 'user'
              return (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[82%] px-3 py-1.5 text-[14px] leading-snug shadow-sm',
                      isWA
                        ? mine
                          ? 'rounded-xl rounded-tr-sm bg-[#d9fdd3] text-slate-800'
                          : 'rounded-xl rounded-tl-sm bg-white text-slate-800'
                        : mine
                          ? 'rounded-2xl rounded-br-sm bg-indigo-600 text-white'
                          : 'rounded-2xl rounded-bl-sm bg-slate-100 text-slate-800',
                    )}
                  >
                    <span className="whitespace-pre-wrap break-words">{m.text}</span>
                    <span className={cn('float-right ml-2 mt-1.5 flex items-center gap-0.5 text-[10px]', isWA ? 'text-slate-500' : mine ? 'text-white/70' : 'text-slate-400')}>
                      {m.time}
                      {mine && isWA && <Ticks status={m.status} />}
                    </span>
                  </div>
                </motion.div>
              )
            })}
            {typing && (
              <motion.div key="typing" layout className="flex justify-start">
                <TypingBubble skin={skin} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Composer */}
        <form onSubmit={submit} className={cn('flex items-center gap-2 px-2 py-2', isWA ? 'bg-[#f0f2f5]' : 'border-t border-slate-100 bg-white')}>
          <div className={cn('flex flex-1 items-center gap-2 rounded-full px-3 py-2', isWA ? 'bg-white' : 'bg-slate-100')}>
            <Smile size={18} className="shrink-0 text-slate-400" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={locked}
              placeholder={locked ? 'Scenario playing…' : 'Type as a customer…'}
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-slate-400"
              aria-label="Message"
            />
            {isWA && <Paperclip size={17} className="shrink-0 text-slate-400" />}
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="submit"
            disabled={busy || locked || !input.trim()}
            className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full text-white transition disabled:opacity-60', isWA ? 'bg-[#00a884]' : 'bg-indigo-600')}
            aria-label="Send"
          >
            {input.trim() ? <Send size={17} /> : <Mic size={17} />}
          </motion.button>
        </form>
      </div>
    </div>
  )
}
