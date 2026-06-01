"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type FeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [type, setType] = useState("feature_request");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: insertError } = await supabase.from("feedback").insert({
        user_id: user?.id || null,
        type,
        message: message.trim()
      });

      if (insertError) throw insertError;
      
      setSuccess(true);
      setMessage("");
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setError(err instanceof Error ? err.message : "Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#232419] border border-stone/10 p-6 rounded-2xl w-full max-w-md shadow-2xl relative select-none shadow-black/80">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone/40 hover:text-stone transition cursor-pointer text-sm font-semibold p-1"
        >
          ✕
        </button>

        <h3 className="text-lg font-black tracking-tight text-stone mb-2 flex items-center gap-1.5">
          <span className="text-rust">💡</span> Share Your Feedback
        </h3>
        <p className="text-xs text-stone/50 mb-5 leading-relaxed">
          Noticed a bug? Have a design critique? Let us know what we can do to make your experience more frictionless.
        </p>

        {success ? (
          <div className="text-center py-6 flex flex-col items-center justify-center gap-2">
            <span className="text-3xl text-sage select-none animate-bounce">✓</span>
            <p className="text-sm font-bold text-sage">Feedback Submitted!</p>
            <p className="text-xs text-stone/45">Thank you for helping us shape the digital twin.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone/55 mb-1.5">Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2 bg-earth border border-stone/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-rust/35 text-stone text-xs cursor-pointer transition-all"
              >
                <option value="feature_request">💡 Feature Idea</option>
                <option value="bug">🐛 Bug Report</option>
                <option value="aesthetic">🎨 Aesthetic Critique</option>
                <option value="other">💬 General Thought</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone/55 mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                placeholder="What occurred, or what feature would make this system more valuable?"
                rows={4}
                className="w-full px-3.5 py-2 bg-earth border border-stone/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-rust/35 text-stone text-xs placeholder-stone/30 outline-none resize-none transition-all leading-relaxed"
              />
            </div>

            {error && <p className="text-rust text-[10px] font-semibold">{error}</p>}

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-stone/60 hover:text-stone bg-stone/5 rounded-lg transition border border-transparent cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-xs font-bold bg-rust hover:bg-rust/95 text-earth rounded-lg transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Send Feedback"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
