# API.md

# ThinkFuel API Specification

## 1. Overview

This document defines the backend API contract for ThinkFuel MVP.

Architecture Style:

- REST API
- JSON request / response
- Stateless endpoints
- Role based access (student / teacher)

Base URL:

```text
/api
```

Authentication for MVP:

- Mock auth
- userId passed in request header or body

Production Future:

- JWT
- OAuth
- School SSO

---

# 2. Standard Response Format

## Success Response

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

## Error Response

```json
{
  "success": false,
  "message": "Invalid request",
  "error": {}
}
```

---

# 3. Auth Endpoints

## POST /auth/login

Mock login by role.

### Request

```json
{
  "email": "student@test.com",
  "password": "123456"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "token": "mock_token",
    "user": {
      "id": "u1",
      "name": "Student A",
      "role": "student"
    }
  }
}
```

---

## GET /auth/me

Get current user info.

### Headers

```text
Authorization: Bearer mock_token
```

---

# 4. Student Endpoints

## GET /students/:id/dashboard

Return student dashboard data.

### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "u1",
      "name": "Student A"
    },
    "brainFuel": 720,
    "maxFuel": 1000,
    "dependencyScore": 34,
    "todayTokenUsed": 1540,
    "quizCompleted": 8,
    "streak": 3
  }
}
```

---

## GET /students/:id/profile

Return student profile and stats.

### Response

```json
{
  "success": true,
  "data": {
    "name": "Student A",
    "userId": "2310000"
    "email": "student@test.com",
    "role": "student",
    "joinedAt": "2026-04-24",
  }
}
```

---

# 5. AI Chat Endpoints

## POST /chat/message

Main AI chat endpoint.

System uses Brain Fuel level to decide response mode.

### Request

```json
{
  "userId": "u1",
  "message": "What is the answer to question 3?"
}
```

### Internal Logic

- Count prompt tokens
- Generate AI response
- Count completion tokens
- Deduct Brain Fuel
- Detect response mode

### Response

```json
{
  "success": true,
  "data": {
    "reply": "What method have you tried so far?",
    "mode": "socratic",
    "brainFuelRemaining": 610,
    "tokens": {
      "prompt": 28,
      "completion": 41,
      "total": 69
    }
  }
}
```

---

## GET /chat/history/:userId

Return previous messages.

### Response

```json
{
  "success": true,
  "data": [
    {
      "role": "user",
      "content": "Help me solve this"
    },
    {
      "role": "assistant",
      "content": "Show me your attempt first"
    }
  ]
}
```

---

# 6. Brain Fuel Endpoints

## GET /fuel/:userId

Return fuel status.

### Response

```json
{
  "success": true,
  "data": {
    "current": 650,
    "max": 1000,
    "mode": "guided",
    "resetAt": "2026-04-25T00:00:00"
  }
}
```

---

## POST /fuel/reward

Reward productive learning behavior.

### Request

```json
{
  "userId": "u1",
  "action": "solve_before_asking"
}
```

### Reward Mapping

- solve_before_asking = +80
- correct_streak = +100
- explain_reasoning = +120
- independent_quiz = +150

### Response

```json
{
  "success": true,
  "data": {
    "added": 80,
    "currentFuel": 730
  }
}
```

---

# 7. Quiz Endpoints

## GET /quiz/next/:userId

Return next adaptive question.

### Response

```json
{
  "success": true,
  "data": {
    "questionId": "q12",
    "difficulty": "medium",
    "topic": "Algebra",
    "question": "Solve 2x + 5 = 11"
  }
}
```

---

## POST /quiz/submit

Submit answer.

### Request

```json
{
  "userId": "u1",
  "questionId": "q12",
  "answer": "3"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "correct": true,
    "nextDifficulty": "medium",
    "rewardFuel": 50,
    "weakTopic": false
  }
}
```

---

## GET /quiz/history/:userId

Return past quiz results.

---

# 8. Teacher Endpoints

## GET /teachers/:id/dashboard

Teacher overview.

### Response

```json
{
  "success": true,
  "data": {
    "className": "CS101",
    "students": 30,
    "avgDependencyScore": 42,
    "avgIndependenceScore": 58,
    "atRiskStudents": 5
  }
}
```

---

## GET /teachers/:id/students

Return all students in class.

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "u1",
      "name": "Student A",
      "brainFuel": 220,
      "dependencyScore": 82,
      "risk": "high"
    },
    {
      "id": "u2",
      "name": "Student B",
      "brainFuel": 740,
      "dependencyScore": 22,
      "risk": "low"
    }
  ]
}
```

---

## GET /teachers/:id/alerts

Return warning signals.

### Example Alerts

- Student fuel depleted rapidly
- High dependency score rising
- Low quiz accuracy
- Inactive 3 days

---

# 9. Analytics Endpoints

## GET /analytics/usage/:userId

Return charts data.

### Response

```json
{
  "success": true,
  "data": {
    "dailyTokens": [120, 220, 180, 310],
    "dailyFuel": [920, 810, 770, 620],
    "dependencyTrend": [21, 24, 28, 34]
  }
}
```

---

# 10. AI Modes Logic

## Full Help

Condition:

```text
fuel > 700
```

Behavior:

- detailed help
- examples
- explanation

---

## Guided Mode

Condition:

```text
300 <= fuel <= 700
```

Behavior:

- hints only
- directions

---

## Socratic Mode

Condition:

```text
1 <= fuel < 300
```

Behavior:

- ask questions back
- require attempt first

---

## Locked Answer Mode

Condition:

```text
fuel = 0
```

Behavior:

- no direct answers
- reflection prompts only

---

# 11. Suggested Database Models

## User

```json
{
  "id": "u1",
  "name": "Student A",
  "role": "student"
}
```

## StudentStats

```json
{
  "userId": "u1",
  "brainFuel": 700,
  "dependencyScore": 31,
  "independenceScore": 72
}
```

## ChatLog

```json
{
  "userId": "u1",
  "message": "help me",
  "reply": "show attempt first",
  "tokens": 88
}
```

---

# 12. MVP Priority

Must Have:

- login
- dashboard
- chat
- fuel system
- teacher page

Should Have:

- adaptive quiz
- analytics chart

Nice To Have:

- notifications
- badges
- rankings

---

# 13. Notes For Claude Code

Build MVP first.

Use mock data if backend incomplete.

Prefer clean UI over complex architecture.

Prioritize stable demo flow.

Use reusable components.
