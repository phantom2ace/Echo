"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { getWeekStart } from "@/lib/supabase-utils";
import { getWeeklyReviews, getWeeklyReviewByWeekStart, addWeeklyReview, updateWeeklyReview, addActivityLog } from "@/lib/supabase-utils";
import type { WeeklyReview } from "@/lib/types";

export default function WeeklyReviewsPage() {
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>(
    getWeekStart().toISOString().split('T')[0]
  );
  const [currentReview, setCurrentReview] = useState<WeeklyReview | null>(null);
  const [formData, setFormData] = useState({
    wins: "",
    struggles: "",
    next_focus: ""
  });
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      try {
        const data = await getWeeklyReviews();
        setReviews(data);
      } catch (error) {
        console.error("Error loading weekly reviews:", error);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  useEffect(() => {
    async function loadCurrentReview() {
      try {
        const review = await getWeeklyReviewByWeekStart(selectedWeek);
        setCurrentReview(review);
        if (review) {
          setFormData({
            wins: review.wins || "",
            struggles: review.struggles || "",
            next_focus: review.next_focus || ""
          });
        } else {
          setFormData({
            wins: "",
            struggles: "",
            next_focus: ""
          });
        }
      } catch (error) {
        console.error("Error loading current review:", error);
      }
    }
    loadCurrentReview();
  }, [selectedWeek]);

  const handleSaveReview = async () => {
    try {
      if (currentReview) {
        const updated = await updateWeeklyReview(currentReview.id, formData);
        // Log activity
        await addActivityLog("Updated Weekly Review", "WeeklyReview", updated.id);
        
        setCurrentReview(updated);
        setReviews(prev => prev.map(r => r.id === updated.id ? updated : r));
      } else {
        const added = await addWeeklyReview({
          week_start: selectedWeek,
          ...formData
        });
        // Log activity
        await addActivityLog("Created Weekly Review", "WeeklyReview", added.id);
        
        setCurrentReview(added);
        setReviews([added, ...reviews]);
      }
    } catch (error) {
      console.error("Error saving review:", error);
    }
  };

  const handlePrevWeek = () => {
    const date = new Date(selectedWeek);
    date.setDate(date.getDate() - 7);
    setSelectedWeek(date.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const date = new Date(selectedWeek);
    date.setDate(date.getDate() + 7);
    setSelectedWeek(date.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </main>
    );
  }

  const weekStartDate = new Date(selectedWeek);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <main className="min-h-screen bg-black text-white flex">
      <Sidebar activeTab="weekly-reviews" />
      <section className="flex-1 flex flex-col">
        <div className="md:hidden p-4 border-b border-zinc-800">
          <button
            onClick={() => setMobileNav(!mobileNav)}
            className="text-2xl"
          >
            ☰
          </button>
          {mobileNav && (
            <nav className="mt-4 flex flex-wrap gap-2">
              <Link href="/" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Dashboard</Link>
              <Link href="/areas" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Areas</Link>
              <Link href="/goals" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Goals</Link>
              <Link href="/tasks" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Tasks</Link>
              <Link href="/courses" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Courses</Link>
              <Link href="/projects" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Projects</Link>
              <Link href="/weekly-reviews" className="px-3 py-1.5 bg-zinc-900 rounded-lg">Weekly Reviews</Link>
              <Link href="/analytics" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Analytics</Link>
            </nav>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Weekly Reviews</h1>

          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={handlePrevWeek}
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg transition"
            >
              ← Previous
            </button>
            <div className="text-xl font-semibold min-w-[250px] text-center">
              {formatDate(weekStartDate)} - {formatDate(weekEndDate)}
            </div>
            <button
              onClick={handleNextWeek}
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg transition"
            >
              Next →
            </button>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-6 mb-8">
            <div className="mb-6">
              <label className="block text-sm text-zinc-400 mb-2">
                ✨ What went well this week?
              </label>
              <textarea
                value={formData.wins}
                onChange={(e) => setFormData(prev => ({ ...prev, wins: e.target.value }))}
                placeholder="List your wins..."
                className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-xl p-4 outline-none resize-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-zinc-400 mb-2">
                💪 What were your struggles?
              </label>
              <textarea
                value={formData.struggles}
                onChange={(e) => setFormData(prev => ({ ...prev, struggles: e.target.value }))}
                placeholder="List your struggles..."
                className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-xl p-4 outline-none resize-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-zinc-400 mb-2">
                🎯 What should you focus on next week?
              </label>
              <textarea
                value={formData.next_focus}
                onChange={(e) => setFormData(prev => ({ ...prev, next_focus: e.target.value }))}
                placeholder="Next week's focus..."
                className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-xl p-4 outline-none resize-none"
              />
            </div>

            <button
              onClick={handleSaveReview}
              className="w-full bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-zinc-100 transition"
            >
              Save Review
            </button>
          </div>

          <h2 className="text-2xl font-bold mb-4">Past Reviews</h2>
          <div className="space-y-3">
            {reviews.map(review => {
              const reviewWeekStart = new Date(review.week_start);
              const reviewWeekEnd = new Date(reviewWeekStart);
              reviewWeekEnd.setDate(reviewWeekEnd.getDate() + 6);
              return (
                <div
                  key={review.id}
                  onClick={() => setSelectedWeek(review.week_start)}
                  className="bg-zinc-900 rounded-xl p-4 cursor-pointer hover:bg-zinc-800 transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">
                        {formatDate(reviewWeekStart)} - {formatDate(reviewWeekEnd)}
                      </p>
                      {review.wins && (
                        <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{review.wins}</p>
                      )}
                    </div>
                    <div className="text-zinc-500">
                      {review.wins || review.struggles || review.next_focus ? (
                        <span className="text-green-400">✓ Completed</span>
                      ) : (
                        <span className="text-zinc-500">Not started</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {reviews.length === 0 && (
              <p className="text-zinc-500 text-center py-8">
                No past reviews yet. Start with this week!
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
