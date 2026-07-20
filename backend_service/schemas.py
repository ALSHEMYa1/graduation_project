from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


# ================= FILE =================
class FileBase(BaseModel):
    filename: str


class FileCreate(FileBase):
    pass


class File(FileBase):
    id: int
    filepath: str
    upload_time: datetime
    owner_id: int

    class Config:
        from_attributes = True


# ================= USER =================
class UserBase(BaseModel):
    email: str


class UserCreate(UserBase):
    name: str = ""
    password: str


class User(UserBase):
    id: int
    is_active: bool
    is_admin: bool = False
    created_at: datetime
    files: List[File] = []

    class Config:
        from_attributes = True


# ================= TOKEN =================
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# ================= AI =================
class SummaryRequest(BaseModel):
    document_id: int
    language: str = "ar"
    detail_level: str = "short"


class QuizRequest(BaseModel):
    document_id: int
    language: str = "ar"
    subject_title: str = "Study Material"
    num_questions: int = 30


class StudyPlanRequest(BaseModel):
    document_id: int
    days: int
    language: str = "ar"
    subject_title: str = "Study Material"


class ChatRequest(BaseModel):
    message: str
    document_id: Optional[int] = None
    conversation_history: Optional[List[dict]] = []
    language: str = "en"


class FlashcardsRequest(BaseModel):
    document_id: int
    language: str = "ar"
    subject_title: str = "Study Material"
    num_cards: int = 20


class MindMapRequest(BaseModel):
    document_id: int
    language: str = "ar"
    subject_title: str = "Study Material"


# ================= ADMIN =================
class AIUsageOut(BaseModel):
    id: int
    user_id: int
    feature: str
    created_at: datetime

    class Config:
        from_attributes = True


# ================= GAP ANALYSIS =================
class GapAnalysisStartRequest(BaseModel):
    document_id: int
    language: str = "en"


class GapAnalysisSubmitRequest(BaseModel):
    session_id: int
    answers: list[dict]
