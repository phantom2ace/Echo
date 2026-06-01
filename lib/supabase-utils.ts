import { supabase } from "./supabase";
import type { Task, Course, Project, DailyStats, Area, Goal, WeeklyReview, ActivityLog, ActivityActionType, ActivityEntityType, GoalHealth } from "./types";

// Helper to get current user
async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("User not authenticated");
  return user.id;
}

// Helper to get week start (Monday)
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  return new Date(d.setDate(diff));
}

// Goal health calculation
export function calculateGoalHealth(goal: Goal, tasks: Task[]): GoalHealth {
  const goalTasks = tasks.filter(t => t.goal_id === goal.id);
  const completedTasks = goalTasks.filter(t => t.completed);
  
  // Find last activity (task completed or created, or goal created)
  const lastActivityDates: Date[] = [new Date(goal.created_at)];
  goalTasks.forEach(task => {
    lastActivityDates.push(new Date(task.created_at));
    if (task.completed) {
      // If we track task completion date, we'd use that - for now, use created_at
      lastActivityDates.push(new Date(task.created_at));
    }
  });
  
  const lastActivity = new Date(Math.max(...lastActivityDates.map(d => d.getTime())));
  const daysSinceActivity = Math.floor((new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceActivity < 7) return "Healthy";
  if (daysSinceActivity < 14) return "At Risk";
  if (daysSinceActivity < 30) return "Stalled";
  return "Abandoned";
}

// Tasks
export async function getTasks(): Promise<Task[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("tasks").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getTasksByGoalId(goalId: number): Promise<Task[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("tasks").select("*").eq("goal_id", goalId).eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addTask(title: string, goalId?: number): Promise<Task> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("tasks").insert([{ title, goal_id: goalId, user_id: userId }]).select().single();
  if (error) throw error;
  return data;
}

export async function updateTask(id: number, updates: Partial<Task>) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("tasks").update(updates).eq("id", id).eq("user_id", userId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id: number) {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

// Courses
export async function getCourses(): Promise<Course[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("courses").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addCourse(name: string, examDate?: string, confidence?: number): Promise<Course> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("courses").insert([{ name, exam_date: examDate, confidence, user_id: userId }]).select().single();
  if (error) throw error;
  return data;
}

export async function updateCourse(id: number, updates: Partial<Course>) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("courses").update(updates).eq("id", id).eq("user_id", userId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCourse(id: number) {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("courses").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

// Projects
export async function getProjects(): Promise<Project[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("projects").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addProject(title: string, status?: string): Promise<Project> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("projects").insert([{ title, status, user_id: userId }]).select().single();
  if (error) throw error;
  return data;
}

export async function updateProject(id: number, updates: Partial<Project>) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("projects").update(updates).eq("id", id).eq("user_id", userId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProject(id: number) {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("projects").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

// Daily Stats
export async function getDailyStats(): Promise<DailyStats[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("daily_stats").select("*").eq("user_id", userId).order("date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function upsertDailyStats(date: string, updates: Partial<DailyStats>) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("daily_stats").upsert({ date, ...updates, user_id: userId }, { onConflict: "date" }).select().single();
  if (error) throw error;
  return data;
}

// Areas
export async function getAreas(): Promise<Area[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("areas").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addArea(name: string, type?: string, color?: string): Promise<Area> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("areas").insert([{ name, type, color, user_id: userId }]).select().single();
  if (error) throw error;
  return data;
}

export async function updateArea(id: number, updates: Partial<Area>) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("areas").update(updates).eq("id", id).eq("user_id", userId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteArea(id: number) {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("areas").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

// Goals
export async function getGoals(): Promise<Goal[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getGoalsByAreaId(areaId: number): Promise<Goal[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("goals").select("*").eq("area_id", areaId).eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addGoal(areaId: number, title: string, progress?: number, targetDate?: string, goalType?: string): Promise<Goal> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("goals").insert([{ area_id: areaId, title, progress, target_date: targetDate, goal_type: goalType, user_id: userId }]).select().single();
  if (error) throw error;
  return data;
}

export async function updateGoal(id: number, updates: Partial<Goal>) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("goals").update(updates).eq("id", id).eq("user_id", userId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteGoal(id: number) {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("goals").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

// Weekly Reviews
export async function getWeeklyReviews(): Promise<WeeklyReview[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("weekly_reviews").select("*").eq("user_id", userId).order("week_start", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getWeeklyReviewByWeekStart(weekStart: string): Promise<WeeklyReview | null> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("weekly_reviews").select("*").eq("week_start", weekStart).eq("user_id", userId).single();
  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

export async function addWeeklyReview(review: Omit<WeeklyReview, "id" | "created_at" | "user_id">): Promise<WeeklyReview> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("weekly_reviews").insert([{ ...review, user_id: userId }]).select().single();
  if (error) throw error;
  return data;
}

export async function updateWeeklyReview(id: number, updates: Partial<WeeklyReview>) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("weekly_reviews").update(updates).eq("id", id).eq("user_id", userId).select().single();
  if (error) throw error;
  return data;
}

// Activity Log
export async function getActivityLog(limit: number = 50): Promise<ActivityLog[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("activity_log").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data || [];
}

export async function addActivityLog(
  actionType: ActivityActionType,
  entityType: ActivityEntityType,
  entityId: number
): Promise<ActivityLog> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from("activity_log").insert([{
    action_type: actionType,
    entity_type: entityType,
    entity_id: entityId,
    user_id: userId
  }]).select().single();
  if (error) throw error;
  return data;
}
