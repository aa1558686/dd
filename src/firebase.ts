import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  type Firestore,
} from 'firebase/firestore'
import type { Category, LinkItem, AdItem, SystemSettings, MarqueeItem } from './types'

// ⚠️ 请将下方占位符替换为您的 Firebase 项目配置
// 获取方式：Firebase 控制台 → 项目设置 → 您的应用 → SDK 设置和配置
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
}

const isConfigured = !firebaseConfig.apiKey.startsWith('YOUR_')

let app: FirebaseApp | null = null
let db: Firestore | null = null

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    db = getFirestore(app)
    console.info('[Firebase] 已连接到 Firestore，实时同步已启用')
  } catch (e) {
    console.warn('[Firebase] 初始化失败，降级为本地存储模式:', e)
  }
} else {
  console.info('[Firebase] 未配置，使用 localStorage 本地模式。在 src/firebase.ts 中填写配置以启用云端同步。')
}

// localStorage 辅助工具
const LS = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(key)
      return v ? (JSON.parse(v) as T) : fallback
    } catch {
      return fallback
    }
  },
  set(key: string, v: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(v))
    } catch {}
  },
}

type SubscribeCallbacks = {
  setCategories: (v: Category[]) => void
  setLinks: (v: LinkItem[]) => void
  setAds: (v: AdItem[]) => void
  setSettings: (v: SystemSettings) => void
  setMarquees: (v: MarqueeItem[]) => void
  onEmpty?: () => void
}

export function subscribeAll(callbacks: SubscribeCallbacks): () => void {
  if (db) {
    const unsubs: (() => void)[] = []

    unsubs.push(
      onSnapshot(collection(db, 'categories'), (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category))
        if (docs.length > 0) callbacks.setCategories(docs)
        else callbacks.onEmpty?.()
      }),
    )

    unsubs.push(
      onSnapshot(collection(db, 'links'), (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LinkItem))
        if (docs.length > 0) callbacks.setLinks(docs)
      }),
    )

    unsubs.push(
      onSnapshot(collection(db, 'ads'), (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdItem))
        callbacks.setAds(docs)
      }),
    )

    unsubs.push(
      onSnapshot(doc(db, 'settings', 'main'), (snap) => {
        if (snap.exists()) callbacks.setSettings(snap.data() as SystemSettings)
      }),
    )

    unsubs.push(
      onSnapshot(collection(db, 'marquees'), (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MarqueeItem))
        callbacks.setMarquees(docs)
      }),
    )

    return () => unsubs.forEach((u) => u())
  } else {
    // localStorage 降级
    const cats = LS.get<Category[]>('nav_categories', [])
    const links = LS.get<LinkItem[]>('nav_links', [])
    const ads = LS.get<AdItem[]>('nav_ads', [])
    const settings = LS.get<SystemSettings | null>('nav_settings', null)

    const marquees = LS.get<MarqueeItem[]>('nav_marquees', [])

    if (cats.length > 0) callbacks.setCategories(cats)
    else callbacks.onEmpty?.()
    if (links.length > 0) callbacks.setLinks(links)
    if (ads.length > 0) callbacks.setAds(ads)
    if (settings) callbacks.setSettings(settings)
    if (marquees.length > 0) callbacks.setMarquees(marquees)

    return () => {}
  }
}

// ── Categories ──────────────────────────────────────────────
export async function saveCategory(cat: Omit<Category, 'id'>): Promise<string> {
  if (db) {
    const ref = await addDoc(collection(db, 'categories'), cat)
    return ref.id
  }
  const id = `cat_${Date.now()}`
  const cats = LS.get<Category[]>('nav_categories', [])
  LS.set('nav_categories', [...cats, { ...cat, id }])
  return id
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<void> {
  if (db) {
    await updateDoc(doc(db, 'categories', id), data as any)
    return
  }
  const cats = LS.get<Category[]>('nav_categories', [])
  LS.set('nav_categories', cats.map((c) => (c.id === id ? { ...c, ...data } : c)))
}

export async function deleteCategory(id: string): Promise<void> {
  if (db) {
    await deleteDoc(doc(db, 'categories', id))
    return
  }
  const cats = LS.get<Category[]>('nav_categories', [])
  LS.set('nav_categories', cats.filter((c) => c.id !== id))
}

// ── Links ────────────────────────────────────────────────────
export async function saveLink(link: Omit<LinkItem, 'id'>): Promise<string> {
  if (db) {
    const ref = await addDoc(collection(db, 'links'), link)
    return ref.id
  }
  const id = `link_${Date.now()}`
  const links = LS.get<LinkItem[]>('nav_links', [])
  LS.set('nav_links', [...links, { ...link, id }])
  return id
}

export async function updateLink(id: string, data: Partial<LinkItem>): Promise<void> {
  if (db) {
    await updateDoc(doc(db, 'links', id), data as any)
    return
  }
  const links = LS.get<LinkItem[]>('nav_links', [])
  LS.set('nav_links', links.map((l) => (l.id === id ? { ...l, ...data } : l)))
}

export async function deleteLink(id: string): Promise<void> {
  if (db) {
    await deleteDoc(doc(db, 'links', id))
    return
  }
  const links = LS.get<LinkItem[]>('nav_links', [])
  LS.set('nav_links', links.filter((l) => l.id !== id))
}

// ── Ads ──────────────────────────────────────────────────────
export async function saveAd(ad: Omit<AdItem, 'id'>): Promise<string> {
  if (db) {
    const ref = await addDoc(collection(db, 'ads'), ad)
    return ref.id
  }
  const id = `ad_${Date.now()}`
  const ads = LS.get<AdItem[]>('nav_ads', [])
  LS.set('nav_ads', [...ads, { ...ad, id }])
  return id
}

export async function updateAd(id: string, data: Partial<AdItem>): Promise<void> {
  if (db) {
    await updateDoc(doc(db, 'ads', id), data as any)
    return
  }
  const ads = LS.get<AdItem[]>('nav_ads', [])
  LS.set('nav_ads', ads.map((a) => (a.id === id ? { ...a, ...data } : a)))
}

export async function deleteAd(id: string): Promise<void> {
  if (db) {
    await deleteDoc(doc(db, 'ads', id))
    return
  }
  const ads = LS.get<AdItem[]>('nav_ads', [])
  LS.set('nav_ads', ads.filter((a) => a.id !== id))
}

// ── Marquees ─────────────────────────────────────────────────
export async function saveMarquee(item: Omit<MarqueeItem, 'id'>): Promise<string> {
  if (db) {
    const ref = await addDoc(collection(db, 'marquees'), item)
    return ref.id
  }
  const id = `mq_${Date.now()}`
  const list = LS.get<MarqueeItem[]>('nav_marquees', [])
  LS.set('nav_marquees', [...list, { ...item, id }])
  return id
}

export async function updateMarquee(id: string, data: Partial<MarqueeItem>): Promise<void> {
  if (db) {
    await updateDoc(doc(db, 'marquees', id), data as any)
    return
  }
  const list = LS.get<MarqueeItem[]>('nav_marquees', [])
  LS.set('nav_marquees', list.map((m) => (m.id === id ? { ...m, ...data } : m)))
}

export async function deleteMarquee(id: string): Promise<void> {
  if (db) {
    await deleteDoc(doc(db, 'marquees', id))
    return
  }
  const list = LS.get<MarqueeItem[]>('nav_marquees', [])
  LS.set('nav_marquees', list.filter((m) => m.id !== id))
}

// ── Settings ─────────────────────────────────────────────────
export async function updateSettings(data: Partial<SystemSettings>): Promise<void> {
  if (db) {
    await setDoc(doc(db, 'settings', 'main'), data, { merge: true })
    return
  }
  const settings = LS.get<SystemSettings>('nav_settings', {} as SystemSettings)
  LS.set('nav_settings', { ...settings, ...data })
}

export { isConfigured as isFirebaseConfigured }

// ── 初始化本地存储（样本数据首次写入） ──────────────────────
export function initLocalStorage(data: {
  categories: Category[]
  links: LinkItem[]
  ads: AdItem[]
  marquees: MarqueeItem[]
  settings: SystemSettings
}) {
  if (db) return // Firebase 模式无需处理
  if (LS.get<Category[]>('nav_categories', []).length === 0)
    LS.set('nav_categories', data.categories)
  if (LS.get<LinkItem[]>('nav_links', []).length === 0)
    LS.set('nav_links', data.links)
  if (LS.get<AdItem[]>('nav_ads', []).length === 0)
    LS.set('nav_ads', data.ads)
  if (LS.get<MarqueeItem[]>('nav_marquees', []).length === 0)
    LS.set('nav_marquees', data.marquees)
  if (!LS.get<SystemSettings | null>('nav_settings', null))
    LS.set('nav_settings', data.settings)
}
