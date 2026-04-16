/* =============================================================
   UI Controller Module
   Handles all direct DOM manipulation for screen transitions,
   visual feedback, and UI state updates. Keeps DOM logic
   separate from game state and data fetching.
   ============================================================= */

/**
 * @description Removes the last heart icon from the lives display in the game top bar
 * @returns {void}
 */
export function removeHeart() {
  const hearts = document.querySelectorAll(".heart");
  if (hearts.length > 0) {
    hearts[hearts.length - 1].remove();
  }
}

/**
 * @description Updates a progress dot to show correct (green) or wrong (red) status
 * @param {number} index - The zero-based index of the progress dot to update
 * @param {boolean} correct - True to mark as correct (green), false for wrong (red)
 * @returns {void}
 */
export function markDot(index, correct) {
  let dots = document.querySelectorAll(".progress-dot");
  if (dots[index]) {
    dots[index].classList.add(correct ? "correct" : "wrong");
  }
}

/**
 * @description Runs the full game intro sequence: generates heart icons based on the
 *              lives count, animates the logo from the home screen into the top bar,
 *              and displays a 3-2-1 countdown overlay before gameplay begins
 * @param {number} lives - The number of lives to display as heart icons
 * @returns {Promise<void>} Resolves when the countdown finishes and the game UI is visible
 */
export async function runGameIntro(lives) {
  // Dynamically generate heart icons to match the number of lives
  const livesContainer = document.getElementById("lives-container");
  livesContainer.innerHTML = '<span class="sr-only">Lives remaining:</span> ';
  for (let i = 0; i < lives; i++) {
    const heart = document.createElement("img");
    heart.className = "heart";
    heart.src = "Images/heart.png";
    heart.alt = "Life";
    livesContainer.appendChild(heart);
  }

  /* --- Logo animation: moves the home screen logo into the top bar --- */

  // Capture logo position before any layout changes happen
  const logo = document.querySelector(".title");
  const logoRect = logo.getBoundingClientRect();

  // Move logo out of its container into body so it stays visible during transition
  document.body.appendChild(logo);

  // Pin logo at its current position using fixed positioning
  logo.style.position = "fixed";
  logo.style.left = logoRect.left + "px";
  logo.style.top = logoRect.top + "px";
  logo.style.width = logoRect.width + "px";
  logo.style.height = logoRect.height + "px";
  logo.style.zIndex = "100";

  // Switch from welcome screen to game layout
  document.getElementById("welcome-screen").style.display = "none";
  document.querySelector("header").style.display = "none";
  document.querySelector(".overall_page").style.padding = "0";
  document.querySelector(".overall_page").style.border = "none";
  document.querySelector(".overall_page").style.margin = "0";
  document.querySelector(".question-banner").style.display = "none";
  document.querySelector(".answers").style.display = "none";
  document.getElementById("game-container").style.display = "flex";

  // Calculate where the top bar logo sits, then animate toward it
  const topBarLogo = document.querySelector(".top-bar-logo");
  const targetRect = topBarLogo.getBoundingClientRect();

  // Force a reflow so the CSS transition triggers from the current position
  logo.offsetHeight;
  logo.classList.add("title-animating");
  logo.style.left = targetRect.left + "px";
  logo.style.top = targetRect.top + "px";
  logo.style.width = targetRect.width + "px";
  logo.style.height = targetRect.height + "px";

  /* --- Countdown: 3, 2, 1 before the first question --- */
  const overlay = document.createElement("div");
  overlay.id = "countdown-overlay";
  document.getElementById("game-container").appendChild(overlay);

  for (let i = 3; i >= 1; i--) {
    overlay.textContent = i;
    await new Promise(r => setTimeout(r, 1000));
  }

  // Swap: reveal the real top bar logo and clean up the animated one
  topBarLogo.style.visibility = "";
  logo.remove();
  overlay.remove();
  document.querySelector(".question-banner").style.display = "";
  document.querySelector(".answers").style.display = "";
}

/**
 * @description Transitions to the game over screen, displays a win or loss heading
 *              based on remaining lives, and updates the high score in localStorage
 * @param {number} lives - Remaining lives (greater than 0 shows "You Win!")
 * @param {number} score - The player's final score
 * @param {number} questionsAnswered - The number of questions answered correctly
 * @returns {void}
 */
export function transitionToGameOver(lives, score, questionsAnswered) {
  // Disable all answer buttons
  document.querySelectorAll(".answer-btn").forEach((btn) => {
    btn.disabled = true;
  });

  // Hide game and welcome screens, show game over screen
  document.getElementById("welcome-screen").style.display = "none";
  document.querySelector("header").style.display = "none";
  document.getElementById("game-over-container").style.display = "flex";
  document.getElementById("game-container").style.display = "none";

  // Display win or loss heading based on remaining lives
  if (lives > 0) {
    document.getElementById("game-over-heading").textContent = "You Win!";
    document.getElementById("game-over-heading").style.color = "green";
  } else {
    document.getElementById("game-over-heading").textContent = "Game Over!";
    document.getElementById("game-over-heading").style.color = "red";
  }

  // Check and update high score using localStorage for persistence
  let highScore = localStorage.getItem("highScore") || 0;

  document.getElementById("final-score").textContent = `Score: ${score}`;
  document.getElementById("questions-correct").textContent = `Correct Answers: ${questionsAnswered}`;

  if (score > highScore) {
    localStorage.setItem("highScore", score);
    highScore = score;
    document.getElementById("high-score").textContent = `Best Score: ${highScore} - New Record!`;
  } else {
    document.getElementById("high-score").textContent = `Best Score: ${highScore}`;
  }
}

/**
 * @description Updates the score display element in the game top bar
 * @param {number} score - The current score value to display
 * @returns {void}
 */
export function updateScore(score) {
  document.getElementById("score").textContent = score;
}
