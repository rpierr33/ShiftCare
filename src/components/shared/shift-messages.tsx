"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send } from "lucide-react";
import { sendMessage } from "@/actions/messages";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
}

interface ShiftMessagesProps {
  shiftId: string;
  currentUserId: string;
  initialMessages: Message[];
}

/* Real-time shift messaging panel with optimistic updates.
   Messages auto-scroll to bottom on new entries. Supports Enter-to-send. */
export function ShiftMessages({ shiftId, currentUserId, initialMessages }: ShiftMessagesProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || sending) return;

    setSending(true);
    setError("");

    // Optimistic update
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: "You", role: "" },
    };
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage("");

    try {
      const result = await sendMessage(shiftId, content);
      if (!result.success) {
        setError(result.error || "Failed to send message");
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      }
    } catch {
      setError("Failed to send message");
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) +
      " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <MessageSquare className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-800">Shift Messages</h3>
        {messages.length > 0 && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {messages.length}
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="max-h-80 overflow-y-auto px-4 py-3 space-y-3"
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-4">
            No messages yet. Send a message about this shift.
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender.id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                    isMe
                      ? "bg-cyan-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {!isMe && (
                    <p className="text-xs font-medium text-gray-500 mb-0.5">
                      {msg.sender.name}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isMe ? "text-cyan-200" : "text-gray-400"
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-4 py-3">
        {error && (
          <p className="text-xs text-red-500 mb-2">{error}</p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            maxLength={1000}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white transition hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
