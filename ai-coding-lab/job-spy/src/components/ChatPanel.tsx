"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  context?: { jdSummary?: string; resumeGaps?: string };
  matchResultId?: string;
  onHighlightsReady?: (highlights: string) => void;
}

export function ChatPanel({ context, matchResultId, onHighlightsReady }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "你好！我是你的职业顾问。让我们一起来挖掘你简历中尚未充分展示的经历和亮点。\n\n首先——你在工作中最有成就感的一个技术项目是什么？具体做了哪些事情？取得了什么可以量化的成果？",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationDone, setConversationDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input };
    setInput("");
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          matchResultId,
          context,
        }),
      });

      if (!res.ok) throw new Error(`Chat failed: ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantMsg: Message = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantContent };
          return updated;
        });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "抱歉，对话出现错误，请重试。" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const finishConversation = () => {
    setConversationDone(true);
    // Extract last assistant message as highlights summary
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (lastAssistant && onHighlightsReady) {
      onHighlightsReady(lastAssistant.content);
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/50 flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          经历挖掘对话
        </span>
        {!conversationDone && messages.length > 3 && (
          <Button variant="outline" size="xs" onClick={finishConversation}>
            <CheckCircle className="h-3 w-3 mr-1" />
            完成对话
          </Button>
        )}
        {conversationDone && (
          <span className="text-xs text-success">对话已完成</span>
        )}
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-4 py-2 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2 text-sm">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {!conversationDone && (
        <div className="border-t p-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="输入你的回答..."
            disabled={loading}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button size="icon-xs" onClick={sendMessage} disabled={loading || !input.trim()}>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
