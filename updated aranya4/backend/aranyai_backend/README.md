# AranyaAI backend — first integration stage

This backend is built around the supplied `trained_model.pkl` and the supplied 2,170-row dataset.

## Verified model contract
- Model: RandomForestClassifier
- n_estimators: 200
- max_depth: 12
- random_state: 42
- Input features (exact order): soil_ph, rainfall_mm, temperature_c, soil_type_encoded, N, P, K
- Soil encoder classes: Alluvial, Laterite, Loamy, Red loam, Rocky, Sandy loam
- Species classes: 31

## Run on Windows
```bat
cd aranyai_backend
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
If 8000 is already taken, `--port 8001` works too — CORS now accepts
any `localhost`/`127.0.0.1` port (see `main.py`), and the frontend
auto-probes 8000 then 8001 on load, so you don't need to hardcode a
port on either side. If you use a different port than both of those,
set it explicitly from the browser console once: `localStorage.setItem
('aranyaApiBase', 'http://127.0.0.1:<port>')`.

API docs: http://127.0.0.1:8000/docs

## Model accuracy — read this before quoting a number
`GET /api/health` now returns `eval_metrics`, computed by
`data/train_model.py` from a stratified 80/20 train/test split (not
measured on training data). Re-run it any time the dataset changes:
```bat
cd data
python train_model.py
```
The headline `test_accuracy_overall` is still high (~98%), but that's
largely because 26 of the 31 species only have synthetic rows with
non-overlapping feature ranges per species (see the script's docstring
and `caveat` field in the output). `test_accuracy_real_kaggle_species_only`
— computed only on the 5 species with real Kaggle-sourced data — is the
more trustworthy figure. Don't advertise the overall number without that
context; it currently overstates how the model would perform on species
whose real-world feature ranges actually overlap.

## Important
`SECRET_KEY` is read from the `ARANYA_SECRET_KEY` environment variable. If it is not set, the backend creates a random key once and stores it in a local `.aranya_secret` file next to `auth.py` (do not share or commit that file). Logging out invalidates the token that was used, and 8 wrong password attempts per email and address lock login for 10 minutes.

## Admin login

AranyaAI Admin access is restricted to these two project emails:
- archanabms123@gmail.com
- 255shalinis@gmail.com

Admin accounts are created locally with `setup_admin.py` and sign in with email and password only. Passwords are stored as salted scrypt hashes; choose them locally and never put them in source files or share them in chat.
