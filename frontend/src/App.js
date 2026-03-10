import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import DiseasePredictor from "./pages/DiseasePredictor";
import PatientMonitoring from "./pages/PatientMonitoring";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-slate-100 to-white">
      <Navbar />
      <div className="mx-auto flex w-full max-w-7xl gap-4 px-4 py-4 md:px-6">
        <Sidebar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/disease-predictor" element={<DiseasePredictor />} />
            <Route path="/patient-monitoring" element={<PatientMonitoring />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
