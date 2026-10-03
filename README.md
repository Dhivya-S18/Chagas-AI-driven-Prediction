# Chagas AI Personal ECG Monitoring

Personal monitoring application built with React/Vite, Express, and MongoDB.

## Current Scope

- Users sign up and log in with bcrypt-hashed passwords and JWT authentication.
- ECG, analysis, alerts, and reports are scoped to the authenticated user's MongoDB ID.
- Live Monitor displays a simulated waveform labeled `DEMO ECG`; it is not saved as sensor data.
- Users can generate a PDF report for a selected date range at any time, with or without alerts.
- Genuine ECG feature extraction and ESP32 connectivity are not implemented. ML inference requires a valid stored feature sequence; no prediction or alert is fabricated.

## Project Structure

- `frontend/` - React/Vite application
- `backend/` - Express API, Mongoose models, and PDF report generation
- `ml/` - reserved placeholder; keep separate ML project files outside this application untouched

## Configuration

Create `backend/.env` from `backend/.env.example` and set `MONGODB_URI` and a strong `JWT_SECRET`. The existing `MONGO_URI` name remains supported for local compatibility. Never commit environment files.

## Run Locally

Start the backend from `backend/` with `npm install` followed by `npm run dev`.

Start the frontend from `frontend/` with `npm install` followed by `npm run dev`.

## Stage 2: ML Service Boundary

Start the separate FastAPI application first from its own project directory:

```powershell
py -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Set `ML_SERVICE_URL=http://127.0.0.1:8000` in `backend/.env`. The React app calls only the MERN API; Express performs the health check and prediction request.

The MERN application does not send raw ECG directly to the ML model. The model requires exactly 10 ordered rows containing these 26 features: `PR_interval_mean`, `PR_interval_std`, `PR_interval_min`, `PR_interval_max`, `QRS_duration_mean`, `QRS_duration_std`, `QRS_duration_min`, `QRS_duration_max`, `QT_interval_mean`, `QT_interval_std`, `QT_interval_min`, `QT_interval_max`, `ST_segment_mean`, `ST_segment_std`, `ST_segment_min`, `ST_segment_max`, `ST_slope_mean`, `ST_slope_std`, `ST_slope_min`, `ST_slope_max`, `HRV_MeanNN`, `HRV_SDNN`, `HRV_RMSSD`, `HRV_pNN50`, `age`, and `is_male`. Experimental peak and beat-window diagnostics exist, but reliable complete ECG feature extraction is not implemented, so DEMO ECG remains visualization-only and cannot be analyzed. ML service availability does not mean an analysis result is available. The separate ML project and ESP32 integration are not modified by this application.

An authenticated `POST /api/ecg/features` accepts raw input in the form `{ "source": "EXTERNAL", "samples": [/* finite raw ECG samples */], "samplingRate": 250 }`. `source` may be `DEMO`, `ESP32`, or `EXTERNAL`; DEMO input is rejected. Processing is experimental, does not persist samples, and currently returns an unavailable result because reliable morphology delineation and a complete 10-row feature sequence are not available. Candidate peaks are marked unvalidated, and HRV stays unavailable for those candidates; neither is sent to the ML service.
