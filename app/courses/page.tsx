"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import CourseCard from "@/components/CourseCard";
import { getTodayKey } from "@/lib/utils";
import { getCourses, addCourse, updateCourse, deleteCourse, getDailyStats, upsertDailyStats } from "@/lib/supabase-utils";
import type { Course, DailyStats } from "@/lib/types";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseExamDate, setNewCourseExamDate] = useState("");
  const [newCourseConfidence, setNewCourseConfidence] = useState("50");
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [coursesData, statsData] = await Promise.all([
          getCourses(),
          getDailyStats()
        ]);
        setCourses(coursesData);
        setDailyStats(statsData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddCourse = async () => {
    if (!newCourseName.trim()) return;
    try {
      const confidenceVal = parseInt(newCourseConfidence);
      const added = await addCourse(
        newCourseName, 
        newCourseExamDate || undefined, 
        isNaN(confidenceVal) ? 50 : confidenceVal
      );
      setCourses([added, ...courses]);
      setNewCourseName("");
      setNewCourseExamDate("");
    } catch (error) {
      console.error("Error adding course:", error);
    }
  };

  const handleUpdateProgress = async (id: number, progress: number) => {
    try {
      const course = courses.find(c => c.id === id);
      if (!course) return;

      const updated = await updateCourse(id, { progress });
      setCourses(courses.map(c => c.id === id ? updated : c));

      // Update daily stats
      const today = getTodayKey();
      const todayStats = dailyStats.find(s => s.date === today);
      await upsertDailyStats(today, {
        courses_studied: (todayStats?.courses_studied || 0) + 1
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

  const handleDeleteCourse = async (id: number) => {
    try {
      await deleteCourse(id);
      setCourses(courses.filter(c => c.id !== id));
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex">
      <Sidebar activeTab="courses" />
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
              <Link href="/courses" className="px-3 py-1.5 bg-zinc-900 rounded-lg">Courses</Link>
              <Link href="/tasks" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Tasks</Link>
              <Link href="/projects" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Projects</Link>
              <Link href="/weekly-reviews" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Weekly Reviews</Link>
              <Link href="/analytics" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Analytics</Link>
            </nav>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h1 className="text-4xl font-bold mb-6">Courses</h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Course Name</label>
              <input
                type="text"
                placeholder="e.g. CS101, Advanced Mathematics"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none text-zinc-100 placeholder-zinc-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Exam Date</label>
              <input
                type="date"
                value={newCourseExamDate}
                onChange={(e) => setNewCourseExamDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none text-zinc-100 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Confidence Level</label>
              <select
                value={newCourseConfidence}
                onChange={(e) => setNewCourseConfidence(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none text-zinc-100 cursor-pointer"
              >
                <option value="0">0% Confidence</option>
                <option value="25">25% Confidence</option>
                <option value="50">50% Confidence</option>
                <option value="75">75% Confidence</option>
                <option value="100">100% Confidence</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleAddCourse}
            className="bg-white text-black px-5 py-3 rounded-xl font-medium mb-8 cursor-pointer hover:bg-zinc-200 transition active:scale-95"
          >
            Add Course
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map(course => (
              <div key={course.id}>
                <CourseCard
                  name={course.name}
                  progress={course.progress}
                  confidence={course.confidence}
                  examDate={course.exam_date}
                  onDelete={() => handleDeleteCourse(course.id)}
                  onProgressChange={(p) => handleUpdateProgress(course.id, p)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
