# DATABASE.md

# ThinkFuel Database Design (MongoDB)

## 1. Overview

This document defines the MongoDB database structure for ThinkFuel MVP.

ThinkFuel is an AI-powered learning platform that reduces unhealthy AI dependency and rewards independent learning behavior.

Database Goals:

- Fast MVP development
- Flexible schema
- Easy analytics queries
- Good scalability
- Suitable for hackathon speed
- Clean structure for future production upgrade

Recommended Stack:

- MongoDB Atlas
- Mongoose (Node.js)
- TypeScript optional

Database Name:

```text
thinkfuel
```

---

# 2. Collections Overview

Main collections:

```text
users
subjects
student_subjects
learning_sessions
student_stats
chat_logs
fuel_transactions
quiz_questions
quiz_attempts
classes
teacher_alerts
daily_analytics
```

---

# 3. Collection Details

# users

Stores login identity and role.

```json
{
  "_id": "ObjectId",
  "fullName": "Nguyen Van A",
  "email": "student@test.com",
  "passwordHash": "...",
  "role": "student",
  "avatarUrl": "",
  "classId": "ObjectId",
  "status": "active",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Indexes:

```text
email unique
role
classId
```

---

# subjects

Stores school subjects.

```json
{
  "_id": "ObjectId",
  "name": "Mathematics",
  "code": "MATH",
  "icon": "calculator",
  "color": "#005BAC",
  "description": "Core mathematics learning subject",
  "createdAt": "Date"
}
```

Indexes:

```text
name unique
code unique
```

---

# student_subjects

Stores student enrollment and progress per subject.

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "subjectId": "ObjectId",

  "progress": 42,
  "level": "beginner",

  "dependencyScore": 31,
  "independenceScore": 75,

  "lastStudiedAt": "Date",
  "createdAt": "Date"
}
```

Indexes:

```text
userId + subjectId unique
subjectId
```

---

# learning_sessions

Stores study sessions by subject.

```json
{
  "_id": "ObjectId",

  "userId": "ObjectId",
  "subjectId": "ObjectId",

  "title": "Algebra Practice Session",

  "status": "active",

  "brainFuelUsed": 120,
  "tokensUsed": 830,

  "chatCount": 4,
  "quizCount": 2,

  "startedAt": "Date",
  "endedAt": null
}
```

Indexes:

```text
userId
subjectId
startedAt desc
status
```

---

# student_stats

Stores global student metrics.

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",

  "brainFuel": 720,
  "maxFuel": 1000,

  "dependencyScore": 34,
  "independenceScore": 78,

  "todayTokenUsed": 1540,
  "weeklyTokenUsed": 5400,

  "chatCountToday": 8,
  "quizCompleted": 12,
  "correctStreak": 3,

  "lastActiveAt": "Date",
  "updatedAt": "Date"
}
```

Indexes:

```text
userId unique
dependencyScore
lastActiveAt
```

---

# chat_logs

Stores AI conversations.

```json
{
  "_id": "ObjectId",

  "userId": "ObjectId",
  "subjectId": "ObjectId",
  "sessionId": "ObjectId",

  "userMessage": "What is answer of question 3?",
  "assistantReply": "What method have you tried so far?",

  "mode": "socratic",

  "tokens": {
    "prompt": 28,
    "completion": 41,
    "total": 69
  },

  "fuelCost": 45,

  "createdAt": "Date"
}
```

Indexes:

```text
userId
subjectId
sessionId
createdAt desc
```

---

# fuel_transactions

Stores Brain Fuel history.

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",

  "type": "debit",
  "amount": 45,

  "reason": "chat_usage",

  "metadata": {
    "sessionId": "ObjectId"
  },

  "balanceAfter": 675,

  "createdAt": "Date"
}
```

Indexes:

```text
userId
createdAt desc
type
```

---

# quiz_questions

Question bank.

```json
{
  "_id": "ObjectId",

  "subjectId": "ObjectId",

  "topic": "Algebra",
  "difficulty": "medium",

  "questionText": "Solve 2x + 5 = 11",

  "choices": ["2", "3", "4", "5"],

  "correctAnswer": "3",

  "explanation": "Subtract 5 then divide by 2.",

  "tags": ["equation", "linear"],

  "createdAt": "Date"
}
```

Indexes:

```text
subjectId
topic
difficulty
```

---

# quiz_attempts

Stores student quiz submissions.

```json
{
  "_id": "ObjectId",

  "userId": "ObjectId",
  "subjectId": "ObjectId",
  "sessionId": "ObjectId",
  "questionId": "ObjectId",

  "answer": "3",
  "isCorrect": true,

  "timeSpentSec": 24,

  "usedAIHelp": false,

  "rewardFuel": 50,

  "createdAt": "Date"
}
```

Indexes:

```text
userId
subjectId
createdAt desc
```

---

# classes

Stores classroom grouping.

```json
{
  "_id": "ObjectId",

  "name": "CS101",
  "teacherId": "ObjectId",

  "studentIds": ["ObjectId"],

  "createdAt": "Date"
}
```

---

# teacher_alerts

Stores teacher warnings.

```json
{
  "_id": "ObjectId",

  "teacherId": "ObjectId",
  "studentId": "ObjectId",
  "subjectId": "ObjectId",

  "type": "high_dependency",

  "message": "Student A dependency rising quickly in Mathematics",

  "isRead": false,

  "createdAt": "Date"
}
```

---

# daily_analytics

Stores daily summary.

```json
{
  "_id": "ObjectId",

  "userId": "ObjectId",
  "date": "2026-04-24",

  "tokensUsed": 340,
  "fuelStart": 1000,
  "fuelEnd": 720,

  "chatCount": 5,
  "quizCount": 3,

  "dependencyScore": 34
}
```

---

# 4. Relationships

```text
users._id -> student_stats.userId
users._id -> student_subjects.userId
subjects._id -> student_subjects.subjectId
users._id -> learning_sessions.userId
subjects._id -> learning_sessions.subjectId
learning_sessions._id -> chat_logs.sessionId
learning_sessions._id -> quiz_attempts.sessionId
subjects._id -> quiz_questions.subjectId
```

MongoDB uses references for flexibility.

---

# 5. Suggested Mongoose Schema Structure

```text
/models
  User.js
  Subject.js
  StudentSubject.js
  LearningSession.js
  StudentStat.js
  ChatLog.js
  FuelTransaction.js
  QuizQuestion.js
  QuizAttempt.js
  Class.js
  TeacherAlert.js
  DailyAnalytics.js
```

---

# 6. Core Business Logic Mapping

# When student starts subject session

1. Select subject
2. Create learning_sessions
3. Mark status = active

---

# When student sends chat

1. Insert chat_logs
2. Count tokens
3. Deduct fuel
4. Update learning_sessions
5. Update student_stats

---

# When student completes quiz

1. Insert quiz_attempts
2. Reward fuel
3. Update subject progress
4. Update scores

---

# Daily reset job

Every midnight:

1. Reset brainFuel
2. Snapshot analytics

---

# 7. Recommended Indexes for MVP

```text
users.email
student_subjects.userId + subjectId
learning_sessions.userId + startedAt
chat_logs.sessionId + createdAt
quiz_attempts.userId + subjectId
daily_analytics.userId + date
```

---

# 8. Notes For Claude Code

Use MongoDB + Mongoose.

Seed sample data:

- 1 teacher
- 5 students
- 3 subjects (Math, Physics, English)
- 10 quiz questions each subject

Prioritize subject-based dashboard flow.

---

# 9. Final Recommendation

Student learning flow should be:

Choose Subject -> Start Session -> Chat / Quiz -> End Session -> Receive Report

This makes ThinkFuel feel like a real LMS, not just an AI chatbot.
