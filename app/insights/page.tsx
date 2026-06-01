"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import {
  getTasks,
  getGoals,
  getAreas,
  getDailyStats,
  getWeeklyReviews,
  getActivityLog,
  calculateGoalHealth
} from "@/lib/supabase-utils";
import type { Task, Goal, Area, DailyStats, WeeklyReview, ActivityLog } from "@/lib/types";

export default function InsightsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [
          tasksData,
          goalsData,
          areasData,
          statsData,
          reviewsData,
          logsData,
          { data: { user: userData } }
        ] = await Promise.all([
          getTasks(),
          getGoals(),
          getAreas(),
          getDailyStats(),
          getWeeklyReviews(),
          getActivityLog(100),
          supabase.auth.getUser()
        ]);

        setTasks(tasksData);
        setGoals(goalsData);
        setAreas(areasData);
        setDailyStats(statsData);
        setWeeklyReviews(reviewsData);
        setActivityLogs(logsData);
        setUser(userData);
      } catch (error) {
        console.error("Error loading insights data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#2F3020] text-[#CDCBD6] flex items-center justify-center">
        <p className="text-sm font-semibold animate-pulse">Computing your digital twin observations...</p>
      </main>
    );
  }

  const username = user?.user_metadata?.username || (user?.email ? user.email.split("@")[0] : "User");

  // ==========================================
  // INSIGHT 1: GOAL DISTRIBUTION
  // ==========================================
  const goalDistribution = areas.map(area => {
    const count = goals.filter(g => g.area_id === area.id).length;
    return { name: area.name, count };
  });

  // ==========================================
  // INSIGHT 2: COMPLETION STATS
  // ==========================================
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const completedTasks = tasks.filter(t => t.completed);
  const completedThisWeek = completedTasks.filter(t => new Date(t.created_at) >= oneWeekAgo).length;
  const completedThisMonth = completedTasks.filter(t => new Date(t.created_at) >= oneMonthAgo).length;
  
  const totalTasksThisWeek = tasks.filter(t => new Date(t.created_at) >= oneWeekAgo).length;
  const completionRate = totalTasksThisWeek > 0 ? Math.round((completedThisWeek / totalTasksThisWeek) * 100) : 0;

  // ==========================================
  // INSIGHT 3: GOAL HEALTH & NEGLECTED REGISTER
  // ==========================================
  const goalsWithHealth = goals.map(goal => ({
    ...goal,
    health: calculateGoalHealth(goal, tasks)
  }));

  const healthCounts = {
    Healthy: goalsWithHealth.filter(g => g.health === "Healthy").length,
    "At Risk": goalsWithHealth.filter(g => g.health === "At Risk").length,
    Stalled: goalsWithHealth.filter(g => g.health === "Stalled").length,
    Abandoned: goalsWithHealth.filter(g => g.health === "Abandoned").length,
  };

  const neglectedGoals = goalsWithHealth
    .filter(g => g.health === "Stalled" || g.health === "Abandoned")
    .slice(0, 3);

  // ==========================================
  // INSIGHT 4: WEEKLY ACTIVITY WAVE
  // ==========================================
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const activityByDay: { [key: string]: number } = {
    Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0
  };

  activityLogs.forEach(log => {
    const date = new Date(log.created_at);
    // Only count logs from the past week
    if (date >= oneWeekAgo) {
      const dayName = weekdays[date.getDay()];
      if (dayName in activityByDay) {
        activityByDay[dayName]++;
      }
    }
  });

  const activityWaveData = Object.entries(activityByDay).map(([day, count]) => ({ day, count }));

  // ==========================================
  // INSIGHT 5: WEEKLY REVIEW MEMORY
  // ==========================================
  const winsList: string[] = [];
  const strugglesList: string[] = [];

  weeklyReviews.slice(0, 3).forEach(review => {
    if (review.wins) {
      review.wins.split("\n").forEach(w => {
        const clean = w.replace(/^[-\*\s\d\.)]+/, "").trim();
        if (clean && !winsList.includes(clean)) winsList.push(clean);
      });
    }
    if (review.struggles) {
      review.struggles.split("\n").forEach(s => {
        const clean = s.replace(/^[-\*\s\d\.)]+/, "").trim();
        if (clean && !strugglesList.includes(clean)) strugglesList.push(clean);
      });
    }
  });

  const finalWins = winsList.slice(0, 4);
  const finalStruggles = strugglesList.slice(0, 4);

  // ==========================================
  // DIGITAL TWIN: BEHAVIOR OBSERVATIONS
  // ==========================================
  const observations: string[] = [];

  // Observation 1: Peak Active Hour Blocks
  const hourCounts = Array(24).fill(0);
  activityLogs.forEach(log => {
    const hour = new Date(log.created_at).getHours();
    hourCounts[hour]++;
  });

  let maxBlockCount = 0;
  let peakStartHour = 19; // Default 7 PM
  for (let i = 0; i < 24; i++) {
    const currentBlock = hourCounts[i] + hourCounts[(i + 1) % 24] + hourCounts[(i + 2) % 24];
    if (currentBlock > maxBlockCount) {
      maxBlockCount = currentBlock;
      peakStartHour = i;
    }
  }

  const formatHour = (h: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12} ${ampm}`;
  };

  if (maxBlockCount > 0) {
    observations.push(`Most of your digital interactions and updates occur between ${formatHour(peakStartHour)} and ${formatHour((peakStartHour + 3) % 24)}.`);
  }

  // Observation 2: Focus Dominance
  const areaCompletionCounts: { [key: number]: number } = {};
  tasks.forEach(t => {
    if (t.completed && t.goal_id) {
      const goal = goals.find(g => g.id === t.goal_id);
      if (goal) {
        areaCompletionCounts[goal.area_id] = (areaCompletionCounts[goal.area_id] || 0) + 1;
      }
    }
  });

  let dominantAreaId = -1;
  let maxCompletionCount = -1;
  Object.entries(areaCompletionCounts).forEach(([areaIdStr, count]) => {
    if (count > maxCompletionCount) {
      maxCompletionCount = count;
      dominantAreaId = Number(areaIdStr);
    }
  });

  if (dominantAreaId !== -1) {
    const domArea = areas.find(a => a.id === dominantAreaId);
    if (domArea) {
      observations.push(`Goals in your "${domArea.name}" area are receiving the highest level of task completions.`);
    }
  } else if (areas.length > 0) {
    observations.push(`Your focus is distributed evenly. Complete more tasks under specific goals to build domain concentration.`);
  }

  // Observation 3: Inactivity Warning per Area
  areas.forEach(area => {
    const areaGoals = goals.filter(g => g.area_id === area.id);
    const areaTasks = tasks.filter(t => areaGoals.some(g => g.id === t.goal_id));
    
    if (areaGoals.length > 0) {
      let lastActivityTime = new Date(area.created_at).getTime();
      
      // Check last activity from tasks
      areaTasks.forEach(t => {
        const time = new Date(t.created_at).getTime();
        if (time > lastActivityTime) lastActivityTime = time;
      });
      
      // Check last activity from goal creation
      areaGoals.forEach(g => {
        const time = new Date(g.created_at).getTime();
        if (time > lastActivityTime) lastActivityTime = time;
      });

      const daysSinceActivity = Math.floor((Date.now() - lastActivityTime) / (1000 * 60 * 60 * 24));
      if (daysSinceActivity >= 7) {
        observations.push(`⚠️ Focus drift: You haven't updated or completed any actions under ${area.name} goals in ${daysSinceActivity} days.`);
      }
    }
  });

  // Observation 4: Week-over-Week completed tasks comparison
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const lastWeekCompleted = completedTasks.filter(t => new Date(t.created_at) >= twoWeeksAgo && new Date(t.created_at) < oneWeekAgo).length;

  if (completedThisWeek > lastWeekCompleted) {
    observations.push(`📈 Positive momentum: You completed ${completedThisWeek} tasks this week, outpacing the ${lastWeekCompleted} tasks completed last week.`);
  } else if (completedThisWeek < lastWeekCompleted && lastWeekCompleted > 0) {
    observations.push(`💡 Reset opportunity: Task completions dropped from ${lastWeekCompleted} last week to ${completedThisWeek} this week. Try starting tomorrow with one tiny task.`);
  } else if (completedThisWeek > 0) {
    observations.push(`You completed ${completedThisWeek} tasks this week. Keep taking micro-actions to maintain your habits!`);
  }

  // ==========================================
  // CUSTOM SVG ACTIVITY TRENDS AREA CHART PATHS
  // ==========================================
  const maxActions = Math.max(...activityWaveData.map(d => d.count), 5);
  const chartHeight = 150;
  const chartWidth = 500;
  const paddingX = 40;
  const paddingY = 20;

  const points = activityWaveData.map((d, index) => {
    const x = paddingX + (index * (chartWidth - paddingX * 2)) / 6;
    const y = chartHeight - paddingY - (d.count / maxActions) * (chartHeight - paddingY * 2);
    return { x, y, day: d.day, count: d.count };
  });

  // Generate standard line path
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  // Generate closed area fill path
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : "";

  return (
    <main className="min-h-screen bg-black text-white flex">
      <Sidebar activeTab="insights" />

      <section className="flex-1 flex flex-col min-w-0">
        {/* Mobile Navigation */}
        <div className="md:hidden p-4 border-b border-stone/10 bg-[#232419]">
          <Link href="/" className="text-xs font-bold text-rust hover:text-rust/80 flex items-center gap-1.5">
            ← Dashboard
          </Link>
          <h1 className="text-lg font-black mt-2 text-stone">Productivity Insights</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto">
          {/* Header Section */}
          <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="hidden md:block mb-1">
                <Link href="/" className="text-xs font-bold text-rust hover:text-rust/80 transition flex items-center gap-1">
                  ← Back to Dashboard
                </Link>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-stone">Productivity Intelligence</h1>
              <p className="text-stone/50 text-sm">
                A mathematical twin of <span className="capitalize font-semibold text-stone/85">{username}'s</span> focus cycles, health status, and weekly memory.
              </p>
            </div>
          </header>

          {/* Grid Layout Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT MAIN PANEL (Span 2) */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* Behavior Observations (Digital Twin) */}
              <div className="bg-gradient-to-r from-rust/15 to-sage/10 border border-rust/15 p-6 rounded-2xl shadow-sm shadow-[#24251a]/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rust/5 rounded-full filter blur-xl translate-x-12 -translate-y-12 select-none" />
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg leading-none select-none text-rust">🧠</span>
                  <h2 className="text-lg font-black tracking-tight text-stone">Behavior Observations</h2>
                </div>

                <div className="space-y-4">
                  {observations.map((obs, idx) => (
                    <div key={idx} className="flex gap-3 items-start border-l-2 border-rust/30 pl-3.5 py-0.5">
                      <span className="text-sm select-none text-rust shrink-0 mt-0.5">✦</span>
                      <p className="text-xs text-stone/85 leading-relaxed font-medium">{obs}</p>
                    </div>
                  ))}
                  {observations.length === 0 && (
                    <p className="text-xs text-stone/40 py-4 italic text-center">
                      Insufficent activity data to generate dynamic observations. Complete more tasks to activate your digital twin!
                    </p>
                  )}
                </div>
              </div>

              {/* Chart Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Chart A: Daily Activity Trends (Curved Area) */}
                <div className="bg-stone/3 border border-stone/10 p-5 rounded-2xl shadow-sm shadow-[#24251a]/30 flex flex-col">
                  <div className="flex flex-col mb-4">
                    <h3 className="text-sm font-bold text-stone">Activity Wave</h3>
                    <span className="text-[10px] text-stone/40 uppercase tracking-wider font-semibold">Actions completed this week</span>
                  </div>
                  
                  {/* SVG Chart */}
                  <div className="flex-1 w-full h-[160px] flex items-center justify-center">
                    {points.length > 0 ? (
                      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
                        <defs>
                          <linearGradient id="wave-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#D96846" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#2F3020" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#CDCBD6" strokeWidth={1} strokeOpacity={0.06} />
                        <line x1={paddingX} y1={(chartHeight - paddingY * 2) / 2 + paddingY} x2={chartWidth - paddingX} y2={(chartHeight - paddingY * 2) / 2 + paddingY} stroke="#CDCBD6" strokeWidth={1} strokeOpacity={0.06} />
                        <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#CDCBD6" strokeWidth={1} strokeOpacity={0.15} />

                        {/* Chart Area Gradient Fill */}
                        <path d={areaPath} fill="url(#wave-gradient)" />
                        
                        {/* Chart Stroke Line */}
                        <path d={linePath} fill="none" stroke="#D96846" strokeWidth={2.5} strokeLinecap="round" />

                        {/* Chart Points */}
                        {points.map((p, idx) => (
                          <g key={idx}>
                            <circle cx={p.x} cy={p.y} r={4.5} fill="#2F3020" stroke="#D96846" strokeWidth={2} className="transition-all duration-150 hover:r-6 cursor-pointer" />
                            {p.count > 0 && (
                              <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#CDCBD6" fontSize="9" fontWeight="bold">
                                {p.count}
                              </text>
                            )}
                            {/* Day Labels */}
                            <text x={p.x} y={chartHeight - 4} textAnchor="middle" fill="#CDCBD6" fillOpacity={0.4} fontSize="9" fontWeight="semibold">
                              {p.day.substring(0, 3)}
                            </text>
                          </g>
                        ))}
                      </svg>
                    ) : (
                      <p className="text-xs text-stone/40">No chart data available</p>
                    )}
                  </div>
                </div>

                {/* Chart B: Goal Progress & Counts per Area */}
                <div className="bg-stone/3 border border-stone/10 p-5 rounded-2xl shadow-sm shadow-[#24251a]/30 flex flex-col">
                  <div className="flex flex-col mb-5">
                    <h3 className="text-sm font-bold text-stone">Goal Concentration</h3>
                    <span className="text-[10px] text-stone/40 uppercase tracking-wider font-semibold">Active goals and average progress by area</span>
                  </div>

                  <div className="flex-1 flex flex-col justify-center gap-4.5">
                    {areas.map(area => {
                      const areaGoals = goals.filter(g => g.area_id === area.id);
                      const avgProgress = areaGoals.length > 0 
                        ? Math.round(areaGoals.reduce((sum, g) => sum + g.progress, 0) / areaGoals.length)
                        : 0;
                      
                      return (
                        <div key={area.id} className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="font-bold text-stone/90">{area.name}</span>
                            <span className="text-[10px] text-stone/40 font-semibold uppercase">
                              {areaGoals.length} goal{areaGoals.length !== 1 ? "s" : ""} ({avgProgress}% avg)
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-earth/65 rounded-full border border-stone/5 overflow-hidden">
                            <div 
                              className="h-full bg-sage rounded-full transition-all duration-500"
                              style={{ width: `${avgProgress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {areas.length === 0 && (
                      <p className="text-xs text-stone/40 text-center py-6">No areas available. Create one to visualize concentration!</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Long-Term Memory: Weekly Review Summaries */}
              <div className="bg-stone/3 border border-stone/10 p-6 rounded-2xl shadow-sm shadow-[#24251a]/30">
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-lg leading-none select-none text-sage">📖</span>
                  <h2 className="text-base font-bold tracking-tight text-stone">Habit Memory (Recent Reflections)</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-stone/5 pt-4">
                  {/* Wins Summary */}
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-sage flex items-center gap-1.5 shrink-0">
                      <span>✓</span> Cumulative Wins
                    </h3>
                    <ul className="space-y-2.5 flex-1 pr-2">
                      {finalWins.map((win, idx) => (
                        <li key={idx} className="text-xs text-stone/85 leading-relaxed flex gap-2">
                          <span className="text-sage select-none font-bold shrink-0 mt-0.5">•</span>
                          <span className="font-medium">{win}</span>
                        </li>
                      ))}
                      {finalWins.length === 0 && (
                        <p className="text-xs text-stone/30 italic py-4">No wins recorded in your recent weekly reviews.</p>
                      )}
                    </ul>
                  </div>

                  {/* Struggles Summary */}
                  <div className="flex flex-col gap-3 border-t md:border-t-0 md:border-l border-stone/5 pt-4 md:pt-0 md:pl-8">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rust flex items-center gap-1.5 shrink-0">
                      <span>⚡</span> Recurring Struggles
                    </h3>
                    <ul className="space-y-2.5 flex-1">
                      {finalStruggles.map((struggle, idx) => (
                        <li key={idx} className="text-xs text-stone/85 leading-relaxed flex gap-2">
                          <span className="text-rust select-none font-bold shrink-0 mt-0.5">•</span>
                          <span className="font-medium">{struggle}</span>
                        </li>
                      ))}
                      {finalStruggles.length === 0 && (
                        <p className="text-xs text-stone/30 italic py-4">No struggles recorded in your recent weekly reviews.</p>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT SIDEBAR PANEL (Span 1) */}
            <div className="lg:col-span-1 flex flex-col gap-8">
              
              {/* Task Completion Analytics & Circular SVG Gauge */}
              <div className="bg-stone/3 border border-stone/10 p-5 rounded-2xl shadow-sm shadow-[#24251a]/30 flex flex-col items-center">
                <h3 className="text-sm font-bold text-stone text-left w-full mb-5">Completion Analytics</h3>

                {/* SVG Radial Gauge */}
                <div className="relative w-32 h-32 mb-6 select-none shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#2F3020" strokeWidth="6" className="border border-stone/5" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="42" 
                      fill="none" 
                      stroke="#596235" 
                      strokeWidth="6" 
                      strokeLinecap="round" 
                      strokeDasharray="263.89" 
                      strokeDashoffset={263.89 * (1 - completionRate / 100)} 
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-stone tracking-tight">{completionRate}%</span>
                    <span className="text-[8px] text-stone/45 font-bold uppercase tracking-wider">Comp. Rate</span>
                  </div>
                </div>

                <div className="w-full space-y-3.5 border-t border-stone/5 pt-4">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-stone/50 font-semibold">Completed this week</span>
                    <span className="font-extrabold text-stone text-sm">{completedThisWeek} tasks</span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-stone/50 font-semibold">Completed this month</span>
                    <span className="font-extrabold text-stone text-sm">{completedThisMonth} tasks</span>
                  </div>
                </div>
              </div>

              {/* Goal Health Breakdown */}
              <div className="bg-stone/3 border border-stone/10 p-5 rounded-2xl shadow-sm shadow-[#24251a]/30">
                <h3 className="text-sm font-bold text-stone mb-4">Goal Health Tracker</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-earth/40 border border-stone/5 p-3 rounded-xl flex flex-col">
                    <span className="text-[10px] text-stone/45 font-bold uppercase tracking-wider mb-1">Healthy</span>
                    <span className="text-xl font-extrabold text-sage">{healthCounts.Healthy}</span>
                  </div>
                  <div className="bg-earth/40 border border-stone/5 p-3 rounded-xl flex flex-col">
                    <span className="text-[10px] text-stone/45 font-bold uppercase tracking-wider mb-1">At Risk</span>
                    <span className="text-xl font-extrabold text-stone">{healthCounts["At Risk"]}</span>
                  </div>
                  <div className="bg-earth/40 border border-stone/5 p-3 rounded-xl flex flex-col">
                    <span className="text-[10px] text-stone/45 font-bold uppercase tracking-wider mb-1">Stalled</span>
                    <span className="text-xl font-extrabold text-rust">{healthCounts.Stalled}</span>
                  </div>
                  <div className="bg-earth/40 border border-stone/5 p-3 rounded-xl flex flex-col">
                    <span className="text-[10px] text-stone/45 font-bold uppercase tracking-wider mb-1">Abandoned</span>
                    <span className="text-xl font-extrabold text-rust/60">{healthCounts.Abandoned}</span>
                  </div>
                </div>
              </div>

              {/* Neglected Goals Register */}
              <div className="bg-stone/3 border border-stone/10 p-5 rounded-2xl shadow-sm shadow-[#24251a]/30">
                <h3 className="text-sm font-bold text-stone mb-4">Neglected Goals (Reset Required)</h3>
                
                <div className="space-y-3.5">
                  {neglectedGoals.map(goal => (
                    <div key={goal.id} className="border-l-2 border-rust/40 pl-3 py-0.5">
                      <h4 className="text-xs font-bold text-stone/85 truncate">{goal.title}</h4>
                      <div className="flex gap-2 items-center text-[10px] text-stone/40 mt-1 font-semibold">
                        <span className="uppercase text-rust font-bold">{goal.health}</span>
                        <span>•</span>
                        <span>{goal.progress}% progress</span>
                      </div>
                    </div>
                  ))}
                  {neglectedGoals.length === 0 && (
                    <p className="text-xs text-stone/40 italic py-2 text-center bg-earth/20 rounded-lg">
                      Amazing! You have no stalled or abandoned goals. 🎉
                    </p>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
