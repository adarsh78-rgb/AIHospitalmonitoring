import React from "react";
import { HeartPulse } from "lucide-react";

function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-7 w-7 text-medical-500" />
          <h1 className="text-lg font-semibold text-slate-900">AI Healthcare Dashboard</h1>
        </div>
        <span className="rounded-full bg-medical-100 px-3 py-1 text-xs font-semibold text-medical-700">
          FastAPI + React
        </span>
      </div>
    </header>
  );
}

export default Navbar;
