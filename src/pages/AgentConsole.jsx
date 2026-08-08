import { useState } from "react";
import { base44 } from "@/api/base44Client";
import AgentChat from "@/components/AgentChat";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCw, Loader2, Sparkles } from "lucide-react";

export default function AgentConsole() {
  const [busy, setBusy] = useState(null);
  const { toast } = useToast();

  const runCycle = async () => {
    setBusy("cycle");
    try {
      const r = await base44.functions.invoke("runAgentCycle");
      toast({ title: "Autonomous cycle complete", description: r.data.metrics });
    } catch (e) {
      toast({ title: "Failed", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const generate = async () => {
    setBusy("gen");
    try {
      const r = await base44.functions.invoke("generateProduct", {});
      toast({ title: "Product generated", description: `Created "${r.data.product.title}"` });
    } catch (e) {
      toast({ title: "Failed", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">AI CEO Console</h1>
          <p className="text-sm text-muted-foreground">Direct the autonomous revenue engine.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generate} disabled={!!busy} variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-1" />{busy === "gen" ? "Generating…" : "Generate"}
          </Button>
          <Button onClick={runCycle} disabled={!!busy} size="sm">
            {busy === "cycle" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}Run cycle
          </Button>
        </div>
      </div>
      <AgentChat />
    </div>
  );
}