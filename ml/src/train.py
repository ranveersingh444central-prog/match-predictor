"""
Model Training and Chronological Evaluation Pipeline for PITCHIQ
Trains a baseline DummyClassifier and a leakage-safe RandomForestClassifier.
Evaluates on a strictly chronological held-out test set.
Computes multiclass log loss, Brier score, macro F1, and per-class metrics.
Persists model artifacts and evaluation summaries.
"""

import os
import json
from pathlib import Path
from datetime import datetime
import pandas as pd
import numpy as np
import joblib

from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    log_loss,
    classification_report
)

BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DATA_DIR = BASE_DIR / "data" / "processed"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
REPORTS_DIR = BASE_DIR / "reports"

from features import FEATURE_COLUMNS, generate_training_feature_dataset

# Explicit canonical outcome classes
CLASS_ORDER = ["H", "D", "A"]

def calculate_multiclass_brier_score(y_true_indices: np.ndarray, y_proba: np.ndarray, n_classes: int = 3) -> float:
    """
    Computes standard multiclass Brier score:
    BS = (1/N) * sum_i sum_k (p_ik - y_ik)^2
    Lower is better (0 = perfect calibration and accuracy).
    """
    n_samples = len(y_true_indices)
    one_hot = np.zeros((n_samples, n_classes))
    for i, idx in enumerate(y_true_indices):
        one_hot[i, idx] = 1.0
    return float(np.mean(np.sum((y_proba - one_hot) ** 2, axis=1)))

def train_and_evaluate(test_ratio: float = 0.22) -> dict:
    """
    Executes end-to-end model training with chronological split.
    Guarantees no future-data leakage in preprocessing or evaluation.
    """
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    features_csv = PROCESSED_DATA_DIR / "features_engineered.csv"
    if not features_csv.exists():
        matches_csv = PROCESSED_DATA_DIR / "matches_clean.csv"
        if not matches_csv.exists():
            raise FileNotFoundError("Missing matches_clean.csv. Run validation.py first.")
        clean_df = pd.read_csv(matches_csv)
        clean_df["Date"] = pd.to_datetime(clean_df["Date"])
        df = generate_training_feature_dataset(clean_df)
    else:
        df = pd.read_csv(features_csv)

    df["match_date"] = pd.to_datetime(df["match_date"])
    df = df.sort_values(by="match_date").reset_index(drop=True)

    # Filter to valid classes
    df = df[df["target"].isin(CLASS_ORDER)].copy()
    total_samples = len(df)
    if total_samples < 50:
        raise ValueError(f"Insufficient training samples ({total_samples}). At least 50 matches required.")

    # Chronological Split: strictly earlier matches for train, later matches for test
    split_index = int(total_samples * (1.0 - test_ratio))
    train_df = df.iloc[:split_index].copy()
    test_df = df.iloc[split_index:].copy()

    train_start = train_df["match_date"].min().strftime("%Y-%m-%d")
    train_end = train_df["match_date"].max().strftime("%Y-%m-%d")
    test_start = test_df["match_date"].min().strftime("%Y-%m-%d")
    test_end = test_df["match_date"].max().strftime("%Y-%m-%d")

    X_train = train_df[FEATURE_COLUMNS]
    y_train = train_df["target"]

    X_test = test_df[FEATURE_COLUMNS]
    y_test = test_df["target"]

    # Map target strings to integer indices 0: 'H', 1: 'D', 2: 'A'
    class_to_idx = {cls: idx for idx, cls in enumerate(CLASS_ORDER)}
    y_train_idx = y_train.map(class_to_idx).to_numpy()
    y_test_idx = y_test.map(class_to_idx).to_numpy()

    # 1. Baseline Model: Most Frequent
    baseline = DummyClassifier(strategy="most_frequent")
    baseline.fit(X_train, y_train_idx)
    baseline_pred_idx = baseline.predict(X_test)
    baseline_acc = float(accuracy_score(y_test_idx, baseline_pred_idx))
    baseline_macro_f1 = float(f1_score(y_test_idx, baseline_pred_idx, average="macro", zero_division=0))

    # 2. Main Model: RandomForest Pipeline with StandardScaler fitted ONLY on train data
    rf_classifier = RandomForestClassifier(
        n_estimators=180,
        max_depth=6,
        min_samples_split=8,
        min_samples_leaf=4,
        max_features="sqrt",
        random_state=42,
        class_weight="balanced_subsample",
        n_jobs=-1
    )

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", rf_classifier)
    ])

    pipeline.fit(X_train, y_train_idx)

    # Predictions on unseen test set
    y_pred_idx = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)

    # Ensure y_proba column ordering maps strictly to CLASS_ORDER
    # Pipeline classes_ are the classes encountered in training
    classes_in_model = pipeline.named_steps["classifier"].classes_
    # Re-order probabilities if needed
    prob_matrix = np.zeros((len(test_df), len(CLASS_ORDER)))
    for model_col_idx, orig_cls_idx in enumerate(classes_in_model):
        prob_matrix[:, orig_cls_idx] = y_proba[:, model_col_idx]

    # Metrics computation
    acc = float(accuracy_score(y_test_idx, y_pred_idx))
    macro_prec = float(precision_score(y_test_idx, y_pred_idx, average="macro", zero_division=0))
    macro_rec = float(recall_score(y_test_idx, y_pred_idx, average="macro", zero_division=0))
    macro_f1 = float(f1_score(y_test_idx, y_pred_idx, average="macro", zero_division=0))
    logloss_val = float(log_loss(y_test_idx, prob_matrix, labels=[0, 1, 2]))
    brier_val = calculate_multiclass_brier_score(y_test_idx, prob_matrix, n_classes=3)

    # Per-class metrics
    per_class_prec = precision_score(y_test_idx, y_pred_idx, average=None, labels=[0, 1, 2], zero_division=0)
    per_class_rec = recall_score(y_test_idx, y_pred_idx, average=None, labels=[0, 1, 2], zero_division=0)
    per_class_f1 = f1_score(y_test_idx, y_pred_idx, average=None, labels=[0, 1, 2], zero_division=0)

    per_class_metrics = {}
    class_names = {"H": "Home Win", "D": "Draw", "A": "Away Win"}
    for idx, cls in enumerate(CLASS_ORDER):
        per_class_metrics[cls] = {
            "name": class_names[cls],
            "precision": round(float(per_class_prec[idx]), 3),
            "recall": round(float(per_class_rec[idx]), 3),
            "f1_score": round(float(per_class_f1[idx]), 3),
            "support": int((y_test_idx == idx).sum())
        }

    # Confusion matrix
    cm = confusion_matrix(y_test_idx, y_pred_idx, labels=[0, 1, 2])
    cm_structured = {
        "labels": CLASS_ORDER,
        "label_names": ["Home Win (H)", "Draw (D)", "Away Win (A)"],
        "matrix": cm.tolist()
    }

    # Feature Importance (Gini from Random Forest)
    importances = rf_classifier.feature_importances_
    sorted_features = sorted(
        [{"feature": f, "importance": round(float(imp), 4)} for f, imp in zip(FEATURE_COLUMNS, importances)],
        key=lambda x: x["importance"],
        reverse=True
    )

    # Save artifacts
    model_artifact_path = ARTIFACTS_DIR / "model.joblib"
    baseline_artifact_path = ARTIFACTS_DIR / "baseline_model.joblib"
    joblib.dump(pipeline, model_artifact_path)
    joblib.dump(baseline, baseline_artifact_path)

    metadata = {
        "model_name": "PITCHIQ Random Forest Match Predictor",
        "algorithm": "RandomForestClassifier",
        "pipeline": ["StandardScaler", "RandomForestClassifier"],
        "class_order": CLASS_ORDER,
        "class_mapping": {"0": "H (Home Win)", "1": "D (Draw)", "2": "A (Away Win)"},
        "feature_count": len(FEATURE_COLUMNS),
        "features": FEATURE_COLUMNS,
        "total_dataset_samples": total_samples,
        "train_samples": len(train_df),
        "test_samples": len(test_df),
        "training_period": f"{train_start} to {train_end}",
        "test_period": f"{test_start} to {test_end}",
        "trained_at": datetime.utcnow().isoformat() + "Z",
        "hyperparameters": {
            "n_estimators": 180,
            "max_depth": 6,
            "min_samples_split": 8,
            "min_samples_leaf": 4,
            "class_weight": "balanced_subsample",
            "random_state": 42
        }
    }

    eval_results = {
        "metadata": metadata,
        "baseline": {
            "strategy": "most_frequent",
            "accuracy": round(baseline_acc, 4),
            "macro_f1": round(baseline_macro_f1, 4)
        },
        "main_model": {
            "accuracy": round(acc, 4),
            "macro_precision": round(macro_prec, 4),
            "macro_recall": round(macro_rec, 4),
            "macro_f1": round(macro_f1, 4),
            "log_loss": round(logloss_val, 4),
            "brier_score": round(brier_val, 4),
            "evaluated_test_matches": len(test_df),
            "per_class": per_class_metrics
        },
        "confusion_matrix": cm_structured,
        "top_features": sorted_features[:10]
    }

    with open(ARTIFACTS_DIR / "model_metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    with open(ARTIFACTS_DIR / "evaluation_metrics.json", "w", encoding="utf-8") as f:
        json.dump(eval_results, f, indent=2)

    with open(ARTIFACTS_DIR / "feature_importance.json", "w", encoding="utf-8") as f:
        json.dump(sorted_features, f, indent=2)

    with open(ARTIFACTS_DIR / "confusion_matrix.json", "w", encoding="utf-8") as f:
        json.dump(cm_structured, f, indent=2)

    return eval_results

if __name__ == "__main__":
    results = train_and_evaluate()
    print("Training Complete!")
    print(f"Train samples: {results['metadata']['train_samples']}, Test samples: {results['metadata']['test_samples']}")
    print(f"Baseline Accuracy: {results['baseline']['accuracy'] * 100:.2f}%")
    print(f"Random Forest Accuracy: {results['main_model']['accuracy'] * 100:.2f}% | Macro F1: {results['main_model']['macro_f1']:.4f}")
