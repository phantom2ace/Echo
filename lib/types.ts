export type Area = {
  id: number;
  user_id?: string;
  name: string;
  type?: string;
  color?: string;
  created_at: string;
};

export type GoalHealth = "Healthy" | "At Risk" | "Stalled" | "Abandoned";

export type Goal = {
  id: number;
  user_id?: string;
  area_id: number;
  title: string;
  progress: number;
  target_date?: string;
  goal_type?: string;
  created_at: string;
  health?: GoalHealth;
};

export type Task = {
  id: number;
  user_id?: string;
  goal_id?: number;
  title: string;
  completed: boolean;
  created_at: string;
};

export type WeeklyReview = {
  id: number;
  user_id?: string;
  week_start: string;
  wins?: string;
  struggles?: string;
  next_focus?: string;
  created_at: string;
};

export type ActivityActionType = 
  | "Created Goal"
  | "Updated Goal Progress"
  | "Deleted Goal"
  | "Created Task"
  | "Completed Task"
  | "Reopened Task"
  | "Deleted Task"
  | "Created Course"
  | "Updated Course"
  | "Deleted Course"
  | "Created Project"
  | "Updated Project"
  | "Deleted Project"
  | "Created Weekly Review"
  | "Updated Weekly Review";

export type ActivityEntityType = 
  | "Goal"
  | "Task"
  | "Course"
  | "Project"
  | "WeeklyReview";

export type ActivityLog = {
  id: number;
  user_id?: string;
  action_type: ActivityActionType;
  entity_type: ActivityEntityType;
  entity_id: number;
  created_at: string;
};

export type Course = {
  id: number;
  user_id?: string;
  name: string;
  progress: number;
  confidence: number;
  exam_date?: string;
  created_at: string;
};

export type Project = {
  id: number;
  user_id?: string;
  title: string;
  status?: string;
  progress: number;
  last_touched?: string;
  abandonment_reason?: string;
  created_at: string;
};

export type DailyStats = {
  id?: number;
  user_id?: string;
  date: string;
  tasks_completed: number;
  tasks_added: number;
  courses_studied: number;
  projects_touched: number;
};

export type AIInsight = {
  id: number;
  text: string;
  type: "positive" | "warning" | "suggestion";
  created_at: number;
};
