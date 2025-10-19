// NAMS Master Quiz App
// Author: ChatGPT
// Features: random 20Q rounds, category & difficulty filters, missed tracking, review mode, score history

const FILE_JSON = 'questions.json';
const LS_MISSED = 'nams_missed_v1';
const LS_HISTORY = 'nams_history_v1';

// State
let ALL_QUESTIONS = [];
let session = {
  pool: [],
  index: 0,
  score: 0,
  answered: false,
  current: null,
  settings: {
    categories: new Set(),
    mixAll: true,
    difficulty: 'any',
    numQuestions: 20,
    shuffleAnswers: true,
    reviewMode: false
  }
};

// Utils
function shuffle(array){
  for(let i=array.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
function pick(array, n){
  return array.slice(0, Math.max(0, Math.min(n, array.length)));
}
function nowISO(){ return new Date().toISOString(); }
function byId(id){ return document.getElementById(id); }
function qs(sel, el=document){ return el.querySelector(sel); }
function qsa(sel, el=document){ return [...el.querySelectorAll(sel)]; }

// Local storage helpers
function getMissed(){
  try{
    const raw = localStorage.getItem(LS_MISSED);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  }catch(e){ return new Set(); }
}
function setMissed(set){
  try{ localStorage.setItem(LS_MISSED, JSON.stringify([...set])); }catch(e){}
}
function getHistory(){
  try{
    const raw = localStorage.getItem(LS_HISTORY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
function setHistory(arr){
  try{ localStorage.setItem(LS_HISTORY, JSON.stringify(arr)); }catch(e){}
}

// Load questions
async function loadQuestions(){
  const res = await fetch(FILE_JSON, {cache: 'no-store'});
  if(!res.ok) throw new Error('Could not load questions.json');
  const data = await res.json();
  // Normalize & add ID if missing
  ALL_QUESTIONS = data.map((q, idx)=>({
    id: q.id ?? `q${idx+1}`,
    category: q.category ?? 'General',
    difficulty: q.difficulty ?? 'intermediate',
    stem: q.stem,
    choices: q.choices,
    answer: q.answer, // index 0..3
    explanation: q.explanation ?? ''
  }));
  return ALL_QUESTIONS;
}

// Populate categories
function populateCategories(){
  const wrap = byId('category-chips');
  wrap.innerHTML = '';
  const cats = [...new Set(ALL_QUESTIONS.map(q=>q.category))].sort();
  cats.forEach(cat=>{
    const lbl = document.createElement('label');
    lbl.className = 'chip';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = cat;
    input.addEventListener('change', (e)=>{
      lbl.classList.toggle('active', input.checked);
    });
    lbl.appendChild(input);
    lbl.appendChild(document.createTextNode(` ${cat}`));
    wrap.appendChild(lbl);
  });
}

// Build filtered pool
function buildPool(settings){
  let pool = [...ALL_QUESTIONS];
  if(!settings.mixAll){
    const selectedCats = [...settings.categories];
    pool = pool.filter(q=>selectedCats.includes(q.category));
  }
  if(settings.difficulty !== 'any'){
    pool = pool.filter(q=>q.difficulty === settings.difficulty);
  }
  if(settings.reviewMode){
    const missed = getMissed();
    pool = pool.filter(q=>missed.has(q.id));
  }
  shuffle(pool);
  return pick(pool, settings.numQuestions);
}

// UI Transitions
function show(viewId){
  qsa('.view').forEach(v=>v.classList.remove('active'));
  byId(viewId).classList.add('active');
}

// Render history
function renderHistory(){
  const tbody = qs('#history-table tbody');
  const history = getHistory().slice().reverse(); // newest first
  tbody.innerHTML = '';
  history.forEach(row=>{
    const tr = document.createElement('tr');
    const settings = row.settings;
    const catLabel = settings.mixAll ? 'All' : [...settings.categories].join(', ');
    const diff = settings.difficulty;
    const setText = `Cats: ${catLabel} | Diff: ${diff} | Qs: ${settings.numQuestions}${settings.reviewMode ? ' | Review' : ''}`;
    tr.innerHTML = `<td>${new Date(row.timestamp).toLocaleString()}</td>
                    <td>${Math.round((row.correct/row.total)*100)}%</td>
                    <td>${row.correct}</td>
                    <td>${row.total}</td>
                    <td>${setText}</td>`;
    tbody.appendChild(tr);
  });
}

// Start a game
function startGame(settings){
  session.settings = settings;
  session.pool = buildPool(settings);
  session.index = 0;
  session.score = 0;
  session.answered = false;
  nextQuestion();
  show('view-quiz');
}

// Next question
function nextQuestion(){
  if(session.index >= session.pool.length){
    endGame();
    return;
  }
  session.current = session.pool[session.index];
  session.answered = false;
  renderCard(session.current);
  byId('progress').textContent = `Question ${session.index+1} / ${session.pool.length}`;
  byId('score').textContent = `Score: ${session.score}`;
  byId('feedback').textContent = '';
  byId('feedback').className = 'feedback';
  byId('btn-next').disabled = true;
  // collapse explanation
  const details = byId('explain-wrap');
  details.open = false;
}

// Render current card
function renderCard(q){
  byId('q-category').textContent = q.category;
  byId('q-difficulty').textContent = q.difficulty;
  byId('question-stem').textContent = q.stem;
  const form = byId('choices');
  form.innerHTML = '';
  let answers = q.choices.map((text, idx)=>({text, idx}));
  if(session.settings.shuffleAnswers) shuffle(answers);
  const tmpl = byId('choice-template').content;
  answers.forEach((a, i)=>{
    const node = document.importNode(tmpl, true);
    const label = node.querySelector('.choice');
    const input = node.querySelector('input');
    const letter = node.querySelector('.letter');
    const text = node.querySelector('.text');
    input.value = a.idx;
    input.id = `opt-${i}`;
    label.setAttribute('for', `opt-${i}`);
    letter.textContent = String.fromCharCode(65 + i); // A, B, C, D visual
    text.textContent = a.text;
    form.appendChild(node);
  });
  byId('explanation').textContent = q.explanation || '';
}

// Submit
function submitAnswer(){
  if(session.answered) return;
  const selected = qs('input[name="choice"]:checked', byId('choices'));
  const fb = byId('feedback');
  if(!selected){
    fb.textContent = 'Choose an answer to continue.';
    fb.className = 'feedback error';
    return;
  }
  session.answered = true;
  const chosenIdx = Number(selected.value);
  const correctIdx = session.current.answer;
  const labels = qsa('.choice', byId('choices'));
  // Map choice value to label and mark
  labels.forEach(lbl=>{
    const input = qs('input', lbl);
    const isCorrect = Number(input.value) === correctIdx;
    if(isCorrect) lbl.classList.add('correct');
    if(input.checked && !isCorrect) lbl.classList.add('incorrect');
  });

  const missedSet = getMissed();
  if(chosenIdx === correctIdx){
    session.score += 1;
    fb.textContent = 'Correct ✔';
    fb.className = 'feedback success';
    // If user gets it right during review, remove from missed
    if(session.settings.reviewMode && missedSet.has(session.current.id)){
      missedSet.delete(session.current.id);
      setMissed(missedSet);
    }
  }else{
    fb.textContent = 'Incorrect ✖';
    fb.className = 'feedback error';
    missedSet.add(session.current.id);
    setMissed(missedSet);
  }
  // Expand explanation if present
  if((session.current.explanation ?? '').trim().length){
    byId('explain-wrap').open = true;
  }
  byId('btn-next').disabled = false;
  byId('score').textContent = `Score: ${session.score}`;
}

// End game
function endGame(){
  // Save history
  const hist = getHistory();
  hist.push({
    timestamp: nowISO(),
    correct: session.score,
    total: session.pool.length,
    settings: {
      categories: [...session.settings.categories],
      mixAll: session.settings.mixAll,
      difficulty: session.settings.difficulty,
      numQuestions: session.settings.numQuestions,
      reviewMode: session.settings.reviewMode
    }
  });
  setHistory(hist);
  // Summary
  const percent = Math.round((session.score / session.pool.length)*100);
  alert(`Round complete!\\nScore: ${session.score}/${session.pool.length} (${percent}%)`);
  renderHistory();
  show('view-home');
}

// Wire up events
function setupEvents(){
  // Home form
  byId('settings-form').addEventListener('submit', (e)=>{
    e.preventDefault();
    // categories
    const mixAll = byId('mix-all').checked;
    const categories = new Set();
    if(!mixAll){
      qsa('#category-chips input[type="checkbox"]').forEach(chk=>{
        if(chk.checked) categories.add(chk.value);
      });
      if(categories.size === 0){
        alert('Select at least one category or enable "Mix all topics".');
        return;
      }
    }
    const diff = qs('input[name="difficulty"]:checked').value;
    const numQ = Math.max(5, Math.min(50, Number(byId('num-questions').value || 20)));
    const shuffleAns = byId('shuffle-answers').value === 'yes';
    startGame({
      categories,
      mixAll,
      difficulty: diff,
      numQuestions: numQ,
      shuffleAnswers: shuffleAns,
      reviewMode: false
    });
  });

  // Review mode
  byId('btn-review-mode').addEventListener('click', ()=>{
    const missed = getMissed();
    if(missed.size === 0){
      alert('No missed questions saved yet. Play a round first!');
      return;
    }
    // Build categories snapshot but keep mixAll
    const mixAll = byId('mix-all').checked;
    const categories = new Set();
    if(!mixAll){
      qsa('#category-chips input[type="checkbox"]').forEach(chk=>{
        if(chk.checked) categories.add(chk.value);
      });
    }
    const diff = qs('input[name="difficulty"]:checked').value;
    const numQ = Math.max(5, Math.min(50, Number(byId('num-questions').value || 20)));
    const shuffleAns = byId('shuffle-answers').value === 'yes';
    startGame({
      categories,
      mixAll,
      difficulty: diff,
      numQuestions: numQ,
      shuffleAnswers: shuffleAns,
      reviewMode: true
    });
  });

  // Quiz view actions
  byId('btn-submit').addEventListener('click', submitAnswer);
  byId('btn-next').addEventListener('click', ()=>{
    session.index += 1;
    nextQuestion();
  });
  byId('btn-exit').addEventListener('click', ()=>{
    if(confirm('End this round and return to Home?')){
      show('view-home');
      renderHistory();
    }
  });

  // Clearers
  byId('btn-clear-history').addEventListener('click', ()=>{
    if(confirm('Clear your score history?')){
      setHistory([]);
      renderHistory();
    }
  });
  byId('btn-clear-missed').addEventListener('click', ()=>{
    if(confirm('Clear your saved missed questions?')){
      setMissed(new Set());
      alert('Missed questions cleared.');
    }
  });
}

// Init
(async function init(){
  try{
    await loadQuestions();
    populateCategories();
    renderHistory();
    setupEvents();
  }catch(err){
    alert('Error loading questions. Make sure questions.json is present.\n' + err.message);
    console.error(err);
  }
})();
