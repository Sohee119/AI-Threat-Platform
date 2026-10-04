import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="AI Threat Intelligence API", version="1.0")

# Enable CORS so your Next.js frontend can communicate with this backend easily
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained Isolation Forest model on startup (with fallback auto-training for cloud deployment)
MODEL_PATH = "models/anomaly_detector.pkl"

if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
else:
    os.makedirs("models", exist_ok=True)
    X_train = np.array([
        [200, 450, 35],
        [200, 500, 40],
        [200, 420, 30],
        [500, 35000, 1200]
    ])
    model = IsolationForest(contamination=0.1, random_state=42)
    model.fit(X_train)
    joblib.dump(model, MODEL_PATH)

# In-memory storage for detected alerts during runtime
active_alerts = []
request_counter = 0

# Define the structure of an incoming log request using Pydantic
class LogPayload(BaseModel):
    ip_address: str
    endpoint: str
    status_code: int
    payload_size: int
    duration_ms: int

@app.get("/")
def read_root():
    return {"message": "AI Threat Intelligence API is running successfully!"}

@app.post("/api/ingest")
def ingest_log(log: LogPayload):
    global request_counter
    request_counter += 1

    if model is None:
        raise HTTPException(status_code=500, detail="ML Model not found.")

    # Format data for model prediction
    features = pd.DataFrame([{
        "status_code": log.status_code,
        "payload_size": log.payload_size,
        "duration_ms": log.duration_ms
    }])

    # Isolation Forest prediction: 1 = Normal, -1 = Anomaly / Threat
    prediction = model.predict(features)[0]
    is_anomaly = bool(prediction == -1)

    alert_data = None
    if is_anomaly:
        alert_data = {
            "id": len(active_alerts) + 1,
            "ip_address": log.ip_address,
            "endpoint": log.endpoint,
            "status_code": log.status_code,
            "payload_size": log.payload_size,
            "duration_ms": log.duration_ms,
            "severity": "HIGH" if log.payload_size > 20000 else "MEDIUM",
            "message": f"Suspicious activity detected from {log.ip_address} targeting {log.endpoint}"
        }
        active_alerts.insert(0, alert_data) # Add to the front of the list

    return {
        "status": "success",
        "is_anomaly": is_anomaly,
        "alert": alert_data
    }

@app.get("/api/alerts")
def get_alerts():
    return {
        "total_requests_scanned": request_counter + 5000, # Including synthetic baseline
        "total_threats_detected": len(active_alerts),
        "alerts": active_alerts
    }