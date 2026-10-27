(function () {
  "use strict";

  const DATA = window.CEDILLE_DATA;
  const STORAGE_KEY = "cedille.state.v1";

  const DEFAULT_STATE = {
    name: "Léa",
    level: "B1",
    target: "DELF B1",
    dailyGoal: 20,
    readiness: 68,
    streak: 6,
    xp: 1240,
    wordsLearned: 184,
    lessonsCompleted: 12,
    completedLessons: ["cafe"],
    weekly: [true, true, true, true, true, true, false],
    minutesThisWeek: 104,
    skills: { listening: 72, reading: 81, writing: 54, speaking: 60 },
    examHistory: [
      { date: "24 Oct", level: "DELF B1", score: 64, label: "Mixed sprint" },
      { date: "19 Oct", level: "DELF B1", score: 58, label: "Listening focus" }
    ],
    examLevel: "B1",
    placementResult: null,
    reminder: true
  };

  const VIEWS = ["today", "path", "lesson", "exam", "exam-run", "progress", "profile", "placement"];

  let state = loadState();
  let lessonRun = null;
  let examRun = null;
  let placementRun = null;
  let timerId = null;
  let toastTimer = null;
  let lastRenderedView = null;

  const viewEl = document.getElementById("view");
  const toastEl = document.getElementById("toast");

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadState() {
    const base = clone(DEFAULT_STATE);
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") return base;
      Object.assign(base, saved);
      base.skills = Object.assign({}, DEFAULT_STATE.skills, saved.skills || {});
      if (!Array.isArray(base.weekly) || base.weekly.length !== 7) base.weekly = clone(DEFAULT_STATE.weekly);
      if (!Array.isArray(base.completedLessons)) base.completedLessons = [];
      if (!Array.isArray(base.examHistory)) base.examHistory = [];
      return base;
    } catch (error) {
      return base;
    }
  }

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // Private browsing can block storage; the demo still works for this page view.
    }
  }

  function esc(value) {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(value === null || value === undefined ? "" : value).replace(/[&<>"']/g, function (char) {
      return map[char];
    });
  }

  function icon(name) {
    return '<svg class="icon" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getView() {
    const hash = window.location.hash.replace(/^#\/?/, "");
    return VIEWS.indexOf(hash) !== -1 ? hash : "today";
  }

  function go(view) {
    if (VIEWS.indexOf(view) === -1) view = "today";
    if (window.location.hash === "#" + view) {
      render();
    } else {
      window.location.hash = view;
    }
  }

  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove("show");
    }, 2600);
  }

  function formatToday() {
    return new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  }

  function formatLongDate(value) {
    const date = new Date(value + "T00:00:00");
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }

  function shortDate() {
    return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  function daysUntil(value) {
    const target = new Date(value + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86400000));
  }

  function lastSeven() {
    const days = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      days.push({
        initial: date.toLocaleDateString("en-GB", { weekday: "narrow" }),
        number: date.getDate(),
        done: Boolean(state.weekly[6 - offset]),
        today: offset === 0
      });
    }
    return days;
  }

  function weekStrip() {
    return lastSeven()
      .map(function (day) {
        return (
          '<div class="week-day"><span>' +
          esc(day.initial) +
          '</span><div class="week-dot' +
          (day.done ? " done" : "") +
          (day.today ? " today" : "") +
          '" title="' +
          (day.done ? "Studied" : "No session") +
          '">' +
          (day.done ? "✓" : esc(day.number)) +
          "</div></div>"
        );
      })
      .join("");
  }

  function skillRow(name, value, tone) {
    return (
      '<div class="skill-row"><span>' +
      esc(name) +
      "</span><div class=\"bar-track\"><span class=\"bar-fill " +
      (tone || "") +
      '" style="width:' +
      clamp(value, 0, 100) +
      '%"></span></div><strong>' +
      value +
      "</strong></div>"
    );
  }

  function moduleStatus(module) {
    if (module.lessonId && state.completedLessons.indexOf(module.lessonId) !== -1) return "done";
    if (module.status === "current") return "current";
    if (module.id === "getting-around" && state.completedLessons.indexOf("market") !== -1) return "next";
    return "locked";
  }

  function moduleAction(module, status) {
    if (status === "done" || status === "current") {
      return (
        '<button class="btn btn-sm ' +
        (status === "current" ? "" : "btn-ghost") +
        '" data-action="start-lesson" data-id="' +
        esc(module.lessonId) +
        '">' +
        (status === "done" ? "Review " : "Continue ") +
        icon("arrow") +
        "</button>"
      );
    }
    if (status === "next") {
      return '<button class="btn btn-sm btn-ghost" data-action="roadmap">Preview ' + icon("arrow") + "</button>";
    }
    return (
      '<button class="btn btn-sm btn-ghost" disabled aria-label="' +
      esc(module.title) +
      ' is locked">' +
      icon("lock") +
      " Locked</button>"
    );
  }

  function renderToday() {
    const lesson = DATA.lessons.market;
    const done = state.completedLessons.indexOf(lesson.id) !== -1;
    const days = daysUntil(DATA.user.examDate);
    const weekGoal = state.dailyGoal * 7;
    const minutesPct = clamp(Math.round((state.minutesThisWeek / weekGoal) * 100), 0, 100);
    const gap = Math.max(0, 75 - state.readiness);
    const words = lesson.parts[0].words.slice(0, 3);
    const path = DATA.path.slice(0, 3);

    return (
      '<section class="view">' +
      '<div class="greeting-row">' +
      "<div>" +
      '<p class="eyebrow">' +
      esc(formatToday()) +
      "</p>" +
      '<h1 class="greeting">Bonjour, <em>' +
      esc(state.name) +
      "</em>.</h1>" +
      '<p class="greeting-sub">' +
      (done
        ? "You finished today's session. A short review keeps it warm."
        : "One focused session today. Your B1 plan is ready when you are.") +
      "</p>" +
      "</div>" +
      '<button class="avatar today-avatar" data-action="go" data-view="profile" aria-label="Open profile">LM</button>' +
      "</div>" +
      '<div class="dashboard-grid">' +
      '<div class="dash-main">' +
      '<section class="card hero-lesson">' +
      '<div class="hero-copy">' +
      '<p class="eyebrow light">' +
      (done ? "Session complete · Review any time" : "Today · " + lesson.minutes + " min") +
      "</p>" +
      "<h2>" +
      esc(lesson.title) +
      "</h2>" +
      '<p class="hero-sub">' +
      esc(lesson.subtitle) +
      "</p>" +
      '<div class="hero-meta"><span class="pill">' +
      esc(lesson.level) +
      '</span><span class="pill">' +
      lesson.parts.length +
      " parts</span><span class=\"pill\">+" +
      lesson.xp +
      ' XP</span></div>' +
      '<button class="btn btn-light" data-action="start-lesson" data-id="' +
      lesson.id +
      '">' +
      icon(done ? "refresh" : "play") +
      (done ? " Review today's session" : " Start today's session") +
      "</button>" +
      "</div>" +
      '<div class="hero-art"><div class="lesson-stamp"><div><strong>' +
      esc(lesson.level) +
      "</strong><small>" +
      esc(DATA.user.target) +
      '</small></div><span class="stamp-time">' +
      icon("clock") +
      " " +
      lesson.minutes +
      " min</span></div></div>" +
      "</section>" +
      '<div class="stat-row">' +
      '<div class="stat"><div class="stat-top">' +
      icon("flame") +
      ' Streak</div><strong>' +
      state.streak +
      ' days</strong><small>Personal best: ' +
      Math.max(9, state.streak) +
      " days</small></div>" +
      '<div class="stat"><div class="stat-top">' +
      icon("spark") +
      ' XP</div><strong>' +
      state.xp.toLocaleString("en-GB") +
      '</strong><small>+60 for today\'s lesson</small></div>' +
      '<div class="stat"><div class="stat-top">' +
      icon("book") +
      ' Words</div><strong>' +
      state.wordsLearned +
      "</strong><small>4 new in this lesson</small></div>" +
      "</div>" +
      '<section class="card">' +
      '<div class="card-head"><div><p class="eyebrow">Exam readiness</p><h2>' +
      state.readiness +
      " / 100</h2></div><a class=\"text-link\" href=\"#progress\">Details " +
      icon("arrow") +
      "</a></div>" +
      '<div class="readiness-card">' +
      '<div class="score-ring" style="--score:' +
      state.readiness +
      '"><div class="score-ring-inner"><strong>' +
      state.readiness +
      "</strong><small>of 100</small></div></div>" +
      '<div class="readiness-copy"><h3>' +
      (gap > 0 ? gap + " points from a comfortable pass." : "Comfortably in pass territory.") +
      "</h3><p>Built from your lessons and timed sprints. The DELF B1 pass mark is 50.</p>" +
      '<div class="skill-bars">' +
      skillRow("Listening", state.skills.listening, "") +
      skillRow("Reading", state.skills.reading, "") +
      skillRow("Writing", state.skills.writing, "coral") +
      skillRow("Speaking", state.skills.speaking, "gold") +
      "</div></div></div></section>" +
      '<section class="card">' +
      '<div class="card-head"><div><p class="eyebrow">Your path</p><h2>B1, one week at a time.</h2></div><a class="text-link" href="#path">View all ' +
      icon("arrow") +
      "</a></div>" +
      '<div class="path-list">' +
      path
        .map(function (module) {
          const status = moduleStatus(module);
          const stateLabel =
            status === "done"
              ? icon("check") + " Done"
              : status === "current"
                ? "Continue " + icon("arrow")
                : status === "next"
                  ? "Next " + icon("arrow")
                  : icon("lock") + " Locked";
          const action =
            status === "done" || status === "current"
              ? "start-lesson"
              : status === "next"
                ? "roadmap"
                : "locked";
          return (
            '<button class="path-item status-' +
            status +
            '" data-action="' +
            action +
            '" data-id="' +
            esc(module.lessonId || "") +
            '"><span class="path-num">' +
            esc(module.number) +
            '</span><span class="path-info"><strong>' +
            esc(module.title) +
            "</strong><span>" +
            esc(module.subtitle) +
            '</span></span><span class="path-state">' +
            stateLabel +
            "</span></button>"
          );
        })
        .join("") +
      "</div></section>" +
      '<section class="card">' +
      '<div class="card-head"><div><p class="eyebrow">Word bank</p><h2>Keep these close.</h2></div><a class="text-link" href="#progress">All words ' +
      icon("arrow") +
      "</a></div>" +
      '<div class="word-grid">' +
      words
        .map(function (word) {
          return (
            '<div class="word-chip"><div class="word-chip-top"><div><strong>' +
            esc(word.fr) +
            "</strong><p>" +
            esc(word.en) +
            '</p></div><button class="icon-btn" data-action="play" data-text="' +
            esc(word.fr) +
            '" aria-label="Play ' +
            esc(word.fr) +
            '">' +
            icon("speaker") +
            "</button></div></div>"
          );
        })
        .join("") +
      "</div></section>" +
      "</div>" +
      '<aside class="dash-rail">' +
      '<section class="card week-card"><div class="card-head" style="margin-bottom:0"><div><p class="eyebrow">This week</p><h2>' +
      state.minutesThisWeek +
      ' min</h2></div><span class="pill">' +
      weekGoal +
      ' min goal</span></div><div class="week-strip">' +
      weekStrip() +
      '</div><div class="week-note"><span>' +
      minutesPct +
      "% of weekly goal</span><strong>" +
      (minutesPct >= 100 ? "Goal met" : weekGoal - state.minutesThisWeek + " min to go") +
      "</strong></div></section>" +
      '<section class="card countdown-card"><p class="eyebrow">Next milestone</p><div class="countdown-number"><strong>' +
      days +
      "</strong><span>days to " +
      esc(DATA.user.target) +
      "</span></div><p>" +
      esc(formatLongDate(DATA.user.examDate)) +
      ". Current readiness: " +
      state.readiness +
      "/100.</p><div class=\"mini-bar\"><span></span></div><button class=\"btn btn-light btn-sm\" data-action=\"go\" data-view=\"exam\" style=\"margin-top:16px\">Plan a sprint " +
      icon("arrow") +
      "</button></section>" +
      '<section class="card phrase-card"><p class="eyebrow">Say it like a local</p><div class="phrase-fr">Ça marche !</div><div class="phrase-en">That works!</div><button class="icon-btn" data-action="play" data-text="Ça marche !" aria-label="Play Ça marche" style="margin-top:9px">' +
      icon("speaker") +
      '</button><p class="tip-note">The all-purpose yes in French conversation. Use it to agree, confirm, or say "okay, let\'s do that."</p></section>' +
      "</aside>" +
      "</div>" +
      "</section>"
    );
  }

  function renderPath() {
    const modules = DATA.path
      .map(function (module) {
        const status = moduleStatus(module);
        const progress = clamp(Math.round((module.done / module.lessons) * 100), 0, 100);
        return (
          '<article class="module ' +
          status +
          '"><div class="module-num">' +
          esc(module.number) +
          '</div><div class="module-body"><h3>' +
          esc(module.title) +
          "</h3><p>" +
          esc(module.subtitle) +
          '</p><div class="module-meta"><span class="pill">' +
          esc(module.level) +
          '</span><span class="pill">' +
          module.lessons +
          " lessons</span></div>" +
          (status === "done" || status === "current"
            ? '<div class="module-progress"><div class="bar-track"><span class="bar-fill" style="width:' +
              progress +
              '%"></span></div></div>'
            : "") +
          '</div><div class="module-action">' +
          moduleAction(module, status) +
          "</div></article>"
        );
      })
      .join("");

    return (
      '<section class="view">' +
      '<div class="page-head"><div><p class="eyebrow">Learning path</p><h1>A clear route to exam day.</h1><p class="lede">Short lessons build the language. Timed sprints build the exam habit. Your path is ordered so each week has one obvious next step.</p></div><span class="level-chip"><span class="dot"></span>' +
      esc(DATA.user.target) +
      "</span></div>" +
      '<div class="calibration-banner"><div><strong>Not sure this is the right level?</strong><p>Take the five-question check. It takes about three minutes and suggests where to start.</p></div><button class="btn btn-sm btn-ghost" data-action="go" data-view="placement">Check my level ' +
      icon("arrow") +
      "</button></div>" +
      '<div class="module-list">' +
      modules +
      "</div>" +
      '<div class="path-footer">' +
      '<section class="card"><div class="card-head"><div><p class="eyebrow">What B1 asks of you</p><h2>The four signals.</h2></div></div><div class="skill-list">' +
      ["listening", "reading", "writing", "speaking"]
        .map(function (key) {
          const label = key.charAt(0).toUpperCase() + key.slice(1);
          return (
            '<div class="skill-list-row"><strong>' +
            label +
            "</strong><span>" +
            state.skills[key] +
            '</span><div class="bar-track"><span class="bar-fill ' +
            (key === "writing" ? "coral" : key === "speaking" ? "gold" : "") +
            '" style="width:' +
            state.skills[key] +
            '%"></span></div></div>'
          );
        })
        .join("") +
      "</div></section>" +
      '<section class="card"><div class="card-head"><div><p class="eyebrow">How this demo works</p><h2>Small on purpose.</h2></div></div><p class="lede" style="font-size:12px">Two complete lessons are playable: Café survival and At the market. The exam studio adds a six-question timed sprint. Writing feedback and live speaking practice are the next build, not hidden behind a fake button.</p><button class="btn btn-sm btn-ghost" style="margin-top:16px" data-action="start-lesson" data-id="market">Open the market lesson ' +
      icon("arrow") +
      "</button></section>" +
      "</div>" +
      "</section>"
    );
  }

  function renderLesson() {
    if (!lessonRun) {
      return (
        '<section class="view"><div class="placement-intro"><h1>No lesson open.</h1><p>Pick a lesson from your path and Cedille will set it up.</p><button class="btn" data-action="go" data-view="path" style="margin-top:18px">Go to your path ' +
        icon("arrow") +
        "</button></div></section>"
      );
    }

    const lesson = DATA.lessons[lessonRun.id];
    if (!lesson) {
      return '<section class="view"><div class="placement-intro"><h1>Lesson not found.</h1><p>Return to your path and choose another lesson.</p></div></section>';
    }

    if (lessonRun.done) return renderLessonComplete(lesson);

    const part = lesson.parts[lessonRun.partIndex];
    const total = lesson.parts.length;
    const progress = Math.round(((lessonRun.partIndex + (lessonRun.checked ? 1 : 0.35)) / total) * 100);

    let body = "";
    if (part.type === "vocab") {
      body = renderVocabPart(part);
    } else if (part.type === "listening") {
      body = renderListeningPart(part);
    } else {
      body = renderQuizPart(part);
    }

    return (
      '<section class="view lesson-shell">' +
      '<div class="lesson-top"><button class="back-link" data-action="exit-lesson">' +
      icon("arrow-left") +
      ' Back to today</button><span class="lesson-counter">' +
      (lessonRun.partIndex + 1) +
      " of " +
      total +
      " parts</span></div>" +
      '<div class="lesson-progress"><span style="width:' +
      clamp(progress, 4, 100) +
      '%"></span></div>' +
      '<div class="lesson-heading"><p class="eyebrow">' +
      esc(part.eyebrow) +
      "</p><h1>" +
      esc(part.title) +
      "</h1>" +
      (part.intro ? "<p>" + esc(part.intro) + "</p>" : "") +
      "</div>" +
      body +
      '<div class="lesson-actions"><button class="btn btn-quiet" data-action="exit-lesson">Save and exit</button>' +
      (part.type === "vocab"
        ? '<button class="btn" data-action="lesson-next">Continue ' + icon("arrow") + "</button>"
        : lessonRun.checked
          ? '<button class="btn" data-action="lesson-next">' +
            (lessonRun.partIndex === total - 1 ? "Finish lesson " : "Next part ") +
            icon("arrow") +
            "</button>"
          : '<button class="btn" data-action="check-lesson">Check answer ' + icon("check") + "</button>") +
      "</div>" +
      "</section>"
    );
  }

  function renderVocabPart(part) {
    return (
      '<div class="word-list">' +
      part.words
        .map(function (word) {
          return (
            '<article class="word-card"><div class="word-card-top"><div><div class="fr">' +
            esc(word.fr) +
            '</div><div class="en">' +
            esc(word.en) +
            '</div></div><button class="icon-btn" data-action="play" data-text="' +
            esc(word.fr) +
            '" aria-label="Play ' +
            esc(word.fr) +
            '">' +
            icon("speaker") +
            "</button></div>" +
            '<div class="word-example">' +
            esc(word.example) +
            '</div><div class="word-note">' +
            esc(word.note) +
            "</div></article>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderListeningPart(part) {
    const reveal = lessonRun.checked || lessonRun.showTranscript;
    const options = part.options
      .map(function (option, index) {
        let className = "option-btn";
        let letter = String.fromCharCode(65 + index);
        if (lessonRun.checked) {
          if (index === part.answer) className += " correct";
          else if (index === lessonRun.selected) className += " wrong";
        } else if (index === lessonRun.selected) {
          className += " selected";
        }
        return (
          '<button class="' +
          className +
          '" data-action="select-lesson" data-value="' +
          index +
          '"' +
          (lessonRun.checked ? " disabled" : "") +
          '><span class="letter">' +
          letter +
          "</span><span>" +
          esc(option) +
          "</span></button>"
        );
      })
      .join("");

    return (
      '<div class="listening-box"><div class="listening-top"><button class="audio-orb" data-action="play" data-text="' +
      esc(part.audio) +
      '" aria-label="Play the French audio">' +
      icon("speaker") +
      '</button><div><h3>Listen once, then answer.</h3><p>French audio · tap to replay</p></div></div><div class="waveform">' +
      Array.from({ length: 28 })
        .map(function () {
          return "<span></span>";
        })
        .join("") +
      '</div><div class="replay-row"><button class="btn btn-sm" data-action="play" data-text="' +
      esc(part.audio) +
      '">' +
      icon("speaker") +
      ' Replay audio</button><button class="btn btn-sm" data-action="toggle-transcript">' +
      (reveal ? "Hide transcript" : "Show transcript") +
      "</button></div>" +
      (reveal ? '<div class="transcript">' + esc(part.audio) + "</div>" : "") +
      "</div>" +
      '<div class="question-card"><p class="eyebrow" style="margin-top:4px">Comprehension</p><h3 style="margin-top:7px">' +
      esc(part.prompt) +
      '</h3><div class="option-list">' +
      options +
      "</div>" +
      lessonFeedback(part) +
      "</div>"
    );
  }

  function renderQuizPart(part) {
    const options = part.options
      .map(function (option, index) {
        let className = "option-btn";
        let letter = String.fromCharCode(65 + index);
        if (lessonRun.checked) {
          if (index === part.answer) className += " correct";
          else if (index === lessonRun.selected) className += " wrong";
        } else if (index === lessonRun.selected) {
          className += " selected";
        }
        return (
          '<button class="' +
          className +
          '" data-action="select-lesson" data-value="' +
          index +
          '"' +
          (lessonRun.checked ? " disabled" : "") +
          '><span class="letter">' +
          letter +
          "</span><span>" +
          esc(option) +
          "</span></button>"
        );
      })
      .join("");

    return (
      '<div class="question-card" style="margin-top:0"><div class="question-prompt">' +
      esc(part.prompt) +
      '</div><div class="option-list">' +
      options +
      "</div>" +
      lessonFeedback(part) +
      "</div>"
    );
  }

  function lessonFeedback(part) {
    if (!lessonRun.checked) return "";
    const correct = lessonRun.selected === part.answer;
    return (
      '<div class="feedback ' +
      (correct ? "good" : "bad") +
      '">' +
      icon(correct ? "check" : "x") +
      "<div><strong>" +
      (correct ? "Exactly right." : "Not quite.") +
      "</strong>" +
      esc(part.explanation) +
      "</div></div>"
    );
  }

  function renderLessonComplete(lesson) {
    const confettiColors = ["#d85f43", "#e4b25a", "#cdddc7", "#173f40"];
    const confetti = Array.from({ length: 16 })
      .map(function (_, index) {
        return (
          '<span style="left:' +
          (5 + index * 5.8) +
          "%;background:" +
          confettiColors[index % confettiColors.length] +
          ";animation-delay:" +
          (index * 55) +
          'ms"></span>'
        );
      })
      .join("");

    return (
      '<section class="view lesson-shell"><div class="completion"><div class="confetti" aria-hidden="true">' +
      confetti +
      '</div><div class="completion-mark">' +
      icon("check") +
      "</div><p class=\"eyebrow\">" +
      (lessonRun.awarded ? "Session complete" : "Review complete") +
      "</p><h1>" +
      (lessonRun.awarded ? "That is today done." : "Still sharp.") +
      "</h1><p class=\"outcome\">" +
      esc(lesson.outcome) +
      '</p><div class="completion-stats"><div class="completion-stat"><strong>+' +
      (lessonRun.awarded ? lesson.xp : 0) +
      "</strong><span>XP</span></div><div class=\"completion-stat\"><strong>" +
      lesson.newWords +
      "</strong><span>Words</span></div><div class=\"completion-stat\"><strong>" +
      lessonRun.correct +
      "/" +
      (lesson.parts.length - 1) +
      "</strong><span>Quiz</span></div></div>" +
      '<div class="completion-actions"><button class="btn" data-action="go" data-view="today">Back to today ' +
      icon("arrow") +
      '</button><button class="btn btn-ghost" data-action="go" data-view="exam">Take a timed sprint</button></div>' +
      '<p class="muted small" style="position:relative;margin-top:18px">' +
      (lessonRun.awarded
        ? "Readiness moved up. Your next session is waiting on the path."
        : "Review sessions do not add XP, but they keep the language warm.") +
      "</p></div></section>"
    );
  }

  function renderExam() {
    const level = state.examLevel || "B1";
    const bank = DATA.exam.levels[level];
    const active = examRun && !examRun.finished;
    const finished = examRun && examRun.finished;
    const sections = {};
    bank.questions.forEach(function (question) {
      sections[question.section] = (sections[question.section] || 0) + 1;
    });
    const recent = state.examHistory.slice(0, 4);

    return (
      '<section class="view">' +
      '<div class="page-head"><div><p class="eyebrow">Exam studio</p><h1>Practise the clock, not just the language.</h1><p class="lede">A five-minute sprint sampled from the real paper. Six questions, no hints, a score at the end that moves your readiness estimate.</p></div><span class="level-chip"><span class="dot"></span>' +
      esc(bank.label) +
      "</span></div>" +
      '<div class="exam-grid"><div><section class="exam-hero"><p class="eyebrow light">Timed practice</p><div class="level-switch">' +
      ["B1", "B2", "C1"]
        .map(function (key) {
          return (
            '<button class="' +
            (key === level ? "active" : "") +
            '" data-action="exam-level" data-level="' +
            key +
            '">' +
            key +
            "</button>"
          );
        })
        .join("") +
      '</div><h2>A five-minute sprint, scored like exam day.</h2><p>' +
      esc(bank.blurb) +
      '</p><div class="hero-meta"><span class="pill">' +
      Math.round(DATA.exam.duration / 60) +
      ' min</span><span class="pill">' +
      bank.questions.length +
      ' questions</span><span class="pill">Pass 50/100</span></div>' +
      (active
        ? '<button class="btn btn-light" data-action="resume-exam">' +
          icon("play") +
          " Resume paused sprint</button>"
        : '<button class="btn btn-light" data-action="start-exam" data-level="' +
          level +
          '">' +
          icon("play") +
          " Start " +
          esc(bank.label) +
          " sprint</button>") +
      (finished
        ? '<button class="btn btn-ghost" style="margin-left:8px;color:var(--paper-2);border-color:rgba(251,248,241,.25)" data-action="view-result">View last result</button>'
        : "") +
      "</section>" +
      '<section class="card" style="margin-top:20px"><div class="card-head"><div><p class="eyebrow">Sprint anatomy</p><h2>What is inside.</h2></div><span class="pill">' +
      esc(bank.label) +
      '</span></div><div class="exam-anatomy">' +
      Object.keys(sections)
        .map(function (name) {
          return (
            '<div class="anatomy-row"><span>' +
            esc(name) +
            "</span><strong>" +
            sections[name] +
            (sections[name] === 1 ? " question" : " questions") +
            "</strong></div>"
          );
        })
        .join("") +
      '</div><p class="muted small" style="margin-top:13px">The real DELF is four sections at 25 points each. This sprint samples listening, reading, language, and writing; speaking is not scored here.</p></section>' +
      '<section class="card" style="margin-top:20px"><div class="card-head"><div><p class="eyebrow">Examiner note</p><h2>What moves the mark.</h2></div></div><div class="skill-list"><div class="skill-list-row"><strong>Answer the question that was asked</strong><span>Relevance first</span></div><div class="skill-list-row"><strong>Use a connector</strong><span>However, therefore, although</span></div><div class="skill-list-row"><strong>Leave time to check gender</strong><span>Une erreur évitable</span></div></div></section>' +
      "</div>" +
      '<aside><section class="card"><div class="card-head"><div><p class="eyebrow">Recent attempts</p><h2>Your last sprints.</h2></div></div><div class="history-list">' +
      (recent.length
        ? recent
            .map(function (attempt) {
              return (
                '<div class="history-row"><div><strong>' +
                esc(attempt.label) +
                "</strong><small>" +
                esc(attempt.date) +
                " · " +
                esc(attempt.level) +
                '</small></div><span class="pill">' +
                (attempt.score >= 50 ? "Pass" : "Close") +
                '</span><span class="history-score ' +
                (attempt.score >= 75 ? "pass" : "near") +
                '">' +
                attempt.score +
                "</span></div>"
              );
            })
            .join("")
        : '<p class="muted small">No sprints yet. The first one sets your baseline.</p>') +
      '</div></section><section class="card countdown-card" style="margin-top:20px"><p class="eyebrow">Exam day</p><div class="countdown-number"><strong>' +
      daysUntil(DATA.user.examDate) +
      '</strong><span>days</span></div><p>' +
      esc(DATA.user.target) +
      " · " +
      esc(formatLongDate(DATA.user.examDate)) +
      '</p><div class="mini-bar"><span></span></div></section></aside></div></section>'
    );
  }

  function renderExamRun() {
    if (!examRun) return renderExam();
    if (examRun.finished) return renderExamResult();

    const bank = DATA.exam.levels[examRun.level];
    const questions = bank.questions;
    const question = questions[examRun.index];
    const selected = examRun.answers[examRun.index];
    const answered = examRun.answers.filter(function (answer) {
      return answer !== null;
    }).length;

    const options = question.options
      .map(function (option, index) {
        return (
          '<button class="option-btn' +
          (selected === index ? " selected" : "") +
          '" data-action="exam-answer" data-value="' +
          index +
          '"><span class="letter">' +
          String.fromCharCode(65 + index) +
          "</span><span>" +
          esc(option) +
          "</span></button>"
        );
      })
      .join("");

    return (
      '<section class="view exam-run">' +
      '<div class="exam-status"><div class="exam-status-left"><button class="back-link" data-action="exam-exit" style="margin:0">' +
      icon("arrow-left") +
      ' Exit sprint</button><span class="pill">' +
      esc(bank.label) +
      '</span></div><div class="exam-timer" id="exam-timer">' +
      icon("clock") +
      '<span id="exam-time">' +
      formatTime(examRun.timeLeft) +
      "</span></div></div>" +
      '<div class="exam-progress"><span style="width:' +
      Math.round(((examRun.index + 1) / questions.length) * 100) +
      '%"></span></div>' +
      '<div class="exam-question-head"><div><p class="eyebrow">Question ' +
      (examRun.index + 1) +
      " of " +
      questions.length +
      " · " +
      esc(question.section) +
      '</p><h1>' +
      esc(question.prompt) +
      '</h1></div><span class="pill">No hints</span></div>' +
      (question.audio
        ? '<div class="listening-box" style="margin-top:18px"><div class="listening-top"><button class="audio-orb" data-action="play" data-text="' +
          esc(question.audio) +
          '" aria-label="Play the French audio">' +
          icon("speaker") +
          '</button><div><h3>Listen to the exchange.</h3><p>French audio · tap to replay</p></div></div><div class="waveform">' +
          Array.from({ length: 28 })
            .map(function () {
              return "<span></span>";
            })
            .join("") +
          '</div><div class="replay-row"><button class="btn btn-sm" data-action="play" data-text="' +
          esc(question.audio) +
          '">' +
          icon("speaker") +
          " Replay audio</button></div></div>"
        : "") +
      (question.context ? '<div class="context-box">' + esc(question.context) + "</div>" : "") +
      '<div class="option-list">' +
      options +
      "</div>" +
      '<div class="exam-nav"><button class="btn btn-ghost" data-action="exam-prev"' +
      (examRun.index === 0 ? " disabled" : "") +
      ">" +
      icon("arrow-left") +
      ' Previous</button><div class="exam-nav-right"><span class="muted small" style="align-self:center">' +
      answered +
      " of " +
      questions.length +
      ' answered</span><button class="btn" data-action="exam-next">' +
      (examRun.index === questions.length - 1 ? "Submit sprint " : "Next question ") +
      icon("arrow") +
      "</button></div></div>" +
      "</section>"
    );
  }

  function renderExamResult() {
    const bank = DATA.exam.levels[examRun.level];
    const result = examRun.result;
    const questions = bank.questions;
    const sectionRows = Object.keys(result.sections)
      .map(function (name) {
        const section = result.sections[name];
        const pct = Math.round((section.correct / section.total) * 100);
        return (
          '<div class="result-section-row"><span>' +
          esc(name) +
          '</span><div class="bar-track"><span class="bar-fill" style="width:' +
          pct +
          '%"></span></div><strong>' +
          section.correct +
          "/" +
          section.total +
          "</strong></div>"
        );
      })
      .join("");

    const reviewRows = questions
      .map(function (question, index) {
        const chosen = examRun.answers[index];
        const correct = chosen === question.answer;
        const chosenText = chosen === null ? "No answer" : question.options[chosen];
        return (
          '<article class="review-row"><div class="review-row-head"><span class="review-indicator ' +
          (correct ? "good" : "bad") +
          '">' +
          icon(correct ? "check" : "x") +
          "</span><div><strong>" +
          (index + 1) +
          ". " +
          esc(question.prompt) +
          "</strong><small>" +
          esc(question.section) +
          " · " +
          (correct ? "Correct" : "Your answer: " + esc(chosenText)) +
          '</small></div></div><div class="review-answer">' +
          (correct ? "" : "<b>Correct answer:</b> " + esc(question.options[question.answer]) + "<br>") +
          (question.audio ? "<b>Audio:</b> " + esc(question.audio) + "<br>" : "") +
          (question.context ? "<b>Text:</b> " + esc(question.context.replace(/\n/g, " · ")) + "<br>" : "") +
          esc(question.explanation) +
          "</div></article>"
        );
      })
      .join("");

    const score = result.score;
    const headline =
      score >= 75 ? "A strong pass." : score >= 50 ? "A pass. Now make it comfortable." : "Close. One more sprint.";
    const message =
      score >= 50
        ? "You cleared the pass mark of 50/100. Your readiness estimate is now " +
          state.readiness +
          "/100. The next useful move is a second sprint on a different day."
        : "The pass mark is 50/100. Your readiness estimate is now " +
          state.readiness +
          "/100. Read the explanations, then take the sprint again when the language feels less new.";

    return (
      '<section class="view exam-result">' +
      '<div class="result-hero"><div class="result-ring" style="--score:' +
      score +
      '"><div class="result-ring-inner"><strong>' +
      score +
      "</strong><span>/ 100</span></div></div><div class=\"result-copy\"><p class=\"eyebrow light\">" +
      esc(bank.label) +
      " · " +
      (score >= 50 ? "Pass zone" : "Below pass mark") +
      "</p><h1>" +
      headline +
      "</h1><p>" +
      message +
      '</p><div class="result-section-bars">' +
      sectionRows +
      '</div><div class="result-actions"><button class="btn btn-light" data-action="go" data-view="today">Back to today ' +
      icon("arrow") +
      '</button><button class="btn btn-coral" data-action="exam-retake">Retake sprint</button><button class="btn btn-ghost" style="color:var(--paper-2);border-color:rgba(251,248,241,.25)" data-action="scroll-review">Review answers</button></div></div></div>' +
      '<div class="review-section" id="review"><div class="card-head"><div><p class="eyebrow">Review</p><h2>What the answers were doing.</h2></div><span class="pill">' +
      result.correct +
      " / " +
      result.total +
      " correct</span></div><div class=\"review-list\">" +
      reviewRows +
      "</div></div></section>"
    );
  }

  function renderProgress() {
    const scores = state.examHistory
      .slice()
      .reverse()
      .map(function (attempt) {
        return attempt.score;
      });
    const trend = scores.length > 1 ? scores : [48, 53, 57, 61, 64, 68];
    const trendPoints = trend
      .map(function (score, index) {
        const x = 10 + (index * 580) / Math.max(1, trend.length - 1);
        const y = 105 - (score / 100) * 85;
        return x.toFixed(1) + "," + y.toFixed(1);
      })
      .join(" ");
    const focusKey = ["listening", "reading", "writing", "speaking"].reduce(function (lowest, key) {
      return state.skills[key] < state.skills[lowest] ? key : lowest;
    }, "listening");
    const focusLabel = focusKey.charAt(0).toUpperCase() + focusKey.slice(1);
    const focusValue = state.skills[focusKey];
    const minuteBars = [16, 24, 0, 20, 18, 26, state.completedLessons.indexOf("market") !== -1 ? 18 : 0];
    const dayLabels = lastSeven().map(function (day) {
      return day.initial;
    });

    return (
      '<section class="view"><div class="page-head"><div><p class="eyebrow">Progress</p><h1>Evidence, not a feeling.</h1><p class="lede">Your readiness score blends lesson completion with timed exam results. It is an estimate for practice, not an official DELF score.</p></div><span class="level-chip"><span class="dot"></span>' +
      state.readiness +
      "/100 ready</span></div>" +
      '<div class="progress-grid"><div><div class="card"><div class="card-head"><div><p class="eyebrow">Overall readiness</p><h2>' +
      state.readiness +
      ' / 100</h2></div><span class="pill">' +
      (state.readiness >= 75 ? "Comfortable" : state.readiness >= 50 ? "On track" : "Building") +
      '</span></div><div class="skill-list">' +
      ["listening", "reading", "writing", "speaking"]
        .map(function (key) {
          const label = key.charAt(0).toUpperCase() + key.slice(1);
          return (
            '<div class="skill-list-row"><strong>' +
            label +
            "</strong><span>" +
            state.skills[key] +
            '</span><div class="bar-track"><span class="bar-fill ' +
            (key === "writing" ? "coral" : key === "speaking" ? "gold" : "") +
            '" style="width:' +
            state.skills[key] +
            '%"></span></div></div>'
          );
        })
        .join("") +
      "</div></div>" +
      '<div class="card trend-card"><div class="card-head"><div><p class="eyebrow">Readiness trend</p><h2>Small steps, visible.</h2></div><span class="pill">Last ' +
      trend.length +
      ' checks</span></div><svg class="trend-chart" viewBox="0 0 600 120" role="img" aria-label="Readiness trend from ' +
      trend[0] +
      " to " +
      trend[trend.length - 1] +
      '"><defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#d85f43"/><stop offset="100%" stop-color="#d85f43" stop-opacity="0"/></linearGradient></defs><line class="grid-line" x1="10" y1="105" x2="590" y2="105"/><line class="grid-line" x1="10" y1="62" x2="590" y2="62"/><line class="grid-line" x1="10" y1="20" x2="590" y2="20"/><polyline class="trend-line" points="' +
      trendPoints +
      '"/><polygon class="trend-area" points="' +
      trendPoints +
      ' 590,105 10,105"/><circle class="trend-dot" cx="590" cy="' +
      (105 - (trend[trend.length - 1] / 100) * 85).toFixed(1) +
      '" r="4"/></svg><div class="trend-labels"><span>Earlier</span><span>Today</span></div></div></div>' +
      '<aside><div class="card focus-card"><p class="eyebrow">Next best action</p><div class="focus-number"><strong>' +
      focusValue +
      "</strong><span>/100 " +
      esc(focusLabel) +
      '</span></div><p>' +
      esc(focusLabel) +
      " is your lowest signal. A short timed sprint is the fastest way to make the next number move.</p><button class=\"btn btn-sm btn-coral\" data-action=\"start-exam\" data-level=\"" +
      (state.examLevel || "B1") +
      '">Take a sprint ' +
      icon("arrow") +
      '</button></div><div class="card" style="margin-top:20px"><div class="card-head"><div><p class="eyebrow">This week</p><h2>' +
      state.minutesThisWeek +
      ' min</h2></div><span class="pill">' +
      state.dailyGoal * 7 +
      ' goal</span></div><div class="week-minutes">' +
      minuteBars
        .map(function (minutes, index) {
          return (
            '<div class="minute-col' +
            (index === 6 ? " today" : "") +
            '"><span style="height:' +
            Math.max(5, Math.round((minutes / 30) * 100)) +
            '%"></span><small>' +
            esc(dayLabels[index]) +
            "</small></div>"
          );
        })
        .join("") +
      '</div><p class="muted small" style="margin-top:10px">A 20-minute session is enough. Consistency is the multiplier.</p></div></aside></div>' +
      '<div class="metric-grid" style="margin-top:20px"><div class="metric"><span>Lessons done</span><strong>' +
      state.lessonsCompleted +
      "</strong><small>Across your B1 path</small></div><div class=\"metric\"><span>Words met</span><strong>" +
      state.wordsLearned +
      "</strong><small>Active vocabulary</small></div><div class=\"metric\"><span>Minutes this week</span><strong>" +
      state.minutesThisWeek +
      "</strong><small>Goal: " +
      state.dailyGoal * 7 +
      "</small></div><div class=\"metric\"><span>Timed sprints</span><strong>" +
      state.examHistory.length +
      "</strong><small>Best: " +
      (state.examHistory.length
        ? Math.max.apply(
            null,
            state.examHistory.map(function (attempt) {
              return attempt.score;
            })
          )
        : "—") +
      "</small></div></div>" +
      '<div class="card" style="margin-top:20px"><div class="card-head"><div><p class="eyebrow">Exam history</p><h2>Every attempt counts.</h2></div><a class="text-link" href="#exam">Open exam studio ' +
      icon("arrow") +
      '</a></div><div class="history-list">' +
      (state.examHistory.length
        ? state.examHistory
            .map(function (attempt) {
              return (
                '<div class="history-row"><div><strong>' +
                esc(attempt.label) +
                "</strong><small>" +
                esc(attempt.date) +
                " · " +
                esc(attempt.level) +
                '</small></div><span class="pill">' +
                (attempt.score >= 50 ? "Pass" : "Below 50") +
                '</span><span class="history-score ' +
                (attempt.score >= 75 ? "pass" : "near") +
                '">' +
                attempt.score +
                "</span></div>"
              );
            })
            .join("")
        : '<p class="muted small">No attempts yet.</p>') +
      "</div></div></section>"
    );
  }

  function renderProfile() {
    const days = daysUntil(DATA.user.examDate);
    return (
      '<section class="view"><div class="page-head"><div><p class="eyebrow">Profile</p><h1>Your plan, your pace.</h1><p class="lede">A calm daily habit beats a heroic weekend. Set the goal you can keep, and let the path carry the rest.</p></div></div>' +
      '<div class="profile-hero"><span class="avatar avatar-lg">LM</span><div><p class="eyebrow">B1 candidate</p><h1>' +
      esc(DATA.user.fullName) +
      "</h1><p>" +
      esc(DATA.user.target) +
      " · exam on " +
      esc(formatLongDate(DATA.user.examDate)) +
      '</p><span class="level-chip"><span class="dot"></span>' +
      days +
      " days to go</span></div></div>" +
      '<div class="profile-grid"><section class="card"><div class="card-head"><div><p class="eyebrow">Study plan</p><h2>The shape of your week.</h2></div></div><div class="setting-row"><div><strong>Daily goal</strong><span>A session you can repeat on a busy day</span></div><div class="goal-chips">' +
      [10, 20, 30]
        .map(function (goal) {
          return (
            '<button class="' +
            (state.dailyGoal === goal ? "active" : "") +
            '" data-action="set-goal" data-value="' +
            goal +
            '">' +
            goal +
            "m</button>"
          );
        })
        .join("") +
      '</div></div><div class="setting-row"><div><strong>Exam date</strong><span>' +
      esc(formatLongDate(DATA.user.examDate)) +
      "</span></div><span class=\"pill\">" +
      days +
      ' days</span></div><div class="setting-row"><div><strong>Daily reminder</strong><span>A gentle nudge, not a guilt trip</span></div><button class="btn btn-sm btn-ghost" data-action="toggle-reminder" aria-pressed="' +
      (state.reminder ? "true" : "false") +
      '">' +
      (state.reminder ? "On" : "Off") +
      "</button></div><div class=\"setting-row\"><div><strong>Level check</strong><span>Five questions, about three minutes</span></div><button class=\"btn btn-sm btn-ghost\" data-action=\"go\" data-view=\"placement\">Start " +
      icon("arrow") +
      "</button></div></section>" +
      '<section class="card"><div class="card-head"><div><p class="eyebrow">Your numbers</p><h2>Quiet proof.</h2></div></div><div class="metric-grid"><div class="metric"><span>Readiness</span><strong>' +
      state.readiness +
      "</strong><small>out of 100</small></div><div class=\"metric\"><span>Streak</span><strong>" +
      state.streak +
      "</strong><small>days</small></div><div class=\"metric\"><span>XP</span><strong>" +
      state.xp.toLocaleString("en-GB") +
      "</strong><small>total</small></div><div class=\"metric\"><span>Words</span><strong>" +
      state.wordsLearned +
      "</strong><small>met so far</small></div></div><button class=\"btn btn-ghost btn-block\" style=\"margin-top:17px\" data-action=\"reset-demo\">" +
      icon("refresh") +
      " Reset demo data</button></section></div>" +
      '<div class="about-box"><strong>About this demo.</strong> Cedille is a seeded MVP: the lessons, exam questions, history and progress live in your browser. There is no account, payment, live tutor or official DELF scoring connected yet. Reset the demo any time from this screen.</div>' +
      "</section>"
    );
  }

  function renderPlacement() {
    if (!placementRun) {
      return (
        '<section class="view placement-shell"><div class="placement-intro"><p class="eyebrow">Level check</p><h1>Where should we start?</h1><p>' +
        esc(DATA.placement.intro) +
        '</p><div class="placement-meta"><span class="pill">5 questions</span><span class="pill">About 3 min</span><span class="pill">No account</span></div><button class="btn" data-action="start-placement">' +
        icon("play") +
        ' Start the check</button><button class="btn btn-quiet" data-action="go" data-view="path" style="margin-top:9px">Back to your path</button></div></section>'
      );
    }

    if (placementRun.finished) {
      const result = placementRun.result;
      const copy = {
        A2: "Your answers point to A2: solid foundations, with more practice needed before B1 tasks feel comfortable. The full plan in this demo is B1, so you can see the learning loop end to end.",
        B1: "Your answers point to B1: you can handle familiar situations and simple opinions. That is exactly the plan this demo opens, with lessons and a DELF B1 sprint.",
        B2: "Your answers point to B2: you are already comfortable with nuance and argument. The demo currently ships one full B1 path, which is a useful warm-up rather than a ceiling."
      };
      return (
        '<section class="view placement-shell"><div class="placement-result"><div class="result-level">' +
        esc(result.level) +
        "</div><p class=\"eyebrow\">Your suggested level</p><h1>You're at " +
        esc(result.level) +
        ".</h1><p>" +
        esc(copy[result.level]) +
        '</p><div class="placement-meta" style="justify-content:center"><span class="pill">' +
        result.score +
        " / " +
        result.total +
        " correct</span><span class=\"pill\">Recommended: " +
        esc(result.level) +
        '</span></div><button class="btn" data-action="placement-apply">Open the B1 demo plan ' +
        icon("arrow") +
        '</button><button class="btn btn-quiet" data-action="placement-retake" style="display:flex;margin:10px auto 0">Take it again</button></div></section>'
      );
    }

    const question = DATA.placement.questions[placementRun.index];
    const dots = DATA.placement.questions
      .map(function (_, index) {
        const className = index < placementRun.index ? "done" : index === placementRun.index ? "current" : "";
        return '<span class="' + className + '"></span>';
      })
      .join("");
    const options = question.options
      .map(function (option, index) {
        return (
          '<button class="option-btn' +
          (placementRun.selected === index ? " selected" : "") +
          '" data-action="placement-answer" data-value="' +
          index +
          '"><span class="letter">' +
          String.fromCharCode(65 + index) +
          "</span><span>" +
          esc(option) +
          "</span></button>"
        );
      })
      .join("");

    return (
      '<section class="view placement-shell"><div class="dots">' +
      dots +
      '</div><div class="placement-intro"><p class="eyebrow">Question ' +
      (placementRun.index + 1) +
      " of " +
      DATA.placement.questions.length +
      '</p><h1 style="font-size:34px">' +
      esc(question.prompt) +
      '</h1><div class="option-list">' +
      options +
      '</div><div class="lesson-actions" style="margin-top:21px"><button class="btn btn-quiet" data-action="go" data-view="path">Exit</button><button class="btn" data-action="placement-next">' +
      (placementRun.index === DATA.placement.questions.length - 1 ? "See my level " : "Next question ") +
      icon("arrow") +
      "</button></div></div></section>"
    );
  }

  function render() {
    clearTimer();
    const view = getView();
    const renderer = {
      today: renderToday,
      path: renderPath,
      lesson: renderLesson,
      exam: renderExam,
      "exam-run": renderExamRun,
      progress: renderProgress,
      profile: renderProfile,
      placement: renderPlacement
    }[view];

    viewEl.innerHTML = renderer ? renderer() : renderToday();
    document.body.dataset.view = view;
    updateChrome(view);
    if (view !== lastRenderedView) {
      window.scrollTo({ top: 0, behavior: "auto" });
      lastRenderedView = view;
    }
    if (view === "exam-run") startExamTimer();
  }

  function updateChrome(view) {
    let active = view;
    if (view === "lesson" || view === "placement") active = "path";
    if (view === "exam-run") active = "exam";

    document.querySelectorAll("[data-nav]").forEach(function (link) {
      const isActive = link.getAttribute("data-nav") === active;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    document.querySelectorAll('[data-bind="streak"]').forEach(function (node) {
      node.textContent = String(state.streak);
    });
    document.querySelectorAll('[data-bind="side-level"]').forEach(function (node) {
      node.textContent = state.level;
    });
    document.querySelectorAll('[data-bind="side-target"]').forEach(function (node) {
      node.textContent = state.target;
    });
    document.querySelectorAll('[data-bind="side-readiness"]').forEach(function (node) {
      node.textContent = String(state.readiness);
    });
    document.querySelectorAll('[data-bind="side-bar"]').forEach(function (node) {
      node.style.width = state.readiness + "%";
    });
  }

  function startLesson(id) {
    const lesson = DATA.lessons[id];
    if (!lesson) {
      toast("That lesson is not open yet.");
      return;
    }
    lessonRun = { id: id, partIndex: 0, selected: null, checked: false, showTranscript: false, correct: 0, done: false, awarded: false };
    go("lesson");
  }

  function exitLesson() {
    lessonRun = null;
    go("today");
  }

  function selectLessonOption(value) {
    if (!lessonRun || lessonRun.checked) return;
    lessonRun.selected = value;
    render();
  }

  function checkLessonAnswer() {
    if (!lessonRun) return;
    const lesson = DATA.lessons[lessonRun.id];
    const part = lesson.parts[lessonRun.partIndex];
    if (part.type === "vocab" || lessonRun.checked) return;
    if (lessonRun.selected === null) {
      toast("Choose an answer first.");
      return;
    }
    lessonRun.checked = true;
    if (lessonRun.selected === part.answer) lessonRun.correct += 1;
    render();
  }

  function advanceLesson() {
    if (!lessonRun) return;
    const lesson = DATA.lessons[lessonRun.id];
    const part = lesson.parts[lessonRun.partIndex];
    if (part.type !== "vocab" && !lessonRun.checked) {
      toast("Check your answer first.");
      return;
    }
    if (lessonRun.partIndex >= lesson.parts.length - 1) {
      completeLesson(lesson);
      return;
    }
    lessonRun.partIndex += 1;
    lessonRun.selected = null;
    lessonRun.checked = false;
    lessonRun.showTranscript = false;
    render();
  }

  function completeLesson(lesson) {
    const already = state.completedLessons.indexOf(lesson.id) !== -1;
    lessonRun.done = true;
    lessonRun.awarded = !already;
    if (!already) {
      state.completedLessons.push(lesson.id);
      state.lessonsCompleted += 1;
      state.xp += lesson.xp;
      state.wordsLearned += lesson.newWords;
      state.readiness = clamp(state.readiness + 4, 0, 96);
      state.minutesThisWeek += lesson.minutes;
      state.weekly[6] = true;
      if (state.streak < 7) state.streak += 1;
      saveState();
    }
    render();
  }

  function startExam(level) {
    const bank = DATA.exam.levels[level];
    if (!bank) return;
    examRun = {
      level: level,
      index: 0,
      answers: bank.questions.map(function () {
        return null;
      }),
      timeLeft: DATA.exam.duration,
      finished: false,
      result: null
    };
    state.examLevel = level;
    saveState();
    go("exam-run");
  }

  function selectExamAnswer(value) {
    if (!examRun || examRun.finished) return;
    examRun.answers[examRun.index] = value;
    render();
  }

  function examNext() {
    if (!examRun || examRun.finished) return;
    if (examRun.answers[examRun.index] === null) {
      toast("Pick an answer before moving on.");
      return;
    }
    if (examRun.index === DATA.exam.levels[examRun.level].questions.length - 1) {
      submitExam(false);
      return;
    }
    examRun.index += 1;
    render();
  }

  function examPrev() {
    if (!examRun || examRun.finished || examRun.index === 0) return;
    examRun.index -= 1;
    render();
  }

  function submitExam(auto) {
    if (!examRun || examRun.finished) return;
    const bank = DATA.exam.levels[examRun.level];
    const questions = bank.questions;
    let correct = 0;
    const sections = {};

    questions.forEach(function (question, index) {
      const section = sections[question.section] || { correct: 0, total: 0 };
      section.total += 1;
      if (examRun.answers[index] === question.answer) {
        section.correct += 1;
        correct += 1;
      }
      sections[question.section] = section;
    });

    const score = Math.round((correct / questions.length) * 100);
    examRun.finished = true;
    examRun.result = {
      score: score,
      correct: correct,
      total: questions.length,
      sections: sections
    };

    state.examHistory.unshift({
      date: shortDate(),
      level: bank.label,
      score: score,
      label: "Timed sprint"
    });
    state.examHistory = state.examHistory.slice(0, 6);
    state.readiness = clamp(Math.round(state.readiness * 0.7 + score * 0.3), 0, 96);
    state.minutesThisWeek += 5;
    state.xp += 25;
    state.weekly[6] = true;

    const skillMap = { Listening: "listening", Reading: "reading", Language: "reading", Writing: "writing" };
    Object.keys(sections).forEach(function (name) {
      const key = skillMap[name];
      if (!key) return;
      const pct = Math.round((sections[name].correct / sections[name].total) * 100);
      state.skills[key] = clamp(Math.round(state.skills[key] * 0.7 + pct * 0.3), 0, 100);
    });

    saveState();
    clearTimer();
    if (auto) toast("Time is up. Sprint submitted.");
    render();
  }

  function formatTime(seconds) {
    const safe = Math.max(0, seconds);
    const minutes = Math.floor(safe / 60);
    const rest = safe % 60;
    return minutes + ":" + (rest < 10 ? "0" : "") + rest;
  }

  function clearTimer() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function startExamTimer() {
    clearTimer();
    if (!examRun || examRun.finished) return;
    updateTimerDisplay();
    timerId = window.setInterval(function () {
      if (!examRun || examRun.finished) {
        clearTimer();
        return;
      }
      examRun.timeLeft = Math.max(0, examRun.timeLeft - 1);
      updateTimerDisplay();
      if (examRun.timeLeft <= 0) {
        clearTimer();
        submitExam(true);
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const node = document.getElementById("exam-time");
    const wrapper = document.getElementById("exam-timer");
    if (!node || !examRun) return;
    node.textContent = formatTime(examRun.timeLeft);
    if (wrapper) wrapper.classList.toggle("urgent", examRun.timeLeft <= 60);
  }

  function startPlacement() {
    placementRun = { index: 0, answers: [], selected: null, finished: false, result: null };
    render();
  }

  function selectPlacementAnswer(value) {
    if (!placementRun || placementRun.finished) return;
    placementRun.selected = value;
    render();
  }

  function placementNext() {
    if (!placementRun || placementRun.finished) return;
    if (placementRun.selected === null) {
      toast("Choose an answer first.");
      return;
    }
    placementRun.answers[placementRun.index] = placementRun.selected;
    if (placementRun.index === DATA.placement.questions.length - 1) {
      const correct = DATA.placement.questions.reduce(function (total, question, index) {
        return total + (placementRun.answers[index] === question.answer ? 1 : 0);
      }, 0);
      const level = correct <= 2 ? "A2" : correct <= 4 ? "B1" : "B2";
      placementRun.finished = true;
      placementRun.result = { score: correct, total: DATA.placement.questions.length, level: level };
      state.placementResult = placementRun.result;
      saveState();
      render();
      return;
    }
    placementRun.index += 1;
    placementRun.selected = null;
    render();
  }

  function applyPlacement() {
    state.level = "B1";
    state.target = "DELF B1";
    saveState();
    go("path");
    toast("B1 plan opened. Start with At the market.");
  }

  function playFrench(text, trigger) {
    if (!("speechSynthesis" in window)) {
      toast("This browser cannot play the audio. Use the transcript instead.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.88;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find(function (voice) {
      return voice.lang && voice.lang.toLowerCase().indexOf("fr") === 0;
    });
    if (frenchVoice) utterance.voice = frenchVoice;
    if (trigger) {
      trigger.classList.add("is-playing");
      utterance.onend = function () {
        trigger.classList.remove("is-playing");
      };
      utterance.onerror = function () {
        trigger.classList.remove("is-playing");
      };
    }
    window.speechSynthesis.speak(utterance);
  }

  function resetDemo() {
    const confirmed = window.confirm("Reset the demo? This clears the lesson progress and exam history stored in this browser.");
    if (!confirmed) return;
    state = clone(DEFAULT_STATE);
    lessonRun = null;
    examRun = null;
    placementRun = null;
    saveState();
    go("today");
    toast("Demo reset. Fresh start.");
  }

  function handleAction(element) {
    const action = element.getAttribute("data-action");
    switch (action) {
      case "go":
        go(element.getAttribute("data-view"));
        break;
      case "start-lesson":
        startLesson(element.getAttribute("data-id"));
        break;
      case "exit-lesson":
        exitLesson();
        break;
      case "lesson-next":
        advanceLesson();
        break;
      case "select-lesson":
        selectLessonOption(Number(element.getAttribute("data-value")));
        break;
      case "check-lesson":
        checkLessonAnswer();
        break;
      case "toggle-transcript":
        if (lessonRun) {
          lessonRun.showTranscript = !lessonRun.showTranscript;
          render();
        }
        break;
      case "play":
        playFrench(element.getAttribute("data-text"), element);
        break;
      case "exam-level":
        if (examRun && !examRun.finished) {
          toast("Finish or exit the current sprint before switching level.");
          break;
        }
        state.examLevel = element.getAttribute("data-level");
        saveState();
        render();
        break;
      case "start-exam":
        startExam(element.getAttribute("data-level"));
        break;
      case "resume-exam":
        if (examRun && !examRun.finished) go("exam-run");
        break;
      case "exam-answer":
        selectExamAnswer(Number(element.getAttribute("data-value")));
        break;
      case "exam-next":
        examNext();
        break;
      case "exam-prev":
        examPrev();
        break;
      case "exam-exit":
        go("exam");
        toast("Sprint paused. Resume it from the exam studio.");
        break;
      case "exam-retake":
        startExam(examRun ? examRun.level : state.examLevel || "B1");
        break;
      case "view-result":
        if (examRun && examRun.finished) go("exam-run");
        break;
      case "scroll-review":
        const review = document.getElementById("review");
        if (review) review.scrollIntoView({ behavior: "smooth", block: "start" });
        break;
      case "start-placement":
        startPlacement();
        break;
      case "placement-answer":
        selectPlacementAnswer(Number(element.getAttribute("data-value")));
        break;
      case "placement-next":
        placementNext();
        break;
      case "placement-apply":
        applyPlacement();
        break;
      case "placement-retake":
        startPlacement();
        break;
      case "set-goal":
        state.dailyGoal = Number(element.getAttribute("data-value"));
        saveState();
        render();
        toast("Daily goal set to " + state.dailyGoal + " minutes.");
        break;
      case "toggle-reminder":
        state.reminder = !state.reminder;
        saveState();
        render();
        toast(state.reminder ? "Daily reminder on." : "Daily reminder off.");
        break;
      case "reset-demo":
        resetDemo();
        break;
      case "roadmap":
        toast("Getting around is next on the roadmap. The two lessons and exam sprint are live now.");
        break;
      case "locked":
        toast("Finish the current module to unlock this one.");
        break;
      default:
        break;
    }
  }

  document.addEventListener("click", function (event) {
    const actionElement = event.target.closest("[data-action]");
    if (!actionElement) return;
    event.preventDefault();
    if (actionElement.disabled) return;
    handleAction(actionElement);
  });

  window.addEventListener("hashchange", function () {
    render();
  });

  render();
})();
