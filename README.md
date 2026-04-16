# Trivia Blast — ES6 Module Refactor

## Current Architecture

### JavaScript Files (Pre-Refactor)

| File | Lines | Responsibility |
|------|-------|----------------|
| `script.js` | 401 | Contains all game logic, state management, API data fetching, DOM manipulation, keyboard controls, timer logic, audio playback, logo animation, and screen transitions |
| `streak.js` | 23 | Single exported function that creates or removes a streak GIF image in the DOM based on streak count |

### Mixed Responsibilities in `script.js`

- **Data fetching + UI animation**: `initQuiz()` builds an API URL by reading DOM select elements, fetches data, sets lives based on difficulty, generates heart icons, runs a logo animation, and displays a countdown overlay — all in one 85-line function
- **Game state + DOM rendering**: `displayQuestionAndAnswers()` mutates score, streak, and lives variables while simultaneously setting button innerHTML, background colors, disabled states, and registering click handlers
- **Timer logic + game state**: `startTimer()` manages both the visual countdown display (text content, CSS warning class) and game state side effects (decrementing lives, triggering game over)
- **Screen transitions in multiple locations**: DOM show/hide logic for switching between welcome, game, and game-over screens is spread across `initQuiz()` and `gameOver()`

### Current Dependency Diagram

```
index.html
  |
  +-- style.css
  |
  +-- script.js  (type="module", 401 lines)
        |
        +-- streak.js  (streakImage)
```

![Current Architecture](./diagrams/current-architecture.png)

---

## Proposed Architecture

### Modules

| Module | Responsibility | Exports |
|--------|---------------|---------|
| `data-manager.js` | Fetches trivia questions from the Open Trivia DB API or local fallback, accepting category and difficulty as parameters with no DOM dependency | `fetchQuestions(categoryId, difficulty)` |
| `ui-controller.js` | Handles all direct DOM manipulation for screen transitions, visual feedback (hearts, progress dots, score), logo animation, countdown overlay, and game-over display | `removeHeart()`, `markDot(index, correct)`, `runGameIntro(lives)`, `transitionToGameOver(lives, score, questionsAnswered)`, `updateScore(score)` |
| `streak.js` | Displays or removes a streak GIF image in the score container based on the current consecutive correct answer count | `streakImage(streak)` |
| `script.js` | Entry point and game orchestrator — owns game state variables, keyboard controls, game loop (question display, answer handling, timer), and coordinates the other modules | `initQuiz()` (exposed on window for onclick) |

### Additional Refactor Items

- **Decoupled data fetching**: `fetchQuestions()` accepts `categoryId` and `difficulty` as parameters instead of reading DOM elements internally, making it testable independently of the browser DOM
- **Centralized screen transitions**: All screen show/hide logic (welcome to game, game to game-over) now lives in `ui-controller.js` rather than being split across `initQuiz()` and `gameOver()` in the monolithic `script.js`

### Proposed Dependency Diagram

```
index.html
  |
  +-- style.css
  |
  +-- script.js  (type="module", game state + orchestration)
        |
        +-- data-manager.js   (fetchQuestions)
        |
        +-- ui-controller.js  (removeHeart, markDot, runGameIntro,
        |                       transitionToGameOver, updateScore)
        |
        +-- streak.js          (streakImage)
```

![Proposed Architecture](./diagrams/proposed-architecture.png)

---

## Implemented Changes

### 1. `data-manager.js` — API Data Fetching Module

**Purpose**: Isolates all API communication into a single module with no DOM dependencies.

- Extracted `fetchData()` from `script.js` and renamed to `fetchQuestions(categoryId, difficulty)`
- Changed from reading DOM elements (`category-select`, `difficulty-select`) internally to accepting parameters
- Preserved the fallback to `triviaAPI.json` when the API is unavailable
- The caller (`initQuiz()` in `script.js`) now reads DOM values and passes them as arguments
- Added JSDoc documentation with `@param` and `@returns` tags

### 2. `ui-controller.js` — DOM Manipulation Module

**Purpose**: Centralizes all direct DOM manipulation for screen transitions, visual feedback, and UI state updates.

- Extracted `removeHeart()` and `markDot()` helper functions from `script.js`
- Extracted the logo animation, heart icon generation, screen transitions, and 3-2-1 countdown from `initQuiz()` into `runGameIntro(lives)`
- Extracted the entire `gameOver()` screen transition, win/loss heading, and high score display logic into `transitionToGameOver(lives, score, questionsAnswered)`
- Added `updateScore(score)` to replace inline `document.getElementById("score").textContent` calls
- `script.js` now imports and calls these functions instead of manipulating the DOM directly for these operations
- All five exported functions have full JSDoc documentation
