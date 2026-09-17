"use strict";

// All document paths stay relative so the desktop also works in a hosting subdirectory.
const DOCUMENTS = {
  cv: { file: "Franz-Schwinn-CV.pdf", title: "CV · Franz Schwinn", description: "", icon: "▤" },
  thesis: { file: "Final_Thesis_Compact.pdf", title: "BSc thesis · Gaussian Splatting", description: "", icon: "◌" },
  cil: { file: "CIL_Project.pdf", title: "Monocular Depth Estimation", description: "", icon: "◈" },
  iml: { file: "IML.pdf", title: "Introduction to Machine Learning", description: "", icon: "▤" },
  pprog: { file: "PPROG.pdf", title: "Parallel Programming", description: "", icon: "▤" },
  aw: { file: "AW.pdf", title: "Algorithms and Probability", description: "", icon: "▤" }
};
const LINKS = {
  github: "https://github.com/rotaugenlaubfrosch",
  linkedin: "https://www.linkedin.com/in/franz-schwinn-b4858314a/",
  "org-agent": "https://github.com/rotaugenlaubfrosch/org-agent"
};
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobile = () => window.matchMedia("(max-width: 700px)").matches;
const windows = new Map();
let topLayer = 10;
let activeId = null;
let typing = false;
let typingToken = 0;
let commandQueue = [];
const history = [];
let historyIndex = 0;
let returnFocus = null;
const $ = (selector, root = document) => root.querySelector(selector);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const profileContent = () => `
  <div class="content">
    <div class="profile-heading"><img class="avatar" src="assets/franz.jpg" alt="Franz Schwinn"><div><span class="eyebrow"></span><h2>Franz Schwinn</h2><p>MSc Computer Science · Machine Intelligence<br>ETH Zurich, Switzerland</p></div></div>
    <p>Welcome to my personal portfolio site! :) Here you find some projects I have been working on in the past. Take your time to explore and navigate, and feel free to reach out if you have any questions or inputs! </p>
    <p>Outside of the sphere of computer science, I love creating videos about geography, culture, and moving abroad. I also enjoy playing piano and going to the gym.</p>
    <h3 class="section-title">~/what_i_work_with</h3>
    <div class="tags"><span>Python</span><span>Machine learning</span><span>LangGraph</span><span>Linux / Bash</span><span>Docker</span><span>Ansible</span><span>SQL</span><span>Blender</span><span>Adobe CC / After Effects</span></div>
    <div class="actions"><button class="button" data-command="cat docs/Franz-Schwinn-CV.pdf">Read my CV ↗</button><button class="button secondary" data-command="mail">Get in touch</button></div>
    <div class="link-list"><a href="${LINKS.github}" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="${LINKS.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></div>
  </div>`;

const projectContent = () => `
  <div class="content"><span class="eyebrow">~/projects</span><h2></h2>
    <article class="project-card"><span class="project-mark">&gt;_</span><span class="eyebrow">AI agents / open source</span><h3>org-agent</h3><p>An AI agent that enriches and validates company data. Built at ETH Industry Relations with LangGraph, with support for local, open-weight models.</p><div class="tags"><span>Python</span><span>LangGraph</span><span>Playwright</span><span>Ollama</span></div><div class="actions"><button class="button" data-command="open org-agent">Explore project →</button><a class="button secondary" href="${LINKS['org-agent']}" target="_blank" rel="noopener noreferrer">GitHub ↗</a></div></article>
    <article class="project-card"><span class="project-mark">◌</span><span class="eyebrow">Computer graphics / bachelor thesis</span><h3>Giving Gaussian splats a rig.</h3><p>Combining character rigs with Gaussian Splatting for realistic, interactive facial rendering. Trained across multiple poses and applied to the visualization of orthodontic treatments.</p><div class="tags"><span>3D Gaussian Splatting</span><span>gsplat</span><span>Blender</span></div><div class="actions"><button class="button secondary" data-command="cat docs/Final_Thesis_Compact.pdf">Read thesis ↗</button></div></article>
    <article class="project-card"><span class="project-mark">◈</span><span class="eyebrow">Computer vision / CIL FS2026</span><h3>Depth from a single image.</h3><p>A team exploration of monocular depth estimation: from U-Net baselines to transformer features, knowledge distillation, and a ResNet50–TinyViT hybrid.</p><div class="tags"><span>Computer vision</span><span>TinyViT</span><span>Depth estimation</span></div><div class="actions"><button class="button secondary" data-command="cat docs/CIL_Project.pdf">Read project report ↗</button></div></article>
  </div>`;

const agentContent = () => `
  <div class="content"><span class="eyebrow">~/projects/org-agent</span><h2></h2><p>org-agent turns an organization name and its website into a structured company profile. I built it at ETH Industry Relations to automate company-data enrichment and validation.</p>
  <pre class="code-block">$ uv run org-agent "Example Ltd" \\\n+    --website example.com --country ch</pre>
  <div class="info-grid"><div class="info-card"><h3>Websites → structured data</h3><p>Playwright crawls relevant pages. LLMs extract organization facts, contact information, and classifications.</p></div><div class="info-card"><h3>Local models supported</h3><p>Ollama support enables local, open-weight models. OpenAI and Anthropic providers are also available.</p></div><div class="info-card"><h3>Validation built in</h3><p>Contact checks and optional country-registry integrations, with separate website and registry profiles.</p></div><div class="info-card"><h3>Made for real workflows</h3><p>A Python API and CLI, LangGraph orchestration, and structured JSON output.</p></div></div>
  <div class="tags" style="margin-top:20px"><span>Python</span><span>LangGraph</span><span>Playwright</span><span>Typer</span><span>Ollama</span></div>
  <div class="actions"><a class="button" href="${LINKS['org-agent']}" target="_blank" rel="noopener noreferrer">Explore on GitHub ↗</a></div><p class="small-note">Open-source project · Under active development. The browser-use mode is experimental.</p></div>`;

const summaryContent = () => `<div class="content"><span class="eyebrow">~/summaries</span><h2></h2><p>My course summaries from studying Computer Science. Click a file to read it here or download a copy.</p><div class="file-list">${['iml','pprog','aw'].map(id => `<button class="file-row" data-command="cat docs/${DOCUMENTS[id].file}"><span class="file-symbol">PDF</span><span class="file-copy"><strong>${DOCUMENTS[id].title}</strong><small>${DOCUMENTS[id].file} · Course summary</small></span><span class="file-arrow">↗</span></button>`).join('')}</div><p class="small-note">Personal study notes, not official course materials.</p></div>`;

const contactContent = () => `<div class="content"><span class="eyebrow">~/mail</span><h2>Let’s talk.</h2><p></p><a href="mailto:fschwinn@proton.me">fschwinn@proton.me</a><form class="email-form" id="email-form"><label>SUBJECT<input name="subject" placeholder="Hello Franz!" required maxlength="200"></label><label>MESSAGE<textarea name="message" placeholder="What’s on your mind?" required maxlength="5000"></textarea></label><button class="button" type="submit">Open in your email app ↗</button></form><p class="small-note" id="email-status" role="status">Your subject and message will be passed to your default email app.</p><div class="link-list"><a href="${LINKS.github}" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="${LINKS.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></div></div>`;

const APPS = {
  terminal: { title: "franz@workspace: ~", task: "Terminal", symbol: ">_", width: 660, height: 425 },
  about: { title: "about.txt — Franz Schwinn", task: "About me", symbol: "◉", content: profileContent },
  projects: { title: "~/projects", task: "Projects", symbol: "⌘", content: projectContent },
  "org-agent": { title: "~/projects/org-agent/README.md", task: "org-agent", symbol: ">_", content: agentContent },
  summaries: { title: "~/summaries", task: "Summaries", symbol: "▤", content: summaryContent, height: 480 },
  contact: { title: "mail — fschwinn@proton.me", task: "Contact", symbol: "✉", content: contactContent, width: 510, height: 560 }
};

function focusWindow(id) {
  const win = windows.get(id);
  if (!win || win.element.hidden) return;
  activeId = id;
  win.element.style.zIndex = ++topLayer;
  for (const [key, value] of windows) {
    value.element.classList.toggle("active", key === id);
    value.task.classList.toggle("active", key === id);
    value.task.setAttribute("aria-pressed", String(key === id));
  }
}

function selectNextWindow() {
  const visible = [...windows.entries()].filter(([,w]) => !w.element.hidden);
  visible.sort((a,b) => Number(b[1].element.style.zIndex) - Number(a[1].element.style.zIndex));
  activeId = null;
  if (visible.length) focusWindow(visible[0][0]);
}

function minimizeWindow(id) {
  const win = windows.get(id);
  win.element.hidden = true;
  win.task.classList.add("minimized");
  win.task.classList.remove("active");
  win.task.setAttribute("aria-pressed", "false");
  selectNextWindow();
}

function closeWindow(id) {
  if (id === "terminal" && typing) return;
  const win = windows.get(id);
  // Keep terminal history and document state available for the next visit.
  win.element.hidden = true;
  win.task.hidden = true;
  selectNextWindow();
  if (returnFocus?.isConnected && !returnFocus.closest("[hidden]")) returnFocus.focus({preventScroll:true});
}

function maximizeWindow(id) {
  const win = windows.get(id);
  const maximized = win.element.classList.toggle("maximized");
  $(".maximize", win.element).setAttribute("aria-label", maximized ? "Restore window" : "Maximize window");
  focusWindow(id);
}

function keepOnDesktop(element) {
  if (mobile() || element.classList.contains("maximized")) return;
  const desktop = $("#desktop").getBoundingClientRect();
  element.style.width = Math.min(element.offsetWidth, desktop.width - 24) + "px";
  element.style.height = Math.min(element.offsetHeight, desktop.height - 70) + "px";
  element.style.left = Math.max(12, Math.min(element.offsetLeft, desktop.width - element.offsetWidth - 12)) + "px";
  element.style.top = Math.max(58, Math.min(element.offsetTop, desktop.height - element.offsetHeight - 12)) + "px";
}

function installDrag(win, handle, resize = false) {
  handle.addEventListener("pointerdown", event => {
    if (event.button !== 0 || event.target.closest("button") || mobile() || win.classList.contains("maximized")) return;
    event.preventDefault();
    const start = { x: event.clientX, y: event.clientY, left: win.offsetLeft, top: win.offsetTop, width: win.offsetWidth, height: win.offsetHeight };
    handle.setPointerCapture(event.pointerId);
    const move = e => {
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (resize) {
        win.style.width = Math.max(320, start.width + dx) + "px";
        win.style.height = Math.max(230, start.height + dy) + "px";
      } else {
        win.style.left = start.left + dx + "px";
        win.style.top = start.top + dy + "px";
      }
      keepOnDesktop(win);
    };
    const end = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", end);
      handle.removeEventListener("pointercancel", end);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  });
}

function openWindow(id) {
  if (windows.has(id)) {
    const win = windows.get(id);
    win.element.hidden = false;
    win.task.hidden = false;
    win.task.classList.remove("minimized");
    focusWindow(id);
    return win.element;
  }
  const doc = DOCUMENTS[id];
  const app = doc ? { title: doc.title, task: doc.file, symbol: doc.icon, width: 820, height: 670 } : APPS[id];
  if (!app) return null;
  const win = document.createElement("section");
  win.className = "window";
  win.id = `win-${id}`;
  win.setAttribute("role", "region");
  win.setAttribute("aria-label", app.title);
  win.style.width = (id === "terminal" && !mobile() ? Math.min(660, innerWidth * .46) : app.width || 590) + "px";
  win.style.height = (app.height || 580) + "px";
  const offset = (windows.size % 5) * 24;
  win.style.left = (id === "terminal" ? Math.max(145, innerWidth * .12) : Math.max(160, innerWidth * .26) + offset) + "px";
  win.style.top = (id === "terminal" ? Math.max(100, innerHeight * .29) : 83 + offset) + "px";
  win.innerHTML = `<header class="window-header"><div class="window-title"><span class="win-symbol">${app.symbol}</span>${app.title}</div><div class="window-controls"><button class="minimize" aria-label="Minimize window" title="Minimize"><i>−</i></button><button class="maximize" aria-label="Maximize window" title="Maximize / restore"><i>+</i></button><button class="close" aria-label="Close window" title="Close"><i>×</i></button></div></header><div class="window-body"></div><footer class="window-footer"><span>${doc ? 'PDF VIEWER · READ ONLY' : id === 'terminal' ? 'PORTFOLIO SHELL · TYPE HELP TO EXPLORE' : 'FRANZ SCHWINN / PORTFOLIO'}</span><span>${id === 'terminal' ? '↑↓ history · tab complete' : 'fs_'}</span></footer><div class="resize-handle" aria-hidden="true"></div>`;
  const body = $(".window-body", win);
  if (id === "terminal") {
    body.classList.add("terminal-body");
    body.innerHTML = `<div id="terminal-output" role="log" aria-live="polite" aria-label="Command output"></div><form id="terminal-form" autocomplete="off"><label for="command-input">franz<span style="color:#7789a5">@</span>workspace <span style="color:#7598c7">~</span> ❯</label><input id="command-input" aria-label="Terminal command" spellcheck="false" autocapitalize="off" autocomplete="off"></form>`;
  } else if (doc) {
    body.classList.add("document-body");
    const viewerUrl = `docs/${doc.file}#pagemode=none&navpanes=0`;
    body.innerHTML = `<div class="document-tools"><span>${doc.file}</span><a href="${viewerUrl}" target="_blank" rel="noopener">Open PDF ↗</a><a href="docs/${doc.file}" download>↓ Download</a></div><p class="document-description">${doc.description}</p><div class="pdf-mobile-note">If the preview isn’t supported on your device, use <a href="${viewerUrl}" target="_blank" rel="noopener">Open PDF ↗</a>.</div><iframe class="pdf-viewer" src="${viewerUrl}" title="${doc.title}"></iframe>`;
  } else body.innerHTML = app.content();
  $("#windows").append(win);
  const task = document.createElement("button");
  task.className = "task-button";
  task.textContent = `${app.symbol} ${app.task}`;
  task.title = app.title;
  task.setAttribute("aria-label", `Switch to ${app.task}`);
  task.addEventListener("click", () => {
    if (!win.hidden && activeId === id) minimizeWindow(id);
    else openWindow(id);
  });
  $("#running-apps").append(task);
  windows.set(id, { element: win, task });
  $(".close", win).addEventListener("click", () => closeWindow(id));
  $(".minimize", win).addEventListener("click", () => minimizeWindow(id));
  $(".maximize", win).addEventListener("click", () => maximizeWindow(id));
  $(".window-header", win).addEventListener("dblclick", e => { if (!e.target.closest("button")) maximizeWindow(id); });
  win.addEventListener("pointerdown", () => focusWindow(id));
  win.addEventListener("focusin", () => { if (activeId !== id) focusWindow(id); });
  installDrag(win, $(".window-header", win));
  installDrag(win, $(".resize-handle", win), true);
  keepOnDesktop(win);
  focusWindow(id);
  if (id === "terminal") installTerminal();
  if (id === "contact") {
    $("#email-form").addEventListener("submit", event => {
      event.preventDefault();
      const data = new FormData(event.target);
      window.location.href = `mailto:fschwinn@proton.me?subject=${encodeURIComponent(data.get('subject'))}&body=${encodeURIComponent(data.get('message'))}`;
      $("#email-status").textContent = "Your email app should open with this draft. If it doesn’t, email fschwinn@proton.me directly.";
    });
  }
  return win;
}

function output(text, kind = "") {
  const line = document.createElement("div");
  line.className = `term-line ${kind}`;
  // Never interpret shell input as HTML.
  line.textContent = text;
  $("#terminal-output").append(line);
  scrollTerminal();
  return line;
}

function scrollTerminal() {
  const body = $("#win-terminal .window-body");
  body.scrollTop = body.scrollHeight;
}

function executeCommand(raw) {
  const command = raw.trim();
  if (!command) return;
  history.push(command);
  historyIndex = history.length;
  output(`❯ ${command}`, "command");
  const [verb, ...rest] = command.split(/\s+/);
  const argument = rest.join(" ").replace(/^['"]|['"]$/g, "").replace(/^\.\//, "");
  const lower = verb.toLowerCase();
  const fileMatch = Object.keys(DOCUMENTS).find(id => argument.toLowerCase() === `docs/${DOCUMENTS[id].file}`.toLowerCase() || argument.toLowerCase() === DOCUMENTS[id].file.toLowerCase() || argument.toLowerCase() === id);
  if (["cat", "open", "xdg-open"].includes(lower) && fileMatch) {
    output(`Opening ${DOCUMENTS[fileMatch].file}…`, "success");
    openWindow(fileMatch);
  } else if (lower === "help") {
    output("Explore this workspace:\n  whoami / cat about.txt    About me\n  ls                       List workspace files\n  ls docs                  List PDFs\n  ls summaries             Browse my course notes\n  open projects            Browse projects\n  open org-agent           Read about org-agent\n  cat docs/<filename>      Open a PDF\n  open github / linkedin   Show a profile link\n  mail                     Get in touch\n  clear                    Clear the terminal\n  pwd / date               A little shell familiarity\n\n↑ / ↓ command history · Tab autocomplete · Ctrl+L clear\nThis is a portfolio shell; commands run only in this page.");
  } else if (lower === "whoami" || ((lower === "cat" || lower === "open") && ["about", "about.txt", "profile"].includes(argument))) {
    output("Franz Schwinn · Computer Science @ ETH Zurich", "success");
    openWindow("about");
  } else if (lower === "ls" && (!argument || ["~", "-la", "-l"].includes(argument))) {
    output("about.txt   docs/   projects/   summaries/\nTry ‘ls docs’, ‘open projects’, or ‘cat about.txt’.");
  } else if (lower === "ls" && ["docs", "docs/"].includes(argument)) {
    output(Object.values(DOCUMENTS).map(doc => `  docs/${doc.file}`).join("\n"));
  } else if ((lower === "ls" || lower === "open") && ["summaries", "summaries/"].includes(argument)) {
    output("Course notes: IML.pdf · PPROG.pdf · AW.pdf", "success");
    openWindow("summaries");
  } else if ((lower === "open" || lower === "ls") && ["projects", "projects/"].includes(argument)) {
    output("Projects: org-agent · Gaussian Splatting · Monocular Depth Estimation", "success");
    openWindow("projects");
  } else if (lower === "open" && argument === "org-agent") {
    output("Loading org-agent/README.md…", "success");
    openWindow("org-agent");
  } else if (lower === "open" && LINKS[argument]) {
    const line = output("Visit ");
    const link = document.createElement("a");
    link.href = LINKS[argument];
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `${argument} ↗`;
    line.append(link);
  } else if (lower === "mail") {
    output("Composing to fschwinn@proton.me…", "success");
    openWindow("contact");
  } else if (lower === "clear") $("#terminal-output").replaceChildren();
  else if (lower === "pwd") output("/home/franz/workspace");
  else if (lower === "date") output(new Date().toLocaleString());
  else if (lower === "terminal") output("You’re already home. Type ‘help’ to explore.");
  else output(`Command not found: ${command}\nType ‘help’ for available commands.`, "error");
  scrollTerminal();
}

async function animateCommand(command) {
  commandQueue.push(command);
  if (typing) return;
  typing = true;
  const token = ++typingToken;
  while (commandQueue.length && token === typingToken) {
    const next = commandQueue.shift();
    openWindow("terminal");
    const input = $("#command-input");
    input.readOnly = true;
    input.value = "";
    scrollTerminal();
    if (!mobile()) input.focus({ preventScroll: true });
    for (const character of next) {
      if (token !== typingToken) break;
      input.value += character;
      input.scrollLeft = input.scrollWidth;
      if (!reducedMotion.matches) await delay(19);
    }
    if (token !== typingToken) break;
    await delay(reducedMotion.matches ? 0 : 160);
    input.value = "";
    executeCommand(next);
    input.readOnly = false;
    // Keep keyboard focus in the newly opened panel without summoning a mobile keyboard.
    if (activeId !== "terminal") {
      input.blur();
      const panel = windows.get(activeId)?.element;
      if (panel) { panel.tabIndex = -1; panel.focus({preventScroll:true}); }
    }
    if (commandQueue.length) await delay(180);
  }
  typing = false;
  $("#command-input").readOnly = false;
}

function installTerminal() {
  const form = $("#terminal-form"), input = $("#command-input");
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (typing) return;
    const command = input.value;
    input.value = "";
    executeCommand(command);
  });
  input.addEventListener("keydown", event => {
    if (event.ctrlKey && event.key.toLowerCase() === "c") {
      event.preventDefault();
      typingToken++;
      commandQueue = [];
      input.value = "";
      output("^C");
      return;
    }
    if (typing) return;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      historyIndex = Math.max(0, Math.min(history.length, historyIndex + (event.key === "ArrowUp" ? -1 : 1)));
      input.value = history[historyIndex] || "";
      input.setSelectionRange(input.value.length, input.value.length);
    } else if (event.ctrlKey && event.key.toLowerCase() === "l") {
      event.preventDefault();
      $("#terminal-output").replaceChildren();
    } else if (event.key === "Tab" && input.value.trim()) {
      const options = ["help", "whoami", "cat about.txt", "ls docs", "ls summaries", "open projects", "open org-agent", "open github", "open linkedin", "mail", "clear", "pwd", "date", ...Object.values(DOCUMENTS).map(doc => `cat docs/${doc.file}`)];
      const matches = options.filter(option => option.toLowerCase().startsWith(input.value.toLowerCase()));
      if (matches.length) {
        event.preventDefault();
        if (matches.length === 1) input.value = matches[0];
        else output(matches.join("\n"));
      }
    }
  });
}

document.addEventListener("click", event => {
  const button = event.target.closest("[data-command]");
  if (!button) return;
  returnFocus = button;
  if (button.dataset.command === "terminal") {
    openWindow("terminal");
    if (!mobile()) $("#command-input").focus();
  } else animateCommand(button.dataset.command);
});
$("#show-desktop").addEventListener("click", () => {
  const visible = [...windows.entries()].filter(([, win]) => !win.element.hidden);
  if (visible.length) visible.forEach(([id]) => minimizeWindow(id));
  else openWindow("terminal");
});
window.addEventListener("resize", () => windows.forEach(win => keepOnDesktop(win.element)));

function updateClock() {
  const now = new Date();
  $("#clock").textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  $("#clock").dateTime = now.toISOString();
  $("#clock").title = now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
updateClock();
setInterval(updateClock, 1000);

async function boot() {
  let seen = false;
  try { seen = sessionStorage.getItem("franz-workspace-booted") === "1"; } catch { /* Storage is optional. */ }
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    $("#boot").hidden = true;
    $("#desktop").inert = false;
    $("#taskbar").inert = false;
    openWindow("terminal");
    if (!mobile()) $("#command-input").focus({preventScroll:true});
    try { sessionStorage.setItem("franz-workspace-booted", "1"); } catch { /* Storage is optional. */ }
  };
  if (seen || reducedMotion.matches) { finish(); return; }
  $("#boot").hidden = false;
  $("#desktop").inert = true;
  $("#taskbar").inert = true;
  $("#skip-boot").addEventListener("click", finish, {once:true});
  const skipKey = e => { if (e.key === "Enter" || e.key === "Escape") finish(); };
  document.addEventListener("keydown", skipKey);
  const lines = ["Starting FranzOS 1.0…", "Mounting /home/franz/workspace…", "Loading projects, research, and a few good ideas…", "Indexing thesis and course notes…", "Personal workspace ready. Welcome."];
  for (const text of lines) {
    if (finished) break;
    const line = document.createElement("div");
    const ok = document.createElement("span");
    ok.textContent = "[ OK ]";
    line.append(ok, text);
    $("#boot-lines").append(line);
    await delay(220);
  }
  if (!finished) await delay(350);
  finish();
  document.removeEventListener("keydown", skipKey);
}
boot();
