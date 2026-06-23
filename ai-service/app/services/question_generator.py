import json
from app.services.openai_client import chat_completion

QUESTION_GEN_SYSTEM = """You are an expert assessment question generator.
Generate interview/assessment questions and return JSON with a "questions" array.
Each question object must have:
- question: string
- options: array of 4 strings (for MCQ/aptitude)
- correct_answer: string (must match one option exactly)
- category: string
- difficulty: string
Return ONLY valid JSON."""


async def generate_questions(
    question_type: str,
    category: str | None,
    difficulty: str,
    count: int,
    job_description: str | None = None,
) -> list[dict]:
    user_prompt = f"""Generate {count} {difficulty} difficulty {question_type} questions.
Category: {category or 'general'}.
"""
    if job_description:
        user_prompt += f"Job context: {job_description[:2000]}"

    result = chat_completion(QUESTION_GEN_SYSTEM, user_prompt, json_mode=True)
    try:
        data = json.loads(result)
        return data.get("questions", [])
    except json.JSONDecodeError:
        return [
            {
                "question": "What is 25% of 80?",
                "options": ["15", "20", "25", "30"],
                "correct_answer": "20",
                "category": category or "aptitude",
                "difficulty": difficulty,
            }
        ]
