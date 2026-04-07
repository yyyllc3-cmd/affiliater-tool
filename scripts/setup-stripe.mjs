import Stripe from 'stripe'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// .env.local を手動で読む
const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const secretKey = env.match(/STRIPE_SECRET_KEY=(.+)/)?.[1]?.trim()

if (!secretKey || secretKey.includes('...')) {
  console.error('STRIPE_SECRET_KEY が .env.local に正しく設定されていません')
  process.exit(1)
}

const stripe = new Stripe(secretKey)

// 既存プロダクトを確認
const products = await stripe.products.list({ limit: 100 })
const existing = products.data.find(p => p.name === 'Affiliater Tool Pro')

let productId
if (existing) {
  productId = existing.id
  console.log('既存プロダクトを使用:', productId)
} else {
  const product = await stripe.products.create({
    name: 'Affiliater Tool Pro',
    description: 'Affiliater Tool Proプラン - 全機能アンロック',
  })
  productId = product.id
  console.log('プロダクト作成:', productId)
}

// 既存の980円プライスを確認
const prices = await stripe.prices.list({ product: productId, limit: 100 })
const existingPrice = prices.data.find(
  p => p.unit_amount === 980 && p.currency === 'jpy' && p.recurring?.interval === 'month' && p.active
)

let priceId
if (existingPrice) {
  priceId = existingPrice.id
  console.log('既存プライスを使用:', priceId)
} else {
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: 980,
    currency: 'jpy',
    recurring: { interval: 'month' },
  })
  priceId = price.id
  console.log('プライス作成:', priceId)
}

console.log('\n.env.local に以下を追加してください:')
console.log(`STRIPE_PRICE_ID=${priceId}`)
