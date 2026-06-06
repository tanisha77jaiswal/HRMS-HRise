# HRise ML — Hiring Prediction Microservice

A standalone Python ML microservice for predicting hiring probability using a **Random Forest Classifier** trained on historical hiring data.

## Architecture

```
React Frontend → Node.js Backend API → Python ML Service → Random Forest Model
```

## Project Structure

```
ml-service/
├── api/
│   └── app.py              # Flask API server (POST /predict, POST /batch-predict)
├── model/
│   ├── hiring_model.pkl     # Trained Random Forest model (generated)
│   └── label_encoders.pkl   # Serialized label encoders (generated)
├── training/
│   ├── train_model.py       # Training pipeline script
│   └── hiring_dataset.csv   # 200-row synthetic hiring dataset
├── requirements.txt         # Python dependencies
└── README.md
```

## Quick Start

### 1. Install Dependencies

```bash
cd ml-service
pip install -r requirements.txt
```

### 2. Train the Model

```bash
python training/train_model.py
```

This will:
- Load `hiring_dataset.csv`
- Encode categorical features
- Train a Random Forest Classifier (200 estimators)
- Save model to `model/hiring_model.pkl`
- Save encoders to `model/label_encoders.pkl`
- Print accuracy, classification report, and feature importances

### 3. Start the API

```bash
python api/app.py
```

Server starts at `http://localhost:5050`

## API Endpoints

### `GET /health`

Health check.

### `POST /predict`

Single candidate prediction.

**Request:**
```json
{
  "resumeScore": 85,
  "interviewScore": 90,
  "skillsMatch": 88,
  "experienceYears": 3,
  "educationLevel": "Bachelor"
}
```

**Response:**
```json
{
  "hiringProbability": 91.2,
  "recommendation": "Recommended",
  "confidence": "High",
  "featureContributions": {
    "resumeScore": 22.5,
    "interviewScore": 25.1,
    "skillsMatch": 20.3,
    "experienceYears": 18.7,
    "educationLevel": 13.4
  }
}
```

### `POST /batch-predict`

Batch prediction for multiple candidates.

**Request:**
```json
{
  "candidates": [
    { "candidateId": "c1", "resumeScore": 85, "interviewScore": 90, "skillsMatch": 88, "experienceYears": 3, "educationLevel": "Bachelor" },
    { "candidateId": "c2", "resumeScore": 50, "interviewScore": 45, "skillsMatch": 40, "experienceYears": 1, "educationLevel": "High School" }
  ]
}
```

## Features Used

| Feature | Type | Range |
|---------|------|-------|
| Resume Score | Numeric | 0–100 |
| Interview Score | Numeric | 0–100 |
| Skills Match % | Numeric | 0–100 |
| Experience Years | Numeric | 0–50 |
| Education Level | Categorical | High School, Associate, Bachelor, Master, PhD |

## Model Details

- **Algorithm**: Random Forest Classifier
- **Estimators**: 200
- **Max Depth**: 12
- **Class Weight**: Balanced
- **Cross-Validation**: 5-fold

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ML_SERVICE_PORT` | `5050` | Port for the Flask server |
