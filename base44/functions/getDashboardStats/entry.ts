import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const sales = await base44.asServiceRole.entities.Sale.filter({ payment_status: 'completed' }, '-created_date', 500);
    const products = await base44.asServiceRole.entities.Product.filter({}, '-created_date', 200);
    const decisions = await base44.asServiceRole.entities.AgentDecision.filter({}, '-created_date', 50);

    const gross = sales.reduce((s, x) => s + x.amount, 0);
    const fees = sales.reduce((s, x) => s + (x.fee || 0), 0);
    const net = gross - fees;

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() - i);
      const next = new Date(d); next.setUTCDate(next.getUTCDate() + 1);
      const daySales = sales.filter(s => {
        const t = new Date(s.created_date).getTime();
        return t >= d.getTime() && t < next.getTime();
      });
      days.push({ date: d.toISOString().slice(0, 10), revenue: +daySales.reduce((s, x) => s + x.amount, 0).toFixed(2), sales: daySales.length });
    }

    return Response.json({
      gross: +gross.toFixed(2), fees: +fees.toFixed(2), net: +net.toFixed(2),
      totalSales: sales.length, activeProducts: products.filter(p => p.status === 'active').length,
      series: days, recentSales: sales.slice(0, 15), products, decisions
    });
  } catch (error) {
    console.error('getDashboardStats error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}