import pandas as pd
from pathlib import Path

fights_path = Path("ml/data/ufc/processed/fights_clean.csv")
df = pd.read_csv(fights_path)

# Look for Khabib vs Gaethje
khabib_gaethje = df[
    ((df["R_fighter"].str.contains("Khabib", case=False, na=False)) & (df["B_fighter"].str.contains("Gaethje", case=False, na=False))) |
    ((df["R_fighter"].str.contains("Gaethje", case=False, na=False)) & (df["B_fighter"].str.contains("Khabib", case=False, na=False)))
]

print("Khabib vs Gaethje in fights_clean.csv:")
print(khabib_gaethje[["date", "R_fighter", "B_fighter", "Winner", "method_clean", "title_bout"]])

# Also inspect all of Khabib's fights in fights_clean.csv
khabib_all = df[
    (df["R_fighter"].str.contains("Khabib", case=False, na=False)) |
    (df["B_fighter"].str.contains("Khabib", case=False, na=False))
].sort_values(by="date")
print(f"\nTotal Khabib bouts in dataset: {len(khabib_all)}")
print(khabib_all[["date", "R_fighter", "B_fighter", "Winner", "method_clean"]].tail(5))

# Also inspect all of Gaethje's fights in fights_clean.csv
gaethje_all = df[
    (df["R_fighter"].str.contains("Gaethje", case=False, na=False)) |
    (df["B_fighter"].str.contains("Gaethje", case=False, na=False))
].sort_values(by="date")
print(f"\nTotal Gaethje bouts in dataset: {len(gaethje_all)}")
print(gaethje_all[["date", "R_fighter", "B_fighter", "Winner", "method_clean"]].tail(8))
