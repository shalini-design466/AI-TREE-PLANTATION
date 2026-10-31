from pathlib import Path
import json, math, os, time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from collections import Counter
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from datetime import timedelta
import hashlib, hmac, secrets
from database import Base, engine, User, ActivityLog, RecommendationEvent, PasswordReset, get_db
from mailer import send_reset_code, email_configured
from schemas import RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest, RecommendationRequest, PlantationRequest, TokenResponse
from auth import hash_password, verify_password, create_token, current_user, revoke_token, bearer
from model_service import get_bundle, recommend

ROOT = Path(__file__).parent
SPECIES_PATH = ROOT / 'data' / 'species_catalog.json'
with open(SPECIES_PATH, encoding='utf-8') as f:
    SPECIES = json.load(f)
SPECIES_BY_NAME = {x['name']: x for x in SPECIES}
ADMIN_EMAILS = {'archanabms123@gmail.com', '255shalinis@gmail.com'}

@asynccontextmanager
async def lifespan(app_):
    get_bundle()  # load the model once at startup (database tables are created in database.py)
    yield

app = FastAPI(title='AranyaAI API', version='2.0.0', lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=['http://localhost:5500','http://127.0.0.1:5500','http://localhost:8000','http://127.0.0.1:8000'], allow_origin_regex=r'http://(localhost|127\.0\.0\.1):\d+', allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

def log_activity(db, user_id, action, details=None):
    db.add(ActivityLog(user_id=user_id, action=action, details=details))
    db.commit()

def require_admin(user: User = Depends(current_user)) -> User:
    if user.role != 'admin' or user.email.lower() not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail='Admin access required')
    return user

def user_dict(user):
    return {'id':user.id,'name':user.name,'email':user.email,'phone':user.phone,'purpose':user.purpose,'region':user.region,'role':user.role}

@app.get('/api/health')
def health():
    bundle=get_bundle()
    return {'status':'ok','model':type(bundle['model']).__name__,'model_features':list(bundle['model'].feature_names_in_),'species_count':len(bundle['species_encoder'].classes_),'soil_types':list(bundle['soil_encoder'].classes_),'eval_metrics':bundle.get('eval_metrics')}

@app.post('/api/register', response_model=TokenResponse)
def register(req:RegisterRequest, db:Session=Depends(get_db)):
    if req.role != 'user':
        raise HTTPException(status_code=403, detail='Admin accounts are created securely by the project administrator. Admin registration is disabled.')
    email=req.email.lower()
    if db.query(User).filter(User.email==email).first():
        raise HTTPException(status_code=409, detail='An account with this email already exists')
    user=User(name=req.name.strip(),email=email,phone=req.phone,password_hash=hash_password(req.password),purpose=req.purpose,region=req.region,role='user')
    db.add(user)
    try:
        db.commit(); db.refresh(user)
        log_activity(db,user.id,'registration','Normal user account created')
    except IntegrityError:
        db.rollback(); raise HTTPException(status_code=409, detail='An account with this email already exists')
    return {'access_token':create_token(user.id),'user':user_dict(user)}

# Simple in-memory brake on password guessing: 8 wrong tries per email+address per 10 minutes.
_LOGIN_FAILS={}
LOGIN_MAX_FAILS=8
LOGIN_WINDOW_SECONDS=600

@app.post('/api/login', response_model=TokenResponse)
def login(req:LoginRequest, request:Request, db:Session=Depends(get_db)):
    email=req.email.lower(); user=db.query(User).filter(User.email==email).first()
    fail_key=email+'|'+(request.client.host if request.client else '')
    now=time.time(); recent=[x for x in _LOGIN_FAILS.get(fail_key,[]) if now-x<LOGIN_WINDOW_SECONDS]; _LOGIN_FAILS[fail_key]=recent
    if len(recent)>=LOGIN_MAX_FAILS:
        raise HTTPException(status_code=429, detail='Too many failed login attempts. Please wait 10 minutes and try again.')
    if not user or not verify_password(req.password,user.password_hash):
        _LOGIN_FAILS[fail_key].append(now)
        raise HTTPException(status_code=401, detail='Invalid email or password')
    _LOGIN_FAILS.pop(fail_key,None)
    if user.role=='admin' and email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail='This Admin account is not authorized')
    log_activity(db,user.id,'login','Admin login' if user.role=='admin' else 'User login')
    return {'access_token':create_token(user.id),'user':user_dict(user)}

RESET_MINUTES=15
RESET_MAX_ATTEMPTS=5
_RESET_REQUESTS={}

def _hash_code(code:str)->str:
    return hashlib.sha256(code.encode()).hexdigest()

@app.post('/api/forgot-password')
def forgot_password(req:ForgotPasswordRequest, request:Request, db:Session=Depends(get_db)):
    configured=email_configured()
    generic={'message':'If an account exists for this email, a 6-digit reset code has been sent to it. It is valid for 15 minutes.' if configured else 'Email sending is not set up on this server yet, so no email can be delivered. The administrator can read the 6-digit code in the backend window, or set up email in the .env file (see .env.example).','email_configured':configured}
    email=req.email.lower()
    key=email+'|'+(request.client.host if request.client else '')
    now=time.time(); recent=[x for x in _RESET_REQUESTS.get(key,[]) if now-x<600]
    if len(recent)>=3:
        raise HTTPException(status_code=429, detail='Too many reset requests. Please wait 10 minutes and try again.')
    recent.append(now); _RESET_REQUESTS[key]=recent
    user=db.query(User).filter(User.email==email).first()
    # Same reply whether or not the account exists. Admin accounts stay password-only/unchanged.
    if not user or user.role!='user':
        return generic
    code=f'{secrets.randbelow(1000000):06d}'
    db.query(PasswordReset).filter(PasswordReset.user_id==user.id,PasswordReset.used==0).update({'used':1})
    db.add(PasswordReset(user_id=user.id,code_hash=_hash_code(code),expires_at=datetime.now(timezone.utc)+timedelta(minutes=RESET_MINUTES)))
    db.commit()
    send_reset_code(user.email,code)
    log_activity(db,user.id,'password_reset_requested','Reset code issued')
    return generic

@app.post('/api/reset-password')
def reset_password(req:ResetPasswordRequest, db:Session=Depends(get_db)):
    bad=HTTPException(status_code=400, detail='Invalid or expired reset code. Please request a new one.')
    user=db.query(User).filter(User.email==req.email.lower()).first()
    if not user or user.role!='user':
        raise bad
    row=db.query(PasswordReset).filter(PasswordReset.user_id==user.id,PasswordReset.used==0).order_by(PasswordReset.id.desc()).first()
    if not row:
        raise bad
    expires=row.expires_at if row.expires_at.tzinfo else row.expires_at.replace(tzinfo=timezone.utc)
    if expires<datetime.now(timezone.utc) or row.attempts>=RESET_MAX_ATTEMPTS:
        row.used=1; db.commit(); raise bad
    if not hmac.compare_digest(row.code_hash,_hash_code(req.code)):
        row.attempts+=1
        if row.attempts>=RESET_MAX_ATTEMPTS: row.used=1
        db.commit(); raise bad
    user.password_hash=hash_password(req.new_password)
    row.used=1; db.commit()
    log_activity(db,user.id,'password_reset','Password reset with emailed code')
    return {'message':'Password updated. You can now log in with your new password.'}

@app.post('/api/logout')
def logout(user:User=Depends(current_user), credentials=Depends(bearer), db:Session=Depends(get_db)):
    revoke_token(credentials)
    log_activity(db,user.id,'logout','User logged out')
    return {'message':'Logged out'}

@app.get('/api/me')
def me(user:User=Depends(current_user)):
    return user_dict(user)

@app.get('/api/species')
def species_list(): return SPECIES

@app.get('/api/species/{name}')
def species_detail(name:str):
    if name not in SPECIES_BY_NAME: raise HTTPException(status_code=404, detail='Species not found')
    return SPECIES_BY_NAME[name]

@app.post('/api/recommend')
def recommendation(req:RecommendationRequest,user:User=Depends(current_user),db:Session=Depends(get_db)):
    try: all_results=recommend(req.model_dump(),top_k=len(SPECIES))
    except ValueError as exc: raise HTTPException(status_code=422,detail=str(exc))
    if req.planting_space:
        all_results=[item for item in all_results if req.planting_space in SPECIES_BY_NAME.get(item['species'],{}).get('space_suitability',[])]
    results=all_results[:3]
    for rank,item in enumerate(results,1): item['rank']=rank; item['species_data']=SPECIES_BY_NAME.get(item['species'])
    db.add(RecommendationEvent(user_id=user.id,selected_species=None,recommended_species=json.dumps([x['species'] for x in results]),inputs=json.dumps(req.model_dump())))
    log_activity(db,user.id,'recommendation',json.dumps({'top_species':[x['species'] for x in results]}))
    return {'inputs':req.model_dump(),'recommendations':results}

# ---- Plot-size rule: bigger plots may hold more commercial species -------------------
# One species per 80 sq ft of land, at least 1 and at most 8 (so a 20 x 20 ft plot = 400 sq ft
# allows at most 5 species). The same rule is applied in the browser (js/script.js).
SQFT_PER_SPECIES=80
MAX_SPECIES_CAP=8
M2_TO_SQFT=10.7639104167

def max_species_for_area_sqft(area_sqft:float)->int:
    return max(1,min(MAX_SPECIES_CAP,int(math.floor(round(area_sqft,2)/SQFT_PER_SPECIES+1e-6))))

@app.post('/api/plantation/calculate')
def plantation(req:PlantationRequest,user:User=Depends(current_user),db:Session=Depends(get_db)):
    unknown=[s for s in req.species if s not in SPECIES_BY_NAME]
    if unknown: raise HTTPException(status_code=404,detail=f'Species not found in catalog: {", ".join(unknown)}')
    area_sqft=req.length_m*req.width_m*M2_TO_SQFT
    allowed=max_species_for_area_sqft(area_sqft)
    if len(req.species)>allowed:
        raise HTTPException(status_code=422,detail=f'Your plot is about {round(area_sqft):,} sq ft, which allows at most {allowed} commercial species (1 species for every {SQFT_PER_SPECIES} sq ft, up to {MAX_SPECIES_CAP}). You selected {len(req.species)}. Please remove {len(req.species)-allowed} species or use a bigger plot.')
    span_length=req.length_m-2*req.boundary_gap_m; span_width=req.width_m-2*req.boundary_gap_m
    usable_length=max(0.0,span_length); usable_width=max(0.0,span_width)
    # Trees stand ON the spacing grid (first and last at the edges of the usable area), so a span of S metres at spacing s holds floor(S/s)+1 positions.
    rows=math.floor(usable_width/req.row_spacing_m+1e-9)+1 if span_width>=0 else 0
    trees_per_row=math.floor(usable_length/req.tree_spacing_m+1e-9)+1 if span_length>=0 else 0
    total_trees=rows*trees_per_row
    weights=req.ratios if req.ratios else [1.0]*len(req.species)
    if len(weights)!=len(req.species) or any(r<=0 for r in weights): raise HTTPException(status_code=422,detail='ratios must match species and be positive')
    weight_sum=sum(weights); raw=[rows*w/weight_sum for w in weights]; alloc=[int(x) for x in raw]; remainder=rows-sum(alloc)
    for i in sorted(range(len(req.species)),key=lambda i:raw[i]-alloc[i],reverse=True)[:remainder]: alloc[i]+=1
    bands=[]; cursor=0
    for name,nrows in zip(req.species,alloc):
        bands.append({'species':name,'rows':nrows,'trees':nrows*trees_per_row,'row_start':cursor,'row_end':cursor+nrows}); cursor+=nrows
    warning='More species selected than planting rows: some species got no rows. Select fewer species or increase the plot size.' if len(req.species)>rows else None
    db.add(RecommendationEvent(user_id=user.id,selected_species=json.dumps(req.species),recommended_species=None,inputs=json.dumps(req.model_dump())))
    log_activity(db,user.id,'plantation_plan',json.dumps({'species':req.species,'total_trees':total_trees}))
    return {'species':req.species,'bands':bands,'land_area_m2':round(req.length_m*req.width_m,2),'usable_area_m2':round(usable_length*usable_width,2),'usable_length_m':round(usable_length,2),'usable_width_m':round(usable_width,2),'rows':rows,'trees_per_row':trees_per_row,'total_trees':total_trees,'tree_spacing_m':req.tree_spacing_m,'row_spacing_m':req.row_spacing_m,'boundary_gap_m':req.boundary_gap_m,'warning':warning,'max_species_allowed':allowed,'land_area_sqft':round(area_sqft,1),'note':'This is a geometric planting-position estimate; verify final agronomic spacing locally.'}

class PasswordChange(BaseModel):
    current_password:str
    new_password:str=Field(min_length=8,max_length=128)

class SpeciesUpdate(BaseModel):
    duration_months:float|None=None
    image:str|None=None
    water:str|None=None
    leaf:str|None=None
    climate:str|None=None
    insect:str|None=None
    profit_per_acre_inr:float|None=None

@app.get('/api/admin/overview')
def admin_overview(admin:User=Depends(require_admin),db:Session=Depends(get_db)):
    users=db.query(User).order_by(User.id.desc()).all()
    logs=db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(250).all()
    events=db.query(RecommendationEvent).order_by(RecommendationEvent.created_at.desc()).all()
    top=Counter()
    selected=Counter()
    for e in events:
        for field,c in [(e.recommended_species,top),(e.selected_species,selected)]:
            if field:
                try:
                    for n in json.loads(field): c[n]+=1
                except Exception: pass
    action_counts=Counter(x.action for x in logs)
    daily=Counter(x.created_at.date().isoformat() for x in logs if x.created_at)
    return {'stats':{'total_users':len(users),'normal_users':sum(u.role!='admin' for u in users),'admin_users':sum(u.role=='admin' for u in users),'total_recommendations':sum(1 for e in events if e.recommended_species),'plantation_plans':sum(1 for e in events if e.selected_species),'active_today':len({x.user_id for x in logs if x.created_at and x.created_at.date()==datetime.now(timezone.utc).date()}),'species_count':len(SPECIES)},'top_recommended_species':[{'name':n,'count':c} for n,c in top.most_common(10)],'top_selected_species':[{'name':n,'count':c} for n,c in selected.most_common(10)],'activity_breakdown':dict(action_counts),'daily_activity':[{'date':d,'count':daily[d]} for d in sorted(daily)[-14:]],'users':[{'id':u.id,'name':u.name,'email':u.email,'phone':u.phone,'purpose':u.purpose,'region':u.region,'role':u.role} for u in users],'recent_activity':[{'id':x.id,'user_id':x.user_id,'action':x.action,'details':x.details,'created_at':x.created_at.isoformat() if x.created_at else None} for x in logs[:50]]}

@app.get('/api/admin/species')
def admin_species(admin:User=Depends(require_admin)):
    return SPECIES

@app.put('/api/admin/species/{name}')
def update_species(name:str,req:SpeciesUpdate,admin:User=Depends(require_admin),db:Session=Depends(get_db)):
    if name not in SPECIES_BY_NAME: raise HTTPException(status_code=404,detail='Species not found')
    item=SPECIES_BY_NAME[name]; data=req.model_dump(exclude_none=True)
    if 'duration_months' in data: item['duration_months']=data['duration_months']
    if 'image' in data: item['image']=data['image']
    k=item.setdefault('knowledge',{})
    for key in ['water','leaf','climate','insect']:
        if key in data: k[key]=data[key]
    if 'profit_per_acre_inr' in data: item['profit_per_acre_inr_range']=[data['profit_per_acre_inr'],data['profit_per_acre_inr']]
    SPECIES_PATH.write_text(json.dumps(SPECIES,ensure_ascii=False,indent=2),encoding='utf-8')
    SPECIES_BY_NAME.clear(); SPECIES_BY_NAME.update({x['name']:x for x in SPECIES})
    log_activity(db,admin.id,'species_update',json.dumps({'species':name,'fields':list(data)}))
    return SPECIES_BY_NAME[name]

@app.get('/api/admin/reports')
def admin_reports(admin:User=Depends(require_admin),db:Session=Depends(get_db)):
    users=db.query(User).all(); events=db.query(RecommendationEvent).all(); logs=db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).all()
    user_activity=Counter(e.user_id for e in events if e.user_id)
    return {'users_by_purpose':dict(Counter(u.purpose for u in users)),'users_by_region':dict(Counter(u.region or 'Not provided' for u in users)),'recommendations_by_user':[{'user_id':uid,'events':count} for uid,count in user_activity.most_common()], 'recent_reports':[{'user_id':e.user_id,'selected_species':json.loads(e.selected_species) if e.selected_species else [],'recommended_species':json.loads(e.recommended_species) if e.recommended_species else [],'created_at':e.created_at.isoformat()} for e in events[-100:]], 'activity_total':len(logs)}

@app.post('/api/admin/change-password')
def admin_change_password(req:PasswordChange,admin:User=Depends(require_admin),db:Session=Depends(get_db)):
    if not verify_password(req.current_password,admin.password_hash): raise HTTPException(status_code=401,detail='Current password is incorrect')
    admin.password_hash=hash_password(req.new_password); db.commit(); log_activity(db,admin.id,'password_change','Admin password changed'); return {'message':'Password changed successfully'}

_frontend_candidates=[os.environ.get('ARANYA_FRONTEND_DIR',''),str(ROOT.parent.parent/'frontend'/'aranyai_frontend_integrated'),str(ROOT/'frontend')]
for _dir in _frontend_candidates:
    if _dir and Path(_dir,'index.html').exists(): app.mount('/',StaticFiles(directory=_dir,html=True),name='frontend'); break
