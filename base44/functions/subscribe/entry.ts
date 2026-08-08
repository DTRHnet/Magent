import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();
    if (!email || !/.+@.+\..+/.test(email)) return Response.json({ error: 'Valid email required' }, { status: 400 });
    const existing = await base44.asServiceRole.entities.Subscriber.filter({ email });
    if (existing.length === 0) {
      await base44.asServiceRole.entities.Subscriber.create({ email, source: 'storefront' });
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error('subscribe error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}