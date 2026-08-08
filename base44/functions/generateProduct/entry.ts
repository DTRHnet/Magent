import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { researchNiche, generateProductForNiche } from '../../shared/productEngine.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const niche = body.niche;
    let nicheInfo;
    if (niche && String(niche).trim()) {
      nicheInfo = { niche: String(niche).trim(), product_type: body.product_type || 'report', suggested_price: body.price || 19, product_idea: niche, title: niche };
    } else {
      nicheInfo = await researchNiche(base44);
    }
    await base44.asServiceRole.entities.NicheResearch.create({
      niche: nicheInfo.niche,
      demand_score: nicheInfo.demand_score || 0,
      competition_score: nicheInfo.competition_score || 0,
      opportunity_score: nicheInfo.opportunity_score || 0,
      keywords: nicheInfo.keywords || [],
      summary: nicheInfo.summary || nicheInfo.product_idea || '',
      status: 'used'
    });
    const product = await generateProductForNiche(base44, nicheInfo);
    await base44.asServiceRole.entities.AgentDecision.create({
      decision_type: 'generate',
      product_id: product.id,
      reasoning: `Generated product for niche: ${nicheInfo.niche}`,
      action_taken: `Created "${product.title}" at $${product.price}`,
      expected_impact: 'New revenue stream',
      revenue_at_time: 0
    });
    return Response.json({ success: true, product });
  } catch (error) {
    console.error('generateProduct error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}