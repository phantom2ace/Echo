"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import ProjectCard from "@/components/ProjectCard";
import { getTodayKey } from "@/lib/utils";
import { getProjects, addProject, updateProject, deleteProject, getDailyStats, upsertDailyStats } from "@/lib/supabase-utils";
import type { Project, DailyStats } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectCategory, setNewProjectCategory] = useState("personal");
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [projectsData, statsData] = await Promise.all([
          getProjects(),
          getDailyStats()
        ]);
        setProjects(projectsData);
        setDailyStats(statsData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddProject = async () => {
    if (!newProjectTitle.trim()) return;
    try {
      const added = await addProject(newProjectTitle, newProjectCategory);
      setProjects([added, ...projects]);
      setNewProjectTitle("");
    } catch (error) {
      console.error("Error adding project:", error);
    }
  };

  const handleUpdateProgress = async (id: number, progress: number) => {
    try {
      const now = new Date().toISOString();
      const updated = await updateProject(id, { progress, last_touched: now });
      setProjects(projects.map(p => p.id === id ? updated : p));

      // Update daily stats
      const today = getTodayKey();
      const todayStats = dailyStats.find(s => s.date === today);
      await upsertDailyStats(today, {
        projects_touched: (todayStats?.projects_touched || 0) + 1
      });
      setDailyStats(prev => {
        const todayIdx = prev.findIndex(s => s.date === today);
        if (todayIdx !== -1) {
          const newStats = [...prev];
          newStats[todayIdx] = { ...newStats[todayIdx], projects_touched: newStats[todayIdx].projects_touched + 1 };
          return newStats;
        }
        return [...prev, { date: today, projects_touched: 1, tasks_added: 0, tasks_completed: 0, courses_studied: 0 }];
      });
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  const handleToggleAbandon = async (id: number) => {
    try {
      const project = projects.find(p => p.id === id);
      if (!project) return;

      const isAbandoned = project.status === "abandoned";
      const updated = await updateProject(id, {
        status: isAbandoned ? "active" : "abandoned",
        last_touched: new Date().toISOString()
      });
      setProjects(projects.map(p => p.id === id ? updated : p));
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  const handleDeleteProject = async (id: number) => {
    try {
      await deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </main>
    );
  }

  const activeProjects = projects.filter(p => p.status !== "abandoned");
  const abandonedProjects = projects.filter(p => p.status === "abandoned");

  return (
    <main className="min-h-screen bg-black text-white flex">
      <Sidebar activeTab="projects" />
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
              <Link href="/projects" className="px-3 py-1.5 bg-zinc-900 rounded-lg">Projects</Link>
              <Link href="/weekly-reviews" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Weekly Reviews</Link>
              <Link href="/analytics" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Analytics</Link>
            </nav>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h1 className="text-4xl font-bold mb-6">Projects</h1>

          <div className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Add a project..."
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddProject()}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none"
            />
            <select
              value={newProjectCategory}
              onChange={(e) => setNewProjectCategory(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none"
            >
              <option value="personal">Personal</option>
              <option value="work">Work</option>
              <option value="school">School</option>
            </select>
            <button
              onClick={handleAddProject}
              className="bg-white text-black px-5 rounded-xl font-medium"
            >
              Add
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Active Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeProjects.map(project => (
                <div key={project.id}>
                  <ProjectCard
                    title={project.title}
                    progress={project.progress}
                    category={project.status || "personal"}
                    isAbandoned={false}
                    onDelete={() => handleDeleteProject(project.id)}
                    onToggleAbandon={() => handleToggleAbandon(project.id)}
                    onProgressChange={(p) => handleUpdateProgress(project.id, p)}
                  />
                </div>
              ))}
            </div>
          </div>

          {abandonedProjects.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-red-400">Project Graveyard</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {abandonedProjects.map(project => (
                  <div key={project.id}>
                    <ProjectCard
                      title={project.title}
                      progress={project.progress}
                      category={project.status || "personal"}
                      isAbandoned={true}
                      onDelete={() => handleDeleteProject(project.id)}
                      onToggleAbandon={() => handleToggleAbandon(project.id)}
                      onProgressChange={(p) => handleUpdateProgress(project.id, p)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
