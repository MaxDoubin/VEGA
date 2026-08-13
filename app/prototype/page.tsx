"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import "./prototype.css";

type Role = "Student" | "Teacher" | "Family" | "Staff";
type Mode = "Tutor" | "Plan" | "Translate" | "Navigate";
type Source = { name: string; url: string; note: string };
type Msg = { id: number; who: "user" | "vega"; text: string; sources?: Source[]; warning?: string; feedback?: "up" | "down" };
type Thread = { id: string; title: string; role: Role; mode: Mode; messages: Msg[]; updated: number };

const sources = {
  home: { name: "CCSD Home", url: "https://www.ccsd.net/", note: "District services and information" },
  grades: { name: "Infinite Campus", url: "https://campusportal.ccsd.net/", note: "Grades, attendance, and schedules" },
  canvas: { name: "Canvas", url: "https://canvas.ccsd.net/", note: "Courses, modules, and assignments" },
  canvasHelp: { name: "Canvas Help", url: "https://canvashelp.ccsd.net/", note: "Official Canvas support" },
  privacy: { name: "CCSD Student Data Privacy", url: "https://safe.ccsd.net/", note: "Reviewed apps and privacy guidance" },
  policy: { name: "Acceptable Use + AI", url: "https://www.ccsd.net/legal/acceptable-use-policy", note: "District technology expectations" },
  tech: { name: "CCSD StuTech", url: "https://stutech.ccsd.net/", note: "Device and account support" },
  transport: { name: "CCSD Transportation", url: "https://transportation.ccsd.net/", note: "Routes and eligibility" },
  clever: { name: "Clever", url: "https://clever.ccsd.net/", note: "Approved learning-app launchpad" },
};

const welcome = (role: Role, mode: Mode): Msg => ({
  id: Date.now(), who: "vega",
  text: `${role} workspace ready in ${mode} mode. I use a local demonstration engine and fictional data. Choose a starter below or ask your own question—without names, IDs, grades, or other private information.`,
  sources: [sources.policy, sources.privacy],
});

const starter: Thread = { id: "welcome", title: "Welcome to VEGA", role: "Student", mode: "Tutor", updated: 1, messages: [welcome("Student", "Tutor")] };
const pii = /\b(?:\d{3}-\d{2}-\d{4}|\d{7,10}|[\w.+-]+@[\w.-]+\.[a-z]{2,}|password|student id|home address|iep|medical record|date of birth|social security)\b/i;

const promptSets: Record<Mode, Record<Role, string[]>> = {
  Tutor: {
    Student: ["Tutor me on slope", "Start a cell biology quiz", "Help me improve a thesis"],
    Teacher: ["Create guided questions for slope", "Differentiate a reading task", "Make a retrieval quiz"],
    Family: ["Explain an assignment simply", "Help me ask a learning question", "How can I support study time?"],
    Staff: ["Design a tutoring safeguard", "Draft academic-integrity guidance", "List pilot learning metrics"],
  },
  Plan: {
    Student: ["Plan my study week", "Break down a big project", "Make a 25-minute focus plan"],
    Teacher: ["Plan a 45-minute lesson", "Create an exit ticket", "Adapt a lesson for multilingual learners"],
    Family: ["Make a homework routine", "Plan questions for a teacher", "Create a school-week checklist"],
    Staff: ["Draft a 30-day pilot plan", "Create an evaluation scorecard", "Plan a staff training session"],
  },
  Translate: {
    Student: ["Explain directions in Spanish", "Simplify this school notice", "Make this easier to read"],
    Teacher: ["Draft a bilingual family update", "Simplify these directions", "Create a plain-language version"],
    Family: ["Translate a school message", "Explain Canvas in Spanish", "Help me reply to a teacher"],
    Staff: ["Create a multilingual notice", "Audit this for plain language", "Draft accessibility guidance"],
  },
  Navigate: {
    Student: ["Where are my grades?", "How do I open Canvas?", "I need device help"],
    Teacher: ["Find Canvas support", "Show approved technology guidance", "Find district policy"],
    Family: ["Where is attendance?", "Find transportation information", "How do I contact CCSD?"],
    Staff: ["Show privacy sources", "Find acceptable-use guidance", "List trusted CCSD portals"],
  },
};

function answer(query: string, role: Role, mode: Mode): Omit<Msg, "id" | "who"> {
  const q = query.toLowerCase();
  if (pii.test(query)) return { text: "I paused before processing that message because it appears to contain private information. Remove names, student IDs, contact details, passwords, grades, medical details, or education records. Then ask again with fictional details.", warning: "Privacy safeguard activated", sources: [sources.privacy, sources.policy] };
  if (/grade|attendance|schedule|campus/.test(q)) return { text: "Open Infinite Campus for current grades, attendance, schedules, assignments, and notices. VEGA cannot see a student record. For privacy, open the official portal directly and never paste the record into this demo.", sources: [sources.grades, sources.privacy] };
  if (/canvas|assignment|module|course/.test(q) && mode === "Navigate") return { text: "Canvas is CCSD’s course workspace. Students usually launch it through Clever. If a class is missing, check All Courses, confirm the term, and ask the teacher whether the course is published.", sources: [sources.canvas, sources.canvasHelp, sources.clever] };
  if (/bus|transport|route/.test(q)) return { text: "Use the official CCSD Transportation page for route and eligibility information. Keep addresses out of this prototype; enter them only in the authorized district tool.", sources: [sources.transport] };
  if (/device|password|account|chromebook|tech/.test(q)) return { text: "CCSD StuTech provides official help for devices, passwords, Google, Canvas, and Microsoft 365. Start there, then contact your school if the issue involves an account permission.", sources: [sources.tech] };
  if (/privacy|data|safe|policy|ai rule|acceptable/.test(q)) return { text: "CCSD’s published guidance centers educational purpose, protection of personally identifiable information, critical review of AI output, and academic integrity. VEGA’s proposed local design follows those boundaries, but any real pilot would still need district security, legal, accessibility, and instructional review.", sources: [sources.policy, sources.privacy] };
  if (mode === "Translate" || /spanish|translate|bilingual/.test(q)) return { text: "Versión clara en español: Puedo explicar el mensaje escolar paso a paso y conservar el significado original. Antes de pegar texto, quite nombres, números de identificación, calificaciones y cualquier información privada. También puedo mostrar una versión en inglés para comparar.", sources: [sources.home] };
  if (mode === "Plan") {
    if (role === "Teacher") return { text: "45-minute learning plan\n\n1. Launch · 5 min — one visual question that reveals prior knowledge.\n2. Model · 8 min — teacher think-aloud with one worked example.\n3. Practice · 20 min — pairs solve, explain, and compare strategies.\n4. Check · 7 min — individual hinge question and targeted reteach.\n5. Exit · 5 min — one transfer problem plus confidence rating.\n\nAdd language frames, a worked-example scaffold, and an extension that asks students to justify a second method.", sources: [sources.canvas] };
    return { text: "Here’s a practical plan: define one finish line, split it into three 25-minute blocks, put the hardest block first, and end each block with a one-sentence recap. After block two, take a real break. What deadline and subject should I use to personalize the sequence?" };
  }
  if (/slope|linear|y\s*=|graph/.test(q)) return { text: "Let’s keep the thinking yours. Slope measures how much y changes for each 1-unit change in x. Choose two points, calculate change in y, calculate change in x in the same order, then divide. Tell me your two points and I’ll check each step—not jump to the answer." };
  if (/quiz|test me|study/.test(q)) return { text: "Study mode is on. I’ll ask one question at a time, give a hint before revealing anything, and adapt the next question to your answer. First question: explain the topic in one sentence as if you were teaching a sixth grader." };
  if (/essay|paragraph|thesis|write/.test(q)) return { text: "Start with a claim that directly answers the prompt. Under it, write two evidence bullets and one ‘so what?’ sentence for each. I can challenge your reasoning, suggest structure, and give feedback—but the final voice and wording stay yours." };
  const lead = role === "Teacher" ? "I can turn that into a measurable objective, learning sequence, differentiation, and check for understanding." : role === "Family" ? "I can explain that in plain language and help prepare a respectful school message." : role === "Staff" ? "I can map that request to policy, controls, owners, and pilot evidence." : "I can coach this step by step while keeping the work yours.";
  return { text: `${lead} Tell me the subject, goal, deadline, and what you have already tried. Use fictional details only.` };
}

function Icon({ children }: { children: React.ReactNode }) { return <span className="mode-icon" aria-hidden="true">{children}</span>; }

export default function Prototype() {
  const [threads, setThreads] = useState<Thread[]>([starter]);
  const [active, setActive] = useState("welcome");
  const [input, setInput] = useState("");
  const [role, setRole] = useState<Role>("Student");
  const [mode, setMode] = useState<Mode>("Tutor");
  const [ready, setReady] = useState(false);
  const [menu, setMenu] = useState(false);
  const [context, setContext] = useState(false);
  const [query, setQuery] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState("Saved locally");
  const [dark, setDark] = useState(false);
  const [tour, setTour] = useState(0);
  const [engine, setEngine] = useState<"checking" | "live" | "demo">("checking");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestAbort = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const messageId = useRef(100);

  useEffect(() => {
    const raw = localStorage.getItem("vega-demo-threads-v2");
    const seen = localStorage.getItem("vega-tour-seen");
    const theme = localStorage.getItem("vega-theme");
    const hydrate = setTimeout(() => {
      if (raw) try { const parsed = JSON.parse(raw) as Thread[]; setThreads(parsed); setActive(parsed[0]?.id || "welcome"); setRole(parsed[0]?.role || "Student"); setMode(parsed[0]?.mode || "Tutor"); } catch {}
      if (!seen) setTour(1);
      if (theme === "dark") setDark(true);
      setReady(true);
    }, 0);
    return () => clearTimeout(hydrate);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(() => { localStorage.setItem("vega-demo-threads-v2", JSON.stringify(threads.slice(0, 20))); setSaved("Saved locally"); }, 250);
    return () => clearTimeout(id);
  }, [threads, ready]);
  useEffect(() => { if (ready) localStorage.setItem("vega-theme", dark ? "dark" : "light"); }, [dark, ready]);
  useEffect(() => { fetch("/api/chat").then(r => r.json()).then(data => setEngine(data.connected ? "live" : "demo")).catch(() => setEngine("demo")); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [threads, generating]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const thread = threads.find(t => t.id === active) || threads[0];
  const filteredThreads = useMemo(() => [...threads].sort((a, b) => b.updated - a.updated).filter(t => t.title.toLowerCase().includes(query.toLowerCase())), [threads, query]);
  const suggestions = promptSets[mode][role];

  function updateThread(change: Partial<Thread>) { setThreads(list => list.map(t => t.id === active ? { ...t, ...change, updated: Date.now() } : t)); }
  function selectMode(next: Mode) { setMode(next); updateThread({ mode: next }); }
  function selectRole(next: Role) { setRole(next); updateThread({ role: next }); }
  function newThread(nextRole = role, nextMode = mode) {
    const t: Thread = { id: crypto.randomUUID(), title: "New conversation", role: nextRole, mode: nextMode, updated: Date.now(), messages: [welcome(nextRole, nextMode)] };
    setThreads(list => [t, ...list]); setActive(t.id); setRole(nextRole); setMode(nextMode); setMenu(false);
  }
  async function send(event?: FormEvent, preset?: string) {
    event?.preventDefault();
    const text = (preset || input).trim();
    if (!text || !thread || generating) return;
    const id = messageId.current += 2;
    const user: Msg = { id, who: "user", text };
    setThreads(list => list.map(t => t.id === thread.id ? { ...t, title: t.title === "New conversation" || t.id === "welcome" ? text.slice(0, 42) : t.title, role, mode, updated: id, messages: [...t.messages, user] } : t));
    setInput(""); setGenerating(true);
    const local = answer(text, role, mode);
    if (local.warning) {
      timer.current = setTimeout(() => {
        const reply: Msg = { id: id + 1, who: "vega", ...local };
        setThreads(list => list.map(t => t.id === thread.id ? { ...t, updated: Date.now(), messages: [...t.messages, reply] } : t));
        setGenerating(false); timer.current = null;
      }, 420);
      return;
    }
    const controller = new AbortController(); requestAbort.current = controller;
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ role, mode, messages: [...thread.messages, user] }) });
      if (!response.ok) throw new Error("fallback");
      const data = await response.json() as { text?: string };
      if (!data.text) throw new Error("fallback");
      const reply: Msg = { id: id + 1, who: "vega", text: data.text, sources: local.sources };
      setThreads(list => list.map(t => t.id === thread.id ? { ...t, updated: Date.now(), messages: [...t.messages, reply] } : t));
      setEngine("live");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      const reply: Msg = { id: id + 1, who: "vega", ...local };
      setThreads(list => list.map(t => t.id === thread.id ? { ...t, updated: Date.now(), messages: [...t.messages, reply] } : t));
      setEngine("demo");
    } finally { setGenerating(false); requestAbort.current = null; }
  }
  function stop() { if (timer.current) clearTimeout(timer.current); timer.current = null; requestAbort.current?.abort(); requestAbort.current = null; setGenerating(false); }
  function removeThread() {
    if (!thread) return;
    const remaining = threads.filter(t => t.id !== thread.id);
    const next = remaining.length ? remaining : [{ ...starter, id: crypto.randomUUID(), updated: Date.now(), messages: [welcome(role, mode)] }];
    setThreads(next); setActive(next[0].id); setRole(next[0].role); setMode(next[0].mode);
  }
  function clearAll() { const next = { ...starter, id: crypto.randomUUID(), updated: Date.now(), messages: [welcome(role, mode)] }; setThreads([next]); setActive(next.id); localStorage.removeItem("vega-demo-threads-v2"); }
  function download() {
    if (!thread) return;
    const body = [`VEGA prototype transcript`, `${thread.role} · ${thread.mode}`, "", ...thread.messages.map(m => `${m.who === "vega" ? "VEGA" : "YOU"}\n${m.text}`)].join("\n\n");
    const href = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
    const anchor = document.createElement("a"); anchor.href = href; anchor.download = `vega-${thread.title.replace(/\W+/g, "-").toLowerCase()}.txt`; anchor.click(); URL.revokeObjectURL(href);
  }
  function feedback(id: number, value: "up" | "down") { setThreads(list => list.map(t => t.id === active ? { ...t, messages: t.messages.map(m => m.id === id ? { ...m, feedback: value } : m) } : t)); }
  async function copy(text: string) { try { await navigator.clipboard.writeText(text); setSaved("Response copied"); setTimeout(() => setSaved("Saved locally"), 1200); } catch {} }
  function closeTour() { setTour(0); localStorage.setItem("vega-tour-seen", "yes"); }

  const activeSources = thread?.messages.flatMap(m => m.sources || []).filter((s, i, all) => all.findIndex(x => x.url === s.url) === i) || [];
  const tourSteps = [
    ["Choose how VEGA helps", "Tutor, Plan, Translate, and Navigate change the workflow—not just the color."],
    ["Your privacy boundary", "The demo runs in this browser, blocks common private-data patterns, and never needs real student information."],
    ["Check the evidence", "Official links appear beside grounded answers so every important claim can be verified."],
  ];

  return <main className={`vega-app ${dark ? "theme-dark" : ""}`}>
    <aside className={menu ? "side open" : "side"} aria-label="Conversation history">
      <Link className="appbrand" href="/"><span>V</span><b>VEGA</b><em>LOCAL LAB</em></Link>
      <button className="newchat" onClick={() => newThread()}>＋ New conversation <kbd>⌘K</kbd></button>
      <div className="thread-search"><span>⌕</span><input aria-label="Search conversations" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search conversations" /></div>
      <label>RECENT · {filteredThreads.length}</label>
      <div className="threads">{filteredThreads.map(t => <button key={t.id} className={t.id === active ? "selected" : ""} onClick={() => { setActive(t.id); setRole(t.role); setMode(t.mode); setMenu(false); }}><span>{t.mode === "Tutor" ? "✦" : t.mode === "Plan" ? "▤" : t.mode === "Translate" ? "文" : "⌁"}</span><div><b>{t.title}</b><small>{t.role} · {t.mode}</small></div></button>)}</div>
      <div className={`system ${engine === "live" ? "is-live" : ""}`}><div><i /> <b>{engine === "checking" ? "CHECKING ENGINE" : engine === "live" ? "OPENAI CONNECTED" : "LOCAL DEMO READY"}</b></div><span>{engine === "live" ? "Secure server connection active" : "No messages leave this browser"}</span><small>{engine === "live" ? "VEGA rules · live model" : "Rules engine · automatic fallback"}</small><button onClick={clearAll}>Clear local data</button></div>
    </aside>

    <section className="workspace">
      <header>
        <button className="menubtn" onClick={() => setMenu(!menu)} aria-label="Open conversation history">☰</button>
        <div className="thread-title"><b>{thread?.title}</b><span><i />Protected workspace · {saved}</span></div>
        <div className="header-actions"><button onClick={() => setDark(!dark)} aria-label="Toggle color theme">{dark ? "☀" : "◐"}</button><button onClick={download}>↓ Export</button><button onClick={removeThread} className="danger">Delete</button><button className="contextbtn" onClick={() => setContext(!context)}>Sources</button></div>
      </header>

      <div className="modebar" role="tablist" aria-label="Assistant mode">{(["Tutor", "Plan", "Translate", "Navigate"] as Mode[]).map(item => <button role="tab" aria-selected={mode === item} className={mode === item ? "active" : ""} key={item} onClick={() => selectMode(item)}><Icon>{item === "Tutor" ? "✦" : item === "Plan" ? "▤" : item === "Translate" ? "文" : "⌁"}</Icon><span><b>{item}</b><small>{item === "Tutor" ? "Learn the thinking" : item === "Plan" ? "Build the pathway" : item === "Translate" ? "Make it clear" : "Find the source"}</small></span></button>)}</div>

      <div className="workgrid">
        <section className="conversation" aria-label="VEGA conversation">
          <div className="roleline"><span>VIEWING AS</span>{(["Student", "Teacher", "Family", "Staff"] as Role[]).map(item => <button className={role === item ? "active" : ""} key={item} onClick={() => selectRole(item)}>{item}</button>)}</div>
          <div className="messages">{thread?.messages.map((m,index) => <article key={`${m.who}-${m.id}-${index}`} className={m.who}>
            <div className="avatar">{m.who === "vega" ? "V" : "Y"}</div>
            <div className="bubble"><div className="msgmeta"><b>{m.who === "vega" ? "VEGA" : "YOU"}</b>{m.warning && <strong className="warning">⚠ {m.warning}</strong>}</div><p>{m.text}</p>
              {m.sources && <div className="source-row"><span>GROUNDED IN</span>{m.sources.map(s => <a href={s.url} target="_blank" rel="noreferrer" key={s.url}>{s.name} ↗</a>)}</div>}
              {m.who === "vega" && <div className="message-tools"><button onClick={() => copy(m.text)}>▣ Copy</button><span>Was this useful?</span><button className={m.feedback === "up" ? "chosen" : ""} onClick={() => feedback(m.id, "up")} aria-label="Helpful">↑</button><button className={m.feedback === "down" ? "chosen" : ""} onClick={() => feedback(m.id, "down")} aria-label="Not helpful">↓</button></div>}
            </div>
          </article>)}
          {generating && <article className="vega"><div className="avatar">V</div><div className="bubble thinking"><b>VEGA IS THINKING LOCALLY</b><div><i /><i /><i /></div><button onClick={stop}>Stop</button></div></article>}
          <div ref={endRef} /></div>
          <div className="dock"><div className="suggestions">{suggestions.map(s => <button key={s} onClick={() => send(undefined, s)} disabled={generating}>{s}<span>↗</span></button>)}</div><form onSubmit={send}><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={`Message VEGA as ${role.toLowerCase()}…`} aria-label="Message VEGA" /><div className="composer-meta"><span>⌁ Privacy check on</span><span>{input.length}/2000</span></div><button disabled={!input.trim() || generating} aria-label="Send message">↑</button></form><small><b>Concept prototype.</b> Use fictional information. Verify important answers with cited sources and a qualified adult.</small></div>
        </section>

        <aside className={context ? "context open" : "context"} aria-label="Source context">
          <div className="context-head"><div><span>LIVE CONTEXT</span><h2>Why this answer?</h2></div><button onClick={() => setContext(false)}>×</button></div>
          <section className="context-card privacy-card"><div className="card-icon">◇</div><div><b>Privacy boundary active</b><p>Common IDs, contact details, passwords, and sensitive records are blocked before a response.</p></div></section>
          <section className="context-section"><span>ACTIVE SOURCES · {activeSources.length}</span>{activeSources.length ? activeSources.map(s => <a href={s.url} target="_blank" rel="noreferrer" key={s.url}><i>✓</i><div><b>{s.name}</b><small>{s.note}</small></div><em>↗</em></a>) : <p>Ask about a district resource or policy to see official citations here.</p>}</section>
          <section className="context-section"><span>ANSWER RECIPE</span><ol><li><b>1</b>Detect intent and role</li><li><b>2</b>Apply privacy boundary</li><li><b>3</b>Use approved source set</li><li><b>4</b>Show uncertainty and links</li></ol></section>
          <section className="context-section quick"><span>QUICK LINKS</span><a href={sources.policy.url} target="_blank" rel="noreferrer">Acceptable Use ↗</a><a href={sources.privacy.url} target="_blank" rel="noreferrer">SAFE List ↗</a><a href={sources.tech.url} target="_blank" rel="noreferrer">StuTech ↗</a></section>
          <div className="context-foot"><i /><span><b>{engine === "live" ? "OpenAI model connected" : "Local fallback active"}</b><small>VEGA guardrails · 8 trusted entry points</small></span></div>
        </aside>
      </div>
    </section>

    {menu && <button className="scrim" onClick={() => setMenu(false)} aria-label="Close menu" />}
    {context && <button className="context-scrim" onClick={() => setContext(false)} aria-label="Close sources" />}
    {tour > 0 && <div className="tour" role="dialog" aria-modal="true" aria-label="Welcome tour"><div className="tour-visual"><span>{tour === 1 ? "✦" : tour === 2 ? "◇" : "⌁"}</span><i /><i /><i /></div><small>WELCOME TO VEGA · {tour}/3</small><h2>{tourSteps[tour - 1][0]}</h2><p>{tourSteps[tour - 1][1]}</p><div className="tour-dots">{tourSteps.map((_, i) => <i className={tour === i + 1 ? "active" : ""} key={i} />)}</div><div className="tour-actions"><button onClick={closeTour}>Skip</button><button onClick={() => tour === 3 ? closeTour() : setTour(tour + 1)}>{tour === 3 ? "Enter VEGA" : "Next →"}</button></div></div>}
  </main>;
}
