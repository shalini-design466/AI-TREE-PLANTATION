import json
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
df = pd.read_csv(ROOT / 'data' / 'final_training_dataset.csv')
records = []
for species, g in df.groupby('species', sort=True):
    row = g.iloc[0]
    records.append({
        'name': species,
        'category': str(row['category']),
        'duration_months': int(row['duration_months']),
        'soil_types': sorted(g['soil_type'].astype(str).unique().tolist()),
        'soil_ph_range': [float(g['soil_ph'].min()), float(g['soil_ph'].max())],
        'rainfall_mm_range': [float(g['rainfall_mm'].min()), float(g['rainfall_mm'].max())],
        'temperature_c_range': [float(g['temperature_c'].min()), float(g['temperature_c'].max())],
        'N_range': [float(g['N'].min()), float(g['N'].max())],
        'P_range': [float(g['P'].min()), float(g['P'].max())],
        'K_range': [float(g['K'].min()), float(g['K'].max())],
        'regions': sorted(g['region'].astype(str).unique().tolist()),
        'altitude_m_range': [float(g['altitude_m'].min()), float(g['altitude_m'].max())],
        'investment_per_acre_inr_range': [float(g['investment_per_acre_inr'].min()), float(g['investment_per_acre_inr'].max())],
        'profit_per_acre_inr_range': [float(g['profit_per_acre_inr'].min()), float(g['profit_per_acre_inr'].max())],
        'data_sources': sorted(g['data_source'].astype(str).unique().tolist()),
        'image': f"assets/species/{species.lower().replace(' ', '-').replace('/', '-')}.jpg",
        'knowledge': {
            'scientific_name': None,
            'benefits': [],
            'planting_steps': [],
            'irrigation': [],
            'fertilizer': [],
            'pest_management': [],
            'maintenance': [],
            'intercrops': [],
            'supporting_tree': None,
            'supporting_tree_rule': None,
        },
    })
with open(ROOT / 'data' / 'species_catalog.json', 'w', encoding='utf-8') as f:
    json.dump(records, f, indent=2, ensure_ascii=False)
print(f'Wrote {len(records)} species')
