import type { Task, Course, DailyStats } from "./types";

export const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setLocalStorage = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
};

export const getTodayKey = () => new Date().toISOString().split("T")[0];

export const calculateFocusScore = (
  tasks: Task[],
  courses: Course[],
  dailyStats: DailyStats[]
): number => {
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

export const calculateStreak = (
  dailyStats: DailyStats[],
  type: "tasks" | "courses" | "all" = "all"
): number => {
  let count = 0;
  const today = new Date();
  
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateKey = checkDate.toISOString().split("T")[0];
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
