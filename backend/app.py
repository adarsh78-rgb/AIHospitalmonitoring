import os
import pickle
import io
from typing import Any, Dict, List

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    import torch
except Exception:  # pragma: no cover
    torch = None


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ML_MODEL_PATH = os.path.join(BASE_DIR, "ml.pkl")
DL_MODEL_PATH = os.path.join(BASE_DIR, "deeplearning.pkl")

app = FastAPI(title="AI Healthcare API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ml_model: Any = None
dl_model: Any = None


class RiskLSTMTransformer(torch.nn.Module):
    def __init__(self, input_size: int = 9, hidden_size: int = 128, num_layers: int = 2) -> None:
        super().__init__()
        self.lstm = torch.nn.LSTM(
            input_size=input_size, hidden_size=hidden_size, num_layers=num_layers, batch_first=True
        )
        enc_layer = torch.nn.TransformerEncoderLayer(
            d_model=hidden_size, nhead=8, dim_feedforward=2048, batch_first=True
        )
        self.transformer = torch.nn.TransformerEncoder(enc_layer, num_layers=2)
        self.fc = torch.nn.Linear(hidden_size, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x.unsqueeze(1)
        lstm_out, _ = self.lstm(x)
        transformed = self.transformer(lstm_out)
        logits = self.fc(transformed[:, -1, :])
        return torch.sigmoid(logits)


DEFAULT_MEDICINE_MAP = {
    "flu": "Paracetamol + Rest + Hydration",
    "common cold": "Antihistamine + Steam Inhalation",
    "covid": "Consult physician, supportive care",
    "migraine": "Sumatriptan / NSAIDs (as prescribed)",
    "diabetes": "Metformin (as prescribed)",
    "hypertension": "ACE inhibitors (as prescribed)",
}


class DiseasePredictRequest(BaseModel):
    symptoms: List[str] = Field(default_factory=list)


class RiskPredictRequest(BaseModel):
    vitals: List[float]


class DiseasePredictResponse(BaseModel):
    disease: str
    medicine: str


class RiskPredictResponse(BaseModel):
    risk_probability: float
    risk_level: str


@app.on_event("startup")
def load_models() -> None:
    global ml_model, dl_model

    if not os.path.exists(ML_MODEL_PATH):
        raise RuntimeError(f"ml.pkl not found at {ML_MODEL_PATH}")
    if not os.path.exists(DL_MODEL_PATH):
        raise RuntimeError(f"deeplearning.pkl not found at {DL_MODEL_PATH}")

    with open(ML_MODEL_PATH, "rb") as f:
        ml_model = pickle.load(f)

    try:
        with open(DL_MODEL_PATH, "rb") as f:
            dl_model = pickle.load(f)
    except RuntimeError as exc:
        if "Attempting to deserialize object on a CUDA device" in str(exc) and torch is not None:
            torch_load = torch.load
            original_loader = getattr(torch.storage, "_load_from_bytes", None)

            def _cpu_load_from_bytes(b: bytes) -> Any:
                return torch_load(io.BytesIO(b), map_location="cpu")

            try:
                torch.storage._load_from_bytes = _cpu_load_from_bytes
                with open(DL_MODEL_PATH, "rb") as f:
                    dl_model = pickle.load(f)
            finally:
                if original_loader is not None:
                    torch.storage._load_from_bytes = original_loader
        else:
            raise


def _safe_to_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except Exception:
        return default


def _predict_disease_and_medicine(symptoms: List[str]) -> Dict[str, str]:
    if ml_model is None:
        raise HTTPException(status_code=500, detail="Disease model is not loaded")

    clean_symptoms = [s.strip().lower() for s in symptoms if isinstance(s, str) and s.strip()]
    if not clean_symptoms:
        raise HTTPException(status_code=400, detail="At least one symptom is required")

    joined = ",".join(clean_symptoms)

    disease = "Unknown"
    medicine = "Consult a physician for medication guidance"

    if isinstance(ml_model, dict):
        try:
            vectorizer = ml_model["vectorizer"]
            disease_model = ml_model["disease_model"]
            encoder = ml_model.get("disease_encoder")
            medicine_map = ml_model.get("medicine_dict", {})

            X = vectorizer.transform([" ".join(clean_symptoms)])
            pred = disease_model.predict(X)
            disease = str(pred[0])
            if encoder is not None:
                disease = str(encoder.inverse_transform([pred[0]])[0])
            medicine = str(medicine_map.get(disease, medicine_map.get(disease.lower(), medicine)))
            return {"disease": disease, "medicine": medicine}
        except Exception:
            pass

    # Try common patterns for sklearn/pipeline/custom models.
    prediction = None
    predict_errors = []

    candidate_inputs = [
        [joined],
        [" ".join(clean_symptoms)],
        [clean_symptoms],
        [clean_symptoms, joined],
    ]

    for model_input in candidate_inputs:
        try:
            if hasattr(ml_model, "predict"):
                prediction = ml_model.predict(model_input)
                break
        except Exception as exc:
            predict_errors.append(str(exc))

    if prediction is None and callable(ml_model):
        try:
            prediction = ml_model(clean_symptoms)
        except Exception as exc:
            predict_errors.append(str(exc))

    if prediction is None:
        raise HTTPException(
            status_code=500,
            detail=f"Disease prediction failed. Details: {' | '.join(predict_errors[:3])}",
        )

    # Normalize model output.
    if isinstance(prediction, dict):
        disease = str(prediction.get("disease", disease))
        medicine = str(prediction.get("medicine", medicine))
    elif isinstance(prediction, (list, tuple, np.ndarray)):
        if len(prediction) > 0:
            first = prediction[0]
            if isinstance(first, dict):
                disease = str(first.get("disease", disease))
                medicine = str(first.get("medicine", medicine))
            elif isinstance(first, (list, tuple)) and len(first) >= 2:
                disease = str(first[0])
                medicine = str(first[1])
            else:
                disease = str(first)
    else:
        disease = str(prediction)

    if medicine.startswith("Consult"):
        disease_key = disease.strip().lower()
        medicine = DEFAULT_MEDICINE_MAP.get(disease_key, medicine)

    return {"disease": disease, "medicine": medicine}


def _predict_risk(vitals: List[float]) -> Dict[str, Any]:
    if dl_model is None:
        raise HTTPException(status_code=500, detail="Risk model is not loaded")

    if len(vitals) != 10:
        raise HTTPException(status_code=400, detail="vitals must contain exactly 10 numeric values")

    x_values = [_safe_to_float(v) for v in vitals]
    x = np.array([x_values], dtype=np.float32)
    probability = None
    errors = []

    if isinstance(dl_model, dict) and torch is not None:
        try:
            model_state = dl_model.get("model_state")
            scaler = dl_model.get("scaler")
            feature_count = len(dl_model.get("features", []))
            if feature_count == 9 and len(x_values) == 10:
                # Drop Gender to match trained feature set.
                x_values = x_values[:3] + x_values[4:]
            scaled = scaler.transform([x_values]) if scaler is not None else [x_values]
            tensor_x = torch.tensor(scaled, dtype=torch.float32)

            model = RiskLSTMTransformer(input_size=len(x_values))
            model.load_state_dict(model_state)
            model.eval()
            with torch.no_grad():
                out = model(tensor_x).reshape(-1)
            probability = float(out[0].item())
        except Exception as exc:
            errors.append(str(exc))

    # sklearn-like API
    if hasattr(dl_model, "predict_proba"):
        try:
            proba = dl_model.predict_proba(x)
            probability = float(proba[0][1] if np.ndim(proba) > 1 else proba[0])
        except Exception as exc:
            errors.append(str(exc))

    if probability is None and hasattr(dl_model, "predict"):
        try:
            pred = dl_model.predict(x)
            pred_val = pred[0] if isinstance(pred, (list, tuple, np.ndarray)) else pred
            pred_float = _safe_to_float(pred_val)
            probability = pred_float if 0.0 <= pred_float <= 1.0 else (1.0 if pred_float > 0 else 0.0)
        except Exception as exc:
            errors.append(str(exc))

    # torch model fallback
    if probability is None and torch is not None:
        try:
            tensor_x = torch.tensor(x, dtype=torch.float32)
            if hasattr(dl_model, "eval"):
                dl_model.eval()
            with torch.no_grad():
                out = dl_model(tensor_x)
            out_np = out.detach().cpu().numpy().reshape(-1)
            raw = float(out_np[0])
            probability = raw if 0.0 <= raw <= 1.0 else 1.0 / (1.0 + np.exp(-raw))
        except Exception as exc:
            errors.append(str(exc))

    if probability is None:
        raise HTTPException(
            status_code=500,
            detail=f"Risk prediction failed. Details: {' | '.join(errors[:3])}",
        )

    probability = max(0.0, min(1.0, float(probability)))

    if probability < 0.35:
        level = "Low"
    elif probability < 0.7:
        level = "Medium"
    else:
        level = "High"

    return {"risk_probability": round(probability, 4), "risk_level": level}


@app.get("/")
def health_check() -> Dict[str, str]:
    return {"status": "ok", "message": "AI Healthcare API is running"}


@app.post("/predict-disease", response_model=DiseasePredictResponse)
def predict_disease(req: DiseasePredictRequest) -> Dict[str, str]:
    return _predict_disease_and_medicine(req.symptoms)


@app.post("/predict-risk", response_model=RiskPredictResponse)
def predict_risk(req: RiskPredictRequest) -> Dict[str, Any]:
    return _predict_risk(req.vitals)
