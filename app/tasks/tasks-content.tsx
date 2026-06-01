"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TaskCard from "@/components/TaskCard";
import { getTodayKey } from "@/lib/utils";
import { getTasks, getTasksByGoalId, getGoals, getAreas, addTask, updateTask, deleteTask, getDailyStats, upsertDailyStats, addActivityLog } from "@/lib/supabase-utils";
import type { Task, Goal, Area, DailyStats } from "@/lib/types";

export default function TasksPageContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskGoalId, setNewTaskGoalId] = useState<number | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();

  useEffect(() => {
    async function loadData() {
      try {
        const [goalsData, areasData, statsData] = await Promise.all([
          getGoals(),
          getAreas(),
          getDailyStats()
        ]);
        console.log("Fetched goals:", goalsData); // Add this!
        console.log("Fetched areas:", areasData); // And this!
        setGoals(goalsData);
        setAreas(areasData);
        setDailyStats(statsData);

        const goalId = searchParams.get("goalId");
        if (goalId) {
          const numericGoalId = parseInt(goalId);
          setSelectedGoalId(numericGoalId);
          setNewTaskGoalId(numericGoalId);
          const tasksData = await getTasksByGoalId(numericGoalId);
          setTasks(tasksData);
        } else {
          const tasksData = await getTasks();
          setTasks(tasksData);
        }
      } catch (error: any) {
        console.error("Error loading data:", error);
        console.error("Error message:", error.message);
        console.error("Error code:", error.code);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [searchParams]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const added = await addTask(newTaskTitle, newTaskGoalId || undefined);
      // Log activity
      await addActivityLog("Created Task", "Task", added.id);
      
      setTasks([added, ...tasks]);

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

  const handleToggleTask = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      const updated = await updateTask(id, { completed: !task.completed });
      // Log activity
      if (!task.completed) {
        await addActivityLog("Completed Task", "Task", id);
      } else {
        await addActivityLog("Reopened Task", "Task", id);
      }
      
      setTasks(tasks.map(t => t.id === id ? updated : t));

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

  const handleDeleteTask = async (id: number) => {
    try {
      const taskToDelete = tasks.find(t => t.id === id);
      await deleteTask(id);
      setTasks(tasks.filter(t => t.id !== id));

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

  const selectedGoal = selectedGoalId ? goals.find(g => g.id === selectedGoalId) : null;
  const selectedGoalArea = selectedGoal ? areas.find(a => a.id === selectedGoal.area_id) : null;

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex">
      <Sidebar activeTab="tasks" />
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
              <Link href="/tasks" className="px-3 py-1.5 bg-zinc-900 rounded-lg">Tasks</Link>
              <Link href="/courses" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Courses</Link>
              <Link href="/projects" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Projects</Link>
              <Link href="/analytics" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Analytics</Link>
            </nav>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              Tasks
              {selectedGoal && (
                <span className="text-2xl font-normal text-zinc-400 ml-4">
                  / {selectedGoalArea?.name ? `${selectedGoalArea.name} / ` : ""} {selectedGoal.title}
                </span>
              )}
            </h1>
            {!selectedGoalId && (
              <div className="mb-6">
                <label className="block text-sm text-zinc-400 mb-2">Filter by Goal</label>
                <select
                  value={newTaskGoalId?.toString() || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      const numericValue = parseInt(value);
                      setNewTaskGoalId(numericValue);
                      setSelectedGoalId(numericValue);
                    } else {
                      setNewTaskGoalId(null);
                      setSelectedGoalId(null);
                    }
                  }}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none w-full max-w-xs"
                >
                  <option value="">All Tasks</option>
                  {goals.map(goal => {
                    const area = areas.find(a => a.id === goal.area_id);
                    return (
                      <option key={goal.id} value={goal.id}>
                        {area?.name ? `${area.name} / ` : ""}{goal.title}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
            <input
              type="text"
              placeholder="Add a task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none"
            />
            {!selectedGoalId && (
              <select
                value={newTaskGoalId?.toString() || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    setNewTaskGoalId(parseInt(value));
                  } else {
                    setNewTaskGoalId(null);
                  }
                }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none"
              >
                <option value="">No Goal</option>
                {goals.map(goal => {
                  const area = areas.find(a => a.id === goal.area_id);
                  return (
                    <option key={goal.id} value={goal.id}>
                      {area?.name ? `${area.name} / ` : ""}{goal.title}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
          <button
            onClick={handleAddTask}
            className="bg-white text-black px-5 py-3 rounded-xl font-medium mb-8"
          >
            Add Task
          </button>

          <div className="space-y-3">
            {tasks.map(task => {
              const goal = task.goal_id ? goals.find(g => g.id === task.goal_id) : null;
              const area = goal?.area_id ? areas.find(a => a.id === goal.area_id) : null;
              return (
                <div key={task.id} className="flex gap-2">
                  <div
                    onClick={() => handleToggleTask(task.id)}
                    className="cursor-pointer flex-1"
                  >
                    <TaskCard title={task.title} completed={task.completed} />
                    {goal && (
                      <p className="text-xs text-zinc-500 mt-1 ml-1">
                        {area?.name ? `${area.name} / ` : ""}{goal.title}
                      </p>
                    )}
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
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
