// Kami's Quiz — self-contained version (no JSON fetch needed)

// === Question Bank ===
const questions = [
  {
    question: "Define menopause.",
    options: [
      "12 consecutive months without menstruation",
      "6 months without menstruation",
      "Cessation of ovulation for 6 months",
      "First missed menstrual cycle"
    ],
    answer: 0
  },
  {
    question: "What are common vasomotor symptoms (VMS)?",
    options: [
      "Headaches and blurred vision",
      "Hot flashes and night sweats",
      "Pelvic pain and cramping",
      "Fatigue and memory loss"
    ],
    answer: 1
  },
  {
    question: "Which therapy is first-line for GSM (genitourinary syndrome of menopause)?",
    options: [
      "Systemic estrogen therapy",
      "Nonhormonal lubricants and moisturizers",
      "High-dose vaginal estrogen",
      "Testosterone cream"
    ],
    answer: 1
  },
  {
    question: "What is the 'timing hypothesis' for hormone therapy?",
    options: [
      "It is best started before age 60 or within 10 years of menopause",
      "It should always be started after age 60",
      "It should never be used after 5 years post-menopause",
      "It must only be used if FSH is elevated"
    ],
    answer: 0
  },
  {
    question: "Which is a contraindication to systemic estrogen therapy?",
    options: [
      "Active liver disease",
      "Mild hypertension",
      "Low bone density",
      "Hot flashes"
    ],
    answer: 0
  }
];

// === DOM elements ===
let currentQuestion = 0;
let score = 0;

const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const questionText = document.getElementById("question-text");
const optionsDiv = document.getElementById("options");
const scoreBox = document.getElementById("score-box");
const scoreText = document.getElementById("score-text");

// === Core functions ===
function startQuiz() {
  score = 0;
  currentQuestion = 0;
  scoreBox.style.display = "none";
  startBtn.disabled = true;
  nextBtn.disabled = true;
  showQuestion();
}

function showQuestion() {
  const q = questions[currentQuestion];
  questionText.textContent = q.question;
  optionsDiv.innerHTML = "";

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.className = "option-btn";
    btn.onclick = () => selectAnswer(i);
    optionsDiv.appendChild(btn);
  });
}

function selectAnswer(selected) {
  const q = questions[currentQuestion];
  const allBtns = optionsDiv.querySelectorAll("button");

  allBtns.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answer) {
      btn.style.backgroundColor = "#4CAF50"; // green for correct
      btn.style.color = "#fff";
    } else if (i === selected) {
      btn.style.backgroundColor = "#f44336"; // red for wrong
      btn.style.color = "#fff";
    }
  });

  if (selected === q.answer) score++;
  nextBtn.disabled = false;
}

function nextQuestion() {
  currentQuestion++;
  if (currentQuestion < questions.length) {
    nextBtn.disabled = true;
    showQuestion();
  } else {
    showScore();
  }
}

function showScore() {
  questionText.textContent = "Quiz Complete!";
  optionsDiv.innerHTML = "";
  scoreText.textContent = `You scored ${score} of ${questions.length}`;
  scoreBox.style.display = "block";
  startBtn.disabled = false;
  nextBtn.disabled = true;
}

// === Event Listeners ===
startBtn.addEventListener("click", startQuiz);
nextBtn.addEventListener("click", nextQuestion);