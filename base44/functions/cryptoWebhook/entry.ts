import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { completeSale } from '../../shared/productEngine.ts';

// NOWPayments IPN callback. We don't trust the payload directly — we re-check the
// invoice status via the API before confirming the sale.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const saleId = body.order_id;
    const invoiceId = body.id || body.invoice_id;
    if (!saleId) return Response.json({ error: 'no order_id' }, { status: 400 });
    const sale = await base44.asServiceRole.entities.Sale.get(saleId);
    if (!sale) return Response.json({ error: 'sale not found' }, { status: 404 });
    if (sale.payment_status === 'completed') return Response.json({ status: 'already completed' });

    const apiKey = secrets.get('NOWPAYMENTS_API_KEY');
    const id = invoiceId || sale.crypto_invoice_id;
    if (apiKey && id) {
      const resp = await fetch(`https://api.nowpayments.io/v1/invoice/${id}`, { headers: { 'x-api-key': apiKey } });
      const data = await resp.json();
      const done = ['finished', 'confirmed', 'paid'].includes(data.payment_status) || data.invoice_status === 'closed';
      if (done) await completeSale(base44, saleId);
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error('cryptoWebhook error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}