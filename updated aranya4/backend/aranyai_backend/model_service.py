from pathlib import Path
from typing import Any
import joblib
import numpy as np
import pandas as pd

MODEL_PATH = Path(__file__).parent / "model" / "trained_model.pkl"
_bundle: dict[str, Any] | None = None


def get_bundle() -> dict[str, Any]:
    global _bundle
    if _bundle is None:
        _bundle = joblib.load(MODEL_PATH)
    return _bundle


def _feature_frame(payload: dict[str, Any]) -> pd.DataFrame:
    bundle = get_bundle()
    soil = str(payload["soil_type"])
    encoder = bundle["soil_encoder"]
    known = set(map(str, encoder.classes_))
    if soil not in known:
        raise ValueError(f"Unsupported soil type: {soil}. Supported values: {sorted(known)}")
    encoded = int(encoder.transform([soil])[0])
    # Exact feature order stored by the trained model.
    return pd.DataFrame([{
        "soil_ph": float(payload["soil_ph"]),
        "rainfall_mm": float(payload["rainfall_mm"]),
        "temperature_c": float(payload["temperature_c"]),
        "soil_type_encoded": encoded,
        "N": float(payload["N"]),
        "P": float(payload["P"]),
        "K": float(payload["K"]),
    }])


def recommend(payload: dict[str, Any], top_k: int = 3) -> list[dict[str, Any]]:
    bundle = get_bundle()
    model = bundle["model"]
    species_encoder = bundle["species_encoder"]
    X = _feature_frame(payload)
    probabilities = model.predict_proba(X)[0]
    order = np.argsort(probabilities)[::-1][:top_k]
    results = []
    for rank, class_index in enumerate(order, start=1):
        species = str(species_encoder.inverse_transform([int(class_index)])[0])
        results.append({
            "rank": rank,
            "species": species,
            "probability": round(float(probabilities[class_index]), 6),
            "confidence_percent": round(float(probabilities[class_index]) * 100, 2),
            "category": bundle.get("species_to_category", {}).get(species),
        })
    return results
