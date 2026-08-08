import ReactMarkdown from "react-markdown";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${isUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown className="prose prose-sm max-w-none">{message.content || ""}</ReactMarkdown>
        )}
        {message.tool_calls?.map((tc, i) => {
          const failed = ["failed", "error"].includes(tc.status) || /error|failed/i.test(tc.results || "");
          const Icon = failed ? XCircle : tc.status === "completed" || tc.status === "success" ? CheckCircle2 : Loader2;
          return (
            <div key={i} className="mt-2 flex items-center gap-1 text-xs opacity-80 border-t pt-1">
              <Icon className={`h-3 w-3 ${failed ? "text-rose-500" : ""} ${tc.status !== "completed" && tc.status !== "success" ? "animate-spin" : ""}`} />
              <span>{tc.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}