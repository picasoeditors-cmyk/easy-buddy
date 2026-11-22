import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Copy, Loader2, Sparkles, Zap, ShieldCheck, Brain, SlidersHorizontal, Mail, Rocket, X } from 'lucide-react'
import { useStore } from '../store/AppStore'
import { CHANNELS } from '../components/channels'
import { FakeQR, Icon, Toggle } from '../components/ui'
import { cn, sleep } from '../lib/utils'

function ChannelSetup({ channel, onConnected, onCancel }) {
  const { business, toast } = useStore()
  const [state, setState] = useState('idle')
  const [steps, setSteps] = useState([])

  const run = async (lines) => {
    setState('working')
    setSteps([])
    for (const l of lines) {
      await sleep(650)
      setSteps((s) => [...s, l])
    }
    await sleep(350)
    setState('done')
    onConnected()
  }

  if (channel.id === 'whatsapp')
    return (
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <div className="relative rounded-2xl border border-slate-200 p-2">
          <FakeQR seed={business.brand + 'wa'} size={132} />
          {state === 'working' && (
            <motion.div className="absolute inset-x-2 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399]" initial={{ top: 8 }} animate={{ top: [8, 138, 8] }} transition={{ duration: 1.6, repeat: Infinity }} />
          )}
        </div>
        <div className="flex-1 text-sm">
          <div className="font-semibold text-slate-800">Scan with WhatsApp Business</div>
          <ol className="mt-1 list-inside list-decimal text-xs leading-relaxed text-slate-500">
            <li>Open WhatsApp Business on your phone</li>
            <li>Settings → Linked devices → Link a device</li>
            <li>Point your camera here</li>
          </ol>
          <button onClick={() => run(['Phone detected', 'Linked +1 (555) 012-3344', `${business.botName} can now reply on WhatsApp`])} disabled={state !== 'idle'} className="btn-emerald mt-3 py-2 text-xs">
            {state === 'working' ? <Loader2 size={14} className="animate-spin" /> : null} Simulate scan
          </button>
          <Steps steps={steps} />
        </div>
      </div>
    )

  if (channel.id === 'web') {
    const snippet = `<script src="https://cdn.easybuddy.ai/widget.js" data-buddy="${business.domain.split('.')[0]}" async></script>`
    return (
      <div className="text-sm">
        <div className="font-semibold text-slate-800">Paste this one line before &lt;/body&gt;</div>
        <div className="mt-2 flex items-start gap-2 rounded-xl bg-slate-900 p-3">
          <code className="flex-1 break-all font-mono text-[11px] leading-relaxed text-indigo-200">{snippet}</code>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(snippet)
              toast('Embed code copied', 'success')
            }}
            className="rounded-lg bg-white/10 p-1.5 text-white transition hover:bg-white/20"
            aria-label="Copy embed code"
          >
            <Copy size={14} />
          </button>
        </div>
        <div className="mt-2 text-xs text-slate-500">Using Shopify, Wix or WordPress? Install the Easy Buddy plugin — zero code.</div>
        <button onClick={() => run([`Pinging ${business.domain}…`, 'Widget detected on 14 pages', 'Live chat bubble active'])} disabled={state !== 'idle'} className="btn-indigo mt-3 py-2 text-xs">
          {state === 'working' ? <Loader2 size={14} className="animate-spin" /> : null} Verify installation
        </button>
        <Steps steps={steps} />
      </div>
    )
  }

  if (channel.id === 'instagram')
    return (
      <div className="text-sm">
        <div className="font-semibold text-slate-800">Connect your Instagram Business account</div>
        <p className="text-xs text-slate-500">We’ll ask Meta for permission to read & reply to DMs. Nothing is ever posted.</p>
        <button
          onClick={() => run(['Opening Meta sign-in (simulated)…', `Found @${business.domain.split('.')[0]}`, 'DM permissions granted'])}
          disabled={state !== 'idle'}
          className="btn mt-3 py-2 text-xs text-white"
          style={{ background: channel.gradient }}
        >
          {state === 'working' ? <Loader2 size={14} className="animate-spin" /> : null} Continue with Meta
        </button>
        <Steps steps={steps} />
      </div>
    )

  return (
    <div className="text-sm">
      <div className="font-semibold text-slate-800">Send from hello@{business.domain}</div>
      <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 text-[11px]">
        {[
          ['TXT', '@', 'v=spf1 include:mail.easybuddy.ai ~all'],
          ['CNAME', 'eb._domainkey', 'dkim.easybuddy.ai'],
        ].map((r) => (
          <div key={r[1]} className="grid grid-cols-[48px_90px_1fr] gap-2 border-b border-slate-100 px-3 py-1.5 font-mono last:border-0">
            <span className="font-semibold text-slate-500">{r[0]}</span>
            <span className="text-slate-700">{r[1]}</span>
            <span className="truncate text-slate-500">{r[2]}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-slate-500">Or skip DNS — we auto-configure for Google Workspace & Microsoft 365.</div>
      <button onClick={() => run(['Checking SPF record…', 'Checking DKIM signature…', 'Domain verified · warm-up started'])} disabled={state !== 'idle'} className="btn mt-3 bg-coral-500 py-2 text-xs text-white hover:bg-coral-400">
        {state === 'working' ? <Loader2 size={14} className="animate-spin" /> : null} Auto-verify domain
      </button>
      <Steps steps={steps} />
      {state === 'idle' && (
        <button onClick={onCancel} className="ml-2 text-xs text-slate-400 hover:text-slate-600">
          Cancel
        </button>
      )}
    </div>
  )
}

const Steps = ({ steps }) => (
  <div className="mt-2 space-y-1">
    {steps.map((s) => (
      <motion.div key={s} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 text-xs text-emerald-700">
        <Check size={13} /> {s}
      </motion.div>
    ))}
  </div>
)

function ChannelCard({ channel }) {
  const { channels, setChannels, toast } = useStore()
  const on = channels[channel.id]
  const [open, setOpen] = useState(false)

  const toggle = (v) => {
    if (v) setOpen(true)
    else {
      setChannels((c) => ({ ...c, [channel.id]: false }))
      setOpen(false)
      toast(`${channel.name} paused`, 'info')
    }
  }

  return (
    <motion.div layout className={cn('card overflow-hidden p-5 transition', on && 'ring-2 ring-emerald-400/60')}>
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-lg" style={{ background: channel.gradient }}>
          <Icon name={channel.icon} size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold">{channel.name}</h4>
            {on && (
              <span className="chip bg-emerald-50 py-0.5 text-[10px] font-bold text-emerald-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> LIVE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">{channel.short}</p>
        </div>
        <Toggle checked={on || open} onChange={toggle} label={`Toggle ${channel.name}`} />
      </div>
      <AnimatePresence>
        {open && !on && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="relative mt-4 rounded-2xl bg-slate-50 p-4">
              <button onClick={() => setOpen(false)} className="absolute right-2 top-2 rounded-lg p-1 text-slate-400 hover:bg-white" aria-label="Cancel setup">
                <X size={14} />
              </button>
              <ChannelSetup
                channel={channel}
                onCancel={() => setOpen(false)}
                onConnected={() => {
                  setChannels((c) => ({ ...c, [channel.id]: true }))
                  setOpen(false)
                  toast(`${channel.name} connected 🎉`, 'success')
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {on && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ['Replies', '< 4s'],
            ['Uptime', '24/7'],
            ['Tone', 'Human'],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-slate-50 py-2">
              <div className="text-sm font-bold text-slate-800">{v}</div>
              <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{k}</div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default function SetupHub() {
  const { business, setWizardOpen, setPricingOpen, plan, connectedCount, setPage, trained, persona } = useStore()
  const checklist = [
    { label: 'Business profile', done: true, action: () => setWizardOpen(true) },
    { label: 'Personality calibrated', done: true, action: () => setPage('persona') },
    { label: 'At least one channel', done: connectedCount > 0, action: () => document.getElementById('channels')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'Plan activated', done: !!plan, action: () => setPricingOpen(true) },
  ]
  const progress = checklist.filter((c) => c.done).length / checklist.length

  return (
    <div className="space-y-6 pt-4">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white sm:p-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/40 blur-3xl" />
        <div className="absolute -bottom-32 right-40 h-72 w-72 rounded-full bg-coral-500/30 blur-3xl" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <span className="chip bg-white/10 text-white/90">
              <Sparkles size={12} /> No code · No prompts · No tech skills
            </span>
            <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Meet {business.botName}. Your sales buddy that <span className="shimmer-text">sells like a friend</span>.
            </h2>
            <p className="mt-3 max-w-xl text-white/70">
              {business.botName} chats with your customers on WhatsApp, Instagram and your website — reading emotions, remembering people, and knowing when <i>not</i> to sell.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => setWizardOpen(true)} className="btn bg-white text-slate-900 hover:bg-slate-100">
                <Sparkles size={16} /> Start 60-second setup
              </button>
              <button onClick={() => setPage('limbic')} className="btn border border-white/20 bg-white/5 text-white hover:bg-white/10">
                <Brain size={16} /> See the emotional brain
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Launch checklist</span>
              <span className="text-white/60">{Math.round(progress * 100)}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300" animate={{ width: `${progress * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
            </div>
            <ul className="mt-4 space-y-2.5">
              {checklist.map((c) => (
                <li key={c.label}>
                  <button onClick={c.action} className="flex w-full items-center gap-3 text-left text-sm">
                    <span className={cn('grid h-6 w-6 place-items-center rounded-full transition', c.done ? 'bg-emerald-400 text-slate-900' : 'border border-white/30')}>
                      {c.done && <Check size={14} strokeWidth={3} />}
                    </span>
                    <span className={c.done ? 'text-white' : 'text-white/60'}>{c.label}</span>
                    {!c.done && <ArrowRight size={14} className="ml-auto text-white/40" />}
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={() => setPricingOpen(true)} disabled={!!plan} className="btn-emerald mt-5 w-full">
              {plan ? (<><ShieldCheck size={16} /> Live on {plan.name}</>) : (<><Zap size={16} /> Go live now</>)}
            </button>
          </div>
        </div>
      </section>

      {/* Channels */}
      <section id="channels">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="label">One-click deployment</div>
            <h3 className="text-lg font-bold">Your channels</h3>
          </div>
          <span className="text-sm text-slate-500">{connectedCount} of 4 connected</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {CHANNELS.map((c) => (
            <ChannelCard key={c.id} channel={c} />
          ))}
        </div>
      </section>

      {/* Module shortcuts */}
      <section className="grid gap-4 md:grid-cols-4">
        {[
          { id: 'persona', icon: SlidersHorizontal, title: 'Persona Studio', desc: `Empathy ${persona.empathy} · Humor ${persona.humor}`, color: 'text-coral-500 bg-coral-50' },
          { id: 'limbic', icon: Brain, title: 'Live Simulator', desc: 'Try the No-Budget Magic Moment', color: 'text-indigo-600 bg-indigo-50' },
          { id: 'training', icon: Rocket, title: 'Training Lab', desc: trained ? `Tuned · +${trained.uplift}% conversion` : '1,240 past chats ready', color: 'text-emerald-600 bg-emerald-50' },
          { id: 'email', icon: Mail, title: 'Email Studio', desc: 'Auto follow-up sequences', color: 'text-amber-600 bg-amber-50' },
        ].map((m) => (
          <motion.button key={m.id} whileHover={{ y: -3 }} onClick={() => setPage(m.id)} className="card p-5 text-left">
            <span className={cn('grid h-10 w-10 place-items-center rounded-xl', m.color)}>
              <m.icon size={18} />
            </span>
            <div className="mt-3 font-bold text-slate-800">{m.title}</div>
            <div className="text-xs text-slate-500">{m.desc}</div>
          </motion.button>
        ))}
      </section>
    </div>
  )
}
