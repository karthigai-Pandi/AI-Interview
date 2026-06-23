import io
import httpx
import fitz
from docx import Document


async def download_file(url: str) -> bytes:
    if url.startswith("data:"):
        import base64
        header, data = url.split(",", 1)
        return base64.b64decode(data)

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.content


def extract_text_from_pdf(content: bytes) -> str:
    doc = fitz.open(stream=content, filetype="pdf")
    text_parts = []
    for page in doc:
        text_parts.append(page.get_text())
    doc.close()
    return "\n".join(text_parts).strip()


def extract_text_from_docx(content: bytes) -> str:
    doc = Document(io.BytesIO(content))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()


async def extract_resume_text(resume_url: str) -> str:
    content = await download_file(resume_url)
    url_lower = resume_url.lower()

    if url_lower.endswith(".pdf") or "pdf" in url_lower:
        return extract_text_from_pdf(content)
    if url_lower.endswith(".docx") or "docx" in url_lower:
        return extract_text_from_docx(content)

    try:
        return extract_text_from_pdf(content)
    except Exception:
        return extract_text_from_docx(content)
