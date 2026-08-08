import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const products = await base44.asServiceRole.entities.Product.filter({ status: 'active' }, '-gross_revenue', 100);
    const list = products.map(({ content, ...p }) => p);
    return Response.json({ products: list });
  } catch (error) {
    console.error('getProducts error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}