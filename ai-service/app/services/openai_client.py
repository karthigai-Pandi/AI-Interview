from openai import OpenAI
from app.config import settings

client = OpenAI(
    api_key=settings.openai_api_key or "not-set",
    base_url=settings.openai_base_url,
)


def chat_completion(system: str, user: str, json_mode: bool = False) -> str:
    if not settings.openai_api_key:
        return _fallback_response(system, user)

    kwargs = {
        "model": settings.openai_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.7,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    response = client.chat.completions.create(**kwargs)
    return response.choices[0].message.content or ""


def _fallback_response(system: str, user: str) -> str:
    system_lower = system.lower()
    if "evaluate" in system_lower:
        return """{
            "section_scores": {"technical": 75, "communication": 80, "problem_solving": 70, "confidence": 72, "grammar": 85, "fluency": 78, "relevance": 82},
            "overall_score": 77,
            "strengths": ["Clear communication", "Good technical knowledge", "Structured responses"],
            "weaknesses": ["Could provide more specific examples", "Limited depth on system design"],
            "suggestions": ["Practice STAR method for behavioral questions", "Review system design fundamentals"],
            "recruiter_summary": "Solid candidate with good communication skills and adequate technical knowledge. Recommended for next round."
        }"""
    if "resume" in system_lower or "resume" in user.lower():
        return """{
            "skills": ["JavaScript", "React", "Node.js", "Python", "MongoDB", "TypeScript"],
            "ats_score": 78,
            "job_match_score": 72,
            "matched_skills": ["JavaScript", "React", "Node.js"],
            "missing_skills": ["AWS", "Docker"],
            "improvements": ["Add quantifiable achievements", "Include more keywords from job description", "Optimize section headings for ATS"],
            "recruiter_summary": "Experienced full-stack developer with strong frontend skills. Good match for web development roles.",
            "experience_years": 3
        }"""
    if "interview" in system_lower and "evaluate" not in system_lower:
        return """{
            "question": "Tell me about a challenging project you worked on and how you handled it.",
            "is_complete": false,
            "question_number": 1
        }"""
    if "generate" in system_lower or "assessment question" in system_lower:
        return """{
            "questions": [
                {"question": "If 20% of a number is 40, what is the number?", "options": ["100", "200", "400", "800"], "correct_answer": "200"},
                {"question": "What comes next in the series: 2, 6, 12, 20?", "options": ["28", "30", "32", "24"], "correct_answer": "30"}
            ]
        }"""
    return "Thank you for your response. Can you tell me more about your experience with team collaboration?"
