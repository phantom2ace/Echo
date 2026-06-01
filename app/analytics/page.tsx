"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import FocusScore from "@/components/FocusScore";
import AIInsights from "@/components/AIInsights";
import { getTodayKey } from "@/lib/utils";
import { getTasks, getCourses, getProjects, getDailyStats, getAreas, getGoals } from "@/lib/supabase-utils";
import type { Task, Course, Project, DailyStats, AIInsight, Area, Goal } from "@/lib/types";

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [tasksData, coursesData, projectsData, statsData, areasData, goalsData] = await Promise.all([
          getTasks(),
          getCourses(),
          getProjects(),
          getDailyStats(),
          getAreas(),
          getGoals()
        ]);
        setTasks(tasksData);
        setCourses(coursesData);
        setProjects(projectsData);
        setDailyStats(statsData);
        setAreas(areasData);
        setGoals(goalsData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Generate fake AI insights based on data
  const generateInsights = (): AIInsight[] => {
    const insights: AIInsight[] = [];
    let idCounter = 1;

    // Check for old uncompleted tasks
    const oldTasks = tasks.filter(t => {
      if (t.completed) return false;
      const age = (Date.now() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return age > 5;
    });
    if (oldTasks.length > 0) {
      insights.push({
        id: idCounter++,
        text: `${oldTasks[0].title} has been on your list for a while. Maybe it's time to break it down?`,
        type: "warning",
        created_at: Date.now(),
      });
    }

    // Goals insights
    const goalsWithArea = goals.map(goal => {
      const area = areas.find(a => a.id === goal.area_id);
      return { ...goal, area };
    });

    // Count goals by type
    const goalTypeCounts: Record<string, number> = {};
    goalsWithArea.forEach(goal => {
      if (goal.goal_type) {
        goalTypeCounts[goal.goal_type] = (goalTypeCounts[goal.goal_type] || 0) + 1;
      }
    });

    if (Object.keys(goalTypeCounts).length > 0) {
      const topType = Object.keys(goalTypeCounts).reduce((a, b) => 
        goalTypeCounts[a] > goalTypeCounts[b] ? a : b
      );
      insights.push({
        id: idCounter++,
        text: `${goalTypeCounts[topType]} of your goals are ${topType.replace('_', ' ')} goals.`,
        type: "positive",
        created_at: Date.now(),
      });
    }

    // Areas with no goals
    const areasWithNoGoals = areas.filter(area => !goals.some(g => g.area_id === area.id));
    if (areasWithNoGoals.length > 0) {
      insights.push({
        id: idCounter++,
        text: `${areasWithNoGoals.length} area${areasWithNoGoals.length !== 1 ? 's' : ''} don't have any goals yet. Add some!`,
        type: "suggestion",
        created_at: Date.now(),
      });
    }

    // General suggestions
    if (insights.length === 0) {
      insights.push({
        id: idCounter++,
        text: "Great job staying consistent! Keep using the app to get more insights.",
        type: "positive",
        created_at: Date.now(),
      });
    }

    insights.push({
      id: idCounter++,
      text: "Try to complete 3 tasks before 4 PM for maximum productivity.",
      type: "suggestion",
      created_at: Date.now(),
    });

    return insights;
  };

  const calculateStreak = (type: "tasks" | "courses" | "all" = "all"): number => {
    let count = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateKey = checkDate.toISOString().split('T')[0];
      const stat = dailyStats.find(s => s.date === dateKey);
      
      let hasActivity = false;
      if (type === "tasks" && (stat?.tasks_completed || 0) > 0) hasActivity = true;
      if (type === "courses" && (stat?.courses_studied || 0) > 0) hasActivity = true;
      if (type === "all" && ((stat?.tasks_completed || 0) > 0 || (stat?.courses_studied || 0) > 0 || (stat?.projects_touched || 0) > 0)) hasActivity = true;
      
      if (hasActivity) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  };

  const calculateFocusScore = (): number => {
    let score = 50;

    const completedToday = dailyStats.find(s => s.date === getTodayKey())?.tasks_completed || 0;
    score += Math.min(completedToday * 5, 25);

    const last7DaysStats = dailyStats.filter(s => {
      const date = new Date(s.date);
      const today = new Date();
      const diff = (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff < 7;
    });
    const avgCompleted = last7DaysStats.length > 0 
      ? last7DaysStats.reduce((sum, s) => sum + s.tasks_completed, 0) / last7DaysStats.length 
      : 0;
    score += Math.min(avgCompleted * 3, 20);

    const avgCourseProgress = courses.length > 0 
      ? courses.reduce((sum, c) => sum + c.progress, 0) / courses.length 
      : 0;
    score += Math.min(avgCourseProgress / 10, 10);

    const oldTasks = tasks.filter(t => {
      if (t.completed) return false;
      const age = (Date.now() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return age > 3;
    });
    score -= Math.min(oldTasks.length * 5, 30);

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const insights = generateInsights();
  const focusScore = calculateFocusScore();
  const taskStreak = calculateStreak("tasks");
  const studyStreak = calculateStreak("courses");
  const overallStreak = calculateStreak("all");

  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.length - completedTasks;
  const avgCourseProgress = courses.length > 0
    ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)
    : 0;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const weeklyStats = last7Days.map(date => {
    const stat = dailyStats.find(s => s.date === date);
    return {
      date,
      label: new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' }),
      completed: stat?.tasks_completed || 0,
      added: stat?.tasks_added || 0,
    };
  });
  const maxBarHeight = Math.max(...weeklyStats.map(s => Math.max(s.completed, s.added)), 1);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex">
      <Sidebar activeTab="analytics" />
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
              <Link href="/courses" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Courses</Link>
              <Link href="/tasks" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Tasks</Link>
              <Link href="/projects" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Projects</Link>
              <Link href="/weekly-reviews" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Weekly Reviews</Link>
              <Link href="/analytics" className="px-3 py-1.5 bg-zinc-900 rounded-lg">Analytics</Link>
            </nav>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h1 className="text-4xl font-bold mb-8">Analytics</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="md:col-span-2">
              <FocusScore score={focusScore} />
            </div>
            <div className="bg-zinc-900 p-4 rounded-2xl">
              <h3 className="text-sm text-zinc-400 mb-1">Task Streak</h3>
              <p className="text-3xl font-bold text-blue-400">{taskStreak}</p>
              <p className="text-xs text-zinc-500">days</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-2xl">
              <h3 className="text-sm text-zinc-400 mb-1">Study Streak</h3>
              <p className="text-3xl font-bold text-green-400">{studyStreak}</p>
              <p className="text-xs text-zinc-500">days</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-2xl">
              <h3 className="text-sm text-zinc-400 mb-1">Overall Streak</h3>
              <p className="text-3xl font-bold text-purple-400">{overallStreak}</p>
              <p className="text-xs text-zinc-500">days</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-2xl">
              <h3 className="text-sm text-zinc-400 mb-1">Completed Tasks</h3>
              <p className="text-3xl font-bold text-green-400">{completedTasks}</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-2xl">
              <h3 className="text-sm text-zinc-400 mb-1">Pending Tasks</h3>
              <p className="text-3xl font-bold text-yellow-400">{pendingTasks}</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-2xl">
              <h3 className="text-sm text-zinc-400 mb-1">Avg Course Progress</h3>
              <p className="text-3xl font-bold text-blue-400">{avgCourseProgress}%</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-2xl">
              <h3 className="text-sm text-zinc-400 mb-1">Abandoned Projects</h3>
              <p className="text-3xl font-bold text-red-400">{projects.filter(p => p.status === "abandoned").length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Weekly Activity</h2>
              <div className="bg-zinc-900 p-6 rounded-2xl">
                <div className="flex items-end justify-between gap-4 h-48">
                  {weeklyStats.map((stat, i) => (
                    <div key={stat.date} className="flex-1 flex flex-col items-center gap-2">
                      <div className="flex gap-1 h-36 items-end w-full">
                        <div
                          className="flex-1 bg-green-500/50 rounded-t transition-all"
                          style={{ height: `${(stat.completed / maxBarHeight) * 100}%` }}
                        />
                        <div
                          className="flex-1 bg-purple-500/30 rounded-t transition-all"
                          style={{ height: `${(stat.added / maxBarHeight) * 100}%` }}
                        />
                      </div>
                      <div className="text-sm text-zinc-400">{stat.label}</div>
                      <div className="text-xs text-zinc-500">
                        <span className="text-green-400">{stat.completed}</span>/
                        <span className="text-purple-400">{stat.added}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-6 mt-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500/50 rounded" />
                    <span className="text-zinc-400">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500/30 rounded" />
                    <span className="text-zinc-400">Added</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">AI Insights</h2>
              <div className="bg-zinc-900 p-6 rounded-2xl">
                <AIInsights insights={insights} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
