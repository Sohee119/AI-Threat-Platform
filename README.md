🛡️ AI-Driven Cloud Threat Intelligence Platform
A cloud-native, real-time Threat Intelligence and Security Operations Center (SOC) platform powered by machine learning. It features automated telemetry ingestion, an Isolation Forest anomaly detection engine, interactive threat analytics, and active IP mitigation capabilities.

Key Features

Real-Time ML Anomaly Detection: Utilizes an unsupervised Scikit-Learn Isolation Forest model to evaluate incoming traffic telemetry vectors (status codes, payload sizes, and latency) and flag malicious outliers.

Intelligent Cloud Fallback: Built with automatic model serialization (joblib) and a startup fallback auto-training mechanism to guarantee zero-downtime execution in serverless/cloud environments.

Interactive SOC Dashboard: A modern Next.js interface providing real-time metrics, including Anomaly Ratios, High/Medium severity breakdowns, and total requests scanned.

Visual Threat Analytics: Powered by Recharts to dynamically render traffic distribution charts and track top targeted backend endpoints.

Active IP Mitigation & Firewall: Security analysts can instantly isolate and block suspicious IP addresses directly from the live feed, causing the backend firewall to reject subsequent requests with a 403 Forbidden response.

Tech Stack
Frontend: Next.js (React), Tailwind CSS, Lucide Icons, Recharts (Hosted on Vercel)

Backend: FastAPI (Python), Scikit-Learn, Pandas, NumPy, Joblib, Uvicorn (Hosted on Render)

Architecture: Decoupled REST API communication with in-memory telemetry and threat management.

System Architecture & Workflow
Telemetry Ingestion: Client applications or simulation scripts stream request logs (IP, endpoint, status code, payload size, duration) to the FastAPI backend (/api/ingest).

AI Inference: The Isolation Forest model inspects the telemetry payload in real time to calculate an outlier score.

Threat Logging & Mitigation: If flagged as an anomaly, the event is categorized by severity (HIGH or MEDIUM), logged to the live security feed, and can be actively mitigated via firewall IP isolation.

Getting Started Locally
Prerequisites
Python 3.10+

Node.js 18+

Backend Setup (FastAPI)
Bash
# Clone the repository
git clone https://github.com/Sohee119/AI-Threat-Platform.git
cd AI-Threat-Platform/backend

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --reload --port 8000

Frontend Setup (Next.js)
Bash
# Navigate to the frontend directory
cd ../frontend

# Install dependencies
npm install

# Run the development server
npm run dev

Open http://localhost:3000 in your browser to view the dashboard.

📄 License
This project is open-source and available under the MIT License.
