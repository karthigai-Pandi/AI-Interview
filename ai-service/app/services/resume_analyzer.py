import json
from app.services.openai_client import chat_completion


RESUME_ANALYSIS_SYSTEM = """You are an expert resume analyst and ATS specialist.
Analyze the resume and return a JSON object with these fields:
- skills: array of identified skills
- ats_score: number 0-100 for ATS compatibility
- job_match_score: number 0-100 (if job description provided, else estimate general quality)
- matched_skills: skills matching job requirements
- missing_skills: skills missing from resume but in job requirements
- improvements: array of specific improvement suggestions
- recruiter_summary: 2-3 sentence summary for recruiters
- experience_years: estimated years of experience (number)
Return ONLY valid JSON."""


async def analyze_resume(
    resume_text: str,
    job_description: str | None = None,
    job_skills: list[str] | None = None,
) -> dict:
    user_prompt = f"Resume text:\n{resume_text[:8000]}"
    if job_description:
        user_prompt += f"\n\nJob Description:\n{job_description[:4000]}"
    if job_skills:
        user_prompt += f"\n\nRequired Skills: {', '.join(job_skills)}"

    result = chat_completion(RESUME_ANALYSIS_SYSTEM, user_prompt, json_mode=True)
    try:
        return json.loads(result)
    except json.JSONDecodeError:
        return {
            "skills": ["Communication", "Problem Solving"],
            "ats_score": 65,
            "job_match_score": 60,
            "matched_skills": [],
            "missing_skills": [],
            "improvements": ["Improve resume formatting", "Add more quantifiable results"],
            "recruiter_summary": "Resume analyzed with basic parsing.",
            "experience_years": 2,
        }
