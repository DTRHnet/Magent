import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { sale_id } = await req.json();
    if (!sale_id) return Response.json({ error: 'sale_id required' }, { status: 400 });
    const sale = await base44.asServiceRole.entities.Sale.get(sale_id);
    if (!sale) return Response.json({ error: 'Sale not found' }, { status: 404 });
    if (sale.payment_status !== 'completed') return Response.json({ status: 'pending' }, { status: 202 });
    const product = await base44.asServiceRole.entities.Product.get(sale.product_id);
    return Response.json({
      status: 'completed',
      product_title: product ? product.title : sale.product_title,
      content: product ? product.content : '',
      download_token: sale.download_token
    });
  } catch (error) {
    console.error('deliverProduct error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}