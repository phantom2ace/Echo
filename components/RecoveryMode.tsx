"use client";

import { useState, useEffect } from "react";
import type { Task } from "@/lib/types";

type RecoveryModeProps = {
  tasks: Task[];
  onClose: () => void;
  onCompleteTask: (taskId: number) => void;
};

export default function RecoveryMode({ tasks, onClose, onCompleteTask }: RecoveryModeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timer, setTimer] = useState(25 * 60); // 25 minutes

  const activeTasks = tasks.filter(t => !t.completed);
  const selectedTask = activeTasks[0];

  const steps = selectedTask ? [
    `Step 1: Read "${selectedTask.title}" carefully`,
    "Step 2: Break it down into the smallest possible next action",
    "Step 3: Do that one small action (25 min focus)",
    "Step 4: Mark as done and celebrate! 🎉"
  ] : [];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!selectedTask) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-zinc-900 p-8 rounded-2xl max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">No Tasks Found!</h2>
          <p className="text-zinc-400 mb-6">Add a task first to use Recovery Mode.</p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-medium"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 p-8 rounded-2xl max-w-lg w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">🧘 Smart Recovery Mode</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="bg-zinc-800 p-4 rounded-xl mb-6">
          <h3 className="font-semibold text-lg mb-2">Your Focus Task:</h3>
          <p className="text-xl">{selectedTask.title}</p>
        </div>

        <div className="space-y-4 mb-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl ${
                idx === currentStep ? "bg-blue-900/50 border border-blue-700" :
                idx < currentStep ? "bg-green-900/30 text-zinc-500" : "bg-zinc-800"
              }`}
            >
              <p>{step}</p>
            </div>
          ))}
        </div>

        <div className="text-center mb-6">
          <div className="text-5xl font-mono font-bold mb-4">{formatTime(timer)}</div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-medium"
            >
              {isTimerRunning ? "Pause" : "Start Focus Timer"}
            </button>
            {currentStep < steps.length - 1 && (
              <button
                onClick={() => setCurrentStep(c => c + 1)}
                className="bg-zinc-700 hover:bg-zinc-600 px-6 py-3 rounded-xl font-medium"
              >
                Next Step
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            onCompleteTask(selectedTask.id);
            onClose();
          }}
          className="w-full bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-medium"
        >
          Mark Task as Complete 🎉
        </button>
      </div>
    </div>
  );
}
