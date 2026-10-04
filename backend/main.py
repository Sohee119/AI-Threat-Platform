import numpy as np
from sklearn.ensemble import IsolationForest

# Load the trained Isolation Forest model on startup (with fallback auto-training)
MODEL_PATH = "models/anomaly_detector.pkl"

if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
else:
    # Fallback for cloud deployment if pkl wasn't committed
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