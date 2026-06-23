# Database Schema

## ER Diagram

```mermaid
erDiagram
    Users ||--o{ Applications : submits
    Users ||--o{ Jobs : creates
    Users ||--o{ Notifications : receives
    Jobs ||--o{ Applications : receives
    Applications ||--o{ Interviews : has
    Applications ||--o| Reports : has
    Interviews ||--o| Results : produces
    Users ||--o{ Questions : creates

    Users {
        ObjectId _id PK
        string email UK
        string passwordHash
        string name
        string role
        string googleId
        boolean isEmailVerified
        object profile
        date createdAt
    }

    Jobs {
        ObjectId _id PK
        string title
        string description
        array skills
        string experienceLevel
        ObjectId recruiterId FK
        string status
        object interviewConfig
    }

    Applications {
        ObjectId _id PK
        ObjectId candidateId FK
        ObjectId jobId FK
        string status
        string resumeUrl
        ObjectId resumeAnalysisId FK
        string currentStage
    }

    Questions {
        ObjectId _id PK
        string type
        string category
        string difficulty
        string question
        array options
        string correctAnswer
        array testCases
        string language
    }

    Interviews {
        ObjectId _id PK
        ObjectId applicationId FK
        ObjectId candidateId FK
        string type
        string status
        array questions
        array conversation
        number score
    }

    Results {
        ObjectId _id PK
        ObjectId interviewId FK
        ObjectId applicationId FK
        object sectionScores
        number overallScore
        array strengths
        array weaknesses
    }

    Reports {
        ObjectId _id PK
        string type
        ObjectId candidateId FK
        ObjectId jobId FK
        object data
    }

    Notifications {
        ObjectId _id PK
        ObjectId userId FK
        string type
        string title
        string message
        boolean isRead
    }
```

## Collections

### Users
- **Indexes**: `email` (unique), `googleId` (sparse)
- **Roles**: `admin`, `recruiter`, `candidate`
- **Profile** (candidates): skills, experience, education, certifications, portfolio links, resume URL

### Jobs
- **Indexes**: `recruiterId`, `status`
- **Status**: `draft`, `active`, `closed`
- **Interview Config**: aptitude, technical, AI interview toggles

### Applications
- **Indexes**: `candidateId + jobId` (unique), `jobId + status`
- **Status flow**: applied → screening → assessment → interview → shortlisted/rejected

### Questions
- **Types**: aptitude, mcq, coding, sql, debugging
- **Categories**: aptitude, logical_reasoning, quantitative, verbal_ability

### Interviews
- **Types**: aptitude, technical, ai_hr
- **Anti-cheat flags**: tabSwitches, pasteEvents, fullscreenExits

### Results
- **Section scores**: technical, communication, problemSolving, aptitude, confidence, grammar, fluency, relevance

### Reports
- **Types**: resume_analysis, interview_evaluation

## Sample Document — Resume Report

```json
{
  "type": "resume_analysis",
  "candidateId": "ObjectId",
  "jobId": "ObjectId",
  "data": {
    "skills": ["React", "Node.js", "TypeScript"],
    "atsScore": 82,
    "jobMatchScore": 78,
    "matchedSkills": ["React", "Node.js"],
    "missingSkills": ["AWS"],
    "improvements": ["Add AWS certification"],
    "recruiterSummary": "Strong full-stack developer."
  }
}
```
