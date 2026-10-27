import sys
from pathlib import Path
import pandas as pd
import numpy as np

ml_ufc_dir = Path("ml/src/ufc").resolve()
sys.path.insert(0, str(ml_ufc_dir))

from ufc_predict import get_cached_ufc_resources, predict_ufc_bout
from ufc_features import FEATURE_COLUMNS, build_single_fight_feature_vector

model, _, fighters_df, profiles_dict, history_cache = get_cached_ufc_resources()

print("=============================================================")
print("CASE 1: EXACT DATE OF BOUT (2020-10-24) - PRE-FIGHT STATE")
print("=============================================================")

# 1a. Khabib (Red) vs Gaethje (Blue) on 2020-10-24
res_k_red = predict_ufc_bout("Khabib Nurmagomedov", "Justin Gaethje", target_date="2020-10-24", is_title_bout=True, corner_a="Red", corner_b="Blue")
print("Khabib (Red) vs Gaethje (Blue):")
print(f"  P(Khabib) = {res_k_red['probabilities']['fighter_a']['probability']:.4f}")
print(f"  P(Gaethje) = {res_k_red['probabilities']['fighter_b']['probability']:.4f}")

# 1b. Gaethje (Red) vs Khabib (Blue) on 2020-10-24
res_g_red = predict_ufc_bout("Justin Gaethje", "Khabib Nurmagomedov", target_date="2020-10-24", is_title_bout=True, corner_a="Red", corner_b="Blue")
print("\nGaethje (Red) vs Khabib (Blue):")
print(f"  P(Gaethje) = {res_g_red['probabilities']['fighter_a']['probability']:.4f}")
print(f"  P(Khabib) = {res_g_red['probabilities']['fighter_b']['probability']:.4f}")

print("\n=============================================================")
print("CASE 2: EVALUATING TODAY / 2026-10-24 (POST-RETIREMENT REPLAY)")
print("=============================================================")

# 2a. Khabib (Red) vs Gaethje (Blue) on 2026-10-24
res_k_red_26 = predict_ufc_bout("Khabib Nurmagomedov", "Justin Gaethje", target_date="2026-10-24", is_title_bout=True, corner_a="Red", corner_b="Blue")
print("Khabib (Red) vs Gaethje (Blue):")
print(f"  P(Khabib) = {res_k_red_26['probabilities']['fighter_a']['probability']:.4f}")
print(f"  P(Gaethje) = {res_k_red_26['probabilities']['fighter_b']['probability']:.4f}")

# 2b. Gaethje (Red) vs Khabib (Blue) on 2026-10-24
res_g_red_26 = predict_ufc_bout("Justin Gaethje", "Khabib Nurmagomedov", target_date="2026-10-24", is_title_bout=True, corner_a="Red", corner_b="Blue")
print("\nGaethje (Red) vs Khabib (Blue):")
print(f"  P(Gaethje) = {res_g_red_26['probabilities']['fighter_a']['probability']:.4f}")
print(f"  P(Khabib) = {res_g_red_26['probabilities']['fighter_b']['probability']:.4f}")

# Compare features between Gaethje (Red) on 2020-10-24 vs 2026-10-24
f_2020 = build_single_fight_feature_vector("Justin Gaethje", "Khabib Nurmagomedov", pd.to_datetime("2020-10-24"), history_cache["Justin Gaethje"], history_cache["Khabib Nurmagomedov"], profiles_dict, True)
f_2026 = build_single_fight_feature_vector("Justin Gaethje", "Khabib Nurmagomedov", pd.to_datetime("2026-10-24"), history_cache["Justin Gaethje"], history_cache["Khabib Nurmagomedov"], profiles_dict, True)

print("\nFeatures for Gaethje (Red) vs Khabib (Blue): 2020-10-24 vs 2026-10-24")
for col in FEATURE_COLUMNS:
    v20 = f_2020[col]
    v26 = f_2026[col]
    if v20 != v26:
        print(f"  * {col:25s} | 2020: {v20:8.2f} -> 2026: {v26:8.2f}")
    else:
        print(f"    {col:25s} | {v20:8.2f}")
