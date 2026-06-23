import httpx
from app.config import settings

PISTON_URL = "https://emkc.org/api/v2/piston"

LANGUAGE_MAP = {
    "javascript": "javascript",
    "python": "python",
    "java": "java",
    "cpp": "c++",
    "c": "c",
    "sql": "sqlite3",
}


async def evaluate_code(
    language: str,
    code: str,
    test_cases: list[dict],
) -> dict:
    piston_lang = LANGUAGE_MAP.get(language, language)
    results = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        for tc in test_cases:
            response = await client.post(
                f"{PISTON_URL}/execute",
                json={
                    "language": piston_lang,
                    "version": "*",
                    "files": [{"name": "main", "content": code}],
                    "stdin": tc.get("input", ""),
                },
            )
            data = response.json()
            actual = data.get("run", {}).get("stdout", "").strip()
            expected = tc.get("expected_output", "").strip()
            passed = actual == expected and data.get("run", {}).get("code", 1) == 0
            results.append({"passed": passed, "actual": actual, "expected": expected})

    passed_count = sum(1 for r in results if r["passed"])
    score = round((passed_count / len(results)) * 100) if results else 0

    return {"score": score, "results": results}
