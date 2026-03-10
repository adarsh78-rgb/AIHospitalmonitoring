import React from "react";

function PredictionCard({ title, children }) {
  return (
    <section className="glass-card p-5">
      <h3 className="mb-3 text-lg font-semibold text-slate-900">{title}</h3>
      <div className="text-sm text-slate-700">{children}</div>
    </section>
  );
}

export default PredictionCard;
