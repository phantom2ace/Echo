"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { getAreas, addArea, deleteArea, getGoalsByAreaId } from "@/lib/supabase-utils";
import type { Area, Goal } from "@/lib/types";

interface AreaWithStats extends Area {
  goals: Goal[];
  totalGoals: number;
  averageProgress: number;
}

export default function AreasPage() {
  const [areas, setAreas] = useState<AreaWithStats[]>([]);
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaType, setNewAreaType] = useState("");
  const [newAreaColor, setNewAreaColor] = useState("#60a5fa");
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const areasData = await getAreas();
        const areasWithStats: AreaWithStats[] = await Promise.all(
          areasData.map(async (area) => {
            const goals = await getGoalsByAreaId(area.id);
            const totalGoals = goals.length;
            const averageProgress = totalGoals > 0 
              ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / totalGoals)
              : 0;
            return { ...area, goals, totalGoals, averageProgress };
          })
        );
        setAreas(areasWithStats);
      } catch (error) {
        console.error("Error loading areas:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddArea = async () => {
    if (!newAreaName.trim()) return;
    try {
      const added = await addArea(newAreaName, newAreaType || undefined, newAreaColor);
      setAreas([{ ...added, goals: [], totalGoals: 0, averageProgress: 0 }, ...areas]);
      setNewAreaName("");
      setNewAreaType("");
    } catch (error) {
      console.error("Error adding area:", error);
    }
  };

  const handleDeleteArea = async (id: number) => {
    try {
      await deleteArea(id);
      setAreas(areas.filter(area => area.id !== id));
    } catch (error) {
      console.error("Error deleting area:", error);
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
      <Sidebar activeTab="areas" />
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
              <Link href="/areas" className="px-3 py-1.5 bg-zinc-900 rounded-lg">Areas</Link>
              <Link href="/goals" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Goals</Link>
              <Link href="/tasks" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Tasks</Link>
              <Link href="/courses" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Courses</Link>
              <Link href="/projects" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Projects</Link>
              <Link href="/analytics" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg">Analytics</Link>
            </nav>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h1 className="text-4xl font-bold mb-8">Areas</h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
            <input
              type="text"
              placeholder="Area name (e.g. Career, Health)"
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddArea()}
              className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none"
            />
            <input
              type="text"
              placeholder="Type (optional)"
              value={newAreaType}
              onChange={(e) => setNewAreaType(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 outline-none"
            />
            <input
              type="color"
              value={newAreaColor}
              onChange={(e) => setNewAreaColor(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-2 h-12"
            />
          </div>
          <button
            onClick={handleAddArea}
            className="bg-white text-black px-5 py-3 rounded-xl font-medium mb-8"
          >
            Add Area
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {areas.map(area => (
              <Link
                key={area.id}
                href={`/areas/${area.id}`}
                className="bg-zinc-900 rounded-2xl p-6 border-l-4 transition hover:border-l-6 cursor-pointer block"
                style={{ borderLeftColor: area.color || "#60a5fa" }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{area.name}</h3>
                    {area.type && (
                      <span className="text-sm text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
                        {area.type}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteArea(area.id);
                    }}
                    className="text-zinc-500 hover:text-red-400 transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-zinc-400 mb-1">{area.totalGoals} goal{area.totalGoals !== 1 ? "s" : ""}</p>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400">Progress</span>
                    <span>{area.averageProgress}%</span>
                  </div>
                  <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${area.averageProgress}%` }}
                    />
                  </div>
                </div>

                <span className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                  View Goals →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
