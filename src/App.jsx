import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store/AppStore'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import QuickSetupWizard from './components/QuickSetupWizard'
import PricingModal from './components/PricingModal'
import SettingsModal from './components/SettingsModal'
import { Toasts } from './components/ui'
import SetupHub from './modules/SetupHub'
import PersonaStudio from './modules/PersonaStudio'
import LimbicLab from './modules/LimbicLab'
import TrainingLab from './modules/TrainingLab'
import EmailStudio from './modules/EmailStudio'

const PAGES = {
  launchpad: SetupHub,
  persona: PersonaStudio,
  limbic: LimbicLab,
  training: TrainingLab,
  email: EmailStudio,
}

const Backdrop = () => (
  <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-indigo-200/40 blur-3xl" />
    <div className="absolute -right-40 top-20 h-[460px] w-[460px] rounded-full bg-coral-200/35 blur-3xl" />
    <div className="absolute bottom-[-200px] left-1/3 h-[480px] w-[480px] rounded-full bg-emerald-200/30 blur-3xl" />
  </div>
)

export default function App() {
  const { page } = useStore()
  const Page = PAGES[page] || SetupHub
  return (
    <div className="relative min-h-screen">
      <Backdrop />
      <Sidebar />
      <main className="min-w-0 pb-20 lg:pb-0 lg:pl-64">
        <TopBar />
        <div className="mx-auto max-w-[1400px] px-4 pb-16 sm:px-6 lg:px-10">
          <AnimatePresence mode="wait">
            <motion.div key={page} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
              <Page />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <QuickSetupWizard />
      <PricingModal />
      <SettingsModal />
      <Toasts />
    </div>
  )
}
