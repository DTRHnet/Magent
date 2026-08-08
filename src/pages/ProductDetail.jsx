import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, CreditCard, Bitcoin, Loader2 } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [bump, setBump] = useState(false);
  const [paying, setPaying] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    base44.functions.invoke("getProduct", { product_id: id })
      .then((r) => setProduct(r.data.product))
      .catch(() => setProduct(false));
  }, [id]);

  const inIframe = () => {
    try { return window.self !== window.top; } catch { return true; }
  };

  const block = () => {
    toast({ title: "Open in a new tab", description: "Checkout only works on the published app, not inside the editor preview.", variant: "destructive" });
  };

  const payStripe = async () => {
    if (inIframe()) { block(); return; }
    setPaying("stripe");
    try {
      const r = await base44.functions.invoke("createStripeCheckout", { product_id: id, bump });
      window.location.href = r.data.url;
    } catch (e) {
      toast({ title: "Checkout failed", description: e.response?.data?.error || e.message, variant: "destructive" });
      setPaying(null);
    }
  };

  const payCrypto = async () => {
    if (inIframe()) { block(); return; }
    setPaying("crypto");
    try {
      const r = await base44.functions.invoke("createCryptoInvoice", { product_id: id });
      if (r.data.invoice_url) window.location.href = r.data.invoice_url;
    } catch (e) {
      toast({ title: "Crypto checkout failed", description: e.response?.data?.error || e.message, variant: "destructive" });
      setPaying(null);
    }
  };

  if (product === null) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  if (product === false) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <p className="text-muted-foreground">Product not found.</p>
      <Button asChild className="mt-4"><Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Back to store</Link></Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/"><ArrowLeft className="h-4 w-4 mr-1" />All products</Link></Button>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted">
          {product.cover_url && <Image src={product.cover_url} alt={product.title} className="h-full w-full" />}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="capitalize">{(product.product_type || "report").replace("_", " ")}</Badge>
            {product.sales_count > 0 && <Badge variant="outline">{product.sales_count} sold</Badge>}
            {product.ai_generated && <Badge variant="outline">AI-generated</Badge>}
          </div>
          <h1 className="text-3xl font-bold">{product.title}</h1>
          {product.subtitle && <p className="text-lg text-muted-foreground mt-1">{product.subtitle}</p>}
          <p className="mt-4 text-muted-foreground">{product.description}</p>

          {product.bump_text && (
            <label className="mt-5 flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
              <input type="checkbox" checked={bump} onChange={(e) => setBump(e.target.checked)} className="mt-1" />
              <span className="text-sm"><strong>Add order bump:</strong> {product.bump_text} <span className="text-muted-foreground">(+${5})</span></span>
            </label>
          )}

          <div className="mt-6">
            <div className="text-3xl font-bold">${(product.price + (bump ? 5 : 0)).toFixed(2)}</div>
            <div className="mt-3 flex flex-col sm:flex-row gap-3">
              <Button onClick={payStripe} disabled={!!paying} className="flex-1 h-12">
                {paying === "stripe" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                Pay with card
              </Button>
              <Button onClick={payCrypto} disabled={!!paying} variant="outline" className="flex-1 h-12">
                {paying === "crypto" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bitcoin className="h-4 w-4 mr-2" />}
                Pay with crypto
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Card payments via Stripe (Apple Pay / Google Pay supported). Crypto: USDC, USDT &amp; more altcoins.</p>
          </div>
        </div>
      </div>
    </div>
  );
}