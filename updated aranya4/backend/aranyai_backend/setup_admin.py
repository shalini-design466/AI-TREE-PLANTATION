"""One-time local setup for the two authorized AranyaAI Admin accounts.
Passwords are entered locally and are stored only as scrypt hashes.
"""
from getpass import getpass
from database import Base, engine, SessionLocal, User
from auth import hash_password

ADMIN_EMAILS = ['archanabms123@gmail.com', '255shalinis@gmail.com']
Base.metadata.create_all(engine)

def read_password(label):
    while True:
        p = getpass(label)
        if len(p) < 8 or not any(c.isupper() for c in p) or not any(c.islower() for c in p) or not any(not c.isalnum() and not c.isspace() for c in p):
            print('Password must have 8+ characters, uppercase, lowercase and a special character.')
            continue
        q = getpass('Confirm password: ')
        if p != q:
            print('Passwords do not match. Try again.')
            continue
        return p

print('\nAranyaAI Admin Setup')
print('Admin registration is disabled. This local setup creates/updates only the two authorized Admin accounts.')
print('Never send these passwords to anyone or paste them into chat.\n')
db = SessionLocal()
try:
    for email in ADMIN_EMAILS:
        print(f'--- {email} ---')
        password = read_password('Choose Admin password (hidden): ')
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.password_hash = hash_password(password)
            user.role = 'admin'
            print('Existing account updated as Admin.')
        else:
            user = User(name=email.split('@')[0], email=email, phone=None, password_hash=hash_password(password), purpose='Admin', region=None, role='admin')
            db.add(user)
            print('Admin account created.')
        db.commit()
    print('\nAdmin setup complete. Use the normal Login page with email + password.')
finally:
    db.close()
