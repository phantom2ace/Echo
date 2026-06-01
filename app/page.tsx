"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import TaskCard from "@/components/TaskCard";
import CourseCard from "@/components/CourseCard";
import FocusScore from "@/components/FocusScore";
import RecoveryMode from "@/components/RecoveryMode";
import AIInsights from "@/components/AIInsights";
import { calculateFocusScore, calculateStreak, getTodayKey } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  getCourses,
  updateCourse,
  getProjects,
  getDailyStats,
  upsertDailyStats,
  getAreas,
  getGoals,
  calculateGoalHealth,
  addActivityLog
} from "@/lib/supabase-utils";
import type { Task, Course, Project, DailyStats, AIInsight, Area, Goal } from "@/lib/types";

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRecoveryMode, setShowRecoveryMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [tasksData, coursesData, projectsData, statsData, areasData, goalsData, { data: { user: userData } }] = await Promise.all([
          getTasks(),
          getCourses(),
          getProjects(),
          getDailyStats(),
          getAreas(),
          getGoals(),
          supabase.auth.getUser()
        ]);
        setTasks(tasksData);
        setCourses(coursesData);
        setProjects(projectsData);
        setDailyStats(statsData);
        setAreas(areasData);
        setUser(userData);
        // Calculate goal health for each goal
        const goalsWithHealth = goalsData.map(goal => ({
          ...goal,
          health: calculateGoalHealth(goal, tasksData)
        }));
        setGoals(goalsWithHealth);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const generateInsights = (): AIInsight[] => {
    const insights: AIInsight[] = [];
    let idCounter = 1;

    // Streak insight
    const taskStreak = calculateStreak(dailyStats, "tasks");
    if (taskStreak >= 3) {
      insights.push({
        id: idCounter++,
        text: `You're on a ${taskStreak}-day task completion streak! Keep it up! 🚀`,
        type: "positive",
        created_at: Date.now(),
      });
    }

    // Old tasks insight
    const oldTasks = tasks.filter(t => {
      if (t.completed) return false;
      const age = (Date.now() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return age > 3;
    });
    if (oldTasks.length > 0) {
      insights.push({
        id: idCounter++,
        text: `You have ${oldTasks.length} task${oldTasks.length > 1 ? "s" : ""} that have been pending for over 3 days.`,
        type: "warning",
        created_at: Date.now(),
      });
    }

    // Goal health insights
    const atRiskGoals = goals.filter(g => g.health === "At Risk");
    const stalledGoals = goals.filter(g => g.health === "Stalled");
    const abandonedGoals = goals.filter(g => g.health === "Abandoned");

    if (abandonedGoals.length > 0) {
      insights.push({
        id: idCounter++,
        text: `⚠️ You have ${abandonedGoals.length} abandoned goal${abandonedGoals.length > 1 ? "s" : ""}. Consider revisiting or removing them!`,
        type: "warning",
        created_at: Date.now(),
      });
    }

    if (stalledGoals.length > 0) {
      insights.push({
        id: idCounter++,
        text: `💤 ${stalledGoals.length} goal${stalledGoals.length > 1 ? "s" : ""} have stalled. Try adding small tasks to get them moving again!`,
        type: "warning",
        created_at: Date.now(),
      });
    }

    if (atRiskGoals.length > 0) {
      insights.push({
        id: idCounter++,
        text: `⚠️ ${atRiskGoals.length} goal${atRiskGoals.length > 1 ? "s" : ""} are at risk of stalling. Act soon!`,
        type: "warning",
        created_at: Date.now(),
      });
    }

    // Areas with no goals
    const areasWithNoGoals = areas.filter(area => !goals.some(g => g.area_id === area.id));
    if (areasWithNoGoals.length > 0 && areas.length > 0) {
      insights.push({
        id: idCounter++,
        text: `Add goals to ${areasWithNoGoals.length} area${areasWithNoGoals.length > 1 ? "s" : ""} to start tracking progress! 🎯`,
        type: "suggestion",
        created_at: Date.now(),
      });
    }

    // General suggestion
    insights.push({
      id: idCounter++,
      text: "Try taking a 5-minute break every 25 minutes to stay fresh!",
      type: "suggestion",
      created_at: Date.now(),
    });

    return insights;
  };

  const insights = generateInsights();
  const focusScore = calculateFocusScore(tasks, courses, dailyStats);
  const overallStreak = calculateStreak(dailyStats, "all");
  const completedCount = tasks.filter(t => t.completed).length;
  const avgCourseProgress = courses.length > 0
    ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)
    : 0;
  const todayStats = dailyStats.find(s => s.date === getTodayKey());

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const added = await addTask(newTaskTitle);
      // Log activity
      await addActivityLog("Created Task", "Task", added.id);
      
      setTasks([added, ...tasks]);

      // Update daily stats
      const today = getTodayKey();
      const todayStatsItem = dailyStats.find(s => s.date === today);
      await upsertDailyStats(today, {
        tasks_added: (todayStatsItem?.tasks_added || 0) + 1
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

      // Update daily stats
      const today = getTodayKey();
      const todayStatsItem = dailyStats.find(s => s.date === today);
      const change = !task.completed ? 1 : -1;
      await upsertDailyStats(today, {
        tasks_completed: Math.max(0, (todayStatsItem?.tasks_completed || 0) + change)
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

      // Update daily stats if task was completed
      if (taskToDelete?.completed) {
        const today = getTodayKey();
        const todayStatsItem = dailyStats.find(s => s.date === today);
        await upsertDailyStats(today, {
          tasks_completed: Math.max(0, (todayStatsItem?.tasks_completed || 0) - 1)
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

  const handleUpdateCourseProgress = async (id: number, progress: number) => {
    try {
      const course = courses.find(c => c.id === id);
      if (!course) return;

      const updated = await updateCourse(id, { progress });
      setCourses(courses.map(c => c.id === id ? updated : c));

      // Update daily stats
      const today = getTodayKey();
      const todayStatsItem = dailyStats.find(s => s.date === today);
      await upsertDailyStats(today, {
        courses_studied: (todayStatsItem?.courses_studied || 0) + 1
      });
      setDailyStats(prev => {
        const todayIdx = prev.findIndex(s => s.date === today);
        if (todayIdx !== -1) {
          const newStats = [...prev];
          newStats[todayIdx] = { ...newStats[todayIdx], courses_studied: newStats[todayIdx].courses_studied + 1 };
          return newStats;
        }
        return [...prev, { date: today, courses_studied: 1, tasks_added: 0, tasks_completed: 0, projects_touched: 0 }];
      });
    } catch (error) {
      console.error("Error updating course:", error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </main>
    );
  }

  const username = user?.user_metadata?.username || (user?.email ? user.email.split('@')[0] : 'User');

  const getDynamicGreeting = (): string => {
    const hour = new Date().getHours();
    const cleanName = username.charAt(0).toUpperCase() + username.slice(1);
    
    // Determine time of day prefix
    let timeGreeting = "Welcome";
    if (hour >= 5 && hour < 12) {
      timeGreeting = `Good morning, ${cleanName}`;
    } else if (hour >= 12 && hour < 17) {
      timeGreeting = `Good afternoon, ${cleanName}`;
    } else if (hour >= 17 && hour < 22) {
      timeGreeting = `Good evening, ${cleanName}`;
    } else {
      timeGreeting = `Late night hustle, ${cleanName}`;
    }

    // Add dynamic activity flare
    const todayCompletions = todayStats?.tasks_completed || 0;
    if (todayCompletions >= 3) {
      return `${timeGreeting}! You're absolutely crushing it today 🚀`;
    }
    if (overallStreak >= 3) {
      return `${timeGreeting}! Streak is ${overallStreak} days strong 🔥`;
    }
    if (todayCompletions > 0) {
      return `${timeGreeting}! Great momentum today ⚡`;
    }

    // Default time-of-day greetings
    if (hour >= 5 && hour < 12) {
      return `${timeGreeting}! Ready to own the day? 🌅`;
    }
    if (hour >= 22 || hour < 5) {
      return `${timeGreeting}! Late hours yield great twins 🦉`;
    }
    return `${timeGreeting}! Welcome back to Echo.`;
  };

  return (
    <main className="min-h-screen bg-black text-white flex">
      <Sidebar activeTab="dashboard" />

      <section className="flex-1 flex flex-col min-w-0">
        {/* Mobile Navigation */}
        <div className="md:hidden p-4 border-b border-zinc-800 bg-zinc-950">
          <button
            onClick={() => setMobileNav(!mobileNav)}
            className="text-2xl cursor-pointer text-zinc-400 hover:text-white transition"
          >
            ☰
          </button>
          {mobileNav && (
            <nav className="mt-4 flex flex-wrap gap-2">
              <Link href="/" className="px-3 py-1.5 bg-zinc-900 rounded-lg text-sm text-zinc-200">Dashboard</Link>
              <Link href="/areas" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg text-sm text-zinc-400 hover:text-zinc-200">Areas</Link>
              <Link href="/goals" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg text-sm text-zinc-400 hover:text-zinc-200">Goals</Link>
              <Link href="/tasks" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg text-sm text-zinc-400 hover:text-zinc-200">Tasks</Link>
              <Link href="/courses" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg text-sm text-zinc-400 hover:text-zinc-200">Courses</Link>
              <Link href="/projects" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg text-sm text-zinc-400 hover:text-zinc-200">Projects</Link>
              <Link href="/weekly-reviews" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg text-sm text-zinc-400 hover:text-zinc-200">Weekly Reviews</Link>
              <Link href="/analytics" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg text-sm text-zinc-400 hover:text-zinc-200">Analytics</Link>
            </nav>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto">
          {/* Dashboard Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 select-all">{getDynamicGreeting()}</h1>
            <p className="text-zinc-400 text-sm">
              Your focus score is at <span className="text-rust font-bold">{focusScore}%</span> today. You have completed <span className="text-sage font-bold">{todayStats?.tasks_completed || 0} tasks</span>.
            </p>
          </header>

          {/* Main Dashboard Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Content Area (Span 2) */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* Focus Board and Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Column 1: Focus Board & Recovery Mode Button Stacked */}
                <div className="flex flex-col gap-6">
                  <FocusScore score={focusScore} />
                  
                  {/* Smart Recovery Mode Button */}
                  <button
                    onClick={() => setShowRecoveryMode(true)}
                    className="w-full bg-gradient-to-r from-rust/15 to-sage/15 border border-rust/20 p-5 rounded-2xl text-left hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer group flex flex-col justify-center min-h-[100px] shadow-sm shadow-[#24251a]/30"
                  >
                    <h3 className="text-base font-bold mb-1 flex items-center gap-2 text-rust group-hover:text-rust/95 transition-colors">
                      <span>🧘</span> Feeling Overwhelmed?
                    </h3>
                    <p className="text-xs text-stone/70 group-hover:text-stone/90 transition-colors leading-relaxed">
                      Enter Smart Recovery Mode to reset and focus on one task at a time.
                    </p>
                  </button>
                </div>

                {/* Column 2: Stats Cards Stacked */}
                <div className="flex flex-col gap-6">
                  {/* Completed Tasks Card */}
                  <div className="bg-stone/5 border border-stone/10 p-5 rounded-2xl flex flex-col justify-between hover:bg-stone/8 transition duration-200 min-h-[110px] shadow-sm shadow-[#24251a]/40">
                    <div>
                      <h3 className="text-xs font-bold text-stone/55 mb-1.5 uppercase tracking-wider">Completed Tasks</h3>
                      <p className="text-3xl font-black text-sage tracking-tight">{completedCount}</p>
                    </div>
                    <div className="text-xs text-stone/40 border-t border-stone/5 pt-2 mt-2 flex justify-between items-center">
                      <span>Today's completions</span>
                      <span className="font-semibold text-stone/60">{todayStats?.tasks_completed || 0}</span>
                    </div>
                  </div>

                  {/* Streak Card */}
                  <div className="bg-stone/5 border border-stone/10 p-5 rounded-2xl flex flex-col justify-between hover:bg-stone/8 transition duration-200 min-h-[110px] shadow-sm shadow-[#24251a]/40">
                    <div>
                      <h3 className="text-xs font-bold text-stone/55 mb-1.5 uppercase tracking-wider">Current Streak</h3>
                      <p className="text-3xl font-black text-rust tracking-tight">{overallStreak}</p>
                    </div>
                    <div className="text-xs text-stone/40 border-t border-stone/5 pt-2 mt-2 flex justify-between items-center">
                      <span>Active days in a row</span>
                      <span className="font-semibold text-stone/60">days 🔥</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modules Grid: Recent Tasks & Your Courses side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Recent Tasks Module */}
                <div className="bg-stone/3 border border-stone/10 p-5 rounded-2xl flex flex-col min-h-[400px] shadow-sm shadow-[#24251a]/30">
                  <div className="flex justify-between items-center mb-5 shrink-0">
                    <h2 className="text-base font-bold tracking-tight text-stone">Recent Tasks</h2>
                    <Link href="/tasks" className="text-xs font-bold text-rust hover:text-rust/80 hover:underline transition">
                      View All →
                    </Link>
                  </div>
                  
                  {/* Task List */}
                  <div className="space-y-2.5 mb-5 flex-1 overflow-y-auto pr-1">
                    {tasks.slice(0, 5).map(task => (
                      <div key={task.id} className="flex gap-2 items-center group">
                        <div
                          onClick={() => handleToggleTask(task.id)}
                          className="cursor-pointer flex-1 min-w-0"
                        >
                          <TaskCard title={task.title} completed={task.completed} />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                          className="bg-earth border border-stone/10 hover:bg-rust/10 hover:border-rust/30 hover:text-rust text-stone/50 w-8 h-8 rounded-xl flex items-center justify-center transition cursor-pointer select-none opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <p className="text-xs text-stone/40 text-center py-10 border border-dashed border-stone/10 rounded-xl bg-earth/20">
                        No tasks yet. Create one below!
                      </p>
                    )}
                  </div>

                  {/* Add Task Input */}
                  <div className="flex gap-2 mt-auto shrink-0 pt-2.5 border-t border-stone/5">
                    <input
                      type="text"
                      placeholder="Add a quick task..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                      className="flex-1 bg-earth border border-stone/15 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-rust/40 text-stone placeholder-stone/30 transition-all duration-150"
                    />
                    <button
                      onClick={handleAddTask}
                      className="bg-rust hover:bg-rust/90 text-earth px-4 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Courses Module */}
                <div className="bg-stone/3 border border-stone/10 p-5 rounded-2xl flex flex-col min-h-[400px] shadow-sm shadow-[#24251a]/30">
                  <div className="flex justify-between items-center mb-5 shrink-0">
                    <h2 className="text-base font-bold tracking-tight text-stone">Your Courses</h2>
                    <Link href="/courses" className="text-xs font-bold text-rust hover:text-rust/80 hover:underline transition">
                      View All →
                    </Link>
                  </div>
                  <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                    {courses.slice(0, 3).map(course => (
                      <CourseCard
                        key={course.id}
                        name={course.name}
                        progress={course.progress}
                        confidence={course.confidence}
                        examDate={course.exam_date}
                        onProgressChange={(p) => handleUpdateCourseProgress(course.id, p)}
                      />
                    ))}
                    {courses.length === 0 && (
                      <p className="text-xs text-stone/40 text-center py-10 border border-dashed border-stone/10 rounded-xl bg-earth/20">
                        No active courses yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Right Side Column (Span 1) - Dedicated AI Insights Panel */}
            <div className="lg:col-span-1">
              <div className="bg-stone/3 border border-stone/10 p-5 rounded-2xl h-full flex flex-col min-h-[500px] shadow-sm shadow-[#24251a]/30">
                <div className="flex items-center gap-2 mb-5 shrink-0">
                  <span className="text-lg leading-none select-none text-rust">✨</span>
                  <h2 className="text-base font-bold tracking-tight text-stone">AI Insights</h2>
                </div>
                <div className="flex-1 overflow-y-auto pr-1">
                  <AIInsights insights={insights} />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {showRecoveryMode && (
        <RecoveryMode
          tasks={tasks}
          onClose={() => setShowRecoveryMode(false)}
          onCompleteTask={(id) => {
            handleToggleTask(id);
            setShowRecoveryMode(false);
          }}
        />
      )}
    </main>
  );
}
