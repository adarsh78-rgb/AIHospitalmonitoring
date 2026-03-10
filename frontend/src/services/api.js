import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json"
  }
});

export const predictDisease = (symptoms) => api.post("/predict-disease", { symptoms });
export const predictRisk = (vitals) => api.post("/predict-risk", { vitals });

export default api;
