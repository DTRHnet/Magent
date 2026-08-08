import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import RevenueStats from "@/components/RevenueStats";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { LogIn, RefreshCw, Sparkles, Loader2, Bot } from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const { toast } = useToast();

  const load = () => {
    setError(null);
    base44.functions.invoke("getDashboardStats")
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.status === 403 ? "admin" : "error"));
  };
  useEffect(load, []);

  const runCycle = async () => {
    setBusy("cycle");
    try {
      const r = await base44.functions.invoke("runAgentCycle");
      toast({ title: "Optimization cycle complete", description: r.data.metrics });
      load();
    } catch (e) {
      toast({ title: "Cycle failed", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const generate = async () => {
    setBusy("gen");
    try {
      const r = await base44.functions.invoke("generateProduct", {});
      toast({ title: "Product generated", description: `Created "${r.data.product.title}"` });
      load();
    } catch (e) {
      toast({ title: "Generation failed", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  if (error === "admin") {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <LogIn className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <h2 className="text-xl font-semibold">Admin access required</h2>
        <p className="text-muted-foreground mt-1">Log in as an admin to view revenue and control the engine.</p>
        <Button asChild className="mt-4"><Link to="/login?returnTo=/dashboard">Log in</Link></Button>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container mx-auto py-20 text-center text-muted-foreground">
        Failed to load dashboard. <Button onClick={load} variant="link">Retry</Button>
      </div>
    );
  }
  if (!data) return <div className="container mx-auto py-20 text-center text-muted-foreground">Loading dashboard…</div>;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Revenue Dashboard</h1>
          <p className="text-sm text-muted-foreground">Live money the engine is making.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generate} disabled={!!busy} variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />{busy === "gen" ? "Generating…" : "Generate product"}
          </Button>
          <Button onClick={runCycle} disabled={!!busy}>
            {busy === "cycle" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}Run cycle
          </Button>
        </div>
      </div>

      <RevenueStats data={data} />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Recent sales</h3>
          {data.recentSales.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentSales.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm border-b pb-2">
                  <div>
                    <div className="font-medium truncate max-w-[200px]">{s.product_title}</div>
                    <div className="text-xs text-muted-foreground">${s.amount} · {s.payment_method} · {new Date(s.created_date).toLocaleDateString()}</div>
                  </div>
                  <Badge variant={s.payment_status === "completed" ? "default" : "secondary"}>{s.payment_status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Product performance</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {data.products.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm border-b pb-2">
                <div className="truncate max-w-[180px]">
                  <span className="font-medium">{p.title}</span>
                  <div className="text-xs text-muted-foreground">${p.price} · {p.sales_count} sold · ${(p.gross_revenue || 0).toFixed(0)} rev</div>
                </div>
                <Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Bot className="h-4 w-4" />CEO decisions</h3>
        {data.decisions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No autonomous decisions yet. Run a cycle.</p>
        ) : (
          <div className="space-y-2">
            {data.decisions.map((d) => (
              <div key={d.id} className="text-sm border-b pb-2">
                <Badge variant="outline" className="mr-2">{d.decision_type}</Badge>
                {d.action_taken}
                <div className="text-xs text-muted-foreground mt-1">{new Date(d.created_date).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}