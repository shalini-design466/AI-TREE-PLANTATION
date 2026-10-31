AranyaAI - ONE server for frontend + backend
============================================
Windows:  double-click run.bat   (or in CMD:  run.bat)
Open:     http://127.0.0.1:8000        (also opens automatically)
API docs: http://127.0.0.1:8000/docs

Manual (CMD), from this folder:
  cd backend\aranyai_backend
  python -m venv venv
  venv\Scripts\activate
  pip install -r requirements.txt
  uvicorn main:app --host 127.0.0.1 --port 8000

Then open http://127.0.0.1:8000 - do NOT start a second server on 5500.

ADMIN SETUP (ONE TIME)
----------------------
Admin registration is disabled. After extracting the project, open a terminal in
backend/aranyai_backend and run:

    python setup_admin.py

The script securely creates/updates the two authorized Admin accounts:
    archanabms123@gmail.com
    255shalinis@gmail.com

Choose the passwords locally. Passwords are entered invisibly and stored only as
salted scrypt hashes. Never paste the passwords into chat or source files.

ADMIN FEATURES
--------------
The Admin Command Center provides dashboard KPIs, activity charts, species
management, user management, reports/analytics, CSV export and Admin password
settings. Admin routes are protected by the stored role plus the two authorized
email addresses.

MULTILINGUAL INTERFACE
----------------------
The frontend includes a local language selector for English, Kannada, Hindi,
Telugu and Tamil. It does not require a translation API or API key.

FORGOT PASSWORD
- Click "Forgot password?" on the login page, enter your email, then enter the 6-digit code and a new password.
- By default the code is printed in the backend console window (no email account needed).
- To email it instead, set ARANYA_SMTP_HOST / PORT / USER / PASSWORD (see backend/.env.example).
- Admin accounts are not affected (admin stays password-only).
