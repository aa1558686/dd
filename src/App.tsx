import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Lock, Menu, X, ExternalLink } from 'lucide-react'
import { LucideIcon } from './components/LucideIcon'
import { FontSelector } from './components/FontSelector'
import { AdminPanel } from './components/AdminPanel'
import { subscribeAll, updateSettings, initLocalStorage } from './firebase'
import type { Category, LinkItem, AdItem, SystemSettings, MarqueeItem } from './types'

// ── 默认数据（Firebase 为空时显示） ─────────────────────────
const DEFAULT_SETTINGS: SystemSettings = {
  siteTitle: '导航门户',
  siteSubtitle: '精选优质网站，提升效率',
  adminPassword: 'admin123',
  font: "'Inter', 'Microsoft YaHei', 'PingFang SC', sans-serif",
  customColors: [],
}

const SAMPLE_CATEGORIES: Category[] = [
  { id: 'c1', name: '常用工具', icon: 'Wrench', order: 1, visible: true },
  { id: 'c2', name: '技术开发', icon: 'Code2', order: 2, visible: true },
  { id: 'c3', name: 'AI 工具', icon: 'Bot', order: 3, visible: true },
  { id: 'c4', name: '设计资源', icon: 'Palette', order: 4, visible: true },
  { id: 'c5', name: '效率办公', icon: 'Briefcase', order: 5, visible: true },
]

const SAMPLE_LINKS: LinkItem[] = [
  { id: 'l1', categoryId: 'c1', title: 'Google', subtitle: '全球最大搜索引擎', url: 'https://google.com', order: 1, visible: true },
  { id: 'l2', categoryId: 'c1', title: 'YouTube', subtitle: '视频内容平台', url: 'https://youtube.com', order: 2, visible: true },
  { id: 'l3', categoryId: 'c1', title: 'Bilibili', subtitle: '国内视频弹幕网站', url: 'https://bilibili.com', order: 3, visible: true },
  { id: 'l4', categoryId: 'c1', title: 'Wikipedia', subtitle: '开放百科全书', url: 'https://wikipedia.org', order: 4, visible: true },
  { id: 'l5', categoryId: 'c2', title: 'GitHub', subtitle: '代码托管与协作', url: 'https://github.com', order: 1, visible: true },
  { id: 'l6', categoryId: 'c2', title: 'MDN', subtitle: 'Web 开发参考文档', url: 'https://developer.mozilla.org', order: 2, visible: true },
  { id: 'l7', categoryId: 'c2', title: 'Stack Overflow', subtitle: '开发者问答社区', url: 'https://stackoverflow.com', order: 3, visible: true },
  { id: 'l8', categoryId: 'c2', title: 'npm', subtitle: 'Node.js 包管理器', url: 'https://npmjs.com', order: 4, visible: true },
  { id: 'l9', categoryId: 'c3', title: 'ChatGPT', subtitle: 'OpenAI 对话 AI', url: 'https://chat.openai.com', order: 1, visible: true },
  { id: 'l10', categoryId: 'c3', title: 'Claude', subtitle: 'Anthropic AI 助手', url: 'https://claude.ai', order: 2, visible: true },
  { id: 'l11', categoryId: 'c3', title: 'Midjourney', subtitle: 'AI 图像生成', url: 'https://midjourney.com', order: 3, visible: true },
  { id: 'l12', categoryId: 'c3', title: 'Perplexity', subtitle: 'AI 驱动的搜索引擎', url: 'https://perplexity.ai', order: 4, visible: true },
  { id: 'l13', categoryId: 'c4', title: 'Figma', subtitle: '协作 UI 设计工具', url: 'https://figma.com', order: 1, visible: true },
  { id: 'l14', categoryId: 'c4', title: 'Dribbble', subtitle: '设计作品灵感社区', url: 'https://dribbble.com', order: 2, visible: true },
  { id: 'l15', categoryId: 'c4', title: 'Unsplash', subtitle: '高质量免费图库', url: 'https://unsplash.com', order: 3, visible: true },
  { id: 'l16', categoryId: 'c4', title: 'Color Hunt', subtitle: '精选调色盘合集', url: 'https://colorhunt.co', order: 4, visible: true },
  { id: 'l17', categoryId: 'c5', title: 'Notion', subtitle: '一站式知识管理', url: 'https://notion.so', order: 1, visible: true },
  { id: 'l18', categoryId: 'c5', title: 'Linear', subtitle: '现代项目管理', url: 'https://linear.app', order: 2, visible: true },
  { id: 'l19', categoryId: 'c5', title: 'Obsidian', subtitle: '本地知识图谱笔记', url: 'https://obsidian.md', order: 3, visible: true },
  { id: 'l20', categoryId: 'c5', title: 'Feishu', subtitle: '飞书协作办公平台', url: 'https://feishu.cn', order: 4, visible: true },
]

const SAMPLE_MARQUEES: MarqueeItem[] = [
  { id: 'm1', text: '欢迎使用导航门户 🎉', color: '#6366f1', order: 1, visible: true },
  { id: 'm2', text: '精选优质网站，提升工作效率', color: '#059669', order: 2, visible: true },
  { id: 'm3', text: '发现更多好站，每日更新', color: '#f59e0b', order: 3, visible: true },
  { id: 'm4', text: '点击左侧管理后台，自由定制您的导航', color: '#e11d48', order: 4, visible: true },
  { id: 'm5', text: '支持云端同步 · 多端一致', color: '#0891b2', order: 5, visible: true },
]

const SAMPLE_ADS: AdItem[] = [
  {
    id: 'a1', title: '精选工具集', subtitle: '汇聚全网高质量效率工具，一站直达',
    subtitleColor: '#6366f1', badgeText: '推荐', badgeColor: '#fff', badgeBgColor: '#6366f1',
    url: '#', size: 'large', order: 1, visible: true,
  },
  {
    id: 'a2', title: '优质服务商', subtitle: '专业云服务，稳定可靠',
    subtitleColor: '#059669', badgeText: '赞助', badgeColor: '#fff', badgeBgColor: '#059669',
    url: '#', size: 'medium', order: 2, visible: true,
  },
  {
    id: 'a3', title: '合作伙伴', subtitle: '携手共建，互利共赢',
    subtitleColor: '#d97706', badgeText: '合作', badgeColor: '#fff', badgeBgColor: '#d97706',
    url: '#', size: 'medium', order: 3, visible: true,
  },
]

// ── 彩字跑马灯 ───────────────────────────────────────────────
function MarqueeBanner({ items }: { items: MarqueeItem[] }) {
  const visible = useMemo(
    () => items.filter((m) => m.visible).sort((a, b) => a.order - b.order),
    [items],
  )
  if (visible.length === 0) return null

  // 复制两份实现无缝循环
  const doubled = [...visible, ...visible]
  // 根据文字总量动态调整速度（约 40px/s）
  const totalChars = visible.reduce((s, m) => s + m.text.length, 0)
  const duration = Math.max(totalChars * 0.35, 14)
  // 容器高度随最大字号自适应
  const maxFontSize = visible.reduce((mx, m) => Math.max(mx, m.fontSize ?? 12), 12)
  const bannerHeight = maxFontSize + 20  // 上下各留 10px

  return (
    <div
      className="overflow-hidden border-b border-neutral-100/80 bg-white/70 backdrop-blur-sm"
      style={{ height: `${bannerHeight}px` }}
    >
      <div
        className="marquee-track items-center h-full"
        style={{ '--marquee-duration': `${duration}s` } as React.CSSProperties}
      >
        {doubled.map((item, i) => {
          const inner = (
            <span
              className="inline-flex items-center gap-2 px-5 font-medium tracking-wide select-none"
              style={{ color: item.color, fontSize: `${item.fontSize ?? 12}px` }}
            >
              <span className="opacity-30 text-[10px]">◆</span>
              {item.text}
            </span>
          )
          return item.url ? (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-70 transition-opacity"
            >
              {inner}
            </a>
          ) : (
            <span key={i}>{inner}</span>
          )
        })}
      </div>
    </div>
  )
}

// ── 广告卡片 ─────────────────────────────────────────────────
function AdCard({ ad }: { ad: AdItem }) {
  const colSpan = ad.size === 'large' ? 'md:col-span-4' : ad.size === 'medium' ? 'md:col-span-2' : 'md:col-span-1'

  return (
    <motion.a
      href={ad.url}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      className={`col-span-2 ${colSpan} flex items-center gap-4 p-4 bg-white border border-neutral-100 rounded-2xl hover:shadow-md hover:border-neutral-200 transition-all group`}
    >
      {ad.imageUrl && (
        <img src={ad.imageUrl} alt={ad.title} className="w-12 h-12 rounded-xl object-cover shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-neutral-900 truncate" style={ad.titleColor ? { color: ad.titleColor } : {}}>
            {ad.title}
          </span>
          {ad.badgeText && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
              style={{ color: ad.badgeColor ?? '#fff', background: ad.badgeBgColor ?? '#2563eb' }}
            >
              {ad.badgeText}
            </span>
          )}
        </div>
        {ad.subtitle && (
          <p
            className="text-xs truncate"
            style={ad.subtitleColor ? { color: ad.subtitleColor } : { color: '#737373' }}
          >
            {ad.subtitle}
          </p>
        )}
      </div>
      <ExternalLink size={14} className="text-neutral-300 group-hover:text-neutral-500 transition-colors shrink-0" />
    </motion.a>
  )
}

// ── 链接卡片 ─────────────────────────────────────────────────
// 根据名称生成固定颜色（字母头像用）
function getLetterColor(str: string): string {
  const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#f97316', '#ec4899']
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function LinkCard({ link }: { link: LinkItem }) {
  const [iconError, setIconError] = useState(false)

  const hostname = useMemo(() => {
    try {
      return new URL(link.url.startsWith('http') ? link.url : `https://${link.url}`).hostname
    } catch {
      return ''
    }
  }, [link.url])

  // 优先使用自定义图标，其次 DuckDuckGo（国内可用），失败则显示字母头像
  const faviconUrl = link.iconUrl || (hostname ? `https://icons.duckduckgo.com/ip3/${hostname}.ico` : '')
  const showFavicon = !!faviconUrl && !iconError
  const letter = link.title.charAt(0).toUpperCase()

  return (
    <motion.a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:shadow-sm transition-all group cursor-pointer"
      style={link.bgColor ? { background: link.bgColor } : { background: '#fff' }}
    >
      {showFavicon ? (
        <img
          src={faviconUrl}
          alt=""
          className="w-8 h-8 rounded-lg object-contain shrink-0 bg-neutral-50 p-0.5"
          onError={() => setIconError(true)}
        />
      ) : (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-sm font-bold"
          style={{ background: getLetterColor(link.title) }}
        >
          {letter}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p
            className="text-sm font-medium truncate"
            style={link.textColor ? { color: link.textColor } : { color: '#171717' }}
          >
            {link.title}
          </p>
          {link.badgeText && (
            <span
              className="shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium leading-none"
              style={{
                color: link.badgeColor || '#fff',
                background: link.badgeBgColor || '#2563eb',
              }}
            >
              {link.badgeText}
            </span>
          )}
        </div>
        {link.subtitle && (
          <p
            className="text-xs truncate mt-0.5"
            style={link.subtitleColor ? { color: link.subtitleColor } : { color: '#a3a3a3' }}
          >
            {link.subtitle}
          </p>
        )}
      </div>
    </motion.a>
  )
}

// ── 主应用 ────────────────────────────────────────────────────
export default function App() {
  const [categories, setCategories] = useState<Category[]>(SAMPLE_CATEGORIES)
  const [links, setLinks] = useState<LinkItem[]>(SAMPLE_LINKS)
  const [ads, setAds] = useState<AdItem[]>(SAMPLE_ADS)
  const [marquees, setMarquees] = useState<MarqueeItem[]>(SAMPLE_MARQUEES)
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    return subscribeAll({
      setCategories,
      setLinks,
      setAds,
      setSettings,
      setMarquees,
      onEmpty: () => {
        setCategories(SAMPLE_CATEGORIES)
        setLinks(SAMPLE_LINKS)
        setAds(SAMPLE_ADS)
        // 首次加载时把样本数据写入 localStorage，确保后台编辑可持久化
        initLocalStorage({
          categories: SAMPLE_CATEGORIES,
          links: SAMPLE_LINKS,
          ads: SAMPLE_ADS,
          marquees: SAMPLE_MARQUEES,
          settings: DEFAULT_SETTINGS,
        })
      },
    })
  }, [])

  // 更新 document title
  useEffect(() => {
    document.title = settings.siteTitle
  }, [settings.siteTitle])

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [categories],
  )

  const visibleAds = useMemo(
    () => ads.filter((a) => a.visible).sort((a, b) => a.order - b.order),
    [ads],
  )

  const filteredLinks = useMemo(() => {
    const visible = links.filter((l) => l.visible)
    if (!query.trim()) return visible
    const q = query.toLowerCase()
    return visible.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.subtitle?.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q),
    )
  }, [links, query])

  function scrollToCategory(catId: string) {
    setActiveCategory(catId)
    setMobileSidebar(false)
    setTimeout(() => {
      const el = sectionRefs.current[catId]
      if (el && mainRef.current) {
        const top = el.offsetTop - 96
        mainRef.current.scrollTo({ top, behavior: 'smooth' })
      }
    }, 50)
  }

  function handleSettingsChange(s: SystemSettings) {
    setSettings(s)
    updateSettings(s)
  }

  return (
    <div
      className="flex h-screen overflow-hidden bg-neutral-50"
      style={{ fontFamily: settings.font }}
    >
      {/* 移动端侧边栏遮罩 */}
      <AnimatePresence>
        {mobileSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebar(false)}
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── 左侧边栏 ──────────────────────────────────────────── */}
      <aside
        className={`
          fixed md:relative z-40 md:z-auto h-full w-64 flex flex-col shrink-0
          border-r border-neutral-100 bg-white/85 backdrop-blur-xl
          transition-transform duration-300 ease-out
          ${mobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* 站点 Logo */}
        <div className="px-6 py-5 border-b border-neutral-100/80">
          <h1 className="text-lg font-bold text-neutral-900 tracking-tight">{settings.siteTitle}</h1>
          {settings.siteSubtitle && (
            <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{settings.siteSubtitle}</p>
          )}
        </div>

        {/* 分类导航 */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 py-4 space-y-0.5">
          {visibleCategories.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              whileHover={{ x: 2 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
              }`}
            >
              <LucideIcon
                name={cat.icon}
                size={17}
                className={activeCategory === cat.id ? 'text-neutral-700' : 'text-neutral-400'}
              />
              <span>{cat.name}</span>
              <span className="ml-auto text-xs text-neutral-300">
                {links.filter((l) => l.categoryId === cat.id && l.visible).length}
              </span>
            </motion.button>
          ))}
        </nav>

        {/* 底部功能区 */}
        <div className="px-3 pb-4 pt-2 border-t border-neutral-100/80 space-y-0.5">
          <FontSelector
            font={settings.font}
            onChange={(font) => handleSettingsChange({ ...settings, font })}
          />
          <button
            onClick={() => setShowAdmin(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:bg-neutral-50 hover:text-neutral-800 transition-colors"
          >
            <Lock size={15} />
            <span>管理后台</span>
          </button>
        </div>
      </aside>

      {/* ── 主画布 ────────────────────────────────────────────── */}
      <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* 悬浮搜索栏 + 跑马灯（整体吸顶） */}
        <div className="sticky top-0 z-30 bg-neutral-50/90 backdrop-blur-md border-b border-neutral-100/80">
          <div className="px-4 md:px-8 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-2.5 bg-white/70 backdrop-blur-md rounded-2xl border border-neutral-200/70 shadow-sm shadow-neutral-200/30">
            <Search size={16} className="text-neutral-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索网站、工具、资源..."
              className="flex-1 bg-transparent text-sm text-neutral-900 placeholder-neutral-400 outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-neutral-400 hover:text-neutral-700 transition-colors">
                <X size={14} />
              </button>
            )}
            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setMobileSidebar(true)}
              className="md:hidden text-neutral-400 hover:text-neutral-700 transition-colors ml-1"
            >
              <Menu size={16} />
            </button>
          </div>
          </div>
          {/* 彩字跑马灯 */}
          <MarqueeBanner items={marquees} />
        </div>

        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
          {/* 精品推荐 / 广告位 */}
          <AnimatePresence>
            {!query && visibleAds.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-8"
              >
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
                  精品推荐
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {visibleAds.map((ad) => (
                    <AdCard key={ad.id} ad={ad} />
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* 搜索结果 */}
          {query.trim() ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key="search-results"
            >
              <p className="text-xs text-neutral-400 mb-4">
                找到 <span className="font-semibold text-neutral-600">{filteredLinks.length}</span> 个结果
              </p>
              {filteredLinks.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-neutral-400 text-sm">未找到相关网站</p>
                  <p className="text-neutral-300 text-xs mt-1">试试其他关键词？</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {[...filteredLinks].sort((a, b) => a.order - b.order).map((link) => (
                    <LinkCard key={link.id} link={link} />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            // 按分类展示
            visibleCategories.map((cat) => {
              const catLinks = filteredLinks
                .filter((l) => l.categoryId === cat.id)
                .sort((a, b) => a.order - b.order)

              if (catLinks.length === 0) return null

              return (
                <motion.section
                  key={cat.id}
                  ref={(el) => { sectionRefs.current[cat.id] = el }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-8"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <LucideIcon name={cat.icon} size={15} className="text-neutral-400" />
                    <h2 className="text-sm font-semibold text-neutral-700">{cat.name}</h2>
                    <span className="text-xs text-neutral-300 ml-1">{catLinks.length}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {catLinks.map((link) => (
                      <LinkCard key={link.id} link={link} />
                    ))}
                  </div>
                </motion.section>
              )
            })
          )}
        </div>
      </main>

      {/* ── 管理后台浮层 ─────────────────────────────────────── */}
      <AnimatePresence>
        {showAdmin && (
          <AdminPanel
            settings={settings}
            categories={categories}
            links={links}
            ads={ads}
            marquees={marquees}
            onClose={() => setShowAdmin(false)}
            onSettingsChange={handleSettingsChange}
            onCategoriesChange={setCategories}
            onLinksChange={setLinks}
            onAdsChange={setAds}
            onMarqueesChange={setMarquees}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
