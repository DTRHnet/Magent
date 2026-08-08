import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Sparkles, TrendingUp, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  const [products, setProducts] = useState(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    base44.functions.invoke("getProducts")
      .then((r) => setProducts(r.data.products))
      .catch(() => setProducts([]));
  }, []);

  const subscribe = async () => {
    if (!email) return;
    try {
      await base44.functions.invoke("subscribe", { email });
      setSubscribed(true);
      toast({ title: "You're in!", description: "Watch your inbox for new drops." });
    } catch (e) {
      toast({ title: "Couldn't subscribe", description: e.response?.data?.error || e.message, variant: "destructive" });
    }
  };

  const features = [
    { icon: Zap, t: "Instant delivery", d: "Download the moment your payment clears." },
    { icon: TrendingUp, t: "Always fresh", d: "New products generated from live trends." },
    { icon: ShieldCheck, t: "Pay your way", d: "Card, Apple Pay, Google Pay, or crypto." },
  ];

  return (
    <div>
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs mb-4">
            <Sparkles className="h-3 w-3" /> AI-generated, instantly delivered
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Digital products that <span className="text-primary">earn while you sleep</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            A self-running storefront of premium reports, prompt packs, templates, and guides. Pay by card or crypto, get instant access.
          </p>
          {!subscribed ? (
            <div className="mt-8 flex max-w-md mx-auto gap-2">
              <Input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button onClick={subscribe}>Get new drops</Button>
            </div>
          ) : (
            <p className="mt-8 text-emerald-600 font-medium">✓ Subscribed — you'll hear about every new product.</p>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {features.map((f) => (
            <div key={f.t} className="text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-medium">{f.t}</h3>
              <p className="text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
        <h2 className="text-2xl font-bold mb-6">Latest products</h2>
        {products === null ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : products.length === 0 ? (
          <p className="text-muted-foreground">No products yet — the engine is generating the first batch.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}