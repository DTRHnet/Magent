import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { researchNiche, generateProductForNiche } from '../../shared/productEngine.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const products = await base44.asServiceRole.entities.Product.filter({ status: 'active' }, '-gross_revenue', 100);
    const sales = await base44.asServiceRole.entities.Sale.filter({ payment_status: 'completed' }, '-created_date', 200);
    const totalRevenue = sales.reduce((s, x) => s + x.amount, 0);
    const totalFees = sales.reduce((s, x) => s + (x.fee || 0), 0);
    const net = totalRevenue - totalFees;
    const metrics = `Active products: ${products.length}, Completed sales: ${sales.length}, Gross: $${totalRevenue.toFixed(2)}, Fees: $${totalFees.toFixed(2)}, Net: $${net.toFixed(2)}`;

    const decisions = [];
    const now = Date.now();

    // 1. Retire underperformers: active > 14 days, zero sales, below quality floor.
    for (const p of products) {
      const ageDays = (now - new Date(p.created_date).getTime()) / 86400000;
      if (ageDays > 14 && (p.sales_count || 0) === 0 && (p.quality_score || 0) < 80) {
        await base44.asServiceRole.entities.Product.update(p.id, { status: 'retired' });
        decisions.push({ type: 'retire', product_id: p.id, text: `Retired "${p.title}" — no sales after ${Math.round(ageDays)} days, quality below floor` });
      }
    }

    // 2. Double down on winners: raise price 15% when sales >= 5, capped at 2x original.
    for (const p of products) {
      if ((p.sales_count || 0) >= 5 && p.price < (p.original_price || p.price) * 2) {
        const newPrice = +(p.price * 1.15).toFixed(2);
        await base44.asServiceRole.entities.Product.update(p.id, { price: newPrice });
        decisions.push({ type: 'price_adjust', product_id: p.id, text: `Raised price on "${p.title}" from $${p.price} to $${newPrice} (strong seller)` });
      }
    }

    // 3. Generate new product when catalogue is thin or there is a winner to build around.
    if (products.length < 8 || products.some(p => (p.sales_count || 0) >= 3)) {
      try {
        const nicheInfo = await researchNiche(base44);
        const product = await generateProductForNiche(base44, nicheInfo);
        await base44.asServiceRole.entities.NicheResearch.create({
          niche: nicheInfo.niche, demand_score: nicheInfo.demand_score || 0,
          competition_score: nicheInfo.competition_score || 0, opportunity_score: nicheInfo.opportunity_score || 0,
          keywords: nicheInfo.keywords || [], summary: nicheInfo.summary || '', status: 'used'
        });
        decisions.push({ type: 'generate', product_id: product.id, text: `Generated "${product.title}" for niche "${nicheInfo.niche}"` });
      } catch (e) {
        decisions.push({ type: 'generate', text: `Generation attempted but failed: ${e.message}` });
      }
    }

    for (const d of decisions) {
      await base44.asServiceRole.entities.AgentDecision.create({
        decision_type: d.type, product_id: d.product_id, reasoning: d.text,
        action_taken: d.text, expected_impact: '', revenue_at_time: net, metrics
      });
    }

    return Response.json({ success: true, metrics, decisions, netRevenue: +net.toFixed(2) });
  } catch (error) {
    console.error('runAgentCycle error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}