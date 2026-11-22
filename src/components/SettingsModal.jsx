import { useEffect, useState } from 'react'
import { KeyRound, Lock, Wifi, Cpu, Trash2, CheckCircle2, Loader2 } from 'lucide-react'
import { Modal, Toggle } from './ui'
import { useStore } from '../store/AppStore'
import { PROVIDERS, callLLM } from '../engine/llm'
import { cn } from '../lib/utils'

export default function SettingsModal() {
  const { settingsOpen, setSettingsOpen, settings, setSettings, toast } = useStore()
  const [draft, setDraft] = useState(settings)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    if (settingsOpen) {
      setDraft(settings)
      setTestResult(null)
    }
  }, [settingsOpen, settings])

  const isLocal = draft.provider === 'local'

  const save = () => {
    const live = draft.live && (draft.provider === 'local' || draft.apiKey.trim().length > 10)
    setSettings({ ...draft, apiKey: draft.apiKey.trim(), live })
    setSettingsOpen(false)
    toast(live ? `Live LLM mode on — ${PROVIDERS[draft.provider].label}` : 'Instant Demo Mode on — works fully offline', 'success')
  }

  const test = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const out = await callLLM({
        settings: { ...draft, apiKey: draft.apiKey.trim() },
        system: 'Reply with exactly: Connected',
        messages: [{ role: 'user', content: 'Ping' }],
        maxTokens: 2000,
      })
      setTestResult({ ok: true, text: out || 'Connected' })
    } catch (e) {
      setTestResult({ ok: false, text: e.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} width="max-w-lg">
      <div className="p-6 sm:p-7">
        <div className="label">Settings</div>
        <h2 className="mt-1 text-xl font-extrabold">AI brain mode</h2>
        <p className="mt-1 text-sm text-slate-500">
          Easy Buddy runs on a built-in emotional engine by default — no internet or keys required. Optionally plug in a live LLM.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {[
            { live: false, icon: Wifi, title: 'Instant Demo', desc: 'Local limbic engine. Never fails.', color: 'emerald' },
            { live: true, icon: Cpu, title: 'Live LLM', desc: 'Claude or OpenAI, driven by sliders.', color: 'indigo' },
          ].map((o) => (
            <button
              key={o.title}
              onClick={() => setDraft((d) => ({ ...d, live: o.live }))}
              className={cn(
                'rounded-2xl border-2 p-4 text-left transition',
                draft.live === o.live ? (o.color === 'emerald' ? 'border-emerald-400 bg-emerald-50/60' : 'border-indigo-400 bg-indigo-50/60') : 'border-slate-200 hover:border-slate-300',
              )}
            >
              <o.icon size={18} className={o.color === 'emerald' ? 'text-emerald-600' : 'text-indigo-600'} />
              <div className="mt-2 text-sm font-bold text-slate-800">{o.title}</div>
              <div className="text-xs text-slate-500">{o.desc}</div>
            </button>
          ))}
        </div>

        {draft.live && (
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap gap-2">
              {Object.entries(PROVIDERS).map(([id, p]) => (
                <button
                  key={id}
                  onClick={() => setDraft((d) => ({ ...d, provider: id, model: p.defaultModel }))}
                  className={cn('chip border px-3 py-1.5', draft.provider === id ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600')}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {isLocal ? (
              <>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">Bridge address</span>
                  <input value={draft.bridgeUrl} onChange={(e) => setDraft((d) => ({ ...d, bridgeUrl: e.target.value }))} className="input font-mono" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">Model (optional: opus, sonnet or haiku; blank uses your Claude default)</span>
                  <input value={draft.model} placeholder="default" onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value.trim() }))} className="input font-mono" />
                </label>
                <div className="flex items-start gap-2 rounded-xl bg-indigo-50/70 p-3 text-xs text-indigo-900">
                  <Lock size={14} className="mt-0.5 shrink-0" />
                  Uses your own Claude login through Claude Code on this laptop. No API key. Start it by double-clicking Start-Claude-Bridge.cmd in the easy-buddy folder, and click Allow if the browser asks about devices on your local network.
                </div>
              </>
            ) : (
              <>
                <label className="block">
                  <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <KeyRound size={13} /> API key
                  </span>
                  <input
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    value={draft.apiKey}
                    onChange={(e) => setDraft((d) => ({ ...d, apiKey: e.target.value }))}
                    placeholder={PROVIDERS[draft.provider].keyHint}
                    className="input font-mono"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">Model</span>
                  <input value={draft.model} onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))} className="input font-mono" />
                </label>
                <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                  <Lock size={14} className="mt-0.5 shrink-0" />
                  Your key is stored only in this browser (localStorage) and sent directly to the provider. If a live call fails mid-demo, Easy Buddy silently falls back to Instant Demo Mode.
                </div>
              </>
            )}
            <div className="flex items-center gap-3">
              <button onClick={test} disabled={testing || (!isLocal && draft.apiKey.trim().length < 10)} className="btn-ghost py-2 text-xs">
                {testing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Test connection
              </button>
              {testResult && (
                <span className={cn('text-xs font-medium', testResult.ok ? 'text-emerald-600' : 'text-coral-600')}>
                  {testResult.ok ? '✓ Connected' : `✗ ${testResult.text.slice(0, 80)}`}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <button
            onClick={() => {
              setDraft((d) => ({ ...d, apiKey: '', live: false }))
              toast('API key removed from this browser', 'info')
            }}
            className="btn px-2 text-xs text-slate-400 hover:text-coral-600"
          >
            <Trash2 size={14} /> Forget key
          </button>
          <div className="flex items-center gap-2">
            <Toggle checked={draft.live} onChange={(v) => setDraft((d) => ({ ...d, live: v }))} color="bg-indigo-500" label="Live LLM" />
            <button onClick={save} className="btn-primary">
              Save
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
