import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, Info, X, AlertTriangle } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const toast = useCallback(
    ({ title, description, variant = 'success', duration = 4200 }) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((t) => [...t, { id, title, description, variant }])
      setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {toasts.map((t) => {
          const Icon = ICONS[t.variant] || Info
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-md animate-scale-in items-start gap-3 rounded-2xl border border-ink-800/10 bg-ink-900/95 px-4 py-3 text-white shadow-lift backdrop-blur"
            >
              <Icon
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  t.variant === 'error' ? 'text-rose-300' : 'text-emerald-300'
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-[13px] leading-snug text-white/70">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded-full p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
