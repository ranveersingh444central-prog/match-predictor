import pandas as pd
from pathlib import Path

fights_path = Path("ml/data/ufc/processed/fights_clean.csv")
df = pd.read_csv(fights_path)
decisive = df[df["result_target"].isin(["Red", "Blue"])]
print("Total decisive bouts:", len(decisive))
print("Red wins:", (decisive["result_target"] == "Red").sum(), f"({(decisive['result_target'] == 'Red').mean()*100:.2f}%)")
print("Blue wins:", (decisive["result_target"] == "Blue").sum(), f"({(decisive['result_target'] == 'Blue').mean()*100:.2f}%)")
