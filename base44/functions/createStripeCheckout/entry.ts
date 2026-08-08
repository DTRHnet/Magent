import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { computeFee } from '../../shared/productEngine.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { product_id, bump } = await req.json();
    if (!product_id) return Response.json({ error: 'product_id required' }, { status: 400 });
    const product = await base44.asServiceRole.entities.Product.get(product_id);
    if (!product || product.status !== 'active') return Response.json({ error: 'Product not available' }, { status: 404 });

    const origin = req.headers.get('origin') || req.headers.get('referer') || 'https://base44.app';
    const bumpAmount = bump ? 5 : 0;
    const totalAmount = +(product.price + bumpAmount).toFixed(2);
    const amountCents = Math.round(totalAmount * 100);
    const fee = computeFee(totalAmount, 'stripe');

    const sale = await base44.asServiceRole.entities.Sale.create({
      product_id: product.id,
      product_title: product.title,
      amount: totalAmount,
      currency: product.currency || 'USD',
      payment_method: 'stripe',
      payment_status: 'pending',
      fee,
      net_amount: +(totalAmount - fee).toFixed(2),
      delivery_status: 'pending',
      is_bump: !!bump
    });

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('payment_method_types[0]', 'card');
    params.append('line_items[0][quantity]', '1');
    params.append('line_items[0][price_data][currency]', (product.currency || 'USD').toLowerCase());
    params.append('line_items[0][price_data][unit_amount]', String(amountCents));
    params.append('line_items[0][price_data][product_data][name]', product.title);
    if (product.description) params.append('line_items[0][price_data][product_data][description]', String(product.description).slice(0, 200));
    params.append('success_url', `${origin}/checkout/success?sale_id=${sale.id}`);
    params.append('cancel_url', `${origin}/product/${product.id}?canceled=1`);
    params.append('metadata[sale_id]', sale.id);
    params.append('metadata[product_id]', product.id);
    params.append('metadata[base44_app_id]', secrets.get('BASE44_APP_ID') || '');

    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secrets.get('STRIPE_SECRET_KEY')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    const session = await resp.json();
    if (!resp.ok) {
      console.error('Stripe checkout error', session);
      return Response.json({ error: session.error?.message || 'Stripe error' }, { status: 500 });
    }
    await base44.asServiceRole.entities.Sale.update(sale.id, { stripe_session_id: session.id });
    return Response.json({ url: session.url, sale_id: sale.id });
  } catch (error) {
    console.error('createStripeCheckout error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}