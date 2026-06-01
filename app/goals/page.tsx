"use client";

import { Suspense } from "react";
import GoalsPageContent from "./goals-content";

export default function GoalsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center"><p className="text-xl">Loading...</p></div>}>
      <GoalsPageContent />
    </Suspense>
  );
}
