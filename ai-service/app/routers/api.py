from fastapi import APIRouter
from app.schemas.requests import (
    ResumeExtractRequest,
    ResumeAnalyzeRequest,
    GenerateQuestionsRequest,
    InterviewNextRequest,
    InterviewEvaluateRequest,
    CodeEvaluateRequest,
)
from app.services.resume_parser import extract_resume_text
from app.services.resume_analyzer import analyze_resume
from app.services.question_generator import generate_questions
from app.services.interview_engine import get_next_question, evaluate_interview
from app.services.code_evaluator import evaluate_code
from pydantic import BaseModel
from typing import Optional
from app.services.proctoring import analyze_frame

router = APIRouter()


@router.post("/resume/extract")
async def extract_resume(req: ResumeExtractRequest):
    text = await extract_resume_text(req.resume_url)
    return {"text": text}


@router.post("/resume/analyze")
async def analyze_resume_endpoint(req: ResumeAnalyzeRequest):
    text = await extract_resume_text(req.resume_url)
    analysis = await analyze_resume(text, req.job_description, req.job_skills)
    analysis["extracted_text"] = text[:5000]
    return analysis


@router.post("/questions/generate")
async def generate_questions_endpoint(req: GenerateQuestionsRequest):
    questions = await generate_questions(
        req.type, req.category, req.difficulty, req.count, req.job_description
    )
    return {"questions": questions}


@router.post("/interview/next-question")
async def next_question_endpoint(req: InterviewNextRequest):
    conversation = [m.model_dump() for m in req.conversation]
    result = await get_next_question(
        conversation,
        req.job_description,
        req.company_name,
        req.interview_type,
        req.question_count,
    )
    return result


@router.post("/interview/evaluate")
async def evaluate_endpoint(req: InterviewEvaluateRequest):
    conversation = [m.model_dump() for m in req.conversation]
    result = await evaluate_interview(conversation, req.job_description, req.interview_type)
    return result


@router.post("/code/evaluate")
async def code_evaluate_endpoint(req: CodeEvaluateRequest):
    test_cases = [tc.model_dump() for tc in req.test_cases]
    result = await evaluate_code(req.language, req.code, test_cases)
    return result


class ProctoringRequest(BaseModel):
    image_base64: Optional[str] = None


@router.post("/proctoring/analyze")
async def proctoring_analyze(req: ProctoringRequest):
    return await analyze_frame(req.image_base64)
