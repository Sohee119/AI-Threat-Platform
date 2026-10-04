import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import os

def generate_synthetic_logs(num_samples=5000):
    np.random.seed(42)
    
    # Generate normal traffic patterns
    timestamps = pd.date_range(start="2026-10-01", periods=num_samples, freq="min")
    ip_addresses = [f"192.168.1.{np.random.randint(1, 250)}" for _ in range(num_samples)]
    endpoints = np.random.choice(["/api/login", "/api/data", "/api/profile", "/home"], size=num_samples, p=[0.2, 0.4, 0.3, 0.1])
    status_codes = np.random.choice([200, 200, 200, 200, 401, 404, 500], size=num_samples)
    payload_sizes = np.random.normal(loc=500, scale=100, size=num_samples).astype(int) # Average 500 bytes
    durations = np.random.normal(loc=45, scale=10, size=num_samples).astype(int) # Average 45ms

    # Inject intentional anomalies (Simulating brute-force / data exfiltration attacks)
    anomaly_indices = np.random.choice(num_samples, size=int(num_samples * 0.02), replace=False)
    
    for idx in anomaly_indices:
        # Anomalies have massive payloads, unusual error statuses, or high durations
        payload_sizes[idx] = np.random.randint(15000, 50000) 
        durations[idx] = np.random.randint(500, 2000)
        status_codes[idx] = np.random.choice([403, 500, 429])

    df = pd.DataFrame({
        "timestamp": timestamps,
        "ip_address": ip_addresses,
        "endpoint": endpoints,
        "status_code": status_codes,
        "payload_size": payload_sizes,
        "duration_ms": durations
    })
    
    return df

print("Generating synthetic server logs...")
df_logs = generate_synthetic_logs()

# Save a CSV copy for data analysis reference
df_logs.to_csv("server_logs.csv", index=False)
print("Saved raw logs to server_logs.csv")

# Select numerical features for the Machine Learning model
features = df_logs[["status_code", "payload_size", "duration_ms"]]

print("Training Isolation Forest Anomaly Detection Model...")
# contamination=0.02 tells the model we expect roughly 2% of the data to be anomalous threats
model = IsolationForest(contamination=0.02, random_state=42)
model.fit(features)

# Save the trained model to disk so our FastAPI backend can use it instantly
os.makedirs("models", exist_ok=True)
joblib.dump(model, "models/anomaly_detector.pkl")
print("Model trained and saved successfully as 'models/anomaly_detector.pkl'!")