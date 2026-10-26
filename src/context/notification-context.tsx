'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'cart';

export interface NotificationPayload {
  id?: string;
  type?: NotificationType;
  title: string;
  message?: string;
  durationMs?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notify: (payload: NotificationPayload) => void;
  dismiss: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notify: () => {},
  dismiss: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [activeNotification, setActiveNotification] = useState<NotificationPayload | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const dismiss = useCallback(() => {
    setActiveNotification(null);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  const notify = useCallback(
    (payload: NotificationPayload) => {
      if (timeoutId) clearTimeout(timeoutId);

      // Light haptic feedback if supported
      if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
        try {
          navigator.vibrate(20);
        } catch {
          // ignore
        }
      }

      setActiveNotification(payload);

      const duration = payload.durationMs || 4000;
      const tid = setTimeout(() => {
        setActiveNotification(null);
      }, duration);
      setTimeoutId(tid);
    },
    [timeoutId]
  );

  return (
    <NotificationContext.Provider value={{ notify, dismiss }}>
      {children}
      <DynamicIslandContainer active={activeNotification} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}

// -----------------------------------------------------------------
// DYNAMIC ISLAND COMPONENT (Apple iOS Style)
// -----------------------------------------------------------------
function DynamicIslandContainer({
  active,
  onDismiss,
}: {
  active: NotificationPayload | null;
  onDismiss: () => void;
}) {
  const getIcon = (type?: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-400" />;
      case 'cart':
        return <ShoppingBag className="w-5 h-5 text-nyeni-blue" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-nyeni-blue" />;
    }
  };

  const getBadgeBg = (type?: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/20 border-emerald-500/30';
      case 'warning':
        return 'bg-amber-500/20 border-amber-500/30';
      case 'error':
        return 'bg-rose-500/20 border-rose-500/30';
      case 'cart':
        return 'bg-amber-400/20 border-amber-400/30';
      case 'info':
      default:
        return 'bg-blue-500/20 border-blue-500/30';
    }
  };

  return (
    <div className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none select-none max-w-[92vw]">
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, scale: 0.82, y: -24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -20, transition: { duration: 0.2 } }}
            transition={{
              type: 'spring',
              stiffness: 450,
              damping: 32,
              mass: 0.8,
            }}
            className="pointer-events-auto bg-neutral-950/92 backdrop-blur-2xl text-white rounded-[26px] p-2 sm:p-2.5 pl-3.5 pr-3 shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.12)] border border-white/10 flex items-center gap-3 min-w-[280px] sm:min-w-[340px] max-w-[480px]"
          >
            {/* Left Pulsing Icon Pill */}
            <div
              className={`w-9 h-9 shrink-0 rounded-full border flex items-center justify-center ${getBadgeBg(
                active.type
              )}`}
            >
              {getIcon(active.type)}
            </div>

            {/* Notification Content */}
            <div className="min-w-0 flex-1 py-0.5">
              <h4 className="text-[13px] font-bold text-white tracking-tight leading-tight line-clamp-1">
                {active.title}
              </h4>
              {active.message && (
                <p className="text-[11px] text-neutral-300 font-medium leading-tight mt-0.5 line-clamp-2">
                  {active.message}
                </p>
              )}
            </div>

            {/* Action button if provided */}
            {active.action && (
              <button
                type="button"
                onClick={() => {
                  active.action?.onClick();
                  onDismiss();
                }}
                className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                {active.action.label}
              </button>
            )}

            {/* Dismiss Close Icon */}
            <button
              type="button"
              onClick={onDismiss}
              className="w-6 h-6 shrink-0 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
