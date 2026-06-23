from pydantic import BaseModel


class ResumeExtractRequest(BaseModel):
    resume_url: str


class ResumeAnalyzeRequest(BaseModel):
    resume_url: str
    job_description: str | None = None
    job_skills: list[str] | None = None


class GenerateQuestionsRequest(BaseModel):
    type: str
    category: str | None = None
    difficulty: str = "medium"
    count: int = 5
    job_description: str | None = None


class ConversationMessage(BaseModel):
    role: str
    content: str


class InterviewNextRequest(BaseModel):
    conversation: list[ConversationMessage]
    job_description: str | None = None
    company_name: str | None = None
    interview_type: str = "mixed"
    question_count: int = 0


class InterviewEvaluateRequest(BaseModel):
    conversation: list[ConversationMessage]
    job_description: str | None = None
    interview_type: str = "mixed"


class TestCase(BaseModel):
    input: str = ""
    expected_output: str


class CodeEvaluateRequest(BaseModel):
    language: str
    code: str
    test_cases: list[TestCase]
