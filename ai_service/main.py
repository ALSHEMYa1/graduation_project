from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Literal, Dict

from ai_engine import (
    generate_study_plan,
    summarize_text,
    generate_test,
    generate_flashcards,
    chat_with_ai,
    extract_text_from_image,
    analyze_knowledge_gaps,
    generate_mind_map,
    ocr_pdf
)

app = FastAPI(
    title="AI Study Engine API",
    version="1.0.0"
)

# ================= REQUEST MODELS =================

class StudyPlanRequest(BaseModel):
    text: str
    days: int = Field(gt=0)
    language: str = "ar"
    subject_title: str = "Study Material"


class SummarizeRequest(BaseModel):
    text: str
    language: str = "ar"
    detail_level: Literal["short", "detailed", "very-detailed"] = "very-detailed"


class ComprehensiveTestRequest(BaseModel):
    text: str
    language: str = "ar"
    subject_title: str = "Study Material"
    num_questions: int = Field(5, gt=0)


class ChatRequest(BaseModel):
    user_message: str
    document_text: str = ""
    conversation_history: List[Dict[str, str]] = []
    language: str = "en"


class FlashcardsRequest(BaseModel):
    text: str
    language: str = "ar"
    subject_title: str = "Study Material"
    num_cards: int = Field(20, gt=0)


# ================= ROUTES =================

@app.post("/generate-study-plan")
def generate_study_plan_route(req: StudyPlanRequest):
    result = generate_study_plan(
        req.text,
        req.days,
        req.language,
        req.subject_title
    )

    return {
        "plan": result["days"],
        "meta": result.get("plan_metadata", {})
    }


@app.post("/summarize")
def summarize(req: SummarizeRequest):
    result = summarize_text(
        req.text,
        req.language,
        req.detail_level
    )

    return {"summary": result}


@app.post("/generate-comprehensive-test")
def generate_test_route(req: ComprehensiveTestRequest):
    result = generate_test(
        req.text,
        req.language,
        req.subject_title,
        req.num_questions
    )

    return result


@app.post("/generate-flashcards")
def generate_flashcards_route(req: FlashcardsRequest):
    result = generate_flashcards(
        req.text,
        req.language,
        req.subject_title,
        req.num_cards
    )
    return result


class ExtractTextRequest(BaseModel):
    image_path: str


class OcrPdfRequest(BaseModel):
    pdf_path: str
    language: str = "ara+eng"


@app.post("/extract-text-from-image")
def extract_text_route(req: ExtractTextRequest):
    text = extract_text_from_image(req.image_path)
    return {"text": text}


class OcrPdfRequest(BaseModel):
    pdf_path: str
    language: str = "ara+eng"


@app.post("/ocr-pdf")
def ocr_pdf_route(req: OcrPdfRequest):
    text = ocr_pdf(req.pdf_path, req.language)
    return {"text": text}


@app.post("/chat")
def chat(req: ChatRequest):
    result = chat_with_ai(
        req.user_message,
        req.conversation_history,
        req.document_text,
        req.language
    )
    return {"response": result}


class KnowledgeGapRequest(BaseModel):
    text: str
    language: str = "en"
    subject_title: str = "Study Material"


@app.post("/analyze-knowledge-gaps")
def analyze_gaps_route(req: KnowledgeGapRequest):
    result = analyze_knowledge_gaps(req.text, req.language, req.subject_title)
    return result


class MindMapRequest(BaseModel):
    text: str
    language: str = "ar"
    subject_title: str = "Study Material"


@app.post("/generate-mind-map")
def generate_mind_map_route(req: MindMapRequest):
    result = generate_mind_map(req.text, req.language, req.subject_title)
    return result
