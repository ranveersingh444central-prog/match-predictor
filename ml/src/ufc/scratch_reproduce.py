import sys
from pathlib import Path
import pandas as pd
import numpy as np

# Add ml/src/ufc to sys.path
ml_ufc_dir = Path("ml/src/ufc").resolve()
sys.path.insert(0, str(ml_ufc_dir))

from ufc_predict import predict_ufc_bout, get_cached_ufc_resources
from ufc_features import FEATURE_COLUMNS, build_single_fight_feature_vector

print("=== REPRODUCING ISSUE 1: JON JONES VS DANIEL CORMIER ===")
res1 = predict_ufc_bout("Jon Jones", "Daniel Cormier", corner_a="Red", corner_b="Blue")
print(f"Jones (Red) vs Cormier (Blue):")
print(f"  Predicted winner: {res1['predicted_winner']}")
print(f"  Jones prob: {res1['probabilities']['fighter_a']['probability_percent']}")
print(f"  Cormier prob: {res1['probabilities']['fighter_b']['probability_percent']}")

res1_swapped = predict_ufc_bout("Daniel Cormier", "Jon Jones", corner_a="Red", corner_b="Blue")
print(f"\nCormier (Red) vs Jones (Blue):")
print(f"  Predicted winner: {res1_swapped['predicted_winner']}")
print(f"  Cormier prob: {res1_swapped['probabilities']['fighter_a']['probability_percent']}")
print(f"  Jones prob: {res1_swapped['probabilities']['fighter_b']['probability_percent']}")

res1_corner_swapped = predict_ufc_bout("Jon Jones", "Daniel Cormier", corner_a="Blue", corner_b="Red")
print(f"\nJones (Blue) vs Cormier (Red) via corner_a/corner_b:")
print(f"  Predicted winner: {res1_corner_swapped['predicted_winner']}")
print(f"  Jones prob: {res1_corner_swapped['probabilities']['fighter_a']['probability_percent']}")
print(f"  Cormier prob: {res1_corner_swapped['probabilities']['fighter_b']['probability_percent']}")

print("\n=== REPRODUCING ISSUE 2: JUSTIN GAETHJE VS KHABIB NURMAGOMEDOV ===")
# Real bout was on 2020-10-24 at UFC 254
res2_real_date = predict_ufc_bout("Justin Gaethje", "Khabib Nurmagomedov", target_date="2020-10-24", is_title_bout=True, corner_a="Blue", corner_b="Red")
print(f"Gaethje (Blue) vs Khabib (Red, Champion) on 2020-10-24:")
print(f"  Predicted winner: {res2_real_date['predicted_winner']}")
print(f"  Gaethje prob: {res2_real_date['probabilities']['fighter_a']['probability_percent']}")
print(f"  Khabib prob: {res2_real_date['probabilities']['fighter_b']['probability_percent']}")

res2_real_date_swap = predict_ufc_bout("Khabib Nurmagomedov", "Justin Gaethje", target_date="2020-10-24", is_title_bout=True, corner_a="Red", corner_b="Blue")
print(f"\nKhabib (Red) vs Gaethje (Blue) on 2020-10-24:")
print(f"  Predicted winner: {res2_real_date_swap['predicted_winner']}")
print(f"  Khabib prob: {res2_real_date_swap['probabilities']['fighter_a']['probability_percent']}")
print(f"  Gaethje prob: {res2_real_date_swap['probabilities']['fighter_b']['probability_percent']}")

res2_today = predict_ufc_bout("Justin Gaethje", "Khabib Nurmagomedov", is_title_bout=True)
print(f"\nGaethje (Red) vs Khabib (Blue) today / archive cutoff:")
print(f"  Predicted winner: {res2_today['predicted_winner']}")
print(f"  Gaethje prob: {res2_today['probabilities']['fighter_a']['probability_percent']}")
print(f"  Khabib prob: {res2_today['probabilities']['fighter_b']['probability_percent']}")

res2_today_swap = predict_ufc_bout("Khabib Nurmagomedov", "Justin Gaethje", is_title_bout=True)
print(f"\nKhabib (Red) vs Gaethje (Blue) today / archive cutoff:")
print(f"  Predicted winner: {res2_today_swap['predicted_winner']}")
print(f"  Khabib prob: {res2_today_swap['probabilities']['fighter_a']['probability_percent']}")
print(f"  Gaethje prob: {res2_today_swap['probabilities']['fighter_b']['probability_percent']}")
