import React, { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { Activity, AlertCircle } from "lucide-react";
import PredictionCard from "../components/PredictionCard";
import { predictRisk } from "../services/api";

ChartJS.register(ArcElement, Tooltip, Legend);

const fields = [
  "Respiratory Rate",
  "Diastolic Blood Pressure",
  "Age",
  "Gender",
  "Weight",
  "Height",
  "Derived_HRV",
  "Derived_Pulse_Pressure",
  "Derived_BMI",
  "Derived_MAP"
];

function PatientMonitoring() {
  const [values, setValues] = useState(Array(10).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleChange = (index, value) => {
    const next = [...values];
    next[index] = value;
    setValues(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const parsed = values.map((v) => Number(v));
    if (parsed.some((n) => Number.isNaN(n))) {
      setError("Please provide numeric input for all vital fields.");
      return;
    }

    try {
      setLoading(true);
      const response = await predictRisk(parsed);
      setResult(response.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Risk prediction failed. Check backend server.");
    } finally {
      setLoading(false);
    }
  };

  const gaugeData = useMemo(() => {
    const prob = result?.risk_probability || 0;
    return {
      labels: ["Risk", "Remaining"],
      datasets: [
        {
          data: [prob * 100, (1 - prob) * 100],
          backgroundColor: [
            prob >= 0.7 ? "#dc2626" : prob >= 0.35 ? "#f59e0b" : "#16a34a",
            "#e2e8f0"
          ],
          borderWidth: 0,
          circumference: 180,
          rotation: 270,
          cutout: "70%"
        }
      ]
    };
  }, [result]);

  const gaugeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    }
  };

  return (
    <div className="space-y-6">
      <PredictionCard title="Patient Monitoring">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          {fields.map((label, index) => (
            <div key={label}>
              <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
              <input
                type="number"
                step="any"
                value={values[index]}
                onChange={(e) => handleChange(index, e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
              />
            </div>
          ))}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-medical-500 px-4 py-2 font-semibold text-white transition hover:bg-medical-600 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? <span className="loading-spinner" /> : <Activity className="h-4 w-4" />} Predict Risk
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </PredictionCard>

      {result && (
        <PredictionCard title="Risk Analysis">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Risk Probability</p>
              <p className="text-2xl font-bold text-slate-900">{(result.risk_probability * 100).toFixed(2)}%</p>
              <p className="text-xs font-semibold uppercase text-slate-500">Risk Level</p>
              <p
                className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                  result.risk_level === "High"
                    ? "bg-red-100 text-red-700"
                    : result.risk_level === "Medium"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {result.risk_level}
              </p>
            </div>

            <div className="relative h-56 rounded-xl bg-slate-50 p-4">
              <Doughnut data={gaugeData} options={gaugeOptions} />
              <div className="pointer-events-none absolute inset-0 top-1/2 flex items-center justify-center">
                <span className="mt-10 text-lg font-semibold text-slate-700">{(result.risk_probability * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </PredictionCard>
      )}
    </div>
  );
}

export default PatientMonitoring;
