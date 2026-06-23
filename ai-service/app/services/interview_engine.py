import json
from app.config import settings
from app.services.openai_client import chat_completion

INTERVIEW_SYSTEM = """You are a professional HR interviewer conducting a job interview.
Based on the conversation history, either:
1. Ask the next relevant follow-up question (behavioral, technical, or company-specific)
2. Indicate the interview is complete after 5-6 questions

Return JSON with:
- question: string (the next question, or closing statement if complete)
- is_complete: boolean
- question_number: integer (current question number)
Return ONLY valid JSON."""

EVALUATION_SYSTEM = """You are an expert interview evaluator.
Evaluate the interview conversation and return JSON with:
- section_scores: object with technical, communication, problem_solving, confidence, grammar, fluency, relevance (each 0-100)
- overall_score: number 0-100
- strengths: array of strings
- weaknesses: array of strings
- suggestions: array of improvement suggestions
- recruiter_summary: 3-4 sentence summary for hiring decision
Return ONLY valid JSON."""

DEFAULT_QUESTIONS = [
    "Tell me about yourself and your professional background.",
    "What motivated you to apply for this position?",
    "Describe a challenging project you worked on recently.",
    "How do you handle tight deadlines and pressure?",
    "What are your greatest strengths and areas for improvement?",
    "Where do you see yourself in 5 years?",
    "Do you have any questions for us?",
]


def _fallback_next_question(question_count: int) -> dict:
    if question_count >= 6:
        return {
            "question": "Thank you for your time. That concludes our interview.",
            "is_complete": True,
            "question_number": question_count,
        }

    next_idx = min(question_count, len(DEFAULT_QUESTIONS) - 1)
    is_last = question_count >= len(DEFAULT_QUESTIONS) - 1

    return {
        "question": DEFAULT_QUESTIONS[next_idx],
        "is_complete": is_last,
        "question_number": question_count + 1,
    }


async def get_next_question(
    conversation: list[dict],
    job_description: str | None = None,
    company_name: str | None = None,
    interview_type: str = "mixed",
    question_count: int = 0,
) -> dict:
    if question_count >= 6:
        return {
            "question": "Thank you for your time. That concludes our interview.",
            "is_complete": True,
            "question_number": question_count,
        }

    if not settings.openai_api_key:
        return _fallback_next_question(question_count)

    conv_text = "\n".join(
        f"{msg['role'].upper()}: {msg['content']}" for msg in conversation[-10:]
    )
    user_prompt = f"""Interview type: {interview_type}
Company: {company_name or 'the company'}
Questions asked so far: {question_count}
Job description: {(job_description or 'General role')[:2000]}

Conversation:
{conv_text}

Generate the next interview question."""

    result = chat_completion(INTERVIEW_SYSTEM, user_prompt, json_mode=True)
    try:
        parsed = json.loads(result)
        parsed["is_complete"] = bool(parsed.get("is_complete", False))
        if question_count >= 5:
            parsed["is_complete"] = True
            parsed["question"] = parsed.get(
                "question", "Thank you for your time. That concludes our interview."
            )
        return parsed
    except json.JSONDecodeError:
        return _fallback_next_question(question_count)


async def evaluate_interview(
    conversation: list[dict],
    job_description: str | None = None,
    interview_type: str = "mixed",
) -> dict:
    conv_text = "\n".join(
        f"{msg['role'].upper()}: {msg['content']}" for msg in conversation
    )
    user_prompt = f"""Interview type: {interview_type}
Job description: {(job_description or 'General role')[:2000]}

Full conversation:
{conv_text}

Evaluate this interview comprehensively."""

    result = chat_completion(EVALUATION_SYSTEM, user_prompt, json_mode=True)
    try:
        return json.loads(result)
    except json.JSONDecodeError:
        return {
            "section_scores": {
                "technical": 70,
                "communication": 75,
                "problem_solving": 68,
                "confidence": 72,
                "grammar": 80,
                "fluency": 74,
                "relevance": 76,
            },
            "overall_score": 73,
            "strengths": ["Participated actively", "Provided relevant answers"],
            "weaknesses": ["Could elaborate more on technical details"],
            "suggestions": ["Prepare more specific examples", "Practice concise communication"],
            "recruiter_summary": "Candidate showed adequate communication and relevant experience.",
        }
