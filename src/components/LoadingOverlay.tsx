import { useState, useEffect, useRef } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { getLoadingMessages, getKeySwitchMessages } from '../lib/prompts'

interface LoadingOverlayProps {
  isVisible: boolean
  onCancel?: () => void
  keySwitchMessage?: string | null
}

const ENEM_COLORS = [
  'from-[#009739] to-[#009739]/80',
  'from-[#FEDF00] to-[#FEDF00]/80',
  'from-[#002776] to-[#002776]/80',
]

export default function LoadingOverlay({ isVisible, onCancel, keySwitchMessage }: LoadingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [showKeySwitch, setShowKeySwitch] = useState(false)
  const messages = useRef(getLoadingMessages())
  const keyMessages = useRef(getKeySwitchMessages())
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (!isVisible) {
      setProgress(0)
      setMessageIndex(0)
      setShowKeySwitch(false)
      return
    }

    setProgress(0)
    setShowKeySwitch(false)

    const msgInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.current.length)
    }, 4000)

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev + 0.5
        return prev + Math.random() * 4
      })
    }, 600)

    intervalRef.current = msgInterval

    return () => {
      clearInterval(msgInterval)
      clearInterval(progressInterval)
    }
  }, [isVisible])

  useEffect(() => {
    if (keySwitchMessage) {
      setShowKeySwitch(true)
      const timer = setTimeout(() => setShowKeySwitch(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [keySwitchMessage])

  if (!isVisible) return null

  const colorClass = ENEM_COLORS[messageIndex % ENEM_COLORS.length]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md mx-auto px-6 text-center space-y-8">

        <div className="space-y-3">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${colorClass} shadow-lg animate-pulse`}>
            <Loader2 className="h-10 w-10 text-white animate-spin" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
            Gerando Questões
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed animate-pulse min-h-[3rem] transition-all duration-500">
            {messages.current[messageIndex]}
          </p>
        </div>

        <div className="space-y-2">
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r ${colorClass}`}
              style={{ width: `${Math.min(progress, 95)}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600">
            {Math.round(Math.min(progress, 95))}% concluído
          </span>
        </div>

        {showKeySwitch && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 animate-slide-up">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center justify-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              {keySwitchMessage || keyMessages.current[Math.floor(Math.random() * keyMessages.current.length)]}
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-6 text-[10px] text-slate-400 dark:text-slate-600 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#009739]" />
            Confiabilidade
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FEDF00]" />
            Precisão
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#002776]" />
            ENEM
          </span>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-medium text-slate-400 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300 underline underline-offset-4 transition cursor-pointer"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  )
}
