import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { completeSale } from '../../shared/productEngine.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const signature = req.headers.get('stripe-signature') || '';
    const body = await req.text();
    const webhookSecret = secrets.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('stripeWebhook: STRIPE_WEBHOOK_SECRET not configured');
      return Response.json({ error: 'webhook secret not configured' }, { status: 500 });
    }

    const event = await verifyStripeSignature(body, signature, webhookSecret);
    if (!event) return Response.json({ error: 'invalid signature' }, { status: 400 });

    if (event.type === 'checkout.session.completed') {
      const session = event.data && event.data.object;
      const saleId = session && session.metadata && session.metadata.sale_id;
      if (saleId) {
        const sale = await base44.asServiceRole.entities.Sale.get(saleId);
        if (sale && sale.payment_status !== 'completed') {
          await completeSale(base44, saleId);
          await base44.asServiceRole.entities.Sale.update(saleId, { stripe_session_id: session.id });
        }
      }
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error('stripeWebhook error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function verifyStripeSignature(payload, header, secret) {
  const parts = String(header || '').split(',');
  const tPart = parts.find(p => p.startsWith('t='));
  const v1Part = parts.find(p => p.startsWith('v1='));
  if (!tPart || !v1Part) return null;
  const t = tPart.slice(2);
  const v1 = v1Part.slice(3);
  const signedPayload = `${t}.${payload}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(signedPayload));
  const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  if (expected !== v1) return null;
  const age = Math.abs(Date.now() - parseInt(t, 10) * 1000);
  if (age > 5 * 60 * 1000) return null;
  return JSON.parse(payload);
}