let flashcards = [];
let currentIndex = 0;
let errorCount = 0;
let correctCount = 0; // To count correct answers

const fileInput = document.getElementById("fileInput");
const startButton = document.getElementById("startButton");
const quizContainer = document.getElementById("quizContainer");
const questionElement = document.getElementById("question");
const answerInput = document.getElementById("answerInput");
const submitAnswer = document.getElementById("submitAnswer");
const errorCountElement = document.getElementById("errorCount");
const progressElement = document.getElementById("progress");
const replayButton = document.getElementById("replayButton");
const hintButton = document.getElementById("hintButton");
const hintElement = document.getElementById("hint");

fileInput.addEventListener("change", handleFileUpload);
startButton.addEventListener("click", startQuiz);
submitAnswer.addEventListener("click", checkAnswer);
answerInput.addEventListener("keydown", handleEnterKey);
replayButton.addEventListener("click", replayQuiz);
hintButton.addEventListener("click", showHint);

function handleFileUpload(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    flashcards = rows.map(row => ({
      question: row[0],
      answer: row[1],
      hint: row[2] || "No hint available"
    }));
    startButton.disabled = false;
  };
  reader.readAsArrayBuffer(file);
}

function startQuiz() {
  if (flashcards.length > 0) {
    currentIndex = 0;
    errorCount = 0;
    correctCount = 0; // Reset correct answers count
    updateStats();
    updateProgress();
    loadFlashcard();
    quizContainer.classList.remove("hidden");
    replayButton.classList.add("hidden");
    hintElement.classList.add("hidden");
    hintButton.classList.remove("hidden");
  }
}

function loadFlashcard() {
  if (currentIndex < flashcards.length) {
    questionElement.textContent = flashcards[currentIndex].question;
    answerInput.value = "";
    hintElement.classList.add("hidden");
    hintButton.classList.remove("hidden");
    hintElement.textContent = "Hint: " + flashcards[currentIndex].hint;
    updateProgress();
  } else {
    endQuiz();
  }
}

function checkAnswer() {
  const userAnswer = normalizeString(answerInput.value.trim());
  const correctAnswer = normalizeString(flashcards[currentIndex].answer.trim());

  if (isCloseMatch(userAnswer, correctAnswer)) {
    correctCount++;
    updateStats();
    currentIndex++;
    loadFlashcard();
  } else {
    errorCount++;
    questionElement.textContent = `Incorrect! The correct answer was: ${flashcards[currentIndex].answer}`;
    updateStats();

    // Delay before moving to the next word
    setTimeout(() => {
      currentIndex++;
      loadFlashcard();
    }, 5000); // 2 seconds delay
  }
}

function handleEnterKey(event) {
  if (event.key === "Enter") {
    event.preventDefault(); // Prevent default Enter behavior
    checkAnswer();
  }
}

function normalizeString(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isCloseMatch(userAnswer, correctAnswer) {
  const maxDistance = 2; // Maximum number of allowable edits
  const distance = levenshteinDistance(userAnswer, correctAnswer);
  return distance <= maxDistance;
}

function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function updateStats() {
  errorCountElement.textContent = `Correct: ${correctCount} | Errors: ${errorCount}`;
}

function updateProgress() {
  progressElement.textContent = `Progress: ${currentIndex} / ${flashcards.length}`;
}

function showHint() {
  hintElement.classList.remove("hidden");
  hintButton.classList.add("hidden");
}

function endQuiz() {
  questionElement.textContent = "Quiz Complete!";
  answerInput.classList.add("hidden");
  submitAnswer.classList.add("hidden");
  hintButton.classList.add("hidden");
  replayButton.classList.remove("hidden");
}

function replayQuiz() {
  answerInput.classList.remove("hidden");
  submitAnswer.classList.remove("hidden");
  startQuiz();
}
