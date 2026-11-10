import { triviaQuestions } from '../data/triviaQuestions.js';
import { state } from '../core/state.js';
import { apiRequest } from '../core/api.js';
import { showAppAlert } from '../core/alerts.js';

const kahootColors = ['red', 'blue', 'yellow', 'green'];
const kahootIcons = ['fa-caret-up', 'fa-diamond', 'fa-circle', 'fa-square'];
const QUESTIONS_PER_ROUND = 5;

let currentQuestionIndex = 0;
let triviaRound = [];
let triviaScore = 0;
let correctCount = 0;
let triviaTimer = null;
let timeLeft = 20;

export function initTriviaView() {
  const btnStart = document.getElementById('btn-start-trivia');
  const btnNext = document.getElementById('trivia-next-btn');
  const btnReset = document.getElementById('btn-reset-trivia');

  if (btnStart) btnStart.onclick = () => startTrivia();
  if (btnNext) btnNext.onclick = () => nextQuestion();
  if (btnReset) btnReset.onclick = () => resetTrivia();
}

export function startTrivia() {
  triviaRound = createTriviaRound();
  currentQuestionIndex = 0;
  triviaScore = 0;
  correctCount = 0;

  document.getElementById('trivia-welcome')?.classList.add('hidden');
  document.getElementById('trivia-result')?.classList.add('hidden');
  document.getElementById('trivia-quiz')?.classList.remove('hidden');

  renderQuestion();
}

function startTimer() {
  clearInterval(triviaTimer);
  timeLeft = 20;
  const timerElem = document.getElementById('trivia-timer');
  if (timerElem) timerElem.textContent = timeLeft;

  triviaTimer = setInterval(() => {
    timeLeft--;
    if (timerElem) timerElem.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(triviaTimer);
      autoFailQuestion();
    }
  }, 1000);
}

function autoFailQuestion() {
  const qData = triviaRound[currentQuestionIndex];
  const buttons = document.querySelectorAll('.kahoot-option-btn');

  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === qData.correct) {
      btn.classList.add('correct');
    } else {
      btn.classList.add('incorrect');
    }
  });

  document.getElementById('trivia-next-btn')?.classList.remove('hidden');
}

function renderQuestion() {
  startTimer();
  const qData = triviaRound[currentQuestionIndex];

  const progressEl = document.getElementById('trivia-progress');
  const scoreEl = document.getElementById('trivia-score');
  const questionEl = document.getElementById('trivia-question');
  const optionsContainer = document.getElementById('trivia-options');
  const nextBtn = document.getElementById('trivia-next-btn');

  if (progressEl) progressEl.textContent = `PREGUNTA ${currentQuestionIndex + 1} DE ${triviaRound.length}`;
  if (scoreEl) scoreEl.textContent = `${triviaScore} PTS`;
  if (questionEl) questionEl.textContent = qData.q;
  if (nextBtn) nextBtn.classList.add('hidden');

  if (optionsContainer) {
    optionsContainer.innerHTML = '';
    qData.options.forEach((optText, index) => {
      const colorClass = kahootColors[index % 4];
      const iconClass = kahootIcons[index % 4];
      const btn = document.createElement('button');
      btn.className = `kahoot-option-btn ${colorClass}`;
      btn.innerHTML = `
        <span class="kahoot-shape-icon">
          <i class="fa-solid ${iconClass}"></i>
        </span>
        <span class="kahoot-option-text">${optText}</span>
      `;
      btn.onclick = () => selectOption(index, qData.correct);
      optionsContainer.appendChild(btn);
    });
  }
}

async function selectOption(selectedIndex, correctIndex) {
  clearInterval(triviaTimer);
  const buttons = document.querySelectorAll('.kahoot-option-btn');

  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === correctIndex) btn.classList.add('correct');
    if (idx === selectedIndex && selectedIndex !== correctIndex) btn.classList.add('incorrect');
  });

  if (selectedIndex === correctIndex) {
    correctCount++;
    try {
      const result = await apiRequest('/game/trivia', {
        method: 'POST',
        body: JSON.stringify({ puntosGana: 10 })
      });
      triviaScore += 10;
      state.setPoints(result.puntos);
    } catch (error) {
      console.error('Error al guardar los puntos de trivia:', error);
      await showAppAlert({
        icon: 'error',
        title: 'No se pudieron guardar los puntos',
        text: error.message || 'Intenta de nuevo.'
      });
    }
  }

  const scoreEl = document.getElementById('trivia-score');
  if (scoreEl) scoreEl.textContent = `${triviaScore} PTS`;

  document.getElementById('trivia-next-btn')?.classList.remove('hidden');
}

function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < triviaRound.length) {
    renderQuestion();
  } else {
    document.getElementById('trivia-quiz')?.classList.add('hidden');
    document.getElementById('trivia-result')?.classList.remove('hidden');

    const ratioEl = document.getElementById('trivia-ratio');
    const msgEl = document.getElementById('trivia-final-message');

    if (ratioEl) ratioEl.textContent = `${correctCount}/${triviaRound.length}`;
    if (msgEl) {
      msgEl.textContent = `Respondiste correctamente ${correctCount} de ${triviaRound.length} preguntas y acumulaste ${triviaScore} puntos.`;
    }
  }
}

export function resetTrivia() {
  clearInterval(triviaTimer);
  document.getElementById('trivia-result')?.classList.add('hidden');
  document.getElementById('trivia-welcome')?.classList.remove('hidden');
}

export function destroyTriviaView() {
  clearInterval(triviaTimer);
}

function createTriviaRound() {
  const questionPool = shuffle([...triviaQuestions]).slice(0, QUESTIONS_PER_ROUND);
  return questionPool.map((question) => {
    const options = shuffle(question.options.map((text, index) => ({
      text,
      isCorrect: index === question.correct
    })));

    return {
      q: question.q,
      options: options.map((option) => option.text),
      correct: options.findIndex((option) => option.isCorrect)
    };
  });
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
  }
  return items;
}
