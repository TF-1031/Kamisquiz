// Kami's Quiz — JSON version with random 20-question selection

let questions = [];
let activeQuestions = [];
let currentQuestion = 0;
let score = 0;

// === DOM Elements ===
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const questionText = document.getElementById("question-text");
const optionsDiv = document.getElementById("options");
const scoreBox = document.getElementById("score-box");
const scoreText = document.getElementById("score-text");

// Question counter element
const counterEl = document.createElement("p");
counterEl.id = "question-counter";
counterEl.style.marginTop = "1rem";
counterEl.style.color = "#bbb";
counterEl.style.fontSize = "1rem";
counterEl.style.textAlign = "center";
optionsDiv.insertAdjacentElement("afterend", counterEl);

// === Load and prepare questions ===
async function loadQuestions() {
  try {
    const res = await fetch("./questions.json");
    if (!res.ok) throw new Error("Network error");
    questions = await res.json();
    console.log(`Loaded ${questions.length} questions.`);
  } catch (err) {
    console.error("Could not load questions.json", err);
    alert("⚠️ Error loading questions. Make sure 'questions.json' is present in your repo.");
    questions = [];
  }
}

// Shuffle helper
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// === Core Quiz Logic ===
function startQuiz() {
  if (questions.length === 0) {
    alert("No questions loaded. Please check your questions.json file.");
    return;
  }

  // Randomize and limit to 20
  activeQuestions = shuffle([...questions]).slice(0, 20);

  score = 0;
  currentQuestion = 0;
  scoreBox.style.display = "none";
  nextBtn.disabled = true;

  startBtn.textContent = "Restart Quiz";
  showQuestion();
}

function showQuestion() {
  const q = activeQuestions[currentQuestion];
  questionText.textContent = q.question;
  optionsDiv.innerHTML = "";

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.className = "option-btn";
    btn.onclick = () => selectAnswer(i);
    optionsDiv.appendChild(btn);
  });

  counterEl.textContent = `Question ${currentQuestion + 1} of ${activeQuestions.length}`;
}

function selectAnswer(selected) {
  const q = activeQuestions[currentQuestion];
  const allBtns = optionsDiv.querySelectorAll("button");

  allBtns.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answer) {
      btn.style.backgroundColor = "#4CAF50";
      btn.style.color = "#fff";
    } else if (i === selected) {
      btn.style.backgroundColor = "#f44336";
      btn.style.color = "#fff";
    }
  });

  if (selected === q.answer) score++;
  nextBtn.disabled = false;
}

function nextQuestion() {
  currentQuestion++;
  if (currentQuestion < activeQuestions.length) {
    nextBtn.disabled = true;
    showQuestion();
  } else {
    showScore();
  }
}

function showScore() {
  questionText.textContent = "Quiz Complete!";
  optionsDiv.innerHTML = "";
  counterEl.textContent = "";
  scoreText.textContent = `You scored ${score} of ${activeQuestions.length}`;
  scoreBox.style.display = "block";
  nextBtn.disabled = true;
}

// === Event Listeners ===
startBtn.addEventListener("click", startQuiz);
nextBtn.addEventListener("click", nextQuestion);

// === Initialize ===
loadQuestions();