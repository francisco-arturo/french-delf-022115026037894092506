import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const dataCode = readFileSync("data.js", "utf8");
const appCode = readFileSync("app.js", "utf8");

const dataSandbox = { window: {} };
runInNewContext(dataCode, dataSandbox, { filename: "data.js" });
const data = dataSandbox.window.CEDILLE_DATA;

function makeClassList() {
  const set = new Set();
  return {
    add(name) { set.add(name); },
    remove(name) { set.delete(name); },
    toggle(name, force) {
      if (force === undefined ? !set.has(name) : force) set.add(name);
      else set.delete(name);
    },
    contains(name) { return set.has(name); }
  };
}

function makeElement(attrs = {}) {
  const attributes = Object.assign({}, attrs);
  return {
    attributes,
    innerHTML: "",
    textContent: "",
    style: {},
    dataset: {},
    disabled: false,
    classList: makeClassList(),
    getAttribute(name) { return Object.prototype.hasOwnProperty.call(attributes, name) ? attributes[name] : null; },
    setAttribute(name, value) { attributes[name] = String(value); },
    removeAttribute(name) { delete attributes[name]; },
    closest() { return null; },
    scrollIntoView() {}
  };
}

const view = makeElement();
const toast = makeElement();
const timer = makeElement();
const time = makeElement();
const review = makeElement();
const navLinks = ["today", "path", "exam", "progress", "profile", "today", "path", "exam", "progress", "profile"].map(function (name) {
  return makeElement({ "data-nav": name });
});
const bindElements = {
  streak: [makeElement()],
  "side-level": [makeElement()],
  "side-target": [makeElement()],
  "side-readiness": [makeElement()],
  "side-bar": [makeElement()]
};

const handlers = { click: null, hashchange: null };
const document = {
  body: { dataset: {} },
  getElementById(id) {
    return { view: view, toast: toast, "exam-timer": timer, "exam-time": time, review: review }[id] || null;
  },
  querySelectorAll(selector) {
    if (selector === "[data-nav]") return navLinks;
    const bind = selector.match(/^\[data-bind="(.+)"\]$/);
    if (bind) return bindElements[bind[1]] || [];
    return [];
  },
  addEventListener(type, handler) {
    handlers[type] = handler;
  }
};

const storage = new Map();
const windowObject = {
  location: {
    _hash: "",
    get hash() { return this._hash; },
    set hash(value) {
      this._hash = value;
      if (handlers.hashchange) handlers.hashchange();
    }
  },
  localStorage: {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); }
  },
  addEventListener(type, handler) {
    if (type === "hashchange") handlers.hashchange = handler;
  },
  scrollTo() {},
  setTimeout() { return 1; },
  clearTimeout() {},
  setInterval() { return 1; },
  clearInterval() {},
  confirm() { return true; },
  speechSynthesis: {
    cancel() {},
    getVoices() { return []; },
    speak() {}
  }
};

class SpeechSynthesisUtterance {
  constructor(text) {
    this.text = text;
    this.lang = "";
    this.rate = 1;
    this.pitch = 1;
    this.voice = null;
    this.onend = null;
    this.onerror = null;
  }
}

const sandbox = {
  window: windowObject,
  document: document,
  SpeechSynthesisUtterance: SpeechSynthesisUtterance,
  console: console
};
windowObject.window = windowObject;
windowObject.CEDILLE_DATA = data;
runInNewContext(appCode, sandbox, { filename: "app.js" });

function click(action, attributes = {}) {
  const element = makeElement(Object.assign({ "data-action": action }, attributes));
  const target = {
    closest() { return element; }
  };
  handlers.click({ target: target, preventDefault() {} });
}

function assert(condition, label) {
  if (!condition) {
    console.error("FAIL " + label);
    process.exitCode = 1;
  } else {
    console.log("PASS " + label);
  }
}

assert(view.innerHTML.includes("Bonjour"), "dashboard renders greeting");
assert(view.innerHTML.includes("At the market"), "dashboard renders today's lesson");
assert(view.innerHTML.includes("68 / 100"), "dashboard renders readiness");
assert(view.innerHTML.includes("Your path"), "dashboard renders path");

click("start-lesson", { "data-id": "market" });
assert(view.innerHTML.includes("Four words for the stall"), "market lesson opens on vocabulary");
assert(handlers.hashchange !== null, "hash routing is wired");

click("lesson-next");
assert(view.innerHTML.includes("Catch the price"), "lesson advances to listening");

click("play", { "data-text": "Bonjour" });
assert(true, "audio button does not throw");

click("select-lesson", { "data-value": "2" });
click("check-lesson");
assert(view.innerHTML.includes("Exactly right."), "listening answer gives feedback");

click("lesson-next");
assert(view.innerHTML.includes("Complete the order"), "lesson advances to quiz");

click("select-lesson", { "data-value": "0" });
click("check-lesson");
click("lesson-next");
assert(view.innerHTML.includes("That is today done."), "lesson completion renders");
assert(view.innerHTML.includes("+60"), "lesson completion awards XP");

click("go", { "data-view": "today" });
assert(view.innerHTML.includes("Session complete"), "dashboard reflects the completed lesson");

click("go", { "data-view": "exam" });
assert(view.innerHTML.includes("Exam studio"), "exam studio renders");
click("start-exam", { "data-level": "B1" });
assert(view.innerHTML.includes("Question 1 of 6"), "exam sprint starts at question one");

for (let index = 0; index < 6; index += 1) {
  const answer = data.exam.levels.B1.questions[index].answer;
  click("exam-answer", { "data-value": String(answer) });
  click("exam-next");
}
assert(view.innerHTML.includes("A strong pass."), "perfect sprint reaches a strong pass");
assert(view.innerHTML.includes("Review"), "exam result includes answer review");

click("go", { "data-view": "placement" });
assert(view.innerHTML.includes("Where should we start?"), "placement intro renders");
click("start-placement");
assert(view.innerHTML.includes("Question 1 of 5"), "placement starts");

for (let index = 0; index < 5; index += 1) {
  const answer = data.placement.questions[index].answer;
  click("placement-answer", { "data-value": String(answer) });
  click("placement-next");
}
assert(view.innerHTML.includes("You're at B2."), "placement scores a perfect check");
click("placement-apply");
assert(view.innerHTML.includes("A clear route to exam day."), "placement opens the B1 plan");

click("go", { "data-view": "progress" });
assert(view.innerHTML.includes("Evidence, not a feeling."), "progress renders");
click("go", { "data-view": "profile" });
assert(view.innerHTML.includes("Your plan, your pace."), "profile renders");

click("set-goal", { "data-value": "30" });
assert(storage.get("cedille.state.v1").includes('"dailyGoal":30'), "daily goal persists");

console.log("DOM smoke complete.");
