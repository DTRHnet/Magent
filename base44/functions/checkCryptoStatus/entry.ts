import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { completeSale } from '../../shared/productEngine.ts';

// Polled by the success page until the crypto payment is confirmed on-chain.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { sale_id } = await req.json();
    if (!sale_id) return Response.json({ error: 'sale_id required' }, { status: 400 });
    const sale = await base44.asServiceRole.entities.Sale.get(sale_id);
    if (!sale) return Response.json({ error: 'Sale not found' }, { status: 404 });

    if (sale.payment_status === 'completed') {
      const product = await base44.asServiceRole.entities.Product.get(sale.product_id);
      return Response.json({ status: 'completed', product_title: product ? product.title : sale.product_title, content: product ? product.content : '', download_token: sale.download_token });
    }
    if (sale.payment_method !== 'crypto' || !sale.crypto_invoice_id) return Response.json({ status: 'pending' });

    const apiKey = secrets.get('NOWPAYMENTS_API_KEY');
    const resp = await fetch(`https://api.nowpayments.io/v1/invoice/${sale.crypto_invoice_id}`, { headers: { 'x-api-key': apiKey } });
    const data = await resp.json();
    const done = ['finished', 'confirmed', 'paid'].includes(data.payment_status) || data.invoice_status === 'closed';
    if (done) {
      await completeSale(base44, sale_id);
      const product = await base44.asServiceRole.entities.Product.get(sale.product_id);
      const updated = await base44.asServiceRole.entities.Sale.get(sale_id);
      return Response.json({ status: 'completed', product_title: product ? product.title : sale.product_title, content: product ? product.content : '', download_token: updated.download_token });
    }
    return Response.json({ status: 'pending', invoice_status: data.payment_status || data.invoice_status });
  } catch (error) {
    console.error('checkCryptoStatus error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}