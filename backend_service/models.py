from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


# ================= USER =================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String, default="")
    bio = Column(String, default="")
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    files = relationship(
        "File",
        back_populates="owner",
        cascade="all, delete"
    )

    ai_usage = relationship(
        "AIUsage",
        back_populates="user",
        cascade="all, delete"
    )

    logs = relationship(
        "Log",
        back_populates="user",
        cascade="all, delete"
    )


# ================= FILE =================
class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    filepath = Column(String)
    upload_time = Column(DateTime(timezone=True), server_default=func.now())
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    extracted_text = Column(Text, default="")

    owner = relationship("User", back_populates="files")


# ================= AI USAGE =================
class AIUsage(Base):
    __tablename__ = "ai_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    feature = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="ai_usage")


# ================= LOGS =================
class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    level = Column(String)
    message = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="logs")


# ================= SETTINGS =================
class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(String)


# ================= GAP ANALYSIS =================
class GapAnalysis(Base):
    __tablename__ = "gap_analysis"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    document_id = Column(Integer, ForeignKey("files.id", ondelete="CASCADE"))
    score_percent = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    red_topics = Column(String, default="")
    yellow_topics = Column(String, default="")
    green_topics = Column(String, default="")
    focus_plan = Column(String, default="")
    questions_data = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())