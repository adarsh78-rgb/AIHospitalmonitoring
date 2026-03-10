import React from "react";
import { Activity, ArrowRight, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";

const cards = [
  {
    title: "Disease Predictor",
    description: "Predict probable disease and suggest medicine from symptom inputs.",
    to: "/disease-predictor",
    icon: Stethoscope
  },
  {
    title: "Patient Monitoring",
    description: "Assess patient risk level from vital signs using deep learning.",
    to: "/patient-monitoring",
    icon: Activity
  }
];

function Home() {
  return (
    <div className="space-y-6">
      <section className="glass-card p-6 md:p-8">
        <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Welcome to the AI Healthcare System</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          This platform combines machine learning and deep learning tools to support clinical triage,
          disease prediction, and patient risk monitoring.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {cards.map(({ title, description, to, icon: Icon }) => (
          <Link key={title} to={to} className="glass-card group p-6 transition hover:-translate-y-1 hover:shadow-lg">
            <div className="mb-4 inline-flex rounded-xl bg-medical-100 p-3 text-medical-600">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm text-slate-600">{description}</p>
            <div className="mt-4 flex items-center text-sm font-medium text-medical-600">
              Open tool <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

export default Home;
