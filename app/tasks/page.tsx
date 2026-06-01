"use client";

import { Suspense } from "react";
import TasksPageContent from "./tasks-content";

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center"><p className="text-xl">Loading...</p></div>}>
      <TasksPageContent />
    </Suspense>
  );
}
