const express = require('express')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = 3001
const DATA_FILE = path.join(__dirname, 'data.json')

// ── 中间件 ──────────────────────────────────────────────────
app.use(express.json())

// CORS（允许前端跨域调用，生产环境由 Nginx 代理时可去掉）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// ── 文件读写 ─────────────────────────────────────────────────
const defaultData = { categories: [], links: [], ads: [], marquees: [], settings: null }

function read() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  } catch {
    return { ...defaultData }
  }
}

function write(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
}

function genId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

// ── 全量读写 ─────────────────────────────────────────────────
app.get('/data', (req, res) => {
  res.json(read())
})

app.put('/data', (req, res) => {
  write(req.body)
  res.json({ ok: true })
})

// ── 分类 Categories ──────────────────────────────────────────
app.post('/categories', (req, res) => {
  const d = read()
  const id = genId('cat')
  d.categories.push({ ...req.body, id })
  write(d)
  res.json({ id })
})

app.put('/categories/:id', (req, res) => {
  const d = read()
  d.categories = d.categories.map(c =>
    c.id === req.params.id ? { ...c, ...req.body } : c
  )
  write(d)
  res.json({ ok: true })
})

app.delete('/categories/:id', (req, res) => {
  const d = read()
  d.categories = d.categories.filter(c => c.id !== req.params.id)
  write(d)
  res.json({ ok: true })
})

// ── 链接 Links ───────────────────────────────────────────────
app.post('/links', (req, res) => {
  const d = read()
  const id = genId('link')
  d.links.push({ ...req.body, id })
  write(d)
  res.json({ id })
})

app.put('/links/:id', (req, res) => {
  const d = read()
  d.links = d.links.map(l =>
    l.id === req.params.id ? { ...l, ...req.body } : l
  )
  write(d)
  res.json({ ok: true })
})

app.delete('/links/:id', (req, res) => {
  const d = read()
  d.links = d.links.filter(l => l.id !== req.params.id)
  write(d)
  res.json({ ok: true })
})

// ── 广告位 Ads ───────────────────────────────────────────────
app.post('/ads', (req, res) => {
  const d = read()
  const id = genId('ad')
  d.ads.push({ ...req.body, id })
  write(d)
  res.json({ id })
})

app.put('/ads/:id', (req, res) => {
  const d = read()
  d.ads = d.ads.map(a =>
    a.id === req.params.id ? { ...a, ...req.body } : a
  )
  write(d)
  res.json({ ok: true })
})

app.delete('/ads/:id', (req, res) => {
  const d = read()
  d.ads = d.ads.filter(a => a.id !== req.params.id)
  write(d)
  res.json({ ok: true })
})

// ── 跑马灯 Marquees ──────────────────────────────────────────
app.post('/marquees', (req, res) => {
  const d = read()
  const id = genId('mq')
  d.marquees.push({ ...req.body, id })
  write(d)
  res.json({ id })
})

app.put('/marquees/:id', (req, res) => {
  const d = read()
  d.marquees = d.marquees.map(m =>
    m.id === req.params.id ? { ...m, ...req.body } : m
  )
  write(d)
  res.json({ ok: true })
})

app.delete('/marquees/:id', (req, res) => {
  const d = read()
  d.marquees = d.marquees.filter(m => m.id !== req.params.id)
  write(d)
  res.json({ ok: true })
})

// ── 系统设置 Settings ────────────────────────────────────────
app.put('/settings', (req, res) => {
  const d = read()
  d.settings = { ...(d.settings || {}), ...req.body }
  write(d)
  res.json({ ok: true })
})

// ── 启动 ─────────────────────────────────────────────────────
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[nav-api] 已启动，监听 http://127.0.0.1:${PORT}`)
})
