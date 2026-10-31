"""
Retrains the AranyaAI species-recommendation model with an honest,
held-out evaluation.

Why this script exists
-----------------------
The previously shipped trained_model.pkl had no accompanying training
script, so there was no way to verify how its reported 95-99% accuracy
was measured. Inspecting final_training_dataset.csv shows why that
number is suspicious on its face:

  - 26 of 31 species (1,820 of 2,170 rows) are `synthetic_generated`;
    only 5 species (350 rows) are `real_kaggle`.
  - The synthetic rows were generated with largely non-overlapping
    per-species feature bands (e.g. Guava's N range is 35.2-79.9,
    Amla's is 0.2-34.7 -- zero overlap), which makes those species
    almost trivially separable regardless of model quality.

This script fixes the *process*, not the underlying data quality:
  1. Does a stratified train/test split (by species) BEFORE fitting,
     so the reported accuracy is on genuinely unseen rows.
  2. Reports accuracy separately for the whole test set, for the
     synthetic-only test rows, and for the real_kaggle-only test rows,
     so the honest, weaker real-world number isn't hidden behind the
     inflated synthetic-heavy blended number.
  3. Saves those metrics INTO the model bundle (bundle['eval_metrics'])
     so the API can report them (see /api/health) instead of the app
     just asserting an accuracy figure nobody can check.

This does NOT fix the dataset's fundamental limitation: with only 5
real-world species and 70 rows/species overall, this is a small
dataset for 31-way classification. Treat any accuracy number here as
"how well the model fits this dataset's structure", not as a
guarantee of real-world planting-recommendation quality -- especially
for the 26 synthetic-only species.
"""
from pathlib import Path
import json

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

ROOT = Path(__file__).parent
CSV_PATH = ROOT / "final_training_dataset.csv"
MODEL_DIR = ROOT.parent / "model"
MODEL_PATH = MODEL_DIR / "trained_model.pkl"
BACKUP_PATH = MODEL_DIR / "trained_model_original_backup.pkl"
METRICS_PATH = ROOT / "model_eval_metrics.json"

RANDOM_STATE = 42
TEST_SIZE = 0.2  # 20% held out, stratified by species -> ~14 rows/species


def main():
    df = pd.read_csv(CSV_PATH)

    soil_encoder = LabelEncoder().fit(df["soil_type"].astype(str))
    species_encoder = LabelEncoder().fit(df["species"].astype(str))

    df = df.copy()
    df["soil_type_encoded"] = soil_encoder.transform(df["soil_type"].astype(str))
    df["species_encoded"] = species_encoder.transform(df["species"].astype(str))

    feature_cols = ["soil_ph", "rainfall_mm", "temperature_c", "soil_type_encoded", "N", "P", "K"]
    X = df[feature_cols]
    y = df["species_encoded"]

    # Stratified split by species so every species is represented in both
    # train and test, and so test rows are never seen during fitting.
    X_train, X_test, y_train, y_test, df_train, df_test = train_test_split(
        X, y, df, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        max_features="sqrt",
        random_state=RANDOM_STATE,
    )
    model.fit(X_train, y_train)

    train_pred = model.predict(X_train)
    test_pred = model.predict(X_test)

    train_accuracy = accuracy_score(y_train, train_pred)
    test_accuracy = accuracy_score(y_test, test_pred)

    # Break the held-out accuracy down by data source so the honest,
    # harder real_kaggle number isn't hidden behind the easier synthetic one.
    test_mask_real = (df_test["data_source"] == "real_kaggle").to_numpy()
    test_mask_synth = (df_test["data_source"] == "synthetic_generated").to_numpy()

    metrics = {
        "random_state": RANDOM_STATE,
        "test_size_fraction": TEST_SIZE,
        "n_train_rows": int(len(X_train)),
        "n_test_rows": int(len(X_test)),
        "train_accuracy": round(float(train_accuracy), 4),
        "test_accuracy_overall": round(float(test_accuracy), 4),
        "test_accuracy_synthetic_species_only": (
            round(float(accuracy_score(y_test[test_mask_synth], test_pred[test_mask_synth])), 4)
            if test_mask_synth.any() else None
        ),
        "test_accuracy_real_kaggle_species_only": (
            round(float(accuracy_score(y_test[test_mask_real], test_pred[test_mask_real])), 4)
            if test_mask_real.any() else None
        ),
        "n_species_total": int(df["species"].nunique()),
        "n_species_real_kaggle": int(df[df["data_source"] == "real_kaggle"]["species"].nunique()),
        "n_species_synthetic_only": int(df["species"].nunique()) - int(df[df["data_source"] == "real_kaggle"]["species"].nunique()),
        "caveat": (
            "26 of 31 species have no real-world (Kaggle) rows in this dataset -- "
            "their feature ranges were synthetically generated with little to no "
            "overlap between species, which inflates accuracy on those species "
            "relative to what a real deployment would likely see. Treat "
            "test_accuracy_real_kaggle_species_only as the more trustworthy figure "
            "and test_accuracy_overall as optimistic."
        ),
    }

    print(json.dumps(metrics, indent=2))

    # Refit on the FULL dataset for the shipped model (standard practice once
    # you've validated architecture/hyperparameters on the held-out split),
    # but the bundle still reports the held-out metrics above, not a
    # full-data-fit number, so the reported accuracy stays honest.
    final_model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        max_features="sqrt",
        random_state=RANDOM_STATE,
    )
    final_model.fit(X, y)

    species_to_category = (
        df.drop_duplicates("species").set_index("species")["category"].to_dict()
    )

    bundle = {
        "model": final_model,
        "soil_encoder": soil_encoder,
        "species_encoder": species_encoder,
        "species_to_category": species_to_category,
        "eval_metrics": metrics,
    }

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    if MODEL_PATH.exists() and not BACKUP_PATH.exists():
        import shutil
        shutil.copy(MODEL_PATH, BACKUP_PATH)
        print(f"Backed up previous model to {BACKUP_PATH}")

    joblib.dump(bundle, MODEL_PATH)
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"Saved retrained model to {MODEL_PATH}")
    print(f"Saved metrics to {METRICS_PATH}")


if __name__ == "__main__":
    main()
