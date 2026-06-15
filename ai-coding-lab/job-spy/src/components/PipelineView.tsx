'use client'

import { cn } from '@/lib/utils'
import { STEP_NAMES, type PipelineState } from '@/hooks/usePipeline'
import type { StepStatus } from '@/lib/schemas'
import {
  FileSearch,
  GitCompare,
  TrendingUp,
  Target,
  Check,
  Loader2,
  AlertCircle,
  Ban,
} from 'lucide-react'

const STEP_ICONS = [FileSearch, GitCompare, TrendingUp, Target]

const STATUS_CONFIG: Record<StepStatus, { icon: React.ElementType; color: string; bg: string }> = {
  pending: { icon: Ban, color: 'text-muted-foreground/50', bg: 'bg-muted/30' },
  running: { icon: Loader2, color: 'text-primary', bg: 'bg-primary/10' },
  complete: { icon: Check, color: 'text-success', bg: 'bg-success/10' },
  error: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  skipped: { icon: Ban, color: 'text-muted-foreground/30', bg: 'bg-muted/20' },
}

interface PipelineViewProps {
  state: PipelineState
}

export function PipelineView({ state }: PipelineViewProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-1">
        {STEP_NAMES.map((name, i) => {
          const status = state.stepStatuses[i]
          const config = STATUS_CONFIG[status]
          const StepIcon = STEP_ICONS[i]
          const StatusIcon = config.icon

          return (
            <div key={name} className="flex items-center flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
                {/* Step number circle */}
                <div
                  className={cn(
                    'flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-[10px] sm:text-xs font-bold transition-all',
                    status === 'complete' && 'bg-success text-success-foreground',
                    status === 'running' && 'bg-primary text-primary-foreground',
                    status === 'error' && 'bg-destructive text-white',
                    status === 'pending' && 'bg-muted text-muted-foreground',
                    status === 'skipped' && 'bg-muted/50 text-muted-foreground/50',
                  )}
                >
                  {status === 'complete' ? (
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  ) : status === 'running' ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  ) : status === 'error' ? (
                    <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                <div className="min-w-0 hidden sm:block">
                  <div className={cn('text-xs sm:text-sm font-medium truncate', config.color)}>
                    {name}
                  </div>
                </div>
              </div>
              {/* Connector line */}
              {i < 3 && (
                <div className="mx-1 sm:mx-3 flex-1 max-w-[24px] sm:max-w-[40px]">
                  <div
                    className={cn(
                      'h-0.5 w-full rounded-full transition-all',
                      state.stepStatuses[i] === 'complete' ? 'bg-success/50' : 'bg-border/50',
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
