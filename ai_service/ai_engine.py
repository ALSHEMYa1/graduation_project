import json
import os
import re
import time
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError("OPENAI_API_KEY is missing. Check your .env file.")

client = OpenAI(api_key=api_key)

MAX_INPUT_CHARS = 100000

def truncate_text(text: str, max_chars: int = MAX_INPUT_CHARS) -> str:
    if len(text) > max_chars:
        print(f"[TRUNCATE] Input {len(text)} chars, truncating to {max_chars}")
        return text[:max_chars] + "\n\n[ملاحظة: تم اقتطاع النص لطوله الزائد. النص الكامل يحتوي على " + str(len(text)) + " حرف.]"
    return text


def detect_language(text: str) -> str:
    arabic_chars = len(re.findall(r'[\u0600-\u06FF]', text))
    total = len(text.strip())
    if total == 0:
        return "en"
    return "ar" if (arabic_chars / total) > 0.1 else "en"


def resolve_language(language: str, text: str) -> str:
    if language in ("ar", "en"):
        return language
    return detect_language(text)


def call_llm(messages, model="gpt-4o-mini", temperature=0.5, response_format=None, max_tokens=None):
    kwargs = dict(
        model=model,
        messages=messages,
        temperature=temperature,
    )
    if response_format:
        kwargs["response_format"] = response_format
    if max_tokens:
        kwargs["max_tokens"] = max_tokens
    response = client.chat.completions.create(**kwargs)
    return response.choices[0].message.content


study_plan_schema = {
    "type": "json_schema",
    "json_schema": {
        "name": "study_plan",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "plan_metadata": {
                    "type": "object",
                    "properties": {
                        "total_days": {"type": "integer"},
                        "language": {"type": "string", "enum": ["ar", "en"]},
                        "subject_title": {"type": "string"},
                        "overview": {"type": "string"}
                    },
                    "required": ["total_days", "language", "subject_title", "overview"],
                    "additionalProperties": False
                },
                "days": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "day_number": {"type": "integer"},
                            "day_title": {"type": "string"},
                            "estimated_time": {"type": "string"},
                            "sections": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "title": {"type": "string"},
                                        "text_summary": {"type": "string"},
                                        "key_points": {
                                            "type": "array",
                                            "items": {"type": "string"}
                                        },
                                        "what_to_do": {
                                            "type": "array",
                                            "items": {"type": "string"}
                                        },
                                        "quiz": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "question_text": {"type": "string"},
                                                    "options": {"type": "array", "items": {"type": "string"}},
                                                    "correct_answer": {"type": "string"},
                                                    "explanation": {"type": "string"}
                                                },
                                                "required": [
                                                    "question_text",
                                                    "options",
                                                    "correct_answer",
                                                    "explanation"
                                                ],
                                                "additionalProperties": False
                                            }
                                        }
                                    },
                                    "required": [
                                        "title",
                                        "text_summary",
                                        "key_points",
                                        "what_to_do",
                                        "quiz"
                                    ],
                                    "additionalProperties": False
                                }
                            }
                        },
                        "required": [
                            "day_number",
                            "day_title",
                            "estimated_time",
                            "sections"
                        ],
                        "additionalProperties": False
                    }
                }
            },
            "required": ["plan_metadata", "days"],
            "additionalProperties": False
        }
    }
}


test_schema = {
    "type": "json_schema",
    "json_schema": {
        "name": "test",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "test_title": {"type": "string"},
                "language": {"type": "string", "enum": ["ar", "en"]},
                "questions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "question_text": {"type": "string"},
                            "options": {"type": "array", "items": {"type": "string"}},
                            "correct_answer": {"type": "string"},
                            "explanation": {"type": "string"}
                        },
                        "required": [
                            "question_text",
                            "options",
                            "correct_answer",
                            "explanation"
                        ],
                        "additionalProperties": False
                    }
                }
            },
            "required": ["test_title", "language", "questions"],
            "additionalProperties": False
        }
    }
}


summary_schema = {
    "type": "json_schema",
    "json_schema": {
        "name": "summary",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "key_points": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "full_summary": {
                    "type": "string"
                },
                "detailed_sections": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "content": {"type": "string"},
                            "key_ideas": {
                                "type": "array",
                                "items": {"type": "string"}
                            }
                        },
                        "required": ["title", "content", "key_ideas"],
                        "additionalProperties": False
                    }
                }
            },
            "required": ["key_points", "full_summary", "detailed_sections"],
            "additionalProperties": False
        }
    }
}


import base64
from io import BytesIO

MAX_OCR_PAGES = 50

def ocr_pdf(pdf_path: str, language: str = "ara+eng") -> str:
    try:
        import fitz
        from PIL import Image as PILImage
        from io import BytesIO

        if not os.path.exists(pdf_path):
            print(f"[AI-OCR-PDF] File not found: {pdf_path}")
            return ""

        if not pdf_path.lower().endswith(".pdf"):
            print(f"[AI-OCR-PDF] Not a PDF file: {pdf_path}")
            return ""

        max_workers = 3
        all_text = [None] * 1000
        doc = fitz.open(pdf_path)
        total = len(doc)
        if total > MAX_OCR_PAGES:
            print(f"[AI-OCR-PDF] PDF has {total} pages, limiting OCR to first {MAX_OCR_PAGES}")
            total = MAX_OCR_PAGES
        print(f"[AI-OCR-PDF] Processing {total} pages with {max_workers} workers")

        def render_batch(batch_start):
            batch_end = min(batch_start + 5, total)
            images = []
            for i in range(batch_start, batch_end):
                page = doc[i]
                pix = page.get_pixmap(dpi=72)
                img = PILImage.frombytes("RGB", [pix.width, pix.height], pix.samples)
                images.append(img)
            if not images:
                return batch_start, ""
            w = max(im.width for im in images)
            h = sum(im.height for im in images) + (len(images) - 1) * 3
            comp = PILImage.new("RGB", (w, h), color=(255, 255, 255))
            y = 0
            for im in images:
                comp.paste(im, (0, y))
                y += im.height + 3
            buf = BytesIO()
            comp.save(buf, format="JPEG", quality=60, optimize=True)
            return batch_start, base64.b64encode(buf.getvalue()).decode("utf-8")

        batches = list(range(0, total, 5))
        rendered = {}
        with ThreadPoolExecutor(max_workers=max_workers) as pool:
            futures = {pool.submit(render_batch, bs): bs for bs in batches}
            for f in as_completed(futures):
                bs, b64data = f.result()
                rendered[bs] = b64data
        doc.close()

        def ocr_batch(bs):
            b64data = rendered.get(bs, "")
            if not b64data:
                return bs, ""
            batch_end = min(bs + 5, total)
            for attempt in range(3):
                try:
                    response = client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=[
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": f"Transcribe all visible text from pages {bs+1}-{batch_end} of this document. Return only the raw text, nothing else."},
                                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64data}", "detail": "high"}}
                                ]
                            }
                        ],
                        temperature=0.1,
                        timeout=300
                    )
                    text = response.choices[0].message.content.strip()
                    print(f"[AI-OCR-PDF] Batch {bs+1}-{batch_end}: {len(text)} chars")
                    return bs, text
                except Exception as e:
                    if "rate_limit" in str(e).lower() or "429" in str(e):
                        wait = 10 * (attempt + 1)
                        print(f"[AI-OCR-PDF] Rate limit, waiting {wait}s...")
                        time.sleep(wait)
                    else:
                        print(f"[AI-OCR-PDF] Batch {bs+1} error: {e}")
                        return bs, ""
            return bs, ""

        results = [None] * total
        with ThreadPoolExecutor(max_workers=max_workers) as pool:
            futures = {pool.submit(ocr_batch, bs): bs for bs in batches}
            for f in as_completed(futures):
                bs, text = f.result()
                results[bs // 5] = text

        combined = "\n\n".join(t for t in results if t)
        print(f"[AI-OCR-PDF] Total: {len(combined)} chars")
        return combined
    except Exception as e:
        print(f"[AI-OCR-PDF] Error: {e}")
        return ""


def extract_text_from_image(image_path: str, language: str = "ara+eng") -> str:
    try:
        with open(image_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")

        ext = Path(image_path).suffix.lower().lstrip(".")
        if ext == "jpg":
            ext = "jpeg"
        mime = f"image/{ext}"

        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Extract ALL text from this image. Return only the extracted text, nothing else."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime};base64,{b64}",
                            "detail": "high"
                        }
                    }
                ]
            }
        ]

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.2
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[AI-OCR] Error: {e}")
        return ""


flashcard_schema = {
    "type": "json_schema",
    "json_schema": {
        "name": "flashcards",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "flashcards": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "front": {"type": "string"},
                            "back": {"type": "string"},
                            "topic": {"type": "string"}
                        },
                        "required": ["front", "back", "topic"],
                        "additionalProperties": False
                    }
                },
                "title": {"type": "string"},
                "language": {"type": "string", "enum": ["ar", "en"]}
            },
            "required": ["flashcards", "title", "language"],
            "additionalProperties": False
        }
    }
}


def generate_flashcards(text, language="ar", subject_title="Study Material", num_cards=20):
    text = truncate_text(text)
    language = resolve_language(language, text)
    lang_instruction = "IMPORTANT: Generate ALL content in Arabic." if language == "ar" else "IMPORTANT: Generate ALL content in English."
    messages = [
        {"role": "system", "content": (
            f"You are a flashcard generator. Generate EXACTLY {num_cards} flashcards from the document. "
            "Each flashcard has:\n"
            "- front: A question, term, or concept name\n"
            "- back: The answer, definition, or explanation\n"
            "- topic: The subject area this card belongs to\n\n"
            "Cover the MOST important concepts, definitions, formulas, key terms, and ideas. "
            "Make the front clear and concise. Make the back informative but not too long. "
            "Distribute cards across different topics from the document. "
            f"{lang_instruction}"
        )},
        {"role": "user", "content": (
            f"Subject: {subject_title}\n"
            f"Language: {language}\n"
            f"Generate EXACTLY {num_cards} flashcards.\n\n{text}"
        )}
    ]
    result = call_llm(messages, temperature=0.5, response_format=flashcard_schema, max_tokens=16384)
    return json.loads(result)


knowledge_gap_schema = {
    "type": "json_schema",
    "json_schema": {
        "name": "knowledge_gaps",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "topics": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "questions": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "question_text": {"type": "string"},
                                        "options": {"type": "array", "items": {"type": "string"}},
                                        "correct_answer": {"type": "string"},
                                        "explanation": {"type": "string"},
                                        "difficulty": {"type": "string", "enum": ["easy", "medium", "hard"]}
                                    },
                                    "required": ["question_text", "options", "correct_answer", "explanation", "difficulty"],
                                    "additionalProperties": False
                                }
                            }
                        },
                        "required": ["name", "questions"],
                        "additionalProperties": False
                    }
                }
            },
            "required": ["topics"],
            "additionalProperties": False
        }
    }
}


def analyze_knowledge_gaps(text, language="en", subject_title="Study Material"):
    text = truncate_text(text)
    language = resolve_language(language, text)
    lang_instruction = "IMPORTANT: Generate ALL questions, options, explanations, and topic names in Arabic." if language == "ar" else "IMPORTANT: Generate ALL content in English."
    questions_per_topic = 3 if len(text) > 2000 else 2
    messages = [
        {"role": "system", "content": (
            f"You are an educational assessment AI. Analyze the document and identify ALL distinct topics/concepts. "
            f"For each topic, generate exactly {questions_per_topic} multiple-choice questions at varying difficulty levels "
            f"(easy, medium, hard). Cover the FULL document - do not skip any topic. "
            "Each question MUST have: question_text, options[4], correct_answer, explanation, difficulty. "
            f"{lang_instruction}"
        )},
        {"role": "user", "content": f"Subject: {subject_title}\nLanguage: {language}\n\nDocument:\n{text}"}
    ]
    result = call_llm(messages, temperature=0.4, response_format=knowledge_gap_schema, max_tokens=16384)
    return json.loads(result)


mind_map_schema = {
    "type": "json_schema",
    "json_schema": {
        "name": "mind_map",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "central_topic": {"type": "string"},
                "nodes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "string"},
                            "label": {"type": "string"},
                            "parent_id": {"type": ["string", "null"]},
                            "level": {"type": "integer"},
                            "description": {"type": "string"}
                        },
                        "required": ["id", "label", "parent_id", "level", "description"],
                        "additionalProperties": False
                    }
                }
            },
            "required": ["central_topic", "nodes"],
            "additionalProperties": False
        }
    }
}


def generate_mind_map(text, language="ar", subject_title="Study Material"):
    text = truncate_text(text)
    language = resolve_language(language, text)
    lang_instruction = "IMPORTANT: Generate ALL labels and descriptions in Arabic." if language == "ar" else "IMPORTANT: Generate ALL content in English."
    messages = [
        {"role": "system", "content": (
            "You are a mind map generator. Analyze the document thoroughly and create a COMPREHENSIVE hierarchical mind map. "
            "The central topic is the main subject at Level 0. "
            "Level 1 = MAIN BRANCHES: the major sections/chapters (at least 3-6). "
            "Level 2 = SUB-TOPICS: key concepts under each branch (at least 2-4 per branch). "
            "Level 3 = DETAILS: specific facts, definitions, examples, or formulas. "
            "Each node has: id (unique string), label (short clear name), parent_id (id of parent, null for root), "
            "level (0-3), description (1-2 sentence explanation with key detail). "
            "Cover ALL major topics from the document. Make the tree as comprehensive as possible — "
            "at least 15-25 nodes total. Do NOT oversimplify. Include specific terminology from the document."
            f" {lang_instruction}"
        )},
        {"role": "user", "content": f"Subject: {subject_title}\nLanguage: {language}\n\nDocument:\n{text}"}
    ]
    result = call_llm(messages, temperature=0.3, response_format=mind_map_schema, max_tokens=16384)
    return json.loads(result)


def chat_with_ai(user_message, history, document_text="", language="en"):
    document_text = truncate_text(document_text)
    language = resolve_language(language, document_text or user_message)
    lang_instruction = "Answer in Arabic." if language == "ar" else "Answer in English."
    system_prompt = f"You are an educational AI assistant. {lang_instruction}"
    if document_text:
        system_prompt = (
            f"You are a helpful AI assistant. You have a reference document but you can answer ANY question. "
            f"{lang_instruction} "
            "Answer every question directly and naturally. "
            "If a question is about the document, use the document. "
            "If a question is general (facts, knowledge, etc.), just answer from what you know. "
            "Do NOT mention the document, do NOT apologize. Simply give the answer."
            "\n\n"
            f"--- REFERENCE DOCUMENT ---\n{document_text}\n--- END OF DOCUMENT ---"
        )
    messages = [
        {"role": "system", "content": system_prompt},
        *history,
        {"role": "user", "content": user_message}
    ]
    return call_llm(messages, temperature=0.7)


def summarize_text(text, language="ar", detail_level="very-detailed"):
    text = truncate_text(text)
    language = resolve_language(language, text)
    lang_instruction = "IMPORTANT: Generate ALL summaries, key points, and section titles in Arabic." if language == "ar" else "IMPORTANT: Generate ALL content in English."
    messages = [
        {"role": "system", "content": (
            "You are a thorough educational summarizer. Cover EVERY point and concept in the text in FULL DETAIL. "
            "Do NOT skip any section, paragraph, example, definition, or important detail. "
            "Return a comprehensive JSON summary that includes:\n"
            "- key_points: ALL main ideas from the ENTIRE text (at least 15-30 points, more if the text is long — be exhaustive)\n"
            "- full_summary: A VERY DETAILED summary (800-2000 words) covering ALL parts of the text with examples, definitions, and explanations\n"
            "- detailed_sections: Break the text into logical sections, each with title, extensive detailed content, and key ideas\n\n"
            "The more thorough and exhaustive you are, the better. Include examples, definitions, formulas, important nuances, "
            "and relationships between concepts. Do NOT oversimplify — the user wants comprehensive understanding. "
            f"{lang_instruction}"
        )},
        {"role": "user", "content": f"Language: {language} | Detail level: {detail_level}\n\nPlease summarize this ENTIRE document comprehensively and in great detail:\n\n{text}"}
    ]
    result = call_llm(
        messages,
        temperature=0.4,
        response_format=summary_schema
    )
    return json.loads(result)


import re

def _extract_json(text: str):
    """Extract and parse JSON from AI text response."""
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Try to find JSON block
    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    # Try to find any JSON object
    match = re.search(r'(\{.*\})', text, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    raise ValueError("Could not extract JSON from AI response")


def _generate_plan_batch(text, total_days, batch_start, batch_size, language, subject_title, quiz_per_section):
    """Generate a batch of days for the study plan."""
    lang_instruction = "IMPORTANT: Generate ALL titles, summaries, key points, and quiz content in Arabic." if language == "ar" else "IMPORTANT: Generate ALL content in English."
    batch_end = min(batch_start + batch_size - 1, total_days)
    messages = [
        {"role": "system", "content": (
            f"Create days {batch_start} to {batch_end} of a {total_days}-day study plan in JSON format only. "
            f"Output ONLY a JSON object with a 'days' array containing exactly {batch_size} day objects. "
            "Each day MUST have:\n"
            "- day_number: integer\n"
            "- day_title: A clear title\n"
            "- estimated_time: string like '1.5 hours'\n"
            "- sections: Array of 2-4 sections. Each section has:\n"
            "   * title: Section name\n"
            "   * text_summary: A detailed paragraph\n"
            f"   * key_points: Array of 3-5 bullet points\n"
            f"   * what_to_do: Array of 2-3 actionable steps\n"
            f"   * quiz: Array of {quiz_per_section} MCQ questions (each with question_text, options, correct_answer, explanation)\n\n"
            "Output PURE JSON only, no markdown, no code fences. "
            f"{lang_instruction}"
        )},
        {"role": "user", "content": (
            f"Subject: {subject_title}\n"
            f"Total days: {total_days}\n"
            f"Language: {language}\n"
            f"Generate days {batch_start} to {batch_end}:\n\n{text}"
        )}
    ]

    result = call_llm(messages, temperature=0.5, max_tokens=16384)
    data = _extract_json(result)
    return data.get("days", [data])


import concurrent.futures

def generate_study_plan(text, days, language="ar", subject_title="Study Material"):
    text = truncate_text(text)
    language = resolve_language(language, text)
    # Always use batching without strict schema for speed and reliability
    if days > 20:
        quiz_per_section = 2
        batch_size = 10
    elif days > 14:
        quiz_per_section = 3
        batch_size = 7
    else:
        quiz_per_section = 5
        batch_size = 7

    plan_metadata = {
        "total_days": days,
        "language": language,
        "subject_title": subject_title,
        "overview": f"Comprehensive {days}-day study plan for {subject_title}"
    }

    # Build batch list
    batches = []
    batch_start = 1
    while batch_start <= days:
        actual_batch = min(batch_size, days - batch_start + 1)
        batches.append((text, days, batch_start, actual_batch, language, subject_title, quiz_per_section))
        batch_start += actual_batch

    # Run batches in parallel to speed up generation
    all_days = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(batches)) as executor:
        futures = [executor.submit(_generate_plan_batch, *b) for b in batches]
        for f in concurrent.futures.as_completed(futures):
            all_days.extend(f.result())

    # Sort by day_number to maintain order
    all_days.sort(key=lambda d: d.get("day_number", 0))

    return {
        "plan_metadata": plan_metadata,
        "days": all_days
    }


import random
import time

def _normalize_question(q):
    """Normalize question fields from different AI output formats."""
    out = {}
    # question_text
    out["question_text"] = q.get("question_text") or q.get("question") or q.get("Question") or ""
    # options
    out["options"] = q.get("options") or q.get("Options") or []
    # correct_answer - if it's a number index, map to option text
    ca = q.get("correct_answer") or q.get("answer") or q.get("CorrectAnswer") or ""
    if isinstance(ca, (int, float)):
        idx = int(ca)
        out["correct_answer"] = out["options"][idx] if idx < len(out["options"]) else str(ca)
    else:
        out["correct_answer"] = str(ca)
    # explanation
    out["explanation"] = q.get("explanation") or q.get("Explanation") or ""
    return out


def _generate_quiz_batch(text, batch_n, seed, language, subject_title):
    """Generate a batch of quiz questions."""
    lang_instruction = "IMPORTANT: Generate ALL questions, options, explanations, and test title in Arabic." if language == "ar" else "IMPORTANT: Generate ALL content in English."
    messages = [
        {"role": "system", "content": (
            f"You are a quiz generator. Generate EXACTLY {batch_n} MCQ questions. "
            f"Seed: {seed}. "
            "Cover different topics from the text. "
            "IMPORTANT: Each question MUST have EXACTLY these keys: "
            "'question_text' (string), 'options' (array of 4 strings), "
            "'correct_answer' (string - MUST be the exact text of the correct option, NOT an index), "
            "'explanation' (string). "
            "Randomize correct_answer position in the options array. "
            "Output ONLY a JSON object with keys: 'questions' (array), 'test_title' (string), 'language' (string). "
            f"{lang_instruction}"
        )},
        {"role": "user", "content": (
            f"Subject: {subject_title}\n"
            f"Language: {language}\n"
            f"Questions to generate now: {batch_n}\n\n"
            f"Generate EXACTLY {batch_n} questions. Not less. "
            f"Each question must have: question_text, options, correct_answer (TEXT not index), explanation.\n\n"
            f"{text}"
        )}
    ]
    max_tok = min(16384, batch_n * 400)
    result = call_llm(messages, temperature=0.9, max_tokens=max_tok)
    try:
        data = _extract_json(result)
        raw = data.get("questions", [])
        return [_normalize_question(q) for q in raw]
    except (json.JSONDecodeError, ValueError):
        result = call_llm(messages, temperature=0.9, response_format=test_schema, max_tokens=max_tok)
        raw = json.loads(result).get("questions", [])
        return [_normalize_question(q) for q in raw]


def generate_test(text, language="ar", subject_title="Study Material", num_questions=30):
    text = truncate_text(text)
    language = resolve_language(language, text)
    import concurrent.futures

    # Determine batch sizes
    if num_questions <= 25:
        batch_sizes = [num_questions]
    else:
        batch_sizes = []
        remaining = num_questions
        while remaining > 0:
            batch_sizes.append(min(15, remaining))
            remaining -= 15

    seeds = [int(time.time() * 1000) % 100000 + i for i in range(len(batch_sizes))]

    all_questions = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(batch_sizes)) as executor:
        futures = [
            executor.submit(_generate_quiz_batch, text, batch_sizes[i], seeds[i], language, subject_title)
            for i in range(len(batch_sizes))
        ]
        for f in concurrent.futures.as_completed(futures):
            all_questions.extend(f.result())

    # If not enough, try sequential fallback with stronger prompt
    attempt = 0
    while len(all_questions) < num_questions and attempt < 3:
        remaining = num_questions - len(all_questions)
        batch_n = min(remaining, 10)
        seed = int(time.time() * 1000) % 100000 + 100 + attempt
        new_qs = _generate_quiz_batch(text, batch_n, seed, language, subject_title)
        all_questions.extend(new_qs)
        attempt += 1

    return {
        "test_title": f"{subject_title} - {num_questions} Questions",
        "language": language,
        "questions": all_questions[:num_questions]
    }