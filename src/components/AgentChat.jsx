import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, Loader2 } from "lucide-react";
import MessageBubble from "@/components/MessageBubble";

export default function AgentChat() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (!conversation) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsubscribe();
  }, [conversation ? conversation.id : null]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startConversation = async () => {
    setCreating(true);
    try {
      const conv = await base44.agents.createConversation({ agent_name: "revenueCEO", metadata: { name: "CEO Session" } });
      setConversation(conv);
      setMessages(conv.messages || []);
    } finally {
      setCreating(false);
    }
  };

  const send = async () => {
    if (!input.trim() || !conversation) return;
    const content = input.trim();
    setInput("");
    setBusy(true);
    try {
      const updated = await base44.agents.addMessage(conversation, { role: "user", content });
      setConversation(updated);
    } finally {
      setBusy(false);
    }
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Bot className="h-12 w-12 text-primary mb-4" />
        <h3 className="font-semibold text-lg">Talk to your AI CEO</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
          Start a session and ask the autonomous CEO to research niches, generate products, adjust pricing, retire losers, or review performance.
        </p>
        <Button onClick={startConversation} disabled={creating}>
          {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Start CEO session
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[60vh]">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 pt-3 border-t mt-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask the CEO to generate a product, raise prices, retire losers…"
          disabled={busy}
        />
        <Button onClick={send} disabled={busy || !input.trim()}><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}