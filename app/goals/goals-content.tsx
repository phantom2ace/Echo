"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getAreas, getGoals, getGoalsByAreaId, addGoal, updateGoal, deleteGoal } from "@/lib/supabase-utils";
import type { Area, Goal } from "@/lib/types";

export default function GoalsPageContent() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTargetDate, setNewGoalTargetDate] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();

  useEffect(() => {
    async function loadData() {
      try {
        const areasData = await getAreas();
        setAreas(areasData);

        const areaId = searchParams.get("areaId");
        if (areaId) {
          const numericAreaId = parseInt(areaId);
          setSelectedAreaId(numericAreaId);
          const goalsData = await getGoalsByAreaId(numericAreaId);
          setGoals(goalsData);
        } else {
          const goalsData = await getGoals();
          setGoals(goalsData);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [searchParams]);

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim() || !selectedAreaId) return;
    try {
      const added = await addGoal(selectedAreaId, newGoalTitle, 0, newGoalTargetDate || undefined);
      setGoals([added, ...goals]);
      setNewGoalTitle("");
      setNewGoalTargetDate("");
    } catch (error) {
      console.error("Error adding goal:", error);
    }
  };

  const handleUpdateProgress = async (id: number, progress: number) => {
    try {
      const updated = await updateGoal(id, { progress });
      setGoals(goals.map(goal => goal.id === id ? updated : goal));
    } catch (error) {
      console.error("Error updating goal:", error);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    try {
      await deleteGoal(id);
      setGoals(goals.filter(goal => goal.id !== id));
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const selectedArea = selectedAreaId ? areas.find(a => a.id === selectedAreaId) : null;

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex">
      <Sidebar activeTab="goals" />
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
              <Link href="/goals" className="px-3 py-1.5 bg-zinc-900 rounded-lg">Goals</Link>
              <Link href="/tasks" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Tasks</Link>
              <Link href="/courses" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Courses</Link>
              <Link href="/projects" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Projects</Link>
              <Link href="/analytics" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Analytics</Link>
            </nav>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              Goals
              {selectedArea && <span className="text-2xl font-normal text-zinc-400 ml-4">/ {selectedArea.name}</span>}
            </h1>
            {!selectedArea && (
              <div className="mb-6">
                <label className="block text-sm text-zinc-400 mb-2">Filter by Area</label>
                <select
                  value={selectedAreaId?.toString() || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      setSelectedAreaId(parseInt(value));
                    } else {
                      setSelectedAreaId(null);
                    }
                  }}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none w-full max-w-xs"
                >
                  <option value="">All Areas</option>
                  {areas.map(area => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Goal Title</label>
              <input
                type="text"
                placeholder="e.g. Complete Advanced React Course or Gym 3x a week"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddGoal()}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none text-zinc-100 placeholder-zinc-600"
                disabled={!selectedAreaId}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Target Completion Date</label>
              <input
                type="date"
                value={newGoalTargetDate}
                onChange={(e) => setNewGoalTargetDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none text-zinc-100 cursor-pointer"
                disabled={!selectedAreaId}
              />
            </div>
          </div>
          <button
            onClick={handleAddGoal}
            disabled={!selectedAreaId || !newGoalTitle.trim()}
            className="bg-white text-black px-5 py-3 rounded-xl font-medium mb-8 disabled:opacity-50 cursor-pointer hover:bg-zinc-200 transition active:scale-95"
          >
            Add Goal
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map(goal => {
              const area = areas.find(a => a.id === goal.area_id);
              return (
                <div key={goal.id} className="bg-zinc-900 rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{goal.title}</h3>
                      {area && (
                        <span
                          className="text-sm text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full"
                          style={{ borderLeft: `3px solid ${area.color || "#60a5fa"}` }}
                        >
                          {area.name}
                        </span>
                      )}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500 mt-2.5 font-medium">
                        <span className="flex items-center gap-1 select-none">
                          🚀 Start: {new Date(goal.created_at).toLocaleDateString()}
                        </span>
                        {goal.target_date && (
                          <span className="flex items-center gap-1 select-none">
                            🎯 Target: {new Date(goal.target_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-zinc-500 hover:text-red-400 transition"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-400">Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    {[0, 25, 50, 75, 100].map(progress => (
                      <button
                        key={progress}
                        onClick={() => handleUpdateProgress(goal.id, progress)}
                        className={`flex-1 text-sm py-2 rounded transition ${
                          goal.progress === progress ? "bg-green-600" : "bg-zinc-800 hover:bg-zinc-700"
                        }`}
                      >
                        {progress}%
                      </button>
                    ))}
                  </div>

                  <Link
                    href={`/tasks?goalId=${goal.id}`}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    View Tasks →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
