"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TaskCard from "@/components/TaskCard";
import { getTodayKey } from "@/lib/utils";
import { getAreas, getGoals, getTasks, calculateGoalHealth, getTasksByGoalId, addTask, updateTask, deleteTask, getDailyStats, upsertDailyStats, addActivityLog } from "@/lib/supabase-utils";
import type { Area, Goal, Task, DailyStats, GoalHealth } from "@/lib/types";

function getHealthColor(health: GoalHealth): string {
  switch (health) {
    case "Healthy": return "bg-green-500";
    case "At Risk": return "bg-yellow-500";
    case "Stalled": return "bg-orange-500";
    case "Abandoned": return "bg-red-500";
    default: return "bg-zinc-500";
  }
}

function GoalPageContent() {
  const { id } = useParams();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [area, setArea] = useState<Area | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        if (!id) return;
        const [areasData, goalsData, statsData, allTasksData] = await Promise.all([
          getAreas(),
          getGoals(),
          getDailyStats(),
          getTasks()
        ]);
        const foundGoal = goalsData.find(g => g.id === parseInt(id as string));
        const foundArea = foundGoal ? areasData.find(a => a.id === foundGoal.area_id) : null;
        // Calculate goal health
        const goalWithHealth = foundGoal ? {
          ...foundGoal,
          health: calculateGoalHealth(foundGoal, allTasksData)
        } : null;
        setGoal(goalWithHealth);
        setArea(foundArea || null);
        setDailyStats(statsData);
        setAllTasks(allTasksData);
        const tasksData = await getTasksByGoalId(parseInt(id as string));
        setTasks(tasksData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !id || !goal) return;
    try {
      const added = await addTask(newTaskTitle, parseInt(id as string));
      // Log activity
      await addActivityLog("Created Task", "Task", added.id);
      
      setTasks([added, ...tasks]);
      const newAllTasks = [...allTasks, added];
      setAllTasks(newAllTasks);
      
      // Recalculate goal health
      const newHealth = calculateGoalHealth(goal, newAllTasks);
      setGoal({ ...goal, health: newHealth });

      const today = getTodayKey();
      const todayStats = dailyStats.find(s => s.date === today);
      await upsertDailyStats(today, {
        tasks_added: (todayStats?.tasks_added || 0) + 1
      });
      setDailyStats(prev => {
        const todayIdx = prev.findIndex(s => s.date === today);
        if (todayIdx !== -1) {
          const newStats = [...prev];
          newStats[todayIdx] = { ...newStats[todayIdx], tasks_added: newStats[todayIdx].tasks_added + 1 };
          return newStats;
        }
        return [...prev, { date: today, tasks_added: 1, tasks_completed: 0, courses_studied: 0, projects_touched: 0 }];
      });

      setNewTaskTitle("");
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleToggleTask = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !goal) return;

    try {
      const updated = await updateTask(taskId, { completed: !task.completed });
      // Log activity
      if (!task.completed) {
        await addActivityLog("Completed Task", "Task", taskId);
      } else {
        await addActivityLog("Reopened Task", "Task", taskId);
      }
      
      const newTasks = tasks.map(t => t.id === taskId ? updated : t);
      setTasks(newTasks);
      // Update all tasks array
      const newAllTasks = allTasks.map(t => t.id === taskId ? updated : t);
      setAllTasks(newAllTasks);
      
      // Recalculate goal health
      const newHealth = calculateGoalHealth(goal, newAllTasks);
      setGoal({ ...goal, health: newHealth });

      const today = getTodayKey();
      const todayStats = dailyStats.find(s => s.date === today);
      const change = !task.completed ? 1 : -1;
      await upsertDailyStats(today, {
        tasks_completed: Math.max(0, (todayStats?.tasks_completed || 0) + change)
      });
      setDailyStats(prev => {
        const todayIdx = prev.findIndex(s => s.date === today);
        if (todayIdx !== -1) {
          const newStats = [...prev];
          newStats[todayIdx] = { 
            ...newStats[todayIdx], 
            tasks_completed: Math.max(0, newStats[todayIdx].tasks_completed + change)
          };
          return newStats;
        }
        return [...prev, { 
          date: today, 
          tasks_added: 0, 
          tasks_completed: change > 0 ? 1 : 0, 
          courses_studied: 0, 
          projects_touched: 0 
        }];
      });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const taskToDelete = tasks.find(t => t.id === taskId);
      await deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));

      if (taskToDelete?.completed) {
        const today = getTodayKey();
        const todayStats = dailyStats.find(s => s.date === today);
        await upsertDailyStats(today, {
          tasks_completed: Math.max(0, (todayStats?.tasks_completed || 0) - 1)
        });
        setDailyStats(prev => {
          const todayIdx = prev.findIndex(s => s.date === today);
          if (todayIdx !== -1) {
            const newStats = [...prev];
            newStats[todayIdx] = { 
              ...newStats[todayIdx], 
              tasks_completed: Math.max(0, newStats[todayIdx].tasks_completed - 1)
            };
            return newStats;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </main>
    );
  }

  if (!goal) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Goal not found</p>
          <Link href="/areas" className="text-blue-400 hover:text-blue-300">
            Back to Areas
          </Link>
        </div>
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
            <Link 
              href={area ? `/areas/${area.id}` : "/areas"} 
              className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
            >
              ← Back to {area ? area.name : "Areas"}
            </Link>
            <h1 className="text-4xl font-bold mb-2">{goal.title}</h1>
            <div className="flex gap-2 items-center flex-wrap mb-4">
              {area && (
                <span 
                  className="text-sm text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full"
                  style={{ borderLeft: `3px solid ${area.color}` }}
                >
                  {area.name}
                </span>
              )}
              {goal.goal_type && (
                <span className="text-sm text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
                  {goal.goal_type.replace("_", " ")}
                </span>
              )}
              <span className="text-sm text-zinc-500 select-none">
                🚀 Start: {new Date(goal.created_at).toLocaleDateString()}
              </span>
              {goal.target_date && (
                <span className="text-sm text-zinc-500 select-none">
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
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-400">Progress</span>
                <span>{goal.progress}%</span>
              </div>
              <div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mb-8">
            <input
              type="text"
              placeholder="Add a task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none"
            />
            <button
              onClick={handleAddTask}
              className="bg-white text-black px-5 py-3 rounded-xl font-medium"
            >
              Add Task
            </button>
          </div>

          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="flex gap-2">
                <div
                  onClick={() => handleToggleTask(task.id)}
                  className="cursor-pointer flex-1"
                >
                  <TaskCard title={task.title} completed={task.completed} />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTask(task.id);
                  }}
                  className="bg-red-900/30 text-red-400 px-3 rounded-xl hover:bg-red-900/50 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function GoalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center"><p className="text-xl">Loading...</p></div>}>
      <GoalPageContent />
    </Suspense>
  );
}
