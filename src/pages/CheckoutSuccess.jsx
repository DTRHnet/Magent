import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { Check, Download, Loader2, Sparkles } from "lucide-react";

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const saleId = params.get("sale_id");
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const timer = useRef(null);

  useEffect(() => {
    if (!saleId) { setStatus("error"); return; }
    let attempts = 0;
    const poll = async () => {
      try {
        const r = await base44.functions.invoke("deliverProduct", { sale_id: saleId });
        if (r.status === 202 || r.data?.status === "pending") {
          attempts++;
          if (attempts > 100) { setStatus("timeout"); return; }
          timer.current = setTimeout(poll, 3000);
        } else if (r.data?.status === "completed") {
          setData(r.data);
          setStatus("done");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };
    poll();
    return () => clearTimeout(timer.current);
  }, [saleId]);

  const download = () => {
    const blob = new Blob([`# ${data.product_title}\n\n${data.content}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.product_title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      {status === "loading" && (
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <h2 className="mt-4 text-xl font-semibold">Confirming your payment…</h2>
          <p className="text-muted-foreground mt-1">Hang tight — delivery unlocks the moment payment clears.</p>
        </div>
      )}
      {status === "timeout" && (
        <div className="text-center">
          <p className="text-muted-foreground">Payment is still confirming on the blockchain. This page keeps checking — refresh in a minute, or contact support with your order.</p>
        </div>
      )}
      {status === "error" && (
        <div className="text-center">
          <p className="text-muted-foreground">We couldn't find this order.</p>
          <Button asChild className="mt-4"><Link to="/">Back to store</Link></Button>
        </div>
      )}
      {status === "done" && data && (
        <div>
          <div className="text-center mb-8">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold">Payment confirmed!</h1>
            <p className="text-muted-foreground mt-1">Your product is ready below.</p>
          </div>
          <Card className="p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{data.product_title}</h2>
              <Button onClick={download} size="sm"><Download className="h-4 w-4 mr-2" />Download .md</Button>
            </div>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{data.content}</ReactMarkdown>
            </div>
          </Card>
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Want more? New products drop automatically as the engine finds winning niches.</span>
            </div>
            <Button asChild variant="outline" size="sm" className="mt-3"><Link to="/">Browse more products</Link></Button>
          </Card>
        </div>
      )}
    </div>
  );
}