import type { ComponentType } from 'react'
import * as LucideIcons from 'lucide-react'
import { Link } from 'lucide-react'

interface LucideIconProps {
  name: string
  size?: number
  className?: string
  color?: string
  strokeWidth?: number
}

type IconProps = { size?: number; className?: string; color?: string; strokeWidth?: number }

export function LucideIcon({ name, size = 20, className, color, strokeWidth }: LucideIconProps) {
  const IconComponent = (LucideIcons as Record<string, ComponentType<IconProps>>)[name]

  if (!IconComponent) {
    return <Link size={size} className={className} color={color} strokeWidth={strokeWidth} />
  }

  return (
    <IconComponent
      size={size}
      className={className}
      color={color}
      strokeWidth={strokeWidth}
    />
  )
}

// 供后台图标选择器使用的图标集
export const ICON_OPTIONS = [
  'Wrench', 'Code2', 'Bot', 'Palette', 'Briefcase', 'Globe', 'Star', 'Heart',
  'BookOpen', 'Compass', 'Layers', 'Zap', 'Shield', 'Music', 'Camera', 'Film',
  'ShoppingCart', 'CreditCard', 'BarChart2', 'PieChart', 'Mail', 'Bell', 'Settings',
  'Home', 'Map', 'Cloud', 'Database', 'Server', 'Cpu', 'Terminal', 'Package',
  'Git', 'Github', 'Figma', 'Chrome', 'Smartphone', 'Monitor', 'Tablet',
  'Coffee', 'Anchor', 'Award', 'Bookmark', 'Box', 'Flag', 'Flame', 'Gem',
  'Key', 'Leaf', 'Lightning', 'Link', 'Lock', 'Mic', 'Moon', 'Sun',
]
