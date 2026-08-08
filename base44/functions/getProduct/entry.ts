import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { product_id } = await req.json();
    if (!product_id) return Response.json({ error: 'product_id required' }, { status: 400 });
    const product = await base44.asServiceRole.entities.Product.get(product_id);
    if (!product || product.status !== 'active') return Response.json({ error: 'Not found' }, { status: 404 });
    const { content, ...safe } = product;
    return Response.json({ product: safe });
  } catch (error) {
    console.error('getProduct error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}