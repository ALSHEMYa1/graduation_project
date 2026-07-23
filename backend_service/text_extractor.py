import os
import requests
import tempfile
from pypdf import PdfReader
from docx import Document as DocxDocument

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://127.0.0.1:5000")

try:
    import pytesseract
    import sys
    if sys.platform == "win32":
        possible_paths = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files\Tesseract-OCR\tesseract.exe\tesseract.exe",
        ]
        for p in possible_paths:
            if os.path.exists(p):
                pytesseract.pytesseract.tesseract_cmd = p
                break
    TESSERACT_AVAILABLE = True
except Exception:
    TESSERACT_AVAILABLE = False

MAX_TEXT_CHARS = 100000

def extract_text_from_pdf(pdf_path: str) -> str:
    text = ""
    try:
        reader = PdfReader(pdf_path)
        num_pages = len(reader.pages)
        print(f"[EXTRACT] PDF has {num_pages} pages")
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        if text.strip():
            print(f"[EXTRACT] PyPDF extracted {len(text)} chars from {num_pages} pages")
            if len(text) > MAX_TEXT_CHARS:
                text = text[:MAX_TEXT_CHARS] + "\n\n[نص مقصوص - الملف كبير جداً]"
            return text
    except Exception as e:
        print(f"Error extracting text from PDF (pypdf): {e}")

    try:
        import fitz
        doc = fitz.open(pdf_path)
        num_pages = len(doc)
        print(f"[EXTRACT] Trying PyMuPDF for {num_pages} pages")
        for page in doc:
            page_text = page.get_text()
            if page_text.strip():
                text += page_text + "\n"
        doc.close()
        if text.strip():
            print(f"[EXTRACT] PyMuPDF extracted {len(text)} chars")
            if len(text) > MAX_TEXT_CHARS:
                text = text[:MAX_TEXT_CHARS] + "\n\n[نص مقصوص - الملف كبير جداً]"
            return text
    except Exception as e:
        print(f"Error extracting text from PDF (fitz): {e}")

    if TESSERACT_AVAILABLE:
        try:
            print("[EXTRACT] Trying local Tesseract OCR...")
            import fitz
            from PIL import Image
            doc = fitz.open(pdf_path)
            total = len(doc)
            ocr_pages = min(total, 50)
            print(f"[EXTRACT] OCR processing {ocr_pages}/{total} pages with Tesseract")
            texts = []
            for i in range(ocr_pages):
                page = doc[i]
                pix = page.get_pixmap(dpi=150)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                page_text = pytesseract.image_to_string(img, lang="ara+eng")
                if page_text.strip():
                    texts.append(page_text)
                if (i + 1) % 10 == 0:
                    print(f"[EXTRACT] OCR progress: {i+1}/{ocr_pages} pages")
            doc.close()
            text = "\n".join(texts)
            if text.strip():
                print(f"[EXTRACT] Tesseract OCR extracted {len(text)} chars")
                if len(text) > MAX_TEXT_CHARS:
                    text = text[:MAX_TEXT_CHARS] + "\n\n[نص مقصوص - الملف كبير جداً]"
                return text
            print("[EXTRACT] Tesseract OCR returned no text")
        except Exception as e:
            print(f"[EXTRACT] Tesseract OCR error: {e}")

    try:
        print("No text found in PDF, attempting OCR via AI service...")
        res = requests.post(
            f"{AI_SERVICE_URL}/ocr-pdf",
            json={"pdf_path": os.path.abspath(pdf_path)},
            timeout=1800
        )
        if res.ok:
            result = res.json()
            text = result.get("text", "")
            print(f"OCR extracted {len(text)} chars")
            if len(text) > MAX_TEXT_CHARS:
                text = text[:MAX_TEXT_CHARS] + "\n\n[نص مقصوص - الملف كبير جداً]"
            return text
        return ""
    except Exception as e:
        print(f"Error during PDF OCR: {e}")
        return ""

def extract_text_from_image(image_path: str) -> str:
    abs_path = os.path.abspath(image_path)
    try:
        res = requests.post(
            f"{AI_SERVICE_URL}/extract-text-from-image",
            json={"image_path": abs_path},
            timeout=60
        )
        if res.ok:
            return res.json().get("text", "")
        return ""
    except Exception as e:
        print(f"Error extracting text from image via AI: {e}")
        return ""

def extract_text_from_txt(txt_path: str) -> str:
    try:
        with open(txt_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading text file: {e}")
        return ""

def extract_text_from_docx(docx_path: str) -> str:
    try:
        doc = DocxDocument(docx_path)
        text = "\n".join(p.text for p in doc.paragraphs)
        return text
    except Exception as e:
        print(f"Error extracting text from DOCX: {e}")
        return ""

def extract_text_from_file(filepath: str) -> str:
    try:
        file_extension = os.path.splitext(filepath)[1].lower()

        if file_extension == ".pdf":
            return extract_text_from_pdf(filepath)
        elif file_extension in [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff"]:
            return extract_text_from_image(filepath)
        elif file_extension == ".txt":
            return extract_text_from_txt(filepath)
        elif file_extension == ".docx":
            return extract_text_from_docx(filepath)
        else:
            return ""
    except Exception as e:
        print(f"Error extracting text from file: {e}")
        return ""
