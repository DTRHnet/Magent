import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { computeFee, netAmount } from '../../shared/productEngine.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { product_id, pay_currency } = await req.json();
    if (!product_id) return Response.json({ error: 'product_id required' }, { status: 400 });
    const product = await base44.asServiceRole.entities.Product.get(product_id);
    if (!product || product.status !== 'active') return Response.json({ error: 'Product not available' }, { status: 404 });

    const apiKey = secrets.get('NOWPAYMENTS_API_KEY');
    if (!apiKey) return Response.json({ error: 'Crypto payments not configured. Set NOWPAYMENTS_API_KEY.' }, { status: 503 });

    const origin = req.headers.get('origin') || req.headers.get('referer') || 'https://base44.app';
    const fee = computeFee(product.price, 'crypto');
    const sale = await base44.asServiceRole.entities.Sale.create({
      product_id: product.id,
      product_title: product.title,
      amount: product.price,
      currency: product.currency || 'USD',
      payment_method: 'crypto',
      payment_status: 'pending',
      fee,
      net_amount: netAmount(product.price, 'crypto'),
      delivery_status: 'pending'
    });

    const body = {
      price_amount: product.price,
      price_currency: (product.currency || 'USD').toLowerCase(),
      order_id: sale.id,
      order_description: product.title,
      ipn_callback_url: `${origin}/api/functions/cryptoWebhook`,
      success_url: `${origin}/checkout/success?sale_id=${sale.id}`,
      canceled_url: `${origin}/product/${product.id}?canceled=1`
    };
    if (pay_currency) body.pay_currency = pay_currency;

    const resp = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await resp.json();
    if (!resp.ok) {
      console.error('NOWPayments invoice error', data);
      return Response.json({ error: data.message || 'Crypto invoice error' }, { status: 502 });
    }
    await base44.asServiceRole.entities.Sale.update(sale.id, {
      crypto_invoice_id: String(data.id),
      crypto_pay_address: data.pay_address || ''
    });
    return Response.json({ invoice_url: data.invoice_url, invoice_id: data.id, sale_id: sale.id });
  } catch (error) {
    console.error('createCryptoInvoice error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}