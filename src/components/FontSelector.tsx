import { useState, useRef, useEffect } from 'react'
import { Type, ChevronDown } from 'lucide-react'

export const FONTS = [
  {
    id: 'inter',
    name: '经典系统体',
    desc: 'Inter / 微软雅黑',
    value: "'Inter', 'Microsoft YaHei', 'PingFang SC', sans-serif",
  },
  {
    id: 'apple',
    name: '苹果极简',
    desc: 'SF Pro / PingFang',
    value: "-apple-system, 'PingFang SC', 'Helvetica Neue', Arial, sans-serif",
  },
  {
    id: 'serif',
    name: '高对比度衬线',
    desc: 'Noto Serif SC',
    value: "'Noto Serif SC', 'Georgia', 'SimSun', serif",
  },
  {
    id: 'mono',
    name: '极客代码体',
    desc: 'JetBrains Mono',
    value: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  },
]

interface FontSelectorProps {
  font: string
  onChange: (font: string) => void
}

export function FontSelector({ font, onChange }: FontSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = FONTS.find((f) => f.value === font) ?? FONTS[0]

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 transition-all"
      >
        <Type size={15} />
        <span className="flex-1 text-left">{current.name}</span>
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 w-48 mb-1 bg-white rounded-xl border border-neutral-100 shadow-lg shadow-neutral-200/60 overflow-hidden z-50">
          {FONTS.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                onChange(f.value)
                setOpen(false)
              }}
              style={{ fontFamily: f.value }}
              className={`w-full flex flex-col items-start px-3 py-2.5 text-left hover:bg-neutral-50 transition-colors ${
                f.value === font ? 'bg-neutral-50 text-neutral-900' : 'text-neutral-700'
              }`}
            >
              <span className="text-sm font-medium">{f.name}</span>
              <span className="text-xs text-neutral-400 mt-0.5">{f.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
