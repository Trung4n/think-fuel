import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../config/db.js";
import User from "../models/users.model.js";
import Subject from "../models/subjects.model.js";
import Class from "../models/classes.model.js";
import StudentStat from "../models/student_stats.model.js";
import StudentSubject from "../models/student_subjects.model.js";
import QuizQuestion from "../models/quiz_questions.model.js";
import TeacherAlert from "../models/teacher_alerts.model.js";

await connectDB();

const collections = [
  User,
  Subject,
  Class,
  StudentStat,
  StudentSubject,
  QuizQuestion,
  TeacherAlert,
];
for (const model of collections) await model.deleteMany({});
console.log("Dropped all collections");

const subjects = await Subject.insertMany([
  { name: "Mathematics", code: "MATH", icon: "📐", color: "#06B6D4" },
  { name: "Physics", code: "PHYS", icon: "⚛️", color: "#F59E0B" },
  { name: "English", code: "ENG", icon: "📚", color: "#10B981" },
]);
console.log("Created subjects");

const hash = (pw) => bcrypt.hashSync(pw, 10);

const teacher = await User.create({
  fullName: "Dr. Smith",
  email: "teacher@test.com",
  passwordHash: hash("123456"),
  role: "teacher",
});

const studentData = [
  {
    fullName: "Alice Chen",
    email: "student1@test.com",
    brainFuel: 800,
    dependencyScore: 20,
  },
  {
    fullName: "Bob Kumar",
    email: "student2@test.com",
    brainFuel: 250,
    dependencyScore: 75,
  },
  {
    fullName: "Carlos Rivera",
    email: "student3@test.com",
    brainFuel: 550,
    dependencyScore: 45,
  },
  {
    fullName: "Diana Lee",
    email: "student4@test.com",
    brainFuel: 920,
    dependencyScore: 10,
  },
  {
    fullName: "Ethan Park",
    email: "student5@test.com",
    brainFuel: 100,
    dependencyScore: 88,
  },
];

const students = await User.insertMany(
  studentData.map(({ fullName, email }) => ({
    fullName,
    email,
    passwordHash: hash("123456"),
    role: "student",
  })),
);

const cls = await Class.create({
  name: "CS101",
  teacherId: teacher._id,
  studentIds: students.map((s) => s._id),
});

await User.updateMany(
  { _id: { $in: students.map((s) => s._id) } },
  { classId: cls._id },
);
await User.findByIdAndUpdate(teacher._id, { classId: cls._id });

await StudentStat.insertMany(
  students.map((student, i) => ({
    userId: student._id,
    brainFuel: studentData[i].brainFuel,
    maxFuel: 1000,
    dependencyScore: studentData[i].dependencyScore,
    independenceScore: Math.max(0, 100 - studentData[i].dependencyScore),
    quizCompleted: Math.floor(Math.random() * 20),
    correctStreak: i % 3,
    chatCountToday: Math.floor(Math.random() * 10),
    lastActiveAt: new Date(),
  })),
);

await StudentSubject.insertMany(
  students.flatMap((student) =>
    subjects.map((subject) => ({
      userId: student._id,
      subjectId: subject._id,
      progress: Math.floor(Math.random() * 80),
      level: ["beginner", "intermediate", "advanced"][
        Math.floor(Math.random() * 3)
      ],
    })),
  ),
);
console.log("Created students, class, stats, student-subjects");

const mathQ = [
  {
    topic: "Algebra",
    difficulty: "easy",
    questionText: "What is 2x + 3 = 7? Solve for x.",
    choices: ["x=1", "x=2", "x=3", "x=4"],
    correctAnswer: "x=2",
    explanation: "2x = 7-3 = 4, so x = 2.",
  },
  {
    topic: "Algebra",
    difficulty: "easy",
    questionText: "Which is a prime number?",
    choices: ["4", "6", "7", "9"],
    correctAnswer: "7",
    explanation: "7 is divisible only by 1 and itself.",
  },
  {
    topic: "Geometry",
    difficulty: "easy",
    questionText: "Area of a rectangle 4×5?",
    choices: ["9", "18", "20", "25"],
    correctAnswer: "20",
    explanation: "Area = length × width = 4 × 5 = 20.",
  },
  {
    topic: "Fractions",
    difficulty: "medium",
    questionText: "What is 3/4 + 1/8?",
    choices: ["4/12", "7/8", "1", "5/8"],
    correctAnswer: "7/8",
    explanation: "3/4 = 6/8, so 6/8 + 1/8 = 7/8.",
  },
  {
    topic: "Algebra",
    difficulty: "medium",
    questionText: "Solve: x² - 5x + 6 = 0",
    choices: ["x=1,6", "x=2,3", "x=-2,-3", "x=3,4"],
    correctAnswer: "x=2,3",
    explanation: "Factor: (x-2)(x-3) = 0.",
  },
  {
    topic: "Statistics",
    difficulty: "medium",
    questionText: "Mean of [2, 4, 4, 4, 5, 5, 7, 9]?",
    choices: ["4", "4.5", "5", "5.5"],
    correctAnswer: "5",
    explanation: "Sum=40, count=8, 40/8=5.",
  },
  {
    topic: "Calculus",
    difficulty: "hard",
    questionText: "Derivative of f(x) = x³ + 2x?",
    choices: ["3x²", "3x² + 2", "x² + 2", "3x + 2"],
    correctAnswer: "3x² + 2",
    explanation: "d/dx(x³)=3x², d/dx(2x)=2.",
  },
  {
    topic: "Calculus",
    difficulty: "hard",
    questionText: "∫x² dx = ?",
    choices: ["x³", "x³/3 + C", "2x + C", "x²/2 + C"],
    correctAnswer: "x³/3 + C",
    explanation: "Power rule: ∫xⁿdx = xⁿ⁺¹/(n+1) + C.",
  },
  {
    topic: "Trigonometry",
    difficulty: "hard",
    questionText: "sin²θ + cos²θ = ?",
    choices: ["0", "1", "2", "sin(2θ)"],
    correctAnswer: "1",
    explanation: "Pythagorean identity.",
  },
  {
    topic: "Probability",
    difficulty: "medium",
    questionText: "P(two heads from two coins)?",
    choices: ["1/4", "1/2", "3/4", "1"],
    correctAnswer: "1/4",
    explanation: "P = 1/2 × 1/2 = 1/4.",
  },
];

const physQ = [
  {
    topic: "Mechanics",
    difficulty: "easy",
    questionText: "Force = mass × ?",
    choices: ["velocity", "speed", "acceleration", "momentum"],
    correctAnswer: "acceleration",
    explanation: "Newton's second law: F = ma.",
  },
  {
    topic: "Kinematics",
    difficulty: "easy",
    questionText: "Unit of velocity?",
    choices: ["m/s²", "m/s", "N", "J"],
    correctAnswer: "m/s",
    explanation: "Velocity is displacement per time.",
  },
  {
    topic: "Energy",
    difficulty: "easy",
    questionText: "KE = ½mv². What does 'v' represent?",
    choices: ["volume", "voltage", "velocity", "viscosity"],
    correctAnswer: "velocity",
    explanation: "v is the speed of the object.",
  },
  {
    topic: "Waves",
    difficulty: "medium",
    questionText: "Wave speed = frequency × ?",
    choices: ["amplitude", "wavelength", "period", "intensity"],
    correctAnswer: "wavelength",
    explanation: "v = fλ (wave equation).",
  },
  {
    topic: "Electricity",
    difficulty: "medium",
    questionText: "Ohm's law: V = ?",
    choices: ["I/R", "I×R", "R/I", "I+R"],
    correctAnswer: "I×R",
    explanation: "Voltage = Current × Resistance.",
  },
  {
    topic: "Thermodynamics",
    difficulty: "medium",
    questionText: "Which law is Q=ΔU+W?",
    choices: ["0th", "1st", "2nd", "3rd"],
    correctAnswer: "1st",
    explanation: "First law of thermodynamics.",
  },
  {
    topic: "Quantum",
    difficulty: "hard",
    questionText: "E = hf. What is 'h'?",
    choices: [
      "Hubble constant",
      "Planck's constant",
      "Boltzmann constant",
      "gas constant",
    ],
    correctAnswer: "Planck's constant",
    explanation: "h ≈ 6.626×10⁻³⁴ J·s.",
  },
  {
    topic: "Relativity",
    difficulty: "hard",
    questionText: "E = mc². What is 'c'?",
    choices: ["charge", "speed of light", "capacitance", "coefficient"],
    correctAnswer: "speed of light",
    explanation: "c ≈ 3×10⁸ m/s.",
  },
  {
    topic: "Optics",
    difficulty: "hard",
    questionText: "1/f = 1/v + 1/u is the?",
    choices: ["mirror formula", "lens formula", "wave equation", "Snell's law"],
    correctAnswer: "lens formula",
    explanation: "Thin lens equation.",
  },
  {
    topic: "Mechanics",
    difficulty: "medium",
    questionText: "g on Earth's surface ≈ ?",
    choices: ["8.9 m/s²", "9.8 m/s²", "10.8 m/s²", "11 m/s²"],
    correctAnswer: "9.8 m/s²",
    explanation: "Standard gravitational acceleration.",
  },
];

const engQ = [
  {
    topic: "Grammar",
    difficulty: "easy",
    questionText: "Which is a noun?",
    choices: ["run", "quickly", "happiness", "bright"],
    correctAnswer: "happiness",
    explanation: "Happiness is a noun (thing/concept).",
  },
  {
    topic: "Grammar",
    difficulty: "easy",
    questionText: "Correct sentence?",
    choices: [
      "She go to school.",
      "She goes to school.",
      "She going to school.",
      "She gone to school.",
    ],
    correctAnswer: "She goes to school.",
    explanation: "Third-person singular present requires -s.",
  },
  {
    topic: "Vocabulary",
    difficulty: "easy",
    questionText: "Antonym of 'ancient'?",
    choices: ["old", "modern", "historic", "classical"],
    correctAnswer: "modern",
    explanation: "Modern means new/contemporary.",
  },
  {
    topic: "Grammar",
    difficulty: "medium",
    questionText: "Identify the clause: 'Although it rained, we played.'",
    choices: ["simple", "compound", "complex", "compound-complex"],
    correctAnswer: "complex",
    explanation: "Contains a dependent clause (Although it rained).",
  },
  {
    topic: "Vocabulary",
    difficulty: "medium",
    questionText: "Synonym of 'eloquent'?",
    choices: ["silent", "articulate", "confused", "brief"],
    correctAnswer: "articulate",
    explanation: "Eloquent means fluent/persuasive.",
  },
  {
    topic: "Writing",
    difficulty: "medium",
    questionText: "A thesis statement should be?",
    choices: ["vague", "specific and arguable", "a question", "a fact"],
    correctAnswer: "specific and arguable",
    explanation: "A thesis makes a clear, debatable claim.",
  },
  {
    topic: "Literature",
    difficulty: "hard",
    questionText: "Who wrote '1984'?",
    choices: ["Huxley", "Orwell", "Kafka", "Bradbury"],
    correctAnswer: "Orwell",
    explanation: "George Orwell published 1984 in 1949.",
  },
  {
    topic: "Grammar",
    difficulty: "hard",
    questionText: "Which is a dangling modifier? ",
    choices: [
      "Running fast, the finish line approached.",
      "She ran fast to the finish line.",
      "Fast, she ran to the finish line.",
      "The fast runner reached the line.",
    ],
    correctAnswer: "Running fast, the finish line approached.",
    explanation: "The finish line cannot run — the modifier dangles.",
  },
  {
    topic: "Rhetoric",
    difficulty: "hard",
    questionText: "'To be or not to be' is an example of?",
    choices: ["simile", "metaphor", "antithesis", "alliteration"],
    correctAnswer: "antithesis",
    explanation: "Two contrasting ideas are juxtaposed.",
  },
  {
    topic: "Vocabulary",
    difficulty: "medium",
    questionText: "What does 'ubiquitous' mean?",
    choices: ["rare", "present everywhere", "mysterious", "ancient"],
    correctAnswer: "present everywhere",
    explanation: "Ubiquitous = found everywhere.",
  },
];

const subjectMap = {
  MATH: subjects[0]._id,
  PHYS: subjects[1]._id,
  ENG: subjects[2]._id,
};

await QuizQuestion.insertMany([
  ...mathQ.map((q) => ({ ...q, subjectId: subjectMap.MATH, tags: [q.topic] })),
  ...physQ.map((q) => ({ ...q, subjectId: subjectMap.PHYS, tags: [q.topic] })),
  ...engQ.map((q) => ({ ...q, subjectId: subjectMap.ENG, tags: [q.topic] })),
]);
console.log("Created quiz questions");

const highRiskStudents = students
  .map((student, i) => ({ student, data: studentData[i] }))
  .filter(({ data }) => data.dependencyScore > 60);

await TeacherAlert.insertMany(
  highRiskStudents.map(({ student, data }) => ({
    teacherId: teacher._id,
    studentId: student._id,
    subjectId: subjects[0]._id,
    type: "high_dependency",
    message: `${data.fullName} has a high dependency score (${data.dependencyScore}). Consider reaching out.`,
    isRead: false,
  })),
);
console.log("Created teacher alerts");
console.log("Seed complete!");

await disconnectDB();
