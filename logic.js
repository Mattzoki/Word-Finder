
const SIZE = 10; // grid is SIZE x SIZE
const WORDS_PER_PUZZLE = 8; // how many words to hide
const WORD_POOL = [
    // each word must be <= {SIZE} letters

    "POTATO",
    "ICE",
    "MASH",
    "SWEET",
    "CAR",
    "VALID",
    "MISSING",
    "WILLING",
    "FIRE",
    "PRICK",
];

const DIRS = [
    [0, 1],
    [1, 1],
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, -1],
    [-1, 0],
    [-1, 1],
];

const gridEl = document.getElementById("grid");
const wordsEl = document.getElementById("words");
const statusEl = document.getElementById("status");

let letters = [];
let puzzleWords = [];
let foundWords = new Set();
let cellEls = [];

let dragging = false;
let startCell = null;
let currentLine = [];

const timerEl = document.getElementById("timer");
let timerId = null;
let startTime = 0;
let timerRunning = false;
let timerDone = false;

function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
}

function startTimer() {
    if (timerRunning || timerDone) return;   // only starts once per puzzle
    timerRunning = true;
    startTime = Date.now();
    timerId = setInterval(() => {
        timerEl.textContent = "⏱ " + formatTime(Date.now() - startTime);
    }, 200);
}

function stopTimer() {
    if (!timerRunning) return 0;
    clearInterval(timerId);
    timerRunning = false;
    timerDone = true;
    const elapsed = Date.now() - startTime;
    timerEl.textContent = "⏱ " + formatTime(elapsed);
    timerEl.classList.add("done");
    return elapsed;
}

function resetTimer() {
    clearInterval(timerId);
    timerRunning = false;
    timerDone = false;
    timerEl.textContent = "⏱ 00:00";
    timerEl.classList.remove("done");
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function tryPlace(g, word) {
    for (let attempt = 0; attempt < 60; attempt++) {
        const [dr, dc] = DIRS[Math.floor(Math.random() * 8)];
        const r0 = Math.floor(Math.random() * SIZE);
        const c0 = Math.floor(Math.random() * SIZE);
        const rEnd = r0 + dr * (word.length - 1);
        const cEnd = c0 + dc * (word.length - 1);
        if (rEnd < 0 || rEnd >= SIZE || cEnd < 0 || cEnd >= SIZE) continue;

        let ok = true;
        for (let k = 0; k < word.length; k++) {
            const ch = g[r0 + dr * k][c0 + dc * k];
            if (ch !== "" && ch !== word[k]) {
                ok = false;
                break;
            }
        }
        if (!ok) continue;

        for (let k = 0; k < word.length; k++)
            g[r0 + dr * k][c0 + dc * k] = word[k];
        return true;
    }
    return false;
}

function showError(message) {
    document.getElementById("errorText").textContent = message;
    document.getElementById("errorOverlay").classList.add("show");
}

function generatePuzzle() {
    for (let attempt = 0; attempt < 500; attempt++) {
        const g = Array.from({ length: SIZE }, () => Array(SIZE).fill(""));
        const chosen = [];
        const pool = shuffle(WORD_POOL.filter((w) => w.length <= SIZE));
        for (const w of pool) {
            if (chosen.length >= WORDS_PER_PUZZLE) break;
            if (tryPlace(g, w)) chosen.push(w);
        }
        if (chosen.length === WORDS_PER_PUZZLE) {
            const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            for (let r = 0; r < SIZE; r++)
                for (let c = 0; c < SIZE; c++)
                    if (g[r][c] === "")
                        g[r][c] = alphabet[Math.floor(Math.random() * 26)];
            return { g, chosen };
        }
    }
    throw new Error(
        "Could not build a puzzle - try fewer or shorter words.",
    );
}

function render() {
    document.documentElement.style.setProperty("--n", SIZE);
    gridEl.innerHTML = "";
    cellEls = [];
    for (let r = 0; r < SIZE; r++) {
        const row = [];
        for (let c = 0; c < SIZE; c++) {
            const d = document.createElement("div");
            d.className = "cell";
            d.textContent = letters[r][c];
            d.dataset.r = r;
            d.dataset.c = c;
            gridEl.appendChild(d);
            row.push(d);
        }
        cellEls.push(row);
    }
    wordsEl.innerHTML = "";
    for (const w of puzzleWords) {
        const li = document.createElement("li");
        li.textContent = w;
        li.id = "word-" + w;
        wordsEl.appendChild(li);
    }
    statusEl.textContent = "";
    updateProgress();
    resetTimer();
}

document.getElementById("errorClose").addEventListener("click", () => {
    document.getElementById("errorOverlay").classList.remove("show");
});

function updateProgress() {
    const total = puzzleWords.length;
    const done = foundWords.size;
    document.getElementById("progressText").textContent = `${done} / ${total} found`;
    document.getElementById("progressFill").style.width =
        total ? (done / total) * 100 + "%" : "0%";
}

function newPuzzle() {
    const tooLong = WORD_POOL.filter(w => w.length > SIZE);
    if (tooLong.length > 0) {
        const list = tooLong.join(", ");
        const verb = tooLong.length === 1 ? "is" : "are";
        showError(`Error generating grid: ${list} ${verb} longer than the grid size (${SIZE}).`);
        return;
    }
    const { g, chosen } = generatePuzzle();
    letters = g;
    puzzleWords = shuffle([...chosen]);
    foundWords = new Set();
    render();
}

function cellAt(x, y) {
    const el = document.elementFromPoint(x, y);
    return el && el.classList && el.classList.contains("cell") ? el : null;
}

function lineCells(r0, c0, r1, c1) {
    const dr = r1 - r0,
        dc = c1 - c0;
    if (dr === 0 && dc === 0) return [[r0, c0]];
    const step =
        ((Math.round(Math.atan2(dr, dc) / (Math.PI / 4)) % 8) + 8) % 8;
    const [sr, sc] = DIRS[step];
    const len = Math.max(Math.abs(dr), Math.abs(dc));
    const out = [];
    for (let k = 0; k <= len; k++) {
        const r = r0 + sr * k,
            c = c0 + sc * k;
        if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) break;
        out.push([r, c]);
    }
    return out;
}

function clearSelectionStyles() {
    for (const [r, c] of currentLine) cellEls[r][c].classList.remove("sel");
}

function showSelection(line) {
    clearSelectionStyles();
    currentLine = line;
    for (const [r, c] of currentLine) cellEls[r][c].classList.add("sel");
}

gridEl.addEventListener("pointerdown", (e) => {
    const el = cellAt(e.clientX, e.clientY);
    if (!el) return;
    dragging = true;
    startTimer();
    gridEl.setPointerCapture(e.pointerId);
    startCell = [Number(el.dataset.r), Number(el.dataset.c)];
    showSelection([startCell]);
});

gridEl.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const el = cellAt(e.clientX, e.clientY);
    if (!el) return;
    showSelection(
        lineCells(
            startCell[0],
            startCell[1],
            Number(el.dataset.r),
            Number(el.dataset.c),
        ),
    );
});

function launchConfetti() {
    // skip for people who prefer reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const colors = ["#6366f1", "#ec4899", "#facc15", "#22c55e", "#38bdf8", "#f97316"];
    for (let i = 0; i < 90; i++) {
        const p = document.createElement("div");
        p.className = "confetti-piece";
        p.style.left = Math.random() * 100 + "vw";
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.borderRadius = Math.random() < 0.4 ? "50%" : "2px";
        p.style.setProperty("--dx", (Math.random() * 40 - 20) + "vw");
        p.style.setProperty("--rot", (Math.random() * 900 - 450) + "deg");
        p.style.setProperty("--dur", (2 + Math.random() * 2) + "s");
        p.style.animationDelay = Math.random() * 0.6 + "s";
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 4000);
    }
}

function drawWordBox(line) {
    const [r0, c0] = line[0];
    const [r1, c1] = line[line.length - 1];


    const center = (r, c) => {
        const el = cellEls[r][c];
        return [el.offsetLeft + el.offsetWidth / 2, el.offsetTop + el.offsetHeight / 2];
    };
    const [x0, y0] = center(r0, c0);
    const [x1, y1] = center(r1, c1);

    const gw = gridEl.clientWidth;
    const gh = gridEl.clientHeight;
    const cell = cellEls[0][0].offsetWidth;

    const length = Math.hypot(x1 - x0, y1 - y0) + cell * 0.9;
    const thickness = cell * 0.9;
    const angle = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;

    const box = document.createElement("div");
    box.className = "word-box";

    box.style.left = ((x0 + x1) / 2 / gw * 100) + "%";
    box.style.top = ((y0 + y1) / 2 / gh * 100) + "%";
    box.style.width = (length / gw * 100) + "%";
    box.style.height = (thickness / gh * 100) + "%";
    box.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    gridEl.appendChild(box);
}

function finishSelection() {
    if (!dragging) return;
    dragging = false;

    const line = currentLine;
    clearSelectionStyles();
    currentLine = [];
    if (line.length < 2) return;

    const text = line.map(([r, c]) => letters[r][c]).join("");
    const reversed = [...text].reverse().join("");
    const match = puzzleWords.find(
        (w) => !foundWords.has(w) && (w === text || w === reversed),
    );

    if (match) {
        foundWords.add(match);
        updateProgress();
        for (const [r, c] of line) cellEls[r][c].classList.add("found");
        drawWordBox(line);
        document.getElementById("word-" + match).classList.add("found");
        if (foundWords.size === puzzleWords.length) {
            const elapsed = stopTimer();
            statusEl.textContent = `🎉 You found all the words in ${formatTime(elapsed)}!`;
            launchConfetti();
        }
    } else {
        for (const [r, c] of line) {
            const el = cellEls[r][c];
            el.classList.remove("wrong");
            void el.offsetWidth;
            el.classList.add("wrong");
            setTimeout(() => el.classList.remove("wrong"), 650);
        }
    }
}

gridEl.addEventListener("pointerup", finishSelection);
gridEl.addEventListener("pointercancel", finishSelection);

document.getElementById("newBtn").addEventListener("click", newPuzzle);

newPuzzle();