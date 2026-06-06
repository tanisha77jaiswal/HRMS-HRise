"""
HRise ML Service — Training Pipeline
=====================================
Trains a Random Forest Classifier on the hiring dataset.
Outputs: hiring_model.pkl, label_encoders.pkl
"""

import os
import sys
import io
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import joblib

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ─── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "hiring_dataset.csv")
MODEL_DIR = os.path.join(BASE_DIR, "..", "model")
MODEL_PATH = os.path.join(MODEL_DIR, "hiring_model.pkl")
ENCODERS_PATH = os.path.join(MODEL_DIR, "label_encoders.pkl")


def train():
    """Main training function."""
    print("=" * 60)
    print("  HRise ML -- Random Forest Hiring Prediction Training")
    print("=" * 60)

    # ─── 1. Load Dataset ────────────────────────────────────────────────────
    print(f"\n[LOAD] Loading dataset from: {DATASET_PATH}")
    df = pd.read_csv(DATASET_PATH)
    print(f"   Rows: {len(df)}, Columns: {list(df.columns)}")
    print(f"   Class distribution:\n{df['hired'].value_counts().to_string()}")

    # ─── 2. Encode Categorical Features ─────────────────────────────────────
    label_encoders = {}

    le_education = LabelEncoder()
    df["educationLevel_encoded"] = le_education.fit_transform(df["educationLevel"])
    label_encoders["educationLevel"] = le_education

    print(f"\n[ENC] Education Level Classes: {list(le_education.classes_)}")
    print(f"   Encoding Map: {dict(zip(le_education.classes_, le_education.transform(le_education.classes_)))}")

    # ─── 3. Prepare Features & Target ───────────────────────────────────────
    feature_columns = [
        "resumeScore",
        "interviewScore",
        "skillsMatch",
        "experienceYears",
        "educationLevel_encoded",
    ]

    X = df[feature_columns].values
    y = df["hired"].values

    print(f"\n[DATA] Feature matrix shape: {X.shape}")
    print(f"   Target shape: {y.shape}")

    # ─── 4. Train/Test Split ────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\n[SPLIT] Train: {X_train.shape[0]}, Test: {X_test.shape[0]}")

    # ─── 5. Train Random Forest Classifier ──────────────────────────────────
    print("\n[TRAIN] Training Random Forest Classifier...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced",
    )
    model.fit(X_train, y_train)

    # ─── 6. Evaluate ────────────────────────────────────────────────────────
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n[OK] Test Accuracy: {accuracy:.4f}")
    print(f"\n[REPORT] Classification Report:\n{classification_report(y_test, y_pred, target_names=['Not Hired', 'Hired'])}")

    # Cross-validation
    cv_scores = cross_val_score(model, X, y, cv=5, scoring="accuracy")
    print(f"[CV] 5-Fold CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

    # Feature importance
    importances = model.feature_importances_
    feature_names = [
        "Resume Score",
        "Interview Score",
        "Skills Match %",
        "Experience Years",
        "Education Level",
    ]
    print("\n[FEAT] Feature Importances:")
    for name, imp in sorted(zip(feature_names, importances), key=lambda x: -x[1]):
        bar = "#" * int(imp * 40)
        print(f"   {name:20s}  {imp:.4f}  {bar}")

    # ─── 7. Save Model & Encoders ───────────────────────────────────────────
    os.makedirs(MODEL_DIR, exist_ok=True)

    joblib.dump(model, MODEL_PATH)
    print(f"\n[SAVE] Model saved to: {MODEL_PATH}")

    joblib.dump(label_encoders, ENCODERS_PATH)
    print(f"[SAVE] Label encoders saved to: {ENCODERS_PATH}")

    print("\n" + "=" * 60)
    print("  [OK] Training complete! Model is ready for production.")
    print("=" * 60)


if __name__ == "__main__":
    train()
