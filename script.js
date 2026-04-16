/* =============================================================
   Global State
   Tracks the current game session: score, lives, question progress,
   and answer streak for the bonus multiplier.
   ============================================================= */
import { streakImage } from './streak.js';
import { fetchQuestions } from './data-manager.js';
import { removeHeart, markDot, runGameIntro, transitionToGameOver, updateScore } from './ui-controller.js';

let score = 0;
let lives = 3;
let questionIndex = 0;
let questions = [];
let buttonClicks = 0;
let timerInterval;
let streak = 0;
let questionsAnswered = 0;

// Audio feedback for correct/wrong answers and game over
let correct_answer_noise = new Audio("Sounds/correctanswer.wav");
let wrong_answer_noise = new Audio("Sounds/wronganswer.mp3");
let game_over_noise = new Audio("Sounds/gameover.wav");

/* =============================================================
   Keyboard Controls
   Allows players to select answers using number keys 1-4.
   The event listener checks if the game is active (buttons enabled)
   before triggering a click on the corresponding answer button.
   ============================================================= */
document.addEventListener("keydown", (e) => {
  // Number keys 1-4 select answer buttons during gameplay
  const key = parseInt(e.key);
  if (key >= 1 && key <= 4) {
    const buttons = document.querySelectorAll(".answer-btn");
    if (buttons[key - 1] && !buttons[key - 1].disabled) {
      buttons[key - 1].click();
    }
  }

  // Got rid of space bar start on home screen when not hovering
  // Space bar triggers Play or Play Again buttons
  if (e.key === " " || e.code === "Space") {
    //e.preventDefault();
    //const playBtn = document.getElementById("btn1");
    const restartBtn = document.getElementById("restart-btn");
    //if (playBtn && playBtn.offsetParent !== null) {
      //playBtn.click();
    //}
    // else
    if (restartBtn && restartBtn.offsetParent !== null) {
      restartBtn.click();
    }
  }
});

/* =============================================================
   Helper Functions
   Small utilities used across multiple game states.
   ============================================================= */

// Advances to the next question, or ends the game if all questions answered
function nextQuestion() {
  questionIndex++;
  if (questionIndex >= questions.length) {
    gameOver();
    return;
  }
  displayQuestionAndAnswers();
}

/* =============================================================
   initQuiz()
   Entry point when the player clicks PLAY. Handles:
   1. Setting lives based on difficulty selection
   2. Delegating the intro animation and countdown to ui-controller
   3. Fetching questions from the API (started early, awaited later)
   ============================================================= */
async function initQuiz() {
  // Read user selections from the DOM
  const categoryId = document.getElementById("category-select").value;
  const difficulty = document.getElementById("difficulty-select").value;

  // Start the API fetch immediately so data loads during the countdown
  const dataPromise = fetchQuestions(categoryId, difficulty);

  // Set lives based on selected difficulty
  if (difficulty === "easy") {
    lives = 5;
  } else if (difficulty === "hard") {
    lives = 3;
  } else {
    lives = 4;
  }

  // Run the logo animation and 3-2-1 countdown
  await runGameIntro(lives);

  // Await the API data that was fetched during the countdown
  const data = await dataPromise;
  questions = data.results;
  displayQuestionAndAnswers();
}

/* =============================================================
   displayQuestionAndAnswers()
   Renders the current question and shuffled answer buttons.
   Sets up click handlers for each button that check correctness,
   update score/lives, show feedback colors, and advance after 2s.
   Also handles the streak multiplier: consecutive correct answers
   increase the score bonus (10 * streak).
   ============================================================= */
function displayQuestionAndAnswers() {
  clearInterval(timerInterval);

  var current_question = questions[questionIndex];

  // Combine incorrect and correct answers, then shuffle randomly
  var current_answers = [
    current_question.incorrect_answers,
    current_question.correct_answer,
  ];
  current_answers = current_answers.flat(Infinity);
  current_answers.sort(() => Math.random() - 0.5);

  let question = document.querySelector(".question-banner h2");
  let answerButtons = document.querySelectorAll(".answer-btn");

  startTimer();
  question.innerHTML = current_question.question;

  // Assign each shuffled answer to a button and set up click handlers
  answerButtons.forEach((btn, index) => {
    var answerText = current_answers[index];
    btn.innerHTML = `${answerText}<span class="key-hint">${index + 1}</span>`;
    btn.onclick = () => {
      if (current_answers[index] === current_question.correct_answer) {
        // Correct answer: play sound, highlight green, add streak bonus
        correct_answer_noise.play();
        clearInterval(timerInterval);
        btn.style.backgroundColor = "green";
        streak++;
        score += 10 * streak;
        //Display the streak gif if a streak occured
        streakImage(streak);
        questionsAnswered += 1;
        document.querySelectorAll(".answer-btn").forEach((button) => {
          button.disabled = true;
        });
        updateScore(score);
        markDot(questionIndex, true);

        // Wait 2 seconds to show feedback, then advance
        setTimeout(() => {
          document.querySelectorAll(".answer-btn").forEach((button) => {
            button.style.backgroundColor = "";
            button.disabled = false;
          });
          clearInterval(timerInterval);
          nextQuestion();
        }, 2000);
      } else {
        // Wrong answer: highlight red, show correct answer in green
        document.querySelectorAll(".answer-btn").forEach((button) => {
          button.disabled = true;
        });
        wrong_answer_noise.play();
        streak = 0;
        //Remove the streak gif if question answered wrong
        streakImage(streak);
        clearInterval(timerInterval);
        btn.style.backgroundColor = "red";

        // Reveal the correct answer by highlighting it in green
        answerButtons.forEach((button,i) => {
            if (current_answers[i] === current_question.correct_answer) {
              button.style.backgroundColor = "green";
            }
        });

        lives--;
        removeHeart();
        markDot(questionIndex, false);

        // If no lives left, end the game after showing feedback
        if (lives <= 0) {
          btn.disabled = true;
          lives = 0;
          setTimeout(() => {
            gameOver();
          }, 2000);
          return;
        }

        // Wait 2 seconds to show feedback, then advance
        setTimeout(() => {
          document.querySelectorAll(".answer-btn").forEach((button) => {
            button.style.backgroundColor = "";
            button.disabled = false;
          });
          clearInterval(timerInterval);
          nextQuestion();
        }, 2000);
      }
    };
  });
}

/* =============================================================
   gameOver()
   Delegates to ui-controller for the screen transition and
   high score display.
   ============================================================= */
function gameOver() {
  transitionToGameOver(lives, score, questionsAnswered);
}

/* =============================================================
   startTimer()
   Runs a 15-second countdown for each question. Updates the
   display every second. When 5 seconds remain, adds a flashing
   red warning animation. At 0 seconds, deducts a life and
   either ends the game or advances to the next question.
   ============================================================= */
function startTimer() {
  let timerElement = document.getElementById("timer");
  let timeRemaining = 15;
  let timerContainer = document.getElementById("timer-container");
  timerContainer.classList.remove("timer-warning");
  timerElement.textContent = timeRemaining;

  timerInterval = setInterval(() => {
    timeRemaining--;
    timerElement.textContent = timeRemaining;

    // Flash red warning when time is running low
    if (timeRemaining <= 5) {
      timerContainer.classList.add("timer-warning");
    }

    // Time's up: penalize the player and move on
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      markDot(questionIndex, false);
      lives--;
      removeHeart();
      if (lives === 0) {
        setTimeout(() => {
          gameOver();
        }, 2000);
        return;
      }
      nextQuestion();
    }
  }, 1000);
}

//Since script.js is a module this is needed to be able to click the button
window.initQuiz = initQuiz;
