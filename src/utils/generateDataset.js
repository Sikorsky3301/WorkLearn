// Mulberry32 seeded PRNG — reproducible across all browsers
function mulberry32(initSeed) {
  let seed = initSeed
  return function () {
    seed += 0x6D2B79F5
    let t = seed
    t = Math.imul(t ^ (t >>> 15), 1 | t)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000
  }
}

function pick(rng, choices, weights) {
  let r = rng() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < choices.length; i++) {
    r -= weights[i]
    if (r <= 0) return choices[i]
  }
  return choices[choices.length - 1]
}

function csvEscape(val) {
  if (val === null || val === undefined) return ''
  const s = String(val)
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

// Fixed date window so the file is identical on every download
const START_MS = new Date('2023-06-01').getTime()
const RANGE_MS = new Date('2024-12-31').getTime() - START_MS

function isoDate(ms) {
  const d  = new Date(ms)
  const yr = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dy = String(d.getDate()).padStart(2, '0')
  return { yr, mo, dy }
}

export function generateLumenOrdersCSV() {
  const rng = mulberry32(42)
  const N   = 9600

  const catOptions  = ['Lighting', 'Décor', 'Furniture', 'Outdoor', 'Accessories']
  const catW        = [0.35, 0.25, 0.20, 0.12, 0.08]
  const chanOptions = ['Paid Search', 'Email', 'Organic', 'Social', null]
  const chanW       = [0.33, 0.28, 0.22, 0.13, 0.04]
  const ctrOptions  = ['US', 'CA', 'UK', 'AU', 'ZZ']
  const ctrW        = [0.65, 0.15, 0.12, 0.05, 0.03]
  const expOptions  = ['control', 'variant', null]
  const expW        = [0.30, 0.30, 0.40]
  const qtyOptions  = [1, 2, 3, 4, 5, 6, 7]
  const qtyW        = [0.45, 0.28, 0.12, 0.07, 0.04, 0.02, 0.02]
  const discOptions = [0, 0.05, 0.10, 0.15, 0.20, 0.25]
  const discW       = [0.45, 0.20, 0.15, 0.10, 0.07, 0.03]

  const outlierIdx = Math.floor(rng() * N)

  const baseRows = []
  for (let i = 0; i < N; i++) {
    const { yr, mo, dy } = isoDate(START_MS + rng() * RANGE_MS)
    const dr   = rng()
    const date = dr < 0.01 ? '' : dr < 0.16 ? `${dy}/${mo}/${yr}` : `${yr}-${mo}-${dy}`

    const isGuest = rng() < 0.07
    const custId  = isGuest ? null : `CUST-${String(Math.floor(rng() * 3000) + 1).padStart(5, '0')}`
    const email   = custId ? `${custId.toLowerCase()}@lumenmail.com` : 'guest@lumenmail.com'

    let cat = pick(rng, catOptions, catW)
    const cr = rng()
    if      (cat === 'Lighting'    && cr < 0.04) cat = 'Lightng'
    else if (cat === 'Lighting'    && cr < 0.08) cat = 'lighting'
    else if (cat === 'Accessories' && cr < 0.04) cat = 'Accessoires'

    let qty = pick(rng, qtyOptions, qtyW)
    if (rng() < 0.03) qty = -qty

    let price
    if (i === outlierIdx) {
      price = 99999.00
    } else if (rng() < 0.008) {
      price = 0.00
    } else {
      const u = rng()
      if      (u < 0.10) price = 5   + rng() * 15
      else if (u < 0.35) price = 20  + rng() * 30
      else if (u < 0.60) price = 50  + rng() * 50
      else if (u < 0.80) price = 100 + rng() * 100
      else if (u < 0.93) price = 200 + rng() * 200
      else               price = 400 + rng() * 400
      price = Math.round(price * 100) / 100
    }

    let disc = pick(rng, discOptions, discW)
    if (rng() < 0.12) disc = Math.round(disc * 100 * 100) / 100

    baseRows.push([
      `ORD-${String(i + 1).padStart(6, '0')}`,
      date,
      custId ?? '',
      email,
      cat,
      qty,
      price,
      disc,
      pick(rng, chanOptions, chanW) ?? '',
      pick(rng, ctrOptions, ctrW),
      pick(rng, expOptions, expW) ?? '',
    ])
  }

  // 250 duplicate rows (simulates sloppy ETL double-ingestion)
  const dupSet = new Set()
  while (dupSet.size < 250) dupSet.add(Math.floor(rng() * N))
  const allRows = [...baseRows, ...[...dupSet].map(idx => [...baseRows[idx]])]

  // Fisher-Yates shuffle so dupes aren't obviously at the end
  for (let i = allRows.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[allRows[i], allRows[j]] = [allRows[j], allRows[i]]
  }

  const header = 'order_id,order_date,customer_id,customer_email,product_category,quantity,unit_price,discount_pct,channel,country,experiment_group'
  return [header, ...allRows.map(row => row.map(csvEscape).join(','))].join('\n')
}

export function downloadLumenOrders() {
  const csv  = generateLumenOrdersCSV()
  // BOM so Excel opens UTF-8 correctly (preserves "Décor")
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'lumen_orders.csv'
  a.click()
  URL.revokeObjectURL(url)
}
