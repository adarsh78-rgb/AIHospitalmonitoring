import React from "react";
import { Activity, Home, Stethoscope } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/disease-predictor", icon: Stethoscope, label: "Disease Predictor" },
  { to: "/patient-monitoring", icon: Activity, label: "Patient Monitoring" }
];

function Sidebar() {
  return (
    <aside className="glass-card hidden h-fit w-64 p-4 md:block">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Navigation</p>
      <nav className="space-y-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-medical-500 text-white shadow"
                  : "text-slate-700 hover:bg-slate-100"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
