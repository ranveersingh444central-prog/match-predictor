import sys
from pathlib import Path
import pandas as pd
import numpy as np
import joblib

ml_ufc_dir = Path("ml/src/ufc").resolve()
sys.path.insert(0, str(ml_ufc_dir))

from ufc_predict import get_cached_ufc_resources
from ufc_features import FEATURE_COLUMNS

model, _, fighters_df, profiles_dict, history_cache = get_cached_ufc_resources()

# What does the model predict on all zeros (or identical fighter stats)?
zero_input = pd.DataFrame([{col: 0.0 for col in FEATURE_COLUMNS}])[FEATURE_COLUMNS]
proba_zero = model.predict_proba(zero_input)[0]
print("Prediction on all zeros:")
print(f"  P(Blue=0): {proba_zero[0]:.4f}, P(Red=1): {proba_zero[1]:.4f}")

# Look at Jon Jones vs Daniel Cormier feature vector:
from ufc_predict import predict_ufc_bout
from ufc_features import build_single_fight_feature_vector

date = pd.to_datetime("2026-10-24")
# Jones as Red, Cormier as Blue
j_c_feat = build_single_fight_feature_vector(
    red_name="Jon Jones", blue_name="Daniel Cormier", target_date=date,
    red_prior_bouts=history_cache["Jon Jones"], blue_prior_bouts=history_cache["Daniel Cormier"],
    profiles_dict=profiles_dict, is_title_bout=True
)
# Cormier as Red, Jones as Blue
c_j_feat = build_single_fight_feature_vector(
    red_name="Daniel Cormier", blue_name="Jon Jones", target_date=date,
    red_prior_bouts=history_cache["Daniel Cormier"], blue_prior_bouts=history_cache["Jon Jones"],
    profiles_dict=profiles_dict, is_title_bout=True
)

df_jc = pd.DataFrame([j_c_feat])[FEATURE_COLUMNS]
df_cj = pd.DataFrame([c_j_feat])[FEATURE_COLUMNS]

p_jc = model.predict_proba(df_jc)[0] # [P(Blue=Cormier), P(Red=Jones)]
p_cj = model.predict_proba(df_cj)[0] # [P(Blue=Jones), P(Red=Cormier)]

print("\n--- Jon Jones vs Daniel Cormier ---")
print(f"Jones (Red) vs Cormier (Blue): P(Red=Jones) = {p_jc[1]:.4f}, P(Blue=Cormier) = {p_jc[0]:.4f}")
print(f"Cormier (Red) vs Jones (Blue): P(Red=Cormier) = {p_cj[1]:.4f}, P(Blue=Jones) = {p_cj[0]:.4f}")

print("\nFeature comparison (Jones Red vs Cormier Red):")
for col in FEATURE_COLUMNS:
    val_jc = j_c_feat[col]
    val_cj = c_j_feat[col]
    print(f"  {col:28s} | J(R) vs C(B): {val_jc:8.2f} | C(R) vs J(B): {val_cj:8.2f}")
