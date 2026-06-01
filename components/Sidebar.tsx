import { useState } from "react";
import Link from "next/link";
import UserProfile from "./Auth/UserProfile";
import FeedbackModal from "./FeedbackModal";

type Tab = {
  id: string;
  label: string;
  href?: string;
};

type SidebarProps = {
  activeTab?: string;
  tabs?: Tab[];
};

export default function Sidebar({ 
  activeTab = "dashboard", 
  tabs = [
    { id: "dashboard", label: "Dashboard", href: "/" },
    { id: "insights", label: "Insights", href: "/insights" },
    { id: "areas", label: "Areas", href: "/areas" },
    { id: "goals", label: "Goals", href: "/goals" },
    { id: "tasks", label: "Tasks", href: "/tasks" },
    { id: "courses", label: "Courses", href: "/courses" },
    { id: "projects", label: "Projects", href: "/projects" },
    { id: "weekly-reviews", label: "Weekly Reviews", href: "/weekly-reviews" },
    { id: "analytics", label: "Analytics", href: "/analytics" },
  ]
}: SidebarProps) {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <aside className="w-64 bg-[#232419] border-r border-stone/10 p-4 hidden md:flex flex-col">
      <h1 className="text-2xl font-extrabold tracking-tight mb-8 text-stone">Echo AI</h1>
      <nav className="flex flex-col gap-2">
        {tabs.map(tab => (
          <Link
            key={tab.id}
            href={tab.href || "/"}
            className={`text-left py-2.5 px-3 transition-all duration-150 text-sm ${
              activeTab === tab.id 
                ? "bg-rust/10 text-rust font-bold border-l-2 border-rust pl-2.5 rounded-r-lg" 
                : "text-stone/70 hover:text-stone hover:bg-stone/5 rounded-lg"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto flex flex-col">
        <button
          onClick={() => setIsFeedbackOpen(true)}
          className="w-full text-center py-2 mb-3.5 text-xs font-bold text-rust bg-rust/5 hover:bg-rust/10 border border-rust/15 hover:border-rust/35 rounded-lg transition-all duration-150 cursor-pointer active:scale-[0.98]"
        >
          💡 Give Feedback
        </button>
        <UserProfile />
        <div className="mt-4 text-xs text-stone/40">
          Stay focused 👀
        </div>
      </div>

      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
      />
    </aside>
  );
}
