import os
import shutil
from datetime import datetime, timedelta
from typing import List
import mimetypes
from pathlib import Path
from dotenv import load_dotenv

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Header
from fastapi.responses import FileResponse

load_dotenv(dotenv_path=Path(__file__).parent / ".env")
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError
from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText
import secrets
import string

from database import SessionLocal, engine
import models
import schemas
from text_extractor import extract_text_from_file
from services.ai_service import call_ai

models.Base.metadata.create_all(bind=engine)

# Add missing columns to existing database (safe migration)
from sqlalchemy import text as sa_text
try:
    with engine.connect() as conn:
        conn.execute(sa_text("ALTER TABLE users ADD COLUMN name VARCHAR DEFAULT ''"))
        conn.commit()
except Exception:
    pass
try:
    with engine.connect() as conn:
        conn.execute(sa_text("ALTER TABLE users ADD COLUMN bio VARCHAR DEFAULT ''"))
        conn.commit()
except Exception:
    pass
try:
    with engine.connect() as conn:
        conn.execute(sa_text("ALTER TABLE gap_analysis ADD COLUMN questions_data TEXT DEFAULT ''"))
        conn.commit()
except Exception:
    pass
try:
    with engine.connect() as conn:
        conn.execute(sa_text("ALTER TABLE files ADD COLUMN extracted_text TEXT DEFAULT ''"))
        conn.commit()
except Exception:
    pass

app = FastAPI(title="Backend Service")

# ================= CORS =================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= CONFIG =================
UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

SECRET_KEY = os.getenv("BACKEND_SECRET_KEY", "change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# ================= DB =================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ================= AUTH =================
def verify_password(p, h):
    return pwd_context.verify(p, h)


def hash_password(p):
    return pwd_context.hash(p)


def create_token(data: dict):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")

        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")

        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_admin(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = await get_current_user(token, db)
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ================= AI TRACKING =================
def track_ai_usage(db: Session, user_id: int, feature: str):
    usage = models.AIUsage(user_id=user_id, feature=feature)
    db.add(usage)
    db.commit()


def save_ai_result(db: Session, user_id: int, feature: str, input_data: dict, output_data: dict):
    log = models.Log(
        user_id=user_id,
        level=feature,
        message=str({
            "input": input_data,
            "output": output_data
        })
    )
    db.add(log)
    db.commit()


# ================= HELPERS =================
def get_document_text(document_id: int, user_id: int, db: Session) -> str:
    doc = db.query(models.File).filter(
        models.File.id == document_id,
        models.File.owner_id == user_id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not os.path.exists(doc.filepath):
        raise HTTPException(status_code=404, detail="File not found on disk")

    if doc.extracted_text and doc.extracted_text.strip():
        return doc.extracted_text

    # Fallback: try reading .txt directly from disk
    if doc.filename.lower().endswith('.txt'):
        try:
            with open(doc.filepath, 'r', encoding='utf-8', errors='ignore') as f:
                txt_text = f.read()
            if txt_text.strip():
                doc.extracted_text = txt_text
                try: db.commit()
                except: db.rollback()
                return txt_text
        except Exception as e:
            print(f"[GET_DOC_TEXT] TXT fallback read failed: {e}")

    text = extract_text_from_file(doc.filepath)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from file")

    doc.extracted_text = text
    try:
        db.commit()
    except:
        db.rollback()

    return text


# ================= FORGOT PASSWORD / OTP =================
RESET_TOKENS: dict = {}

def send_email(to: str, subject: str, body: str):
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")

    if not smtp_host:
        print(f"[SSA-EMAIL] SMTP not configured. Would send to {to}: {subject} — {body}")
        return

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = to

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        print(f"[SSA-EMAIL] Sent to {to}")
    except Exception as e:
        print(f"[SSA-EMAIL] Failed: {e}")


@app.post("/forgot-password")
def forgot_password(data: dict, db: Session = Depends(get_db)):
    email = data.get("email", "")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        new_pass = secrets.token_urlsafe(8)
        user.hashed_password = hash_password(new_pass)
        db.commit()
        send_email(
            email,
            "Your New Password",
            f"Your new password is: {new_pass}\n\nPlease log in and change it."
        )
        print(f"[SSA-RESET] Password reset for {email}")
    return {"message": "If the email exists, a new password has been sent"}


# ================= AUTH ROUTES =================
@app.post("/token")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form.username).first()

    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Wrong credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    token = create_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(400, "Email exists")

    new_user = models.User(
        email=user.email,
        name=user.name or "",
        hashed_password=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/auth/google")
def google_auth(data: dict, db: Session = Depends(get_db)):
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google login not configured")

    id_token = data.get("credential", "")
    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests

    try:
        info = google_id_token.verify_oauth2_token(
            id_token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        email = info.get("email", "")
        if not email:
            raise HTTPException(status_code=400, detail="No email from Google")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(
            email=email,
            hashed_password=hash_password(secrets.token_urlsafe(16))
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "is_new": not db.query(models.User).filter(models.User.email == email).first() is None}


@app.get("/users/me")
def me(user=Depends(get_current_user)):
    return user


class TextUploadRequest(BaseModel):
    title: str
    content: str


class UpdateUserRequest(BaseModel):
    name: str | None = None
    email: str | None = None
    bio: str | None = None


@app.patch("/users/me")
def update_me(data: UpdateUserRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if data.name is not None:
        user.name = data.name
    if data.email is not None:
        user.email = data.email
    if data.bio is not None:
        user.bio = data.bio
    db.commit()
    db.refresh(user)
    return user


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@app.post("/users/me/change-password")
def change_password(data: ChangePasswordRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed"}


@app.get("/users/stats")
def user_stats(user=Depends(get_current_user), db: Session = Depends(get_db)):
    files_count = db.query(models.File).filter(models.File.owner_id == user.id).count()
    quizzes_count = db.query(models.AIUsage).filter(
        models.AIUsage.user_id == user.id,
        models.AIUsage.feature == "quiz"
    ).count()
    study_plans_count = db.query(models.AIUsage).filter(
        models.AIUsage.user_id == user.id,
        models.AIUsage.feature == "study_plan"
    ).count()

    return {
        "files": files_count,
        "quizzes": quizzes_count,
        "study_hours": study_plans_count * 2,
        "avg_score": "—"
    }


# ================= FILES =================
@app.post("/upload")
def upload(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    path = os.path.abspath(os.path.join(UPLOAD_DIR, file.filename))

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    db_file = models.File(
        filename=file.filename,
        filepath=path,
        owner_id=user.id
    )

    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return {"file_id": db_file.id, "filename": file.filename}


@app.post("/upload/text")
def upload_text(
    data: TextUploadRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    safe_name = data.title.strip().replace(" ", "_").replace("/", "_")[:50] or "untitled"
    filename = f"{safe_name}.txt"
    path = os.path.abspath(os.path.join(UPLOAD_DIR, filename))

    with open(path, "w", encoding="utf-8") as f:
        f.write(data.content)
        f.flush()
        os.fsync(f.fileno())

    existing = db.query(models.File).filter(
        models.File.filename == filename,
        models.File.owner_id == user.id
    ).first()
    if existing:
        existing.extracted_text = data.content
        existing.filepath = path
        db.commit()
        db.refresh(existing)
        return {"file_id": existing.id, "filename": filename}

    db_file = models.File(
        filename=filename,
        filepath=path,
        owner_id=user.id,
        extracted_text=data.content
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return {"file_id": db_file.id, "filename": filename}


@app.get("/files")
def get_files(user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.File).filter(models.File.owner_id == user.id).all()


@app.get("/files/{file_id}/download")
def download_file(
    file_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_file = db.query(models.File).filter(
        models.File.id == file_id,
        models.File.owner_id == user.id
    ).first()

    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    if not os.path.exists(db_file.filepath):
        raise HTTPException(status_code=404, detail="File not found on disk")

    media_type, _ = mimetypes.guess_type(db_file.filename)
    return FileResponse(
        db_file.filepath,
        media_type=media_type or "application/octet-stream",
        filename=db_file.filename
    )


@app.delete("/files/{file_id}")
def delete_file(file_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_file = db.query(models.File).filter(
        models.File.id == file_id,
        models.File.owner_id == user.id
    ).first()

    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    if os.path.exists(db_file.filepath):
        os.remove(db_file.filepath)

    db.delete(db_file)
    db.commit()

    return {"message": "File deleted"}


# ================= AI GATEWAY =================
@app.post("/summary")
def summary(data: schemas.SummaryRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    text = get_document_text(data.document_id, user.id, db)

    track_ai_usage(db, user.id, "summary")

    result = call_ai("summarize", {
        "text": text,
        "language": data.language if hasattr(data, 'language') else "ar",
        "detail_level": data.detail_level if hasattr(data, 'detail_level') else "short"
    })
    save_ai_result(db, user.id, "summary", {"document_id": data.document_id}, result)

    return result


@app.post("/quiz")
def quiz(data: schemas.QuizRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    text = get_document_text(data.document_id, user.id, db)

    track_ai_usage(db, user.id, "quiz")

    result = call_ai("generate-comprehensive-test", {
        "text": text,
        "language": data.language if hasattr(data, 'language') else "ar",
        "subject_title": data.subject_title if hasattr(data, 'subject_title') else "Study Material",
        "num_questions": data.num_questions if hasattr(data, 'num_questions') else 5
    })
    save_ai_result(db, user.id, "quiz", {"document_id": data.document_id}, result)

    return result


@app.post("/flashcards")
def flashcards(data: schemas.FlashcardsRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    text = get_document_text(data.document_id, user.id, db)
    track_ai_usage(db, user.id, "flashcards")

    result = call_ai("generate-flashcards", {
        "text": text,
        "language": data.language if hasattr(data, 'language') else "ar",
        "subject_title": data.subject_title if hasattr(data, 'subject_title') else "Study Material",
        "num_cards": data.num_cards if hasattr(data, 'num_cards') else 20
    })
    save_ai_result(db, user.id, "flashcards", {"document_id": data.document_id}, result)

    return result


@app.post("/study-plan")
def study_plan(data: schemas.StudyPlanRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    text = get_document_text(data.document_id, user.id, db)

    track_ai_usage(db, user.id, "study_plan")

    result = call_ai("generate-study-plan", {
        "text": text,
        "days": data.days,
        "language": data.language if hasattr(data, 'language') else "ar",
        "subject_title": data.subject_title if hasattr(data, 'subject_title') else "Study Material"
    })
    save_ai_result(db, user.id, "study_plan", {"document_id": data.document_id, "days": data.days}, result)

    return result


@app.post("/mind-map")
def mind_map(data: schemas.MindMapRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    text = get_document_text(data.document_id, user.id, db)
    track_ai_usage(db, user.id, "mind_map")
    result = call_ai("generate-mind-map", {
        "text": text,
        "language": data.language if hasattr(data, 'language') else "ar",
        "subject_title": data.subject_title if hasattr(data, 'subject_title') else "Study Material"
    })
    save_ai_result(db, user.id, "mind_map", {"document_id": data.document_id}, result)
    return result


@app.post("/chat")
def chat(data: schemas.ChatRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    track_ai_usage(db, user.id, "chat")

    document_text = ""
    if data.document_id:
        try:
            document_text = get_document_text(data.document_id, user.id, db)
        except HTTPException:
            pass

    result = call_ai("chat", {
        "user_message": data.message,
        "document_text": document_text,
        "conversation_history": data.conversation_history if hasattr(data, 'conversation_history') else [],
        "language": data.language if hasattr(data, 'language') else "en"
    })
    save_ai_result(db, user.id, "chat", {"message": data.message, "document_id": data.document_id}, result)

    return result


import json as json_lib


@app.post("/gap-analysis/start")
def start_gap_analysis(data: schemas.GapAnalysisStartRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    text = get_document_text(data.document_id, user.id, db)
    track_ai_usage(db, user.id, "gap_analysis")
    result = call_ai("analyze-knowledge-gaps", {
        "text": text,
        "language": data.language,
        "subject_title": "Study Material"
    })
    topics = result.get("topics", [])
    all_questions = []
    for topic in topics:
        for q in topic.get("questions", []):
            q["topic"] = topic["name"]
            all_questions.append(q)
    client_questions = []
    for q in all_questions:
        client_questions.append({
            "question_text": q["question_text"],
            "options": q["options"],
            "topic": q["topic"],
            "difficulty": q["difficulty"]
        })
    return {"questions": client_questions, "all_questions": all_questions}


@app.post("/gap-analysis/submit")
def submit_gap_analysis(data: dict, user=Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Expects JSON body: {questions: [full question objects with correct_answer], answers: [{question_index: int, selected: string}]}
    """
    questions = data.get("questions", [])
    answers = data.get("answers", [])
    language = data.get("language", "en")

    topic_results = {}
    correct_count = 0

    for ans in answers:
        qi = ans.get("question_index")
        selected = ans.get("selected", "")
        q = questions[qi] if qi < len(questions) else None
        if not q:
            continue
        topic = q.get("topic", "Unknown")
        correct = selected == q.get("correct_answer", "")
        if topic not in topic_results:
            topic_results[topic] = {"correct": 0, "total": 0}
        topic_results[topic]["total"] += 1
        if correct:
            topic_results[topic]["correct"] += 1
            correct_count += 1

    total = len(answers)
    score_pct = round((correct_count / max(total, 1)) * 100)

    red = []
    yellow = []
    green = []
    for topic, res in topic_results.items():
        pct = round((res["correct"] / max(res["total"], 1)) * 100)
        if pct < 50:
            red.append(topic)
        elif pct < 80:
            yellow.append(topic)
        else:
            green.append(topic)

    focus_parts = []
    if red:
        focus_parts.append(f"Focus on reviewing: {', '.join(red)} - these topics need significant review.")
    if yellow:
        focus_parts.append(f"Practice more: {', '.join(yellow)} - you have partial understanding.")
    if green:
        focus_parts.append(f"Maintain: {', '.join(green)} - you have good understanding of these topics.")
    focus_plan = " ".join(focus_parts)

    qa_list = []
    for ans in answers:
        qi = ans.get("question_index")
        selected = ans.get("selected", "")
        q = questions[qi] if qi < len(questions) else {}
        qa_list.append({
            "question_text": q.get("question_text", ""),
            "options": q.get("options", []),
            "topic": q.get("topic", ""),
            "difficulty": q.get("difficulty", ""),
            "correct_answer": q.get("correct_answer", ""),
            "user_answer": selected,
            "is_correct": selected == q.get("correct_answer", "")
        })

    ga = models.GapAnalysis(
        user_id=user.id,
        document_id=0,
        score_percent=score_pct,
        total_questions=total,
        correct_answers=correct_count,
        red_topics=json_lib.dumps(red),
        yellow_topics=json_lib.dumps(yellow),
        green_topics=json_lib.dumps(green),
        focus_plan=focus_plan,
        questions_data=json_lib.dumps(qa_list)
    )
    db.add(ga)
    db.commit()
    db.refresh(ga)

    return {
        "session_id": ga.id,
        "score_percent": score_pct,
        "correct": correct_count,
        "total": total,
        "red_topics": red,
        "yellow_topics": yellow,
        "green_topics": green,
        "focus_plan": focus_plan,
        "history": get_gap_history(user.id, db)
    }


def get_gap_history(user_id: int, db):
    sessions = db.query(models.GapAnalysis).filter(
        models.GapAnalysis.user_id == user_id
    ).order_by(models.GapAnalysis.created_at.desc()).limit(10).all()
    return [
        {"id": s.id, "score": s.score_percent, "correct": s.correct_answers,
         "total": s.total_questions, "date": str(s.created_at)[:19] if s.created_at else ""}
        for s in sessions
    ]


@app.get("/gap-analysis/history")
def gap_history(user=Depends(get_current_user), db: Session = Depends(get_db)):
    return get_gap_history(user.id, db)


@app.get("/gap-analysis/session/{session_id}")
def gap_session_detail(session_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(models.GapAnalysis).filter(
        models.GapAnalysis.id == session_id,
        models.GapAnalysis.user_id == user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "id": session.id,
        "score_percent": session.score_percent,
        "correct": session.correct_answers,
        "total": session.total_questions,
        "red_topics": json_lib.loads(session.red_topics) if session.red_topics else [],
        "yellow_topics": json_lib.loads(session.yellow_topics) if session.yellow_topics else [],
        "green_topics": json_lib.loads(session.green_topics) if session.green_topics else [],
        "focus_plan": session.focus_plan,
        "date": str(session.created_at)[:19] if session.created_at else "",
        "questions_data": json_lib.loads(session.questions_data) if session.questions_data else []
    }


class ProgressRequest(BaseModel):
    file_id: int
    day: int
    completed: bool


@app.post("/progress")
def update_progress(data: ProgressRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):

    log = models.Log(
        user_id=user.id,
        level="progress",
        message=str(data.dict())
    )

    db.add(log)
    db.commit()

    return {"status": "ok"}


# ================= ADMIN =================
@app.get("/admin/dashboard")
def admin_dashboard(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    total_users = db.query(models.User).count()
    total_docs = db.query(models.File).count()
    total_usage = db.query(models.AIUsage).count()

    usage_by_feature = db.query(
        models.AIUsage.feature, models.AIUsage.id
    ).all()
    feature_counts = {}
    for f, _ in usage_by_feature:
        feature_counts[f] = feature_counts.get(f, 0) + 1

    recent_logs = db.query(models.Log).order_by(
        models.Log.created_at.desc()
    ).limit(10).all()

    return {
        "total_users": total_users,
        "total_documents": total_docs,
        "total_ai_calls": total_usage,
        "feature_breakdown": feature_counts,
        "recent_logs": [
            {"id": log.id, "level": log.level, "message": log.message, "created_at": str(log.created_at)}
            for log in recent_logs
        ],
    }


@app.get("/admin/users")
def get_users(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    return db.query(models.User).all()


@app.patch("/admin/users/{user_id}")
def update_user(
    user_id: int,
    data: dict,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if "is_admin" in data:
        user.is_admin = bool(data["is_admin"])
    if "is_active" in data:
        user.is_active = bool(data["is_active"])

    db.commit()
    db.refresh(user)
    return user


@app.delete("/admin/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@app.get("/admin/ai-usage")
def ai_usage(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    return db.query(models.AIUsage).order_by(models.AIUsage.created_at.desc()).all()


@app.get("/admin/documents")
def admin_documents(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    files = db.query(models.File).order_by(models.File.upload_time.desc()).all()
    return [
        {
            "id": f.id,
            "filename": f.filename,
            "upload_time": str(f.upload_time),
            "owner_id": f.owner_id,
            "owner_email": f.owner.email if f.owner else None,
        }
        for f in files
    ]


@app.delete("/admin/documents/{file_id}")
def admin_delete_document(
    file_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    file = db.query(models.File).filter(models.File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="Document not found")

    if os.path.exists(file.filepath):
        os.remove(file.filepath)

    db.delete(file)
    db.commit()
    return {"message": "Document deleted"}


@app.get("/admin/analytics")
def admin_analytics(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    from datetime import timedelta

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    mau = db.query(models.AIUsage.user_id).filter(
        models.AIUsage.created_at >= thirty_days_ago
    ).distinct().count()

    total_docs = db.query(models.File).count()
    total_users = db.query(models.User).count()
    retention = round((mau / max(total_users, 1)) * 100) if total_users > 0 else 0

    # Weekly usage for growth trend
    today = datetime.utcnow()
    weekly_data = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = db.query(models.AIUsage).filter(
            models.AIUsage.created_at >= day_start,
            models.AIUsage.created_at < day_end
        ).count()
        weekly_data.append({
            "day": day.strftime("%a"),
            "value": count
        })

    # Feature distribution
    feature_counts = db.query(
        models.AIUsage.feature, models.AIUsage.id
    ).all()
    dist = {}
    for f, _ in feature_counts:
        dist[f] = dist.get(f, 0) + 1
    total = sum(dist.values()) or 1
    feature_distribution = [
        {"name": k.title(), "value": v, "percentage": round((v / total) * 100)}
        for k, v in dist.items()
    ]

    return {
        "mau": mau,
        "retention": retention,
        "docs_processed": total_docs,
        "weekly_growth": weekly_data,
        "feature_distribution": feature_distribution,
    }


@app.get("/admin/logs")
def admin_logs(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    logs = db.query(models.Log).order_by(models.Log.created_at.desc()).limit(100).all()
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "level": log.level,
            "message": log.message,
            "created_at": str(log.created_at),
        }
        for log in logs
    ]


# ================= ADMIN SETTINGS =================
@app.get("/admin/settings")
def get_settings(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    settings = db.query(models.Setting).all()
    return {s.key: s.value for s in settings}


@app.put("/admin/settings")
def update_settings(
    data: dict,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    for key, value in data.items():
        setting = db.query(models.Setting).filter(models.Setting.key == key).first()
        if setting:
            setting.value = str(value)
        else:
            db.add(models.Setting(key=key, value=str(value)))
    db.commit()
    return {"message": "Settings saved"}
