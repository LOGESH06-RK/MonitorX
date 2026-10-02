"""
MonitorX — Random Forest Loan Eligibility Model Trainer
========================================================

Trains a Random Forest Classifier on loan_data.csv and exports
the trained model as a compact JSON file for client-side inference
in the React Native / Expo application.

IMPORTANT: The training target is SYNTHETIC — generated from transparent
financial-risk rules because the original CSV has no actual approval/rejection
outcome column. This is clearly documented and disclosed in the app.

Usage:
  cd project/scripts
  pip install -r requirements.txt
  python train_model.py

Output:
  ../lib/ml-model.json  (compact exported Random Forest for JS inference)
"""

import json
import os
import sys
import warnings

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

warnings.filterwarnings("ignore")

# ─── Configuration ────────────────────────────────────────────────────────────

N_ESTIMATORS = 20       # Number of trees (keep small for client-side JSON)
MAX_DEPTH = 8           # Max tree depth (controls model size & overfitting)
RANDOM_STATE = 42
TEST_SIZE = 0.2

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(SCRIPT_DIR, "..", "loan_data.csv")
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "..", "lib", "ml-model.json")

# ─── Feature & Target Configuration ──────────────────────────────────────────

NUMERIC_FEATURES = [
    "age",
    "annual_income",
    "monthly_income",
    "debt_to_income_ratio",
    "credit_score",
    "loan_amount",
]

CATEGORICAL_FEATURES = [
    "gender",
    "marital_status",
    "education_level",
    "employment_status",
]

# Derived features we'll compute
DERIVED_FEATURES = [
    "loan_to_income_ratio",
    "monthly_emi_estimate",
    "emi_to_income_ratio",
]

TARGET_CLASSES = ["Rejected", "Review", "Approved"]


# ─── Synthetic Target Generation ─────────────────────────────────────────────

def generate_target(row):
    """
    Generates a transparent synthetic loan eligibility target.
    
    Rules (documented and disclosed in the application):
    - Approved: credit_score >= 700 AND dti <= 0.40 AND loan_to_income <= 5.0
    - Review:   credit_score >= 580 AND dti <= 0.55 AND loan_to_income <= 8.0
    - Rejected: everything else
    
    Additional modifiers:
    - Age < 21 or > 65: pushes toward Review/Rejected
    - Very low income with high loan: pushes toward Rejected
    """
    cs = row["credit_score"]
    dti = row["debt_to_income_ratio"]
    lti = row["loan_to_income_ratio"]
    age = row["age"]
    income = row["annual_income"]
    loan = row["loan_amount"]

    # Age penalty
    age_ok = 21 <= age <= 65

    # Core rules
    if cs >= 700 and dti <= 0.40 and lti <= 5.0 and age_ok:
        return "Approved"
    elif cs >= 580 and dti <= 0.55 and lti <= 8.0:
        if not age_ok and cs < 650:
            return "Rejected"
        return "Review"
    else:
        return "Rejected"


# ─── Data Loading & Preprocessing ────────────────────────────────────────────

def load_and_preprocess():
    """Load CSV, compute derived features, generate target, encode categoricals."""
    
    print("=" * 60)
    print("MonitorX — Random Forest Model Training")
    print("=" * 60)
    
    # Load
    if not os.path.exists(CSV_PATH):
        print(f"ERROR: CSV not found at {CSV_PATH}")
        sys.exit(1)

    df = pd.read_csv(CSV_PATH)
    print(f"\n[DATA] Dataset loaded: {len(df)} records, {len(df.columns)} columns")
    print(f"   Columns: {list(df.columns)}")

    # Handle missing values
    for col in NUMERIC_FEATURES:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
            median_val = df[col].median()
            df[col].fillna(median_val, inplace=True)

    for col in CATEGORICAL_FEATURES:
        if col in df.columns:
            df[col] = df[col].astype(str).fillna("Unknown")

    # Compute derived features
    df["loan_to_income_ratio"] = np.where(
        df["annual_income"] > 0,
        df["loan_amount"] / df["annual_income"],
        10.0  # High default if income is 0
    )

    # Estimate monthly EMI (rough: loan / 48 months at ~8.5%)
    monthly_rate = 0.085 / 12
    tenure = 48
    factor = (1 + monthly_rate) ** tenure
    df["monthly_emi_estimate"] = np.where(
        df["loan_amount"] > 0,
        (df["loan_amount"] * monthly_rate * factor) / (factor - 1),
        0
    )

    df["emi_to_income_ratio"] = np.where(
        df["monthly_income"] > 0,
        df["monthly_emi_estimate"] / df["monthly_income"],
        1.0
    )

    # Generate synthetic target
    df["target"] = df.apply(generate_target, axis=1)
    
    print(f"\n[TARGET] Target distribution (synthetic):")
    for cls in TARGET_CLASSES:
        count = (df["target"] == cls).sum()
        pct = count / len(df) * 100
        print(f"   {cls}: {count} ({pct:.1f}%)")

    # Encode categoricals
    label_encoders = {}
    encoded_cat_columns = []
    
    for col in CATEGORICAL_FEATURES:
        if col in df.columns:
            le = LabelEncoder()
            df[f"{col}_encoded"] = le.fit_transform(df[col])
            label_encoders[col] = {
                "classes": le.classes_.tolist(),
                "mapping": {str(cls): int(idx) for idx, cls in enumerate(le.classes_)},
            }
            encoded_cat_columns.append(f"{col}_encoded")

    # Build final feature list
    all_features = NUMERIC_FEATURES + DERIVED_FEATURES + encoded_cat_columns
    
    # Ensure all features exist
    for f in all_features:
        if f not in df.columns:
            print(f"WARNING: Feature '{f}' not in DataFrame, filling with 0")
            df[f] = 0

    X = df[all_features].values.astype(np.float64)
    
    # Encode target
    target_le = LabelEncoder()
    target_le.fit(TARGET_CLASSES)
    y = target_le.transform(df["target"])

    feature_names = all_features

    print(f"\n[FEATURES] Feature matrix: {X.shape[0]} samples x {X.shape[1]} features")
    print(f"   Features: {feature_names}")

    return X, y, feature_names, label_encoders, target_le


# ─── Model Training ──────────────────────────────────────────────────────────

def train_model(X, y, feature_names):
    """Train Random Forest and evaluate."""

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )

    print(f"\n[TRAIN] Training Random Forest...")
    print(f"   Trees: {N_ESTIMATORS}, Max Depth: {MAX_DEPTH}")
    print(f"   Train: {len(X_train)}, Test: {len(X_test)}")

    clf = RandomForestClassifier(
        n_estimators=N_ESTIMATORS,
        max_depth=MAX_DEPTH,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        class_weight="balanced",
    )
    clf.fit(X_train, y_train)

    # Evaluate
    y_pred = clf.predict(X_test)
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    print(f"\n[EVAL] Model Evaluation:")
    print(f"   Accuracy:  {accuracy:.4f}")
    print(f"   Precision: {precision:.4f}")
    print(f"   Recall:    {recall:.4f}")
    print(f"   F1 Score:  {f1:.4f}")

    print(f"\n[REPORT] Classification Report:")
    print(classification_report(y_test, y_pred, target_names=TARGET_CLASSES, zero_division=0))

    print(f"[MATRIX] Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(f"   {cm}")

    # Feature importance
    importances = clf.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    
    print(f"\n[IMPORTANCE] Feature Importance:")
    for i in sorted_idx:
        print(f"   {feature_names[i]}: {importances[i]:.4f}")

    return clf, importances


# ─── Model Export to JSON ─────────────────────────────────────────────────────

def tree_to_dict(tree, feature_names):
    """Convert a single sklearn DecisionTree to a compact JSON-serializable dict."""
    tree_ = tree.tree_
    
    def recurse(node_id):
        if tree_.feature[node_id] == -2:  # Leaf node
            # Get class distribution at this leaf
            values = tree_.value[node_id][0].tolist()
            total = sum(values)
            probs = [v / total if total > 0 else 0 for v in values]
            predicted_class = int(np.argmax(values))
            return {
                "type": "leaf",
                "class": predicted_class,
                "probs": [round(p, 4) for p in probs],
            }
        else:
            feature_idx = int(tree_.feature[node_id])
            threshold = round(float(tree_.threshold[node_id]), 6)
            return {
                "type": "split",
                "feature": feature_idx,
                "threshold": threshold,
                "left": recurse(int(tree_.children_left[node_id])),
                "right": recurse(int(tree_.children_right[node_id])),
            }

    return recurse(0)


def export_model(clf, feature_names, label_encoders, target_classes, importances):
    """Export the trained Random Forest as a compact JSON file."""

    model_data = {
        "model_type": "RandomForestClassifier",
        "version": "1.0.0",
        "n_estimators": clf.n_estimators,
        "max_depth": clf.max_depth,
        "target_classes": target_classes,
        "feature_names": feature_names,
        "feature_importance": {
            name: round(float(imp), 6)
            for name, imp in zip(feature_names, importances)
        },
        "label_encoders": label_encoders,
        "trees": [tree_to_dict(est, feature_names) for est in clf.estimators_],
        "metadata": {
            "training_data": "loan_data.csv (2851 records)",
            "target_type": "synthetic (rule-based, not real bank decisions)",
            "disclaimer": "This model provides estimated eligibility guidance only. Final loan decisions are made by the bank/lender.",
        },
    }

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(model_data, f, separators=(",", ":"))

    file_size = os.path.getsize(OUTPUT_PATH)
    print(f"\n[EXPORT] Model exported to: {OUTPUT_PATH}")
    print(f"   File size: {file_size / 1024:.1f} KB")
    print(f"   Trees: {len(model_data['trees'])}")
    print(f"   Features: {len(feature_names)}")

    return model_data


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    X, y, feature_names, label_encoders, target_le = load_and_preprocess()
    clf, importances = train_model(X, y, feature_names)
    export_model(
        clf,
        feature_names,
        label_encoders,
        TARGET_CLASSES,
        importances,
    )
    print("\n[DONE] Training complete. Model ready for MonitorX client-side inference.")
    print("=" * 60)


if __name__ == "__main__":
    main()
