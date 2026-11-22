import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getBusiness } from '../data/businesses'
import { DEFAULT_PERSONA } from '../data/personas'
import { NAV_IDS } from '../data/nav'
import { initialLimbic } from '../engine/limbic'
import { PROVIDERS, DEFAULT_BRIDGE } from '../engine/llm'
import { uid } from '../lib/utils'

const Ctx = createContext(null)
const KEY = 'easybuddy:v1'
const LLM_KEY = 'easybuddy:llm'

const read = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k)) || {}
  } catch {
    return {}
  }
}

const pageFromHash = () => {
  const h = window.location.hash.replace('#', '')
  return NAV_IDS.includes(h) ? h : 'launchpad'
}

export function AppProvider({ children }) {
  const saved = useMemo(() => read(KEY), [])
  const savedLLM = useMemo(() => read(LLM_KEY), [])

  const [page, setPageState] = useState(pageFromHash)
  const [businessId, setBusinessId] = useState(saved.businessId || 'coffee')
  const [brandOverride, setBrandOverride] = useState(saved.brandOverride || null)
  const [persona, setPersona] = useState(saved.persona || DEFAULT_PERSONA)
  const [channels, setChannels] = useState(saved.channels || { whatsapp: false, web: false, instagram: false, email: false })
  const [plan, setPlan] = useState(saved.plan || null)
  const [settings, setSettings] = useState({
    provider: savedLLM.provider || 'anthropic',
    apiKey: savedLLM.apiKey || '',
    // Browsers that never connected a key pick up the current default model instead of an old saved one
    model: ((savedLLM.apiKey || savedLLM.provider === 'local') && savedLLM.model) || PROVIDERS[savedLLM.provider || 'anthropic'].defaultModel,
    bridgeUrl: savedLLM.bridgeUrl || DEFAULT_BRIDGE,
    live: !!savedLLM.live,
  })

  const [limbic, setLimbic] = useState(initialLimbic)
  const [messages, setMessages] = useState([])
  const [trained, setTrained] = useState(saved.trained || null)
  const [dataset, setDataset] = useState(null)
  const [campaign, setCampaign] = useState(null)

  const [wizardOpen, setWizardOpen] = useState(() => !localStorage.getItem('easybuddy:seenWizard'))
  const [pricingOpen, setPricingOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toasts, setToasts] = useState([])

  const business = useMemo(() => {
    const b = getBusiness(businessId)
    return brandOverride ? { ...b, ...brandOverride } : b
  }, [businessId, brandOverride])

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify({ businessId, brandOverride, persona, channels, plan, trained }))
  }, [businessId, brandOverride, persona, channels, plan, trained])

  useEffect(() => {
    localStorage.setItem(LLM_KEY, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    const onHash = () => setPageState(pageFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const setPage = useCallback((id) => {
    window.location.hash = id
    setPageState(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const toast = useCallback((message, tone = 'info') => {
    const id = uid()
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
  }, [])

  const resetConversation = useCallback(() => {
    setMessages([])
    setLimbic(initialLimbic())
  }, [])

  const closeWizard = useCallback(() => {
    localStorage.setItem('easybuddy:seenWizard', '1')
    setWizardOpen(false)
  }, [])

  const selectBusiness = useCallback((id, override = null) => {
    setBusinessId(id)
    setBrandOverride(override)
  }, [])

  const liveLLM = settings.live && (settings.provider === 'local' || settings.apiKey.trim().length > 10)
  const connectedCount = Object.values(channels).filter(Boolean).length
  const isLive = !!plan && connectedCount > 0

  const value = {
    page,
    setPage,
    business,
    businessId,
    selectBusiness,
    persona,
    setPersona,
    channels,
    setChannels,
    connectedCount,
    plan,
    setPlan,
    isLive,
    settings,
    setSettings,
    liveLLM,
    limbic,
    setLimbic,
    messages,
    setMessages,
    resetConversation,
    trained,
    setTrained,
    dataset,
    setDataset,
    campaign,
    setCampaign,
    wizardOpen,
    setWizardOpen,
    closeWizard,
    pricingOpen,
    setPricingOpen,
    settingsOpen,
    setSettingsOpen,
    toasts,
    toast,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used inside <AppProvider>')
  return ctx
}
