// Shared digital-product generation pipeline + pricing helpers used by backend functions.

const STRIPE_FEE_RATE = 0.029;
const STRIPE_FEE_FIXED = 0.30;
const CRYPTO_FEE_RATE = 0.005;

export function computeFee(amount, method) {
  if (method === "stripe") return +(amount * STRIPE_FEE_RATE + STRIPE_FEE_FIXED).toFixed(2);
  if (method === "crypto") return +(amount * CRYPTO_FEE_RATE).toFixed(2);
  return 0;
}

export function netAmount(amount, method) {
  return +(amount - computeFee(amount, method)).toFixed(2);
}

// Mark a sale paid + delivered, mint a download token, and roll up product stats.
// Shared by the Stripe webhook, crypto webhook, and crypto status polling.
export async function completeSale(base44, saleId) {
  const sale = await base44.asServiceRole.entities.Sale.get(saleId);
  if (!sale) return null;
  if (sale.payment_status === 'completed') return sale;
  const token = crypto.randomUUID();
  await base44.asServiceRole.entities.Sale.update(saleId, {
    payment_status: 'completed',
    delivery_status: 'delivered',
    download_token: token
  });
  const product = await base44.asServiceRole.entities.Product.get(sale.product_id);
  if (product) {
    await base44.asServiceRole.entities.Product.update(product.id, {
      sales_count: (product.sales_count || 0) + 1,
      gross_revenue: +((product.gross_revenue || 0) + sale.amount).toFixed(2)
    });
  }
  return await base44.asServiceRole.entities.Sale.get(saleId);
}

// Research a trending, high-demand niche using live web context.
export async function researchNiche(base44) {
  const schema = {
    type: "object",
    properties: {
      niche: { type: "string" },
      product_idea: { type: "string" },
      product_type: { type: "string" },
      title: { type: "string" },
      demand_score: { type: "number" },
      competition_score: { type: "number" },
      opportunity_score: { type: "number" },
      keywords: { type: "array", items: { type: "string" } },
      summary: { type: "string" },
      suggested_price: { type: "number" }
    },
    required: ["niche", "title", "product_type", "suggested_price"]
  };
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt:
      "You are a market researcher for an autonomous digital-product business. Identify ONE trending, high-demand niche right now that is ideal for a sellable digital product (report, template, prompt pack, mini-guide, checklist, or AI-generated asset). Use current trends and search demand. Return a single best opportunity with a concrete product title, type, suggested price in USD (7-49 range), scores 0-100, 3-6 keywords, and a short summary. Be specific and actionable.",
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: schema
  });
  return result;
}

// Generate a complete sellable product for a niche, create it, and attach marketing assets.
export async function generateProductForNiche(base44, nicheInfo) {
  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      subtitle: { type: "string" },
      description: { type: "string" },
      content: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
      quality_score: { type: "number" },
      upsell_text: { type: "string" },
      bump_text: { type: "string" }
    },
    required: ["title", "description", "content"]
  };
  const prompt = `Create a complete, high-quality, sellable digital product for this niche opportunity.
Niche: ${nicheInfo.niche}
Product idea: ${nicheInfo.product_idea || nicheInfo.summary || ""}
Type: ${nicheInfo.product_type || "report"}
Suggested title: ${nicheInfo.title || ""}

Produce the FULL product content as polished, comprehensive Markdown — this is exactly what the customer downloads, so it must be genuinely useful, accurate, well-structured and valuable. Also write a compelling marketing description, a short subtitle, 3-6 tags, a quality score 0-100, a one-sentence upsell offer, and a one-sentence order-bump offer. The content must clear a high quality floor: actionable and accurate.`;
  const product = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    model: "claude_sonnet_4_6",
    response_json_schema: schema
  });

  let cover_url = "";
  try {
    const cover = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt: `A clean, modern, premium cover image for a digital product titled "${product.title}". Minimalist, bold, professional, relevant to ${nicheInfo.niche}. No text watermark.`
    });
    cover_url = cover.url || "";
  } catch (e) {
    /* cover is optional */
  }

  const price = nicheInfo.suggested_price || 19;
  const created = await base44.asServiceRole.entities.Product.create({
    title: product.title,
    subtitle: product.subtitle || "",
    description: product.description,
    niche: nicheInfo.niche,
    product_type: nicheInfo.product_type || "report",
    content: product.content,
    price,
    original_price: price,
    currency: "USD",
    status: "active",
    cover_url,
    tags: product.tags || [],
    quality_score: product.quality_score || 70,
    upsell_text: product.upsell_text || "",
    bump_text: product.bump_text || "",
    ai_generated: true
  });

  try {
    const mkt = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Write marketing assets for a digital product titled "${product.title}". Description: ${product.description}. Produce a 3-email buyer follow-up sequence (as one Markdown string separated by --- between emails, driving repeat purchases and upsells) and a short social snippet (2-3 posts).`,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: { email_sequence: { type: "string" }, social_snippet: { type: "string" } },
        required: ["email_sequence", "social_snippet"]
      }
    });
    await base44.asServiceRole.entities.MarketingContent.create({
      product_id: created.id, content_type: "email_sequence", content: mkt.email_sequence, channel: "email"
    });
    await base44.asServiceRole.entities.MarketingContent.create({
      product_id: created.id, content_type: "social_snippet", content: mkt.social_snippet, channel: "social"
    });
  } catch (e) {
    /* marketing optional */
  }

  return created;
}