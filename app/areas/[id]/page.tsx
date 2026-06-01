"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getAreas, getGoalsByAreaId, getTasks, calculateGoalHealth, addGoal, updateGoal, deleteGoal, addActivityLog } from "@/lib/supabase-utils";
import type { Area, Goal, Task, GoalHealth } from "@/lib/types";

function getHealthColor(health: GoalHealth): string {
  switch (health) {
    case "Healthy": return "bg-green-500";
    case "At Risk": return "bg-yellow-500";
    case "Stalled": return "bg-orange-500";
    case "Abandoned": return "bg-red-500";
    default: return "bg-zinc-500";
  }
}

function AreaPageContent() {
  const { id } = useParams();
  const [area, setArea] = useState<Area | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTargetDate, setNewGoalTargetDate] = useState("");
  const [newGoalType, setNewGoalType] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        if (!id) return;
        const [areasData, goalsData, tasksData] = await Promise.all([
          getAreas(),
          getGoalsByAreaId(parseInt(id as string)),
          getTasks()
        ]);
        const foundArea = areasData.find(a => a.id === parseInt(id as string));
        setArea(foundArea || null);
        // Calculate health for each goal
        const goalsWithHealth = goalsData.map(goal => ({
          ...goal,
          health: calculateGoalHealth(goal, tasksData)
        }));
        setGoals(goalsWithHealth);
        setTasks(tasksData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim() || !id) return;
    try {
      const added = await addGoal(parseInt(id as string), newGoalTitle, 0, newGoalTargetDate || undefined, newGoalType || undefined);
      // Log activity
      await addActivityLog("Created Goal", "Goal", added.id);
      
      setGoals([{ ...added, health: "Healthy" }, ...goals]);
      setNewGoalTitle("");
      setNewGoalTargetDate("");
      setNewGoalType("");
    } catch (error) {
      console.error("Error adding goal:", error);
    }
  };

  const handleUpdateProgress = async (goalId: number, progress: number) => {
    try {
      const updated = await updateGoal(goalId, { progress });
      // Log activity
      await addActivityLog("Updated Goal Progress", "Goal", goalId);
      
      // Recalculate health for updated goal
      const health = calculateGoalHealth(updated, tasks);
      setGoals(goals.map(g => g.id === goalId ? { ...updated, health } : g));
    } catch (error) {
      console.error("Error updating goal:", error);
    }
  };

  const handleDeleteGoal = async (goalId: number) => {
    try {
      await deleteGoal(goalId);
      setGoals(goals.filter(g => g.id !== goalId));
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </main>
    );
  }

  if (!area) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Area not found</p>
          <Link href="/areas" className="text-blue-400 hover:text-blue-300">
            Back to Areas
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex">
      <Sidebar activeTab="areas" />
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
              <Link href="/areas" className="px-3 py-1.5 bg-zinc-900 rounded-lg">Areas</Link>
              <Link href="/goals" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Goals</Link>
              <Link href="/tasks" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Tasks</Link>
              <Link href="/courses" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Courses</Link>
              <Link href="/projects" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Projects</Link>
              <Link href="/analytics" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Analytics</Link>
            </nav>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <Link href="/areas" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
              ← Back to Areas
            </Link>
            <h1 className="text-4xl font-bold mb-2" style={{ color: area.color }}>{area.name}</h1>
            {area.type && (
              <p className="text-zinc-400">{area.type}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
            <input
              type="text"
              placeholder="Goal title"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddGoal()}
              className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none"
            />
            <select
              value={newGoalType}
              onChange={(e) => setNewGoalType(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none"
            >
              <option value="">Type (optional)</option>
              <option value="short_term">Short Term</option>
              <option value="long_term">Long Term</option>
              <option value="habit">Habit</option>
              <option value="project">Project</option>
              <option value="certification">Certification</option>
              <option value="career">Career</option>
              <option value="financial">Financial</option>
            </select>
            <input
              type="date"
              value={newGoalTargetDate}
              onChange={(e) => setNewGoalTargetDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none"
            />
          </div>
          <button
            onClick={handleAddGoal}
            className="bg-white text-black px-5 py-3 rounded-xl font-medium mb-8"
          >
            Add Goal
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map(goal => (
              <div key={goal.id} className="bg-zinc-900 rounded-2xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{goal.title}</h3>
                    <div className="flex gap-2 items-center flex-wrap">
                      {goal.goal_type && (
                        <span className="text-sm text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
                          {goal.goal_type.replace("_", " ")}
                        </span>
                      )}
                      <span className="text-xs text-zinc-500 select-none">
                        🚀 Start: {new Date(goal.created_at).toLocaleDateString()}
                      </span>
                      {goal.target_date && (
                        <span className="text-xs text-zinc-500 select-none">
                          🎯 Target: {new Date(goal.target_date).toLocaleDateString()}
                        </span>
                      )}
                      {goal.health && (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-zinc-800">
                          <span className={`w-2 h-2 rounded-full ${getHealthColor(goal.health)}`} />
                          {goal.health}
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
                  href={`/goals/${goal.id}`}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  View Tasks →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function AreaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center"><p className="text-xl">Loading...</p></div>}>
      <AreaPageContent />
    </Suspense>
  );
}
