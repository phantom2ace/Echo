"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("focusai_chat");
      return saved ? JSON.parse(saved) : [
        {
          id: 1,
          role: "assistant",
          content: "Hi! I'm your Echo AI assistant. I can help you plan tasks, stay motivated, and track your progress. What would you like to work on today?",
          timestamp: Date.now(),
        },
      ];
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("focusai_chat", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function generateResponse(userMessage: string): string {
    const lowerMsg = userMessage.toLowerCase();
    
    if (lowerMsg.includes("task") || lowerMsg.includes("todo")) {
      return "Great! Let's break that down. What's one small step you can take right now to get started?";
    }
    if (lowerMsg.includes("procrastinat") || lowerMsg.includes("distract")) {
      return "That's totally normal! Try the Pomodoro technique: focus for 25 minutes, then take a 5-minute break. Would you like me to suggest a timer?";
    }
    if (lowerMsg.includes("motivat") || lowerMsg.includes("tired")) {
      return "Remember your 'why'! Why did you start this task? Sometimes taking a 10-minute walk or drinking water can help reset your focus.";
    }
    if (lowerMsg.includes("course") || lowerMsg.includes("study")) {
      return "Active recall is your best friend! Try testing yourself instead of just re-reading notes. What topic are you struggling with?";
    }
    if (lowerMsg.includes("thank")) {
      return "You're welcome! You're doing great by showing up and working on your goals. Keep it up!";
    }
    if (lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("hey")) {
      return "Hey there! Ready to have a productive session? What's on your mind?";
    }
    
    return "Got it! Let's stay focused. What's the most important thing you want to accomplish right now? I'm here to help you stay on track!";
  }

  async function sendMessage() {
    if (!input.trim()) return;
    
    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: input,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    
    setTimeout(() => {
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: generateResponse(userMsg.content),
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800);
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
          AI Assistant
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-100"
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className="text-xs opacity-50 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 p-3 rounded-2xl">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-zinc-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask for help or motivation..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={isTyping}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 rounded-xl font-medium transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
