import sys
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, brier_score_loss, log_loss, roc_auc_score

ml_ufc_dir = Path("ml/src/ufc").resolve()
sys.path.insert(0, str(ml_ufc_dir))

from ufc_features import FEATURE_COLUMNS, generate_chronological_feature_dataset

# Load processed clean features
feats_path = Path("ml/data/ufc/processed/ufc_features.csv")
df = pd.read_csv(feats_path)
df["date"] = pd.to_datetime(df["date"])
df = df.sort_values(by=["date", "R_fighter"]).reset_index(drop=True)

decisive_df = df[df["result_target"].isin(["Red", "Blue"])].copy()
total_decisive = len(decisive_df)

n_train = int(total_decisive * 0.70)
n_val = int(total_decisive * 0.15)

train_df = decisive_df.iloc[:n_train].copy()
val_df = decisive_df.iloc[n_train:n_train + n_val].copy()
test_df = decisive_df.iloc[n_train + n_val:].copy()

print(f"Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")

# What are the strictly differential columns?
# Look at FEATURE_COLUMNS:
diff_cols = [
    "height_diff", "reach_diff", "age_diff",
    "stance_orthodox_vs_southpaw",
    "total_fights_diff", "win_pct_diff", "win_streak_diff",
    "form_diff_roll3", "form_diff_roll5", "layoff_diff_days", "finish_rate_diff",
    "slpm_diff", "sapm_diff", "str_acc_diff", "str_def_diff",
    "td_avg_diff", "td_def_diff", "sub_avg_diff",
    "title_bout"
]

print(f"\nPure differential feature count: {len(diff_cols)}")

# Build swapped training set:
# Original: X_train, y_train
# Swapped: for all diff features, negate the values!
# For title_bout and stance_orthodox_vs_southpaw, they are symmetric (unchanged)!
# y_swapped = 1 - y_train
def create_swapped_df(orig_df, feature_cols):
    swapped = orig_df.copy()
    # Invert differentials
    for c in feature_cols:
        if c.endswith("_diff") or c in ["height_diff", "reach_diff", "age_diff", "layoff_diff_days"]:
            swapped[c] = -orig_df[c]
    swapped["winner_code"] = 1 - orig_df["winner_code"]
    return swapped

# Original features
X_train_orig = train_df[FEATURE_COLUMNS]
y_train_orig = train_df["winner_code"].to_numpy()

X_val_orig = val_df[FEATURE_COLUMNS]
y_val_orig = val_df["winner_code"].to_numpy()

X_test_orig = test_df[FEATURE_COLUMNS]
y_test_orig = test_df["winner_code"].to_numpy()

# Test symmetrized training on pure diff columns:
train_swapped = create_swapped_df(train_df, diff_cols)
sym_train_df = pd.concat([train_df, train_swapped], ignore_index=True)

X_train_sym = sym_train_df[diff_cols]
y_train_sym = sym_train_df["winner_code"].to_numpy()

X_val_sym = val_df[diff_cols]
y_val_sym = val_df["winner_code"].to_numpy()

X_test_sym = test_df[diff_cols]
y_test_sym = test_df["winner_code"].to_numpy()

# Train models on symmetrized data
rf_sym = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", RandomForestClassifier(n_estimators=150, max_depth=6, min_samples_leaf=10, random_state=42))
])
rf_sym.fit(X_train_sym, y_train_sym)

lr_sym = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", LogisticRegression(C=0.1, max_iter=1000, random_state=42))
])
lr_sym.fit(X_train_sym, y_train_sym)

print("\n--- Validation Metrics (Symmetrized RF) ---")
p_rf_val = rf_sym.predict_proba(X_val_sym)[:, 1]
print(f"Accuracy: {accuracy_score(y_val_sym, rf_sym.predict(X_val_sym)):.4f}")
print(f"Log Loss: {log_loss(y_val_sym, p_rf_val):.4f}")
print(f"Brier: {brier_score_loss(y_val_sym, p_rf_val):.4f}")
print(f"ROC-AUC: {roc_auc_score(y_val_sym, p_rf_val):.4f}")

print("\n--- Validation Metrics (Symmetrized LR) ---")
p_lr_val = lr_sym.predict_proba(X_val_sym)[:, 1]
print(f"Accuracy: {accuracy_score(y_val_sym, lr_sym.predict(X_val_sym)):.4f}")
print(f"Log Loss: {log_loss(y_val_sym, p_lr_val):.4f}")
print(f"Brier: {brier_score_loss(y_val_sym, p_lr_val):.4f}")
print(f"ROC-AUC: {roc_auc_score(y_val_sym, p_lr_val):.4f}")
