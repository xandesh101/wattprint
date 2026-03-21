import { cn } from '@/lib/utils'

interface EnergyScoreProps {
  score: number
  grade: string
}

const gradeColors: Record<string, string> = {
  A: 'text-[#2d8a4e]',
  B: 'text-[#5aab6b]',
  C: 'text-[#F9593B]',
  D: 'text-[#e05a2b]',
  F: 'text-red-600',
}

const gradeRing: Record<string, string> = {
  A: 'border-[#2d8a4e]',
  B: 'border-[#5aab6b]',
  C: 'border-[#F9593B]',
  D: 'border-[#e05a2b]',
  F: 'border-red-500',
}

const gradeLabel: Record<string, string> = {
  A: 'Excellent',
  B: 'Good',
  C: 'Average',
  D: 'Below Average',
  F: 'Poor',
}

export function EnergyScore({ score, grade }: EnergyScoreProps) {
  return (
    <div className="flex items-center gap-4">
      <div className={cn(
        'w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center shrink-0',
        gradeRing[grade] ?? 'border-border'
      )}>
        <span className={cn('text-3xl font-bold leading-none', gradeColors[grade])}>
          {grade}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">{score}/100</span>
      </div>
      <div>
        <p className={cn('text-lg font-semibold', gradeColors[grade])}>
          {gradeLabel[grade] ?? 'Unknown'}
        </p>
        <p className="text-sm text-muted-foreground">Energy efficiency rating</p>
      </div>
    </div>
  )
}
