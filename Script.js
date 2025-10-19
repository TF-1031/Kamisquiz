// Script.js — Kami's Quiz engine

let currentQuestion = 0;
let score = 0;
let questions = [];

const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const questionText = document.getElementById("question-text");
const optionsDiv = document.getElementById("options");
const scoreBox = document.getElementById("score-box");
const scoreText = document.getElementById("score-text");

async function loadQuestions() {
  try {
    const res = await fetch("./Questions.json");
    questions = await res.json();
  } catch (err) {
    console.error("Could not load Questions.json", err);
    questions = [
      {
        question: "Define menopause.",
        options: [
          "12 consecutive months without menstruation",
          "3 months without menstruation",
          "Loss of ovulation at age 30",
          "Rapid bone loss after 50"
        ],
        answer: 0
      }
    ];
  }
}

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
      btn.style.backgroundColor = "#4CAF50"; // correct = green
    } else if (i === selected) {
      btn.style.backgroundColor = "#f44336"; // wrong = red
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

// Wire up buttons
startBtn.addEventListener("click", startQuiz);
nextBtn.addEventListener("click", nextQuestion);

// Load questions at startup
loadQuestions();
