"use client";

import { FormEvent, useState } from "react";
import { Activity, ArrowUp, Bot, Braces, ChevronDown, CircleHelp, Code2, Command, FileCode2, FolderGit2, Github, Menu, Plus, Settings2, Sparkles, Terminal, WandSparkles } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const suggestions = [
  { icon: Code2, title: "Understand a codebase", detail: "Explain architecture and key files", prompt: "Help me understand the architecture of my codebase. What files should I inspect first?" },
  { icon: WandSparkles, title: "Build a feature", detail: "Plan and implement a new idea", prompt: "Help me plan a new feature, including its components, API and tests." },
  { icon: FileCode2, title: "Debug an issue", detail: "Trace errors and suggest a fix", prompt: "Help me debug an issue. Ask me for the error and relevant code, then reason through it." }
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  async function send(text = input) {
    const value = text.trim();
    if (!value || busy) return;
    const next = [...messages, { role: "user" as const, content: value }];
    setMessages(next);
    setInput("");
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The request could not be completed.");
      setMessages([...next, { role: "assistant", content: data.text }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send();
  }

  return (
    <main className="shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand"><div className="brand-mark"><Sparkles size={19} /></div><span>cloude<span className="brand-accent">ai</span></span><button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><Menu size={18}/></button></div>
        <button className="new-chat" onClick={() => { setMessages([]); setError(""); setMobileNav(false); }}><Plus size={17}/> New conversation <span>⌘ K</span></button>
        <div className="nav-label">WORKSPACE</div>
        <nav className="nav-list">
          <a className="nav-item active" href="#"><Bot size={17}/> AI workspace</a>
          <a className="nav-item" href="#terminal"><Terminal size={17}/> Terminal setup</a>
          <a className="nav-item" href="https://github.com/adnanyogi88-dev/cloudeai" target="_blank" rel="noreferrer"><Github size={17}/> GitHub repository</a>
        </nav>
        <div className="nav-label recent-label">RECENT</div>
        <div className="empty-history">Your conversations will appear here.</div>
        <div className="sidebar-bottom">
          <div className="status-line"><span className="status-dot"/> Workspace ready</div>
          <a className="nav-item" href="#setup"><Settings2 size={17}/> Configuration</a>
          <a className="nav-item" href="#help"><CircleHelp size={17}/> Help & documentation</a>
          <div className="profile"><div className="avatar">C</div><div><strong>CloudeAI</strong><small>Personal workspace</small></div><ChevronDown size={15}/></div>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={19}/></button><div className="breadcrumb"><span>Workspace</span><span className="slash">/</span><strong>AI assistant</strong></div><div className="top-actions"><span className="model-pill"><span className="model-dot"/> Claude API <ChevronDown size={13}/></span><a className="github-link" href="https://github.com/adnanyogi88-dev/cloudeai" target="_blank" rel="noreferrer"><Github size={16}/> Repository</a></div></header>

        <div className="content">
          <div className="eyebrow"><span className="eyebrow-line"/> YOUR AI-POWERED DEVELOPMENT SPACE</div>
          <div className="hero-title">Build something<br/><span>remarkable.</span></div>
          <p className="hero-copy">Your ideas, your code, one intelligent workspace.<br className="desktop-break"/> Start a conversation or choose a workflow below.</p>

          {messages.length === 0 ? (
            <div className="suggestion-grid">
              {suggestions.map((item) => { const Icon = item.icon; return <button className="suggestion-card" key={item.title} onClick={() => void send(item.prompt)}><div className="suggestion-icon"><Icon size={18}/></div><strong>{item.title}</strong><span>{item.detail}</span><ArrowUp className="card-arrow" size={16}/></button>; })}
            </div>
          ) : (
            <div className="conversation" aria-live="polite">
              {messages.map((message, index) => <div className={`message ${message.role}`} key={index}><div className="message-avatar">{message.role === "assistant" ? <Sparkles size={15}/> : "Y"}</div><div className="message-body"><div className="message-role">{message.role === "assistant" ? "CLOUDEAI" : "YOU"}</div><p>{message.content}</p></div></div>)}
              {busy && <div className="typing"><span/><span/><span/> CloudeAI is thinking…</div>}
              <div id="latest"/>
            </div>
          )}
          {error && <div className="error-box">{error}{error.includes("ANTHROPIC_API_KEY") && <a href="#setup"> See setup instructions.</a>}</div>}

          <form className="composer" onSubmit={onSubmit}>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="Ask CloudeAI anything about your code…" rows={2} aria-label="Message CloudeAI"/>
            <div className="composer-footer"><div className="composer-hint"><Braces size={14}/> AI can make mistakes. Review generated code.</div><button className="send-button" type="submit" disabled={!input.trim() || busy} aria-label="Send message"><ArrowUp size={18}/></button></div>
          </form>
          <div className="composer-note">Press <kbd>Enter</kbd> to send · <kbd>Shift + Enter</kbd> for a new line</div>

          <div className="terminal-banner" id="terminal"><div className="terminal-symbol"><Terminal size={20}/></div><div className="terminal-text"><strong>Prefer working in your terminal?</strong><span>Use CloudeAI from your command line with the same API key.</span></div><a href="#setup">Get started <ArrowUp size={14}/></a></div>

          <section className="setup-section" id="setup"><div className="section-heading"><span>01 / CONFIGURATION</span><h2>Connect your AI engine</h2><p>Add your Anthropic API key as a server-side environment variable in Vercel. Never put it in browser code.</p></div><div className="setup-card"><div className="setup-card-title"><Activity size={16}/> Vercel environment variable</div><code>ANTHROPIC_API_KEY</code><ol><li>Open your Vercel project settings.</li><li>Go to <b>Environment Variables</b>.</li><li>Add <code>ANTHROPIC_API_KEY</code> and your API key. Apply it to Production and Preview.</li><li>Redeploy the latest deployment.</li></ol><a href="https://vercel.com/docs/projects/environment-variables" target="_blank" rel="noreferrer">Vercel environment variable guide ↗</a></div></section>
          <footer id="help">CloudeAI <span>·</span> Built for thoughtful development</footer>
        </div>
      </section>
    </main>
  );
}
