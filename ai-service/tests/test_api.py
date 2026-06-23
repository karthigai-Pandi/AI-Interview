import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_generate_questions():
    response = client.post(
        "/questions/generate",
        json={"type": "aptitude", "category": "aptitude", "difficulty": "easy", "count": 2},
    )
    assert response.status_code == 200
    data = response.json()
    assert "questions" in data
    assert len(data["questions"]) >= 1


def test_interview_next_question():
    response = client.post(
        "/interview/next-question",
        json={
            "conversation": [],
            "company_name": "Test Corp",
            "question_count": 0,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "question" in data
    assert "is_complete" in data


def test_interview_evaluate():
    response = client.post(
        "/interview/evaluate",
        json={
            "conversation": [
                {"role": "interviewer", "content": "Tell me about yourself."},
                {"role": "candidate", "content": "I am a software developer with 5 years of experience."},
            ],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "overall_score" in data
    assert "strengths" in data
