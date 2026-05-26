import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X, Lock, LogOut, Eye, EyeOff, Plus, Trash2, Edit3, Check, RotateCcw,
  ChevronDown, Save, Wifi, WifiOff, GripVertical,
} from 'lucide-react'
import { LucideIcon, ICON_OPTIONS } from './LucideIcon'
import {
  saveCategory, updateCategory, deleteCategory,
  saveLink, updateLink, deleteLink,
  saveAd, updateAd, deleteAd,
  updateSettings, isFirebaseConfigured,
} from '../firebase'
import type { Category, LinkItem, AdItem, SystemSettings } from '../types'
import { FONTS } from './FontSelector'

// ── 推荐配色方案 ────────────────────────────────────────────
const PRESET_PALETTES = [
  { name: '海湛蓝', colors: ['#2563eb', '#3b82f6', '#93c5fd', '#dbeafe'] },
  { name: '翠玉绿', colors: ['#059669', '#10b981', '#6ee7b7', '#d1fae5'] },
  { name: '暗夜紫', colors: ['#7c3aed', '#8b5cf6', '#c4b5fd', '#ede9fe'] },
  { name: '珊瑚橙', colors: ['#ea580c', '#f97316', '#fdba74', '#ffedd5'] },
  { name: '玫瑰红', colors: ['#e11d48', '#f43f5e', '#fda4af', '#ffe4e6'] },
  { name: '金秋黄', colors: ['#d97706', '#f59e0b', '#fcd34d', '#fef3c7'] },
  { name: '青石灰', colors: ['#475569', '#64748b', '#94a3b8', '#f1f5f9'] },
  { name: '极光粉', colors: ['#db2777', '#ec4899', '#f9a8d4', '#fce7f3'] },
  { name: '碧海青', colors: ['#0891b2', '#06b6d4', '#67e8f9', '#cffafe'] },
  { name: '森林棕', colors: ['#92400e', '#b45309', '#d97706', '#fef3c7'] },
]

type Tab = 'categories' | 'links' | 'ads' | 'colors' | 'settings'

interface AdminPanelProps {
  settings: SystemSettings
  categories: Category[]
  links: LinkItem[]
  ads: AdItem[]
  onClose: () => void
  onSettingsChange: (s: SystemSettings) => void
  onCategoriesChange: (cats: Category[]) => void
  onLinksChange: (links: LinkItem[]) => void
  onAdsChange: (ads: AdItem[]) => void
}

// ── 颜色选择器组件 ─────────────────────────────────────────
function ColorInput({
  label, value, onChange, defaultVal, customColors, onSaveCustom,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  defaultVal?: string
  customColors: string[]
  onSaveCustom: (v: string) => void
}) {
  const hasColor = !!value

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-neutral-500">{label}</span>
      <div className="flex items-center gap-2 flex-wrap">
        {hasColor ? (
          <>
            {/* 色块 / 取色器 — 仅在有值时渲染，避免浏览器用 #000000 污染空值 */}
            <div className="relative w-8 h-8 shrink-0">
              <div
                className="w-8 h-8 rounded-lg border border-neutral-200 cursor-pointer"
                style={{ background: value }}
              />
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </div>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#3b82f6"
              className="w-24 px-2 py-1 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            {/* 清除 */}
            <button
              onClick={() => onChange('')}
              className="text-neutral-300 hover:text-red-400 transition-colors"
              title="清除颜色"
            >
              <X size={13} />
            </button>
            {defaultVal !== undefined && value !== defaultVal && (
              <button
                onClick={() => onChange(defaultVal)}
                className="text-neutral-400 hover:text-neutral-700 transition-colors"
                title="恢复默认"
              >
                <RotateCcw size={13} />
              </button>
            )}
            <button
              onClick={() => onSaveCustom(value)}
              className="text-xs text-neutral-400 hover:text-blue-600 border border-neutral-200 rounded px-1.5 py-0.5 hover:border-blue-400 transition-colors"
              title="保存到调色盘"
            >
              + 存色
            </button>
          </>
        ) : (
          <button
            onClick={() => onChange('#3b82f6')}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-blue-600 border border-dashed border-neutral-300 hover:border-blue-400 rounded-lg px-2.5 py-1.5 transition-all"
          >
            <Plus size={12} /> 设置颜色
          </button>
        )}
      </div>
      {customColors.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {customColors.map((c) => (
            <button
              key={c}
              onClick={() => onChange(c)}
              style={{ background: c }}
              className="w-5 h-5 rounded-full border-2 border-white shadow hover:scale-110 transition-transform ring-1 ring-neutral-200"
              title={c}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── 输入框统一样式 ──────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-neutral-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"
      />
    </div>
  )
}

// ── 主组件 ─────────────────────────────────────────────────
export function AdminPanel({ settings, categories, links, ads, onClose, onSettingsChange, onCategoriesChange, onLinksChange, onAdsChange }: AdminPanelProps) {
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem('nav_admin_auth') === '1')
  const [pwInput, setPwInput] = useState('')
  const [pwVisible, setPwVisible] = useState(false)
  const [pwError, setPwError] = useState(false)
  const [tab, setTab] = useState<Tab>('categories')

  function handleAuth() {
    if (pwInput === settings.adminPassword) {
      sessionStorage.setItem('nav_admin_auth', '1')
      setAuthenticated(true)
      setPwError(false)
    } else {
      setPwError(true)
      setPwInput('')
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('nav_admin_auth')
    setAuthenticated(false)
    setPwInput('')
  }

  // ── 认证界面 ─────────────────────────────────────────────
  if (!authenticated) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
              <Lock size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">管理后台</h2>
              <p className="text-xs text-neutral-500">请输入管理员密码</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type={pwVisible ? 'text' : 'password'}
                value={pwInput}
                onChange={(e) => { setPwInput(e.target.value); setPwError(false) }}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                placeholder="输入密码..."
                className={`w-full px-4 py-3 pr-10 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  pwError
                    ? 'border-red-400 ring-red-400/30 bg-red-50'
                    : 'border-neutral-200 focus:ring-blue-400/40 focus:border-blue-400'
                }`}
                autoFocus
              />
              <button
                onClick={() => setPwVisible((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                {pwVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {pwError && (
              <p className="text-xs text-red-500">密码错误，请重试</p>
            )}

            <button
              onClick={handleAuth}
              className="w-full py-3 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 active:scale-[0.98] transition-all"
            >
              进入管理后台
            </button>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <X size={18} />
          </button>
        </motion.div>
      </motion.div>
    )
  }

  // ── 主面板 ───────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="w-full max-w-5xl h-[88vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
              <Lock size={14} className="text-white" />
            </div>
            <h1 className="text-base font-semibold text-neutral-900">管理后台</h1>
            <span className="flex items-center gap-1 text-xs text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-full">
              {isFirebaseConfigured
                ? <><Wifi size={11} className="text-emerald-500" />云端同步</>
                : <><WifiOff size={11} className="text-amber-500" />本地模式</>
              }
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-all"
              title="退出登录"
            >
              <LogOut size={14} />
              退出
            </button>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg p-1.5 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 py-2 border-b border-neutral-100 shrink-0 overflow-x-auto">
          {([
            ['categories', '分类管理'],
            ['links', '链接管理'],
            ['ads', '广告位'],
            ['colors', '色盘定制'],
            ['settings', '系统设置'],
          ] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                tab === t
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'categories' && (
            <CategoriesTab categories={categories} customColors={settings.customColors} onCategoriesChange={onCategoriesChange} />
          )}
          {tab === 'links' && (
            <LinksTab links={links} categories={categories} customColors={settings.customColors} onLinksChange={onLinksChange} />
          )}
          {tab === 'ads' && (
            <AdsTab ads={ads} customColors={settings.customColors} onAdsChange={onAdsChange} />
          )}
          {tab === 'colors' && (
            <ColorsTab settings={settings} onSettingsChange={onSettingsChange} />
          )}
          {tab === 'settings' && (
            <SettingsTab settings={settings} onSettingsChange={onSettingsChange} />
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── 分类管理 Tab ────────────────────────────────────────────
function CategoriesTab({ categories, customColors, onCategoriesChange }: { categories: Category[]; customColors: string[]; onCategoriesChange: (cats: Category[]) => void }) {
  const sorted = [...categories].sort((a, b) => a.order - b.order)
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Category>>({})
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState<Partial<Category>>({ name: '', icon: 'Globe', visible: true, order: sorted.length + 1 })
  const [iconPickerFor, setIconPickerFor] = useState<string | null>(null)

  function startEdit(cat: Category) {
    setEditId(cat.id)
    setEditData({ ...cat })
    setAdding(false)
  }

  async function saveEdit() {
    if (!editId) return
    await updateCategory(editId, editData)
    onCategoriesChange(categories.map((c) => (c.id === editId ? { ...c, ...editData } as Category : c)))
    setEditId(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除该分类？')) return
    await deleteCategory(id)
    onCategoriesChange(categories.filter((c) => c.id !== id))
  }

  async function handleAdd() {
    if (!newItem.name) return
    const catData = {
      name: newItem.name ?? '',
      icon: newItem.icon ?? 'Globe',
      visible: newItem.visible ?? true,
      order: newItem.order ?? sorted.length + 1,
      color: newItem.color,
    }
    const id = await saveCategory(catData)
    onCategoriesChange([...categories, { ...catData, id }])
    setAdding(false)
    setNewItem({ name: '', icon: 'Globe', visible: true, order: sorted.length + 2 })
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-700">分类列表 ({categories.length})</h2>
        <button
          onClick={() => { setAdding(true); setEditId(null) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-700 transition-colors"
        >
          <Plus size={13} /> 新建分类
        </button>
      </div>

      {adding && (
        <ItemForm
          title="新建分类"
          onCancel={() => setAdding(false)}
          onSave={handleAdd}
        >
          <CatFormFields
            data={newItem}
            onChange={(k, v) => setNewItem((p) => ({ ...p, [k]: v }))}
            customColors={customColors}
            iconPickerOpen={iconPickerFor === 'new'}
            onToggleIconPicker={() => setIconPickerFor(iconPickerFor === 'new' ? null : 'new')}
          />
        </ItemForm>
      )}

      <div className="space-y-2">
        {sorted.map((cat) => (
          <div key={cat.id} className="border border-neutral-100 rounded-xl overflow-hidden">
            {editId === cat.id ? (
              <ItemForm title="编辑分类" onCancel={() => setEditId(null)} onSave={saveEdit} compact>
                <CatFormFields
                  data={editData}
                  onChange={(k, v) => setEditData((p) => ({ ...p, [k]: v }))}
                  customColors={customColors}
                  iconPickerOpen={iconPickerFor === cat.id}
                  onToggleIconPicker={() => setIconPickerFor(iconPickerFor === cat.id ? null : cat.id)}
                />
              </ItemForm>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-neutral-50 transition-colors">
                <GripVertical size={14} className="text-neutral-300 shrink-0" />
                <div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center border border-neutral-100">
                  <LucideIcon name={cat.icon} size={16} className="text-neutral-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800">{cat.name}</p>
                  <p className="text-xs text-neutral-400">order: {cat.order} · {cat.visible ? '显示' : '隐藏'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { updateCategory(cat.id, { visible: !cat.visible }); onCategoriesChange(categories.map((c) => c.id === cat.id ? { ...c, visible: !cat.visible } : c)) }}
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${cat.visible ? 'text-emerald-600 bg-emerald-50' : 'text-neutral-400 bg-neutral-50'}`}
                  >
                    {cat.visible ? '显示' : '隐藏'}
                  </button>
                  <button onClick={() => startEdit(cat)} className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function CatFormFields({ data, onChange, customColors, iconPickerOpen, onToggleIconPicker }: {
  data: Partial<Category>
  onChange: (k: string, v: unknown) => void
  customColors: string[]
  iconPickerOpen: boolean
  onToggleIconPicker: () => void
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="分类名称" value={data.name ?? ''} onChange={(v) => onChange('name', v)} placeholder="例：常用工具" />
      <Field label="排序权重" value={String(data.order ?? 1)} onChange={(v) => onChange('order', Number(v))} type="number" />
      <div className="space-y-1 col-span-2">
        <label className="text-xs font-medium text-neutral-500">图标</label>
        <button
          onClick={onToggleIconPicker}
          className="flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-xl text-sm hover:border-blue-400 transition-colors"
        >
          <LucideIcon name={data.icon ?? 'Globe'} size={16} />
          <span>{data.icon ?? 'Globe'}</span>
          <ChevronDown size={13} className="text-neutral-400 ml-auto" />
        </button>
        {iconPickerOpen && (
          <div className="flex flex-wrap gap-1.5 p-3 border border-neutral-200 rounded-xl bg-neutral-50 max-h-32 overflow-y-auto">
            {ICON_OPTIONS.map((name) => (
              <button
                key={name}
                onClick={() => { onChange('icon', name); onToggleIconPicker() }}
                title={name}
                className={`p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all ${data.icon === name ? 'bg-white shadow-sm ring-1 ring-blue-400' : ''}`}
              >
                <LucideIcon name={name} size={16} className="text-neutral-600" />
              </button>
            ))}
          </div>
        )}
      </div>
      <label className="flex items-center gap-2 col-span-2 cursor-pointer">
        <input
          type="checkbox"
          checked={data.visible ?? true}
          onChange={(e) => onChange('visible', e.target.checked)}
          className="rounded"
        />
        <span className="text-sm text-neutral-600">显示此分类</span>
      </label>
    </div>
  )
}

function faviconUrl(url: string): string {
  try {
    const href = url.startsWith('http') ? url : `https://${url}`
    return `https://www.google.com/s2/favicons?domain=${new URL(href).hostname}&sz=32`
  } catch {
    return ''
  }
}

// ── 链接管理 Tab ────────────────────────────────────────────
function LinksTab({ links, categories, customColors, onLinksChange }: { links: LinkItem[]; categories: Category[]; customColors: string[]; onLinksChange: (links: LinkItem[]) => void }) {
  const [filterCat, setFilterCat] = useState<string>('all')
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<LinkItem>>({})
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState<Partial<LinkItem>>({ title: '', url: '', visible: true, order: 1, categoryId: categories[0]?.id ?? '' })

  const sorted = links
    .filter((l) => filterCat === 'all' || l.categoryId === filterCat)
    .sort((a, b) => a.order - b.order)

  async function saveEdit() {
    if (!editId) return
    await updateLink(editId, editData)
    onLinksChange(links.map((l) => (l.id === editId ? { ...l, ...editData } as LinkItem : l)))
    setEditId(null)
  }

  async function handleAdd() {
    if (!newItem.title || !newItem.url) return
    const linkData = {
      title: newItem.title ?? '',
      url: newItem.url ?? '',
      subtitle: newItem.subtitle,
      categoryId: newItem.categoryId ?? categories[0]?.id ?? '',
      visible: newItem.visible ?? true,
      order: newItem.order ?? 1,
      icon: newItem.icon,
      iconUrl: newItem.iconUrl,
      bgColor: newItem.bgColor,
      textColor: newItem.textColor,
      subtitleColor: newItem.subtitleColor,
      badgeText: newItem.badgeText,
      badgeColor: newItem.badgeColor,
      badgeBgColor: newItem.badgeBgColor,
    }
    const id = await saveLink(linkData)
    onLinksChange([...links, { ...linkData, id }])
    setAdding(false)
    setNewItem({ title: '', url: '', visible: true, order: 1, categoryId: filterCat === 'all' ? categories[0]?.id ?? '' : filterCat })
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/40 bg-white"
        >
          <option value="all">全部分类</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span className="text-xs text-neutral-400 flex-1">{sorted.length} 个链接</span>
        <button
          onClick={() => { setAdding(true); setEditId(null) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-700 transition-colors"
        >
          <Plus size={13} /> 新建链接
        </button>
      </div>

      {adding && (
        <ItemForm title="新建链接" onCancel={() => setAdding(false)} onSave={handleAdd}>
          <LinkFormFields
            data={newItem}
            onChange={(k, v) => setNewItem((p) => ({ ...p, [k]: v }))}
            categories={categories}
            customColors={customColors}
          />
        </ItemForm>
      )}

      <div className="space-y-2">
        {sorted.map((link) => (
          <div key={link.id} className="border border-neutral-100 rounded-xl overflow-hidden">
            {editId === link.id ? (
              <ItemForm title="编辑链接" onCancel={() => setEditId(null)} onSave={saveEdit} compact>
                <LinkFormFields
                  data={editData}
                  onChange={(k, v) => setEditData((p) => ({ ...p, [k]: v }))}
                  categories={categories}
                  customColors={customColors}
                />
              </ItemForm>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-neutral-50 transition-colors">
                <img
                  src={link.iconUrl || faviconUrl(link.url)}
                  alt=""
                  className="w-7 h-7 rounded object-contain shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">{link.title}</p>
                  <p className="text-xs text-neutral-400 truncate">{link.url}</p>
                </div>
                <span className="text-xs text-neutral-300 shrink-0">
                  {categories.find((c) => c.id === link.categoryId)?.name}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { updateLink(link.id, { visible: !link.visible }); onLinksChange(links.map((l) => l.id === link.id ? { ...l, visible: !link.visible } : l)) }}
                    className={`text-xs px-2 py-1 rounded-md ${link.visible ? 'text-emerald-600 bg-emerald-50' : 'text-neutral-400 bg-neutral-50'}`}
                  >
                    {link.visible ? '显示' : '隐藏'}
                  </button>
                  <button onClick={() => { setEditId(link.id); setEditData({ ...link }); setAdding(false) }} className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => { if (confirm('确认删除？')) { deleteLink(link.id); onLinksChange(links.filter((l) => l.id !== link.id)) } }} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function LinkFormFields({ data, onChange, categories, customColors }: {
  data: Partial<LinkItem>
  onChange: (k: string, v: unknown) => void
  categories: Category[]
  customColors: string[]
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="链接标题 *" value={data.title ?? ''} onChange={(v) => onChange('title', v)} placeholder="网站名称" />
      <Field label="URL *" value={data.url ?? ''} onChange={(v) => onChange('url', v)} placeholder="https://..." />
      <Field label="副标题" value={data.subtitle ?? ''} onChange={(v) => onChange('subtitle', v)} placeholder="简短描述" />
      <ColorInput label="副标题颜色" value={data.subtitleColor ?? ''} onChange={(v) => onChange('subtitleColor', v)} customColors={customColors} onSaveCustom={() => {}} />
      <Field label="自定义图标 URL" value={data.iconUrl ?? ''} onChange={(v) => onChange('iconUrl', v)} placeholder="https://..." />
      <div className="space-y-1">
        <label className="text-xs font-medium text-neutral-500">所属分类</label>
        <select
          value={data.categoryId ?? ''}
          onChange={(e) => onChange('categoryId', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none bg-white"
        >
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <Field label="排序权重" value={String(data.order ?? 1)} onChange={(v) => onChange('order', Number(v))} type="number" />
      <ColorInput label="卡片背景色" value={data.bgColor ?? ''} onChange={(v) => onChange('bgColor', v)} customColors={customColors} onSaveCustom={() => {}} />
      <ColorInput label="文字颜色" value={data.textColor ?? ''} onChange={(v) => onChange('textColor', v)} customColors={customColors} onSaveCustom={() => {}} />
      {/* 徽章区域 */}
      <div className="col-span-2 pt-1 border-t border-neutral-100">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">徽章设置（可选）</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="徽章文字" value={data.badgeText ?? ''} onChange={(v) => onChange('badgeText', v)} placeholder="如：NEW · HOT · 推荐" />
          <div />
          <ColorInput label="徽章文字色" value={data.badgeColor ?? ''} onChange={(v) => onChange('badgeColor', v)} customColors={customColors} onSaveCustom={() => {}} />
          <ColorInput label="徽章背景色" value={data.badgeBgColor ?? ''} onChange={(v) => onChange('badgeBgColor', v)} customColors={customColors} onSaveCustom={() => {}} />
        </div>
      </div>
      <div className="flex items-center gap-2 col-span-2">
        <input type="checkbox" checked={data.visible ?? true} onChange={(e) => onChange('visible', e.target.checked)} className="rounded" />
        <span className="text-sm text-neutral-600">显示此链接</span>
      </div>
    </div>
  )
}

// ── 广告位管理 Tab ──────────────────────────────────────────
function AdsTab({ ads, customColors: propCustomColors, onAdsChange }: { ads: AdItem[]; customColors: string[]; onAdsChange: (ads: AdItem[]) => void }) {
  const sorted = [...ads].sort((a, b) => a.order - b.order)
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<AdItem>>({})
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState<Partial<AdItem>>({ title: '', url: '', size: 'medium', visible: true, order: sorted.length + 1 })
  const [localCustomColors, setLocalCustomColors] = useState<string[]>(propCustomColors)

  useEffect(() => {
    setLocalCustomColors(propCustomColors)
  }, [propCustomColors])

  function addCustomColor(c: string) {
    if (!c || localCustomColors.includes(c)) return
    setLocalCustomColors((prev) => [...prev, c])
  }

  async function saveEdit() {
    if (!editId) return
    await updateAd(editId, editData)
    onAdsChange(ads.map((a) => (a.id === editId ? { ...a, ...editData } as AdItem : a)))
    setEditId(null)
  }

  async function handleAdd() {
    if (!newItem.title || !newItem.url) return
    const adData = {
      title: newItem.title ?? '',
      url: newItem.url ?? '',
      subtitle: newItem.subtitle,
      titleColor: newItem.titleColor,
      subtitleColor: newItem.subtitleColor,
      imageUrl: newItem.imageUrl,
      badgeText: newItem.badgeText,
      badgeColor: newItem.badgeColor,
      badgeBgColor: newItem.badgeBgColor,
      size: newItem.size ?? 'medium',
      visible: newItem.visible ?? true,
      order: newItem.order ?? sorted.length + 1,
    }
    const id = await saveAd(adData)
    onAdsChange([...ads, { ...adData, id }])
    setAdding(false)
    setNewItem({ title: '', url: '', size: 'medium', visible: true, order: sorted.length + 2 })
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-700">广告位 / 精品推荐 ({ads.length})</h2>
        <button
          onClick={() => { setAdding(true); setEditId(null) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-700 transition-colors"
        >
          <Plus size={13} /> 新建广告位
        </button>
      </div>

      {adding && (
        <ItemForm title="新建广告位" onCancel={() => setAdding(false)} onSave={handleAdd}>
          <AdFormFields
            data={newItem}
            onChange={(k, v) => setNewItem((p) => ({ ...p, [k]: v }))}
            customColors={localCustomColors}
            onSaveCustomColor={addCustomColor}
          />
        </ItemForm>
      )}

      <div className="space-y-2">
        {sorted.map((ad) => (
          <div key={ad.id} className="border border-neutral-100 rounded-xl overflow-hidden">
            {editId === ad.id ? (
              <ItemForm title="编辑广告位" onCancel={() => setEditId(null)} onSave={saveEdit} compact>
                <AdFormFields
                  data={editData}
                  onChange={(k, v) => setEditData((p) => ({ ...p, [k]: v }))}
                  customColors={localCustomColors}
                  onSaveCustomColor={addCustomColor}
                />
              </ItemForm>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-neutral-50 transition-colors">
                {ad.imageUrl && (
                  <img src={ad.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate" style={ad.titleColor ? { color: ad.titleColor } : {}}>
                      {ad.title}
                    </p>
                    {ad.badgeText && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ color: ad.badgeColor ?? '#fff', background: ad.badgeBgColor ?? '#2563eb' }}
                      >
                        {ad.badgeText}
                      </span>
                    )}
                  </div>
                  {ad.subtitle && (
                    <p className="text-xs truncate" style={ad.subtitleColor ? { color: ad.subtitleColor } : { color: '#737373' }}>
                      {ad.subtitle}
                    </p>
                  )}
                  <p className="text-xs text-neutral-300 mt-0.5">尺寸: {ad.size} · 排序: {ad.order}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { updateAd(ad.id, { visible: !ad.visible }); onAdsChange(ads.map((a) => a.id === ad.id ? { ...a, visible: !ad.visible } : a)) }}
                    className={`text-xs px-2 py-1 rounded-md ${ad.visible ? 'text-emerald-600 bg-emerald-50' : 'text-neutral-400 bg-neutral-50'}`}
                  >
                    {ad.visible ? '显示' : '隐藏'}
                  </button>
                  <button onClick={() => { setEditId(ad.id); setEditData({ ...ad }); setAdding(false) }} className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => { if (confirm('确认删除？')) { deleteAd(ad.id); onAdsChange(ads.filter((a) => a.id !== ad.id)) } }} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function AdFormFields({ data, onChange, customColors, onSaveCustomColor }: {
  data: Partial<AdItem>
  onChange: (k: string, v: unknown) => void
  customColors: string[]
  onSaveCustomColor: (c: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="标题 *" value={data.title ?? ''} onChange={(v) => onChange('title', v)} placeholder="推荐站点名称" />
      <Field label="链接 URL *" value={data.url ?? ''} onChange={(v) => onChange('url', v)} placeholder="https://..." />
      <Field label="副标题" value={data.subtitle ?? ''} onChange={(v) => onChange('subtitle', v)} placeholder="简短描述文案" />
      <Field label="封面图 URL" value={data.imageUrl ?? ''} onChange={(v) => onChange('imageUrl', v)} placeholder="https://..." />
      <Field label="徽章文字" value={data.badgeText ?? ''} onChange={(v) => onChange('badgeText', v)} placeholder="推荐 / 赞助" />
      <div className="space-y-1">
        <label className="text-xs font-medium text-neutral-500">卡片尺寸</label>
        <select
          value={data.size ?? 'medium'}
          onChange={(e) => onChange('size', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none bg-white"
        >
          <option value="small">Small — 1/4 宽</option>
          <option value="medium">Medium — 1/2 宽</option>
          <option value="large">Large — 全宽</option>
        </select>
      </div>
      <Field label="排序权重" value={String(data.order ?? 1)} onChange={(v) => onChange('order', Number(v))} type="number" />
      <div className="col-span-2 grid grid-cols-2 gap-4">
        <ColorInput label="标题颜色" value={data.titleColor ?? ''} onChange={(v) => onChange('titleColor', v)} customColors={customColors} onSaveCustom={onSaveCustomColor} />
        <ColorInput label="副标题颜色" value={data.subtitleColor ?? ''} onChange={(v) => onChange('subtitleColor', v)} customColors={customColors} onSaveCustom={onSaveCustomColor} />
        <ColorInput label="徽章文字色" value={data.badgeColor ?? ''} onChange={(v) => onChange('badgeColor', v)} customColors={customColors} onSaveCustom={onSaveCustomColor} />
        <ColorInput label="徽章背景色" value={data.badgeBgColor ?? ''} onChange={(v) => onChange('badgeBgColor', v)} customColors={customColors} onSaveCustom={onSaveCustomColor} />
      </div>
      <div className="flex items-center gap-2 col-span-2">
        <input type="checkbox" checked={data.visible ?? true} onChange={(e) => onChange('visible', e.target.checked)} className="rounded" />
        <span className="text-sm text-neutral-600">显示此广告位</span>
      </div>
    </div>
  )
}

// ── 色盘定制 Tab ────────────────────────────────────────────
function ColorsTab({ settings, onSettingsChange }: { settings: SystemSettings; onSettingsChange: (s: SystemSettings) => void }) {
  const [hexInput, setHexInput] = useState('')

  function addColor(c: string) {
    if (!c || settings.customColors.includes(c)) return
    const updated = { ...settings, customColors: [...settings.customColors, c] }
    onSettingsChange(updated)
    updateSettings({ customColors: updated.customColors })
  }

  function removeColor(c: string) {
    const updated = { ...settings, customColors: settings.customColors.filter((x) => x !== c) }
    onSettingsChange(updated)
    updateSettings({ customColors: updated.customColors })
  }

  return (
    <div className="p-6 space-y-8">
      {/* 推荐配色方案 */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-700 mb-3">推荐配色方案</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {PRESET_PALETTES.map((p) => (
            <button
              key={p.name}
              onClick={() => p.colors.forEach((c) => addColor(c))}
              className="p-3 border border-neutral-100 rounded-xl hover:border-neutral-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="flex gap-1 mb-2">
                {p.colors.map((c) => (
                  <div key={c} style={{ background: c }} className="h-4 flex-1 rounded" />
                ))}
              </div>
              <p className="text-xs text-neutral-600 group-hover:text-neutral-900 transition-colors">{p.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 自定义调色盘 */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-700 mb-3">我的调色盘</h3>
        <div className="flex items-center gap-2 mb-4">
          <input
            type="color"
            value={hexInput || '#2563eb'}
            onChange={(e) => setHexInput(e.target.value)}
            className="w-9 h-9 rounded-lg cursor-pointer border border-neutral-200"
            style={{ padding: '2px' }}
          />
          <input
            type="text"
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            placeholder="#2563eb"
            className="w-28 px-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/40"
          />
          <button
            onClick={() => { addColor(hexInput); setHexInput('') }}
            disabled={!hexInput}
            className="px-3 py-2 bg-neutral-900 text-white text-sm rounded-xl hover:bg-neutral-700 disabled:opacity-40 transition-all"
          >
            <Plus size={15} />
          </button>
        </div>

        {settings.customColors.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-6">还没有保存任何颜色，从推荐方案中添加或自定义</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {settings.customColors.map((c) => (
              <div key={c} className="group relative">
                <div
                  style={{ background: c }}
                  className="w-10 h-10 rounded-xl border-2 border-white shadow-md ring-1 ring-neutral-200"
                />
                <button
                  onClick={() => removeColor(c)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X size={9} />
                </button>
                <p className="text-xs text-neutral-400 text-center mt-1">{c}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── 系统设置 Tab ────────────────────────────────────────────
function SettingsTab({ settings, onSettingsChange }: { settings: SystemSettings; onSettingsChange: (s: SystemSettings) => void }) {
  const [draft, setDraft] = useState<SystemSettings>({ ...settings })
  const [pwVisible, setPwVisible] = useState(false)

  useEffect(() => {
    setDraft({ ...settings })
  }, [settings])
  const [saved, setSaved] = useState(false)

  function update(k: keyof SystemSettings, v: unknown) {
    setDraft((p) => ({ ...p, [k]: v }))
    setSaved(false)
  }

  async function handleSave() {
    await updateSettings(draft)
    onSettingsChange(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-700">站点信息</h3>
        <Field label="站点标题" value={draft.siteTitle} onChange={(v) => update('siteTitle', v)} placeholder="导航门户" />
        <Field label="站点副标题" value={draft.siteSubtitle} onChange={(v) => update('siteSubtitle', v)} placeholder="精选优质网站，提升效率" />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-700">安全设置</h3>
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-500">管理员密码</label>
          <div className="relative">
            <input
              type={pwVisible ? 'text' : 'password'}
              value={draft.adminPassword}
              onChange={(e) => update('adminPassword', e.target.value)}
              className="w-full px-3 py-2 pr-10 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/40"
            />
            <button
              onClick={() => setPwVisible((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
            >
              {pwVisible ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-700">字体设置</h3>
        <div className="grid grid-cols-2 gap-2">
          {FONTS.map((f) => (
            <button
              key={f.id}
              onClick={() => update('font', f.value)}
              style={{ fontFamily: f.value }}
              className={`px-3 py-3 border rounded-xl text-left transition-all ${
                draft.font === f.value
                  ? 'border-neutral-900 bg-neutral-50 text-neutral-900'
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
              }`}
            >
              <p className="text-sm font-medium">{f.name}</p>
              <p className="text-xs text-neutral-400">{f.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-neutral-900 text-white hover:bg-neutral-700'
          }`}
        >
          {saved ? <><Check size={15} /> 已保存</> : <><Save size={15} /> 保存设置</>}
        </button>
      </div>

      {!isFirebaseConfigured && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <p className="font-medium">提示：当前为本地存储模式</p>
          <p className="text-xs mt-1 text-amber-600">
            在 <code className="bg-amber-100 px-1 rounded">src/firebase.ts</code> 中填写您的 Firebase 配置，即可开启多端实时同步。
          </p>
        </div>
      )}
    </div>
  )
}

// ── 通用表单容器 ────────────────────────────────────────────
function ItemForm({ title, children, onCancel, onSave, compact }: {
  title: string
  children: React.ReactNode
  onCancel: () => void
  onSave: () => void
  compact?: boolean
}) {
  return (
    <div className={`border border-blue-200 rounded-xl bg-blue-50/30 ${compact ? '' : 'mb-4'}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-100">
        <h3 className="text-sm font-medium text-neutral-700">{title}</h3>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="text-xs text-neutral-500 hover:text-neutral-800 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors">取消</button>
          <button onClick={onSave} className="text-xs text-white bg-neutral-900 hover:bg-neutral-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
            <Check size={12} /> 保存
          </button>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}
