# API Documentation

Base URL: `http://localhost:5000/api/v1`

All protected endpoints require `Authorization: Bearer <access_token>` header.

## Authentication

### POST /auth/register
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "John Doe",
  "role": "candidate"
}
```

### POST /auth/login
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "name": "...", "role": "candidate" },
    "accessToken": "eyJ..."
  }
}
```

### GET /auth/google
Redirects to Google OAuth.

### POST /auth/forgot-password
```json
{ "email": "user@example.com" }
```

### POST /auth/reset-password
```json
{ "token": "reset-token", "password": "NewPassword123!" }
```

### POST /auth/verify-email
```json
{ "token": "verification-token" }
```

### GET /auth/me
Returns current user profile.

### POST /auth/refresh
Refreshes access token using httpOnly refresh cookie.

## Candidate

### GET /candidate/profile
### PUT /candidate/profile
### POST /candidate/resume (multipart/form-data, field: `resume`)
### GET /candidate/applications
### GET /candidate/applications/:id/status
### POST /candidate/apply
```json
{ "jobId": "job-id" }
```
### GET /candidate/jobs

## AI / Resume

### POST /ai/resume/analyze
```json
{ "resumeUrl": "optional", "jobId": "optional" }
```

### GET /ai/resume/reports/:id

## Assessments

### POST /assessments/aptitude/start
```json
{
  "applicationId": "...",
  "category": "aptitude",
  "difficulty": "medium",
  "questionCount": 10
}
```

### POST /assessments/aptitude/:sessionId/submit
```json
{
  "answers": [{ "questionId": "...", "answer": "...", "timeSpent": 30 }],
  "antiCheatFlags": { "tabSwitches": 0, "pasteEvents": 0 }
}
```

### POST /assessments/technical/start
### POST /assessments/technical/:sessionId/run-code
```json
{ "language": "python", "code": "print('hello')", "stdin": "" }
```
### POST /assessments/technical/:sessionId/submit

## AI Interview

### POST /interviews/ai/start
```json
{ "applicationId": "..." }
```

### POST /interviews/ai/:id/message
```json
{ "message": "My answer..." }
```

### GET /interviews/ai/:id/next-question
### POST /interviews/ai/:id/complete

## Recruiter

### GET /recruiter/jobs
### POST /recruiter/jobs
### PUT /recruiter/jobs/:id
### DELETE /recruiter/jobs/:id
### GET /recruiter/candidates?search=&status=&jobId=&page=1&limit=10
### PATCH /recruiter/applications/:id/status
```json
{ "status": "shortlisted", "currentStage": "Shortlisted for Final Round" }
```
### GET /recruiter/reports/:applicationId
### GET /recruiter/analytics

## Admin

### GET /admin/users
### PATCH /admin/users/:id/role
```json
{ "role": "recruiter" }
```
### GET /admin/questions
### POST /admin/questions
### PUT /admin/questions/:id
### DELETE /admin/questions/:id

## Dashboard

### GET /dashboard/stats
### GET /dashboard/notifications
### PATCH /dashboard/notifications/:id/read
### PATCH /dashboard/notifications/read-all

## AI Service (FastAPI — port 8000)

### POST /resume/extract
### POST /resume/analyze
### POST /questions/generate
### POST /interview/next-question
### POST /interview/evaluate
### POST /code/evaluate
