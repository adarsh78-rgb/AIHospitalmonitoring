import React, { useState } from "react";
import { AlertCircle, Pill } from "lucide-react";
import PredictionCard from "../components/PredictionCard";
import { predictDisease } from "../services/api";

function DiseasePredictor() {
  const [symptomsInput, setSymptomsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handlePredict = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const symptoms = symptomsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!symptoms.length) {
      setError("Please enter at least one symptom.");
      return;
    }

    try {
      setLoading(true);
      const response = await predictDisease(symptoms);
      setResult(response.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Prediction failed. Check backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PredictionCard title="Disease Predictor">
        <form onSubmit={handlePredict} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700" htmlFor="symptoms">
            Symptoms (comma-separated)
          </label>
          <input
            id="symptoms"
            type="text"
            value={symptomsInput}
            onChange={(e) => setSymptomsInput(e.target.value)}
            placeholder="fever,cough,headache"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-medical-500 px-4 py-2 font-semibold text-white transition hover:bg-medical-600 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? <span className="loading-spinner" /> : <Pill className="h-4 w-4" />} Predict
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </PredictionCard>

      {result && (
        <PredictionCard title="Prediction Result">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Predicted Disease</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{result.disease}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Recommended Medicine</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{result.medicine}</p>
            </div>
          </div>
        </PredictionCard>
      )}
    </div>
  );
}

export default DiseasePredictor;
