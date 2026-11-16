import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

const SOURCES = [
  { group: "Jammu & Kashmir", name: "DIPR Jammu & Kashmir", url: "https://dipr.jk.gov.in/", detail: "Official press releases and government updates" },
  { group: "Jammu & Kashmir", name: "J&K General Administration Department", url: "https://jkgad.nic.in/", detail: "Government orders and administrative notifications" },
  { group: "Jammu & Kashmir", name: "JKSSB", url: "https://jkssb.nic.in/", detail: "Recruitment notices, results and exam updates" },
  { group: "Jammu & Kashmir", name: "JKBOSE", url: "https://jkbose.nic.in/", detail: "Board notifications, datesheets and results" },
  { group: "India", name: "Press Information Bureau", url: "https://pib.gov.in/", detail: "Central government releases and briefings" },
  { group: "India", name: "Election Commission of India", url: "https://eci.gov.in/", detail: "Official election announcements and data" },
  { group: "World", name: "Reuters", url: "https://www.reuters.com/", detail: "International reporting; check reuse and licensing terms" },
  { group: "World", name: "Associated Press", url: "https://apnews.com/", detail: "International reporting; check reuse and licensing terms" },
  { group: "Health & Science", name: "World Health Organization", url: "https://www.who.int/news", detail: "Public health updates and official publications" }
];

const STATUSES = ["New", "Verifying", "Verified", "Rejected", "Drafted"];
const CATEGORIES = ["Jammu & Kashmir", "India", "World", "Education", "Health", "Science", "Business", "Technology", "Other"];
const fieldStyle = { width: "100%", boxSizing: "border-box", border: "1px solid #d9ded8", borderRadius: 8, padding: "11px 12px", margin: "6px 0 13px", font: "inherit", background: "#fff", color: "#202720" };
const buttonStyle = { border: "1px solid #d9ded8", borderRadius: 7, padding: "9px 12px", background: "#f7f8f4", color: "#294638", fontWeight: 650, cursor: "pointer" };

export default function ResearchDesk() {
  const [leads, setLeads] = useState([]);
  const [headline, setHeadline] = useState("");
  const [category, setCategory] = useState("Jammu & Kashmir");
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("All");

  const loadLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("news_research").select("*").order("created_at", { ascending: false });
    if (error) setMessage("Research leads could not be loaded. Run the SQL setup shown below first. " + error.message);
    else setLeads(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  async function addLead(event) {
    event.preventDefault();
    if (!headline.trim() || !sourceName.trim() || !sourceUrl.trim()) {
      setMessage("Headline, source name and original source URL are required.");
      return;
    }
    try {
      new URL(sourceUrl.trim());
    } catch {
      setMessage("Please enter a valid original source URL.");
      return;
    }
    setSaving(true);
    setMessage("");
    const { data, error } = await supabase.from("news_research").insert([{
      headline: headline.trim(), category, source_name: sourceName.trim(),
      source_url: sourceUrl.trim(), summary: summary.trim(), notes: notes.trim(), status: "New"
    }]).select().single();
    if (error) setMessage("Could not save research lead: " + error.message);
    else {
      setLeads((old) => [data, ...old]);
      setHeadline(""); setSourceName(""); setSourceUrl(""); setSummary(""); setNotes("");
      setMessage("Research lead saved.");
    }
    setSaving(false);
  }

  async function updateStatus(id, status) {
    const { data, error } = await supabase.from("news_research").update({ status }).eq("id", id).select().single();
    if (error) setMessage("Status could not be updated: " + error.message);
    else setLeads((old) => old.map((lead) => lead.id === id ? data : lead));
  }

  async function updateNotes(lead) {
    const value = window.prompt("Update research / verification notes:", lead.notes || "");
    if (value === null) return;
    const { data, error } = await supabase.from("news_research").update({ notes: value.trim() }).eq("id", lead.id).select().single();
    if (error) setMessage("Notes could not be saved: " + error.message);
    else setLeads((old) => old.map((item) => item.id === lead.id ? data : item));
  }

  async function deleteLead(id) {
    if (!window.confirm("Delete this research lead? This cannot be undone.")) return;
    const { error } = await supabase.from("news_research").delete().eq("id", id);
    if (error) setMessage("Lead could not be deleted: " + error.message);
    else setLeads((old) => old.filter((lead) => lead.id !== id));
  }

  const visibleLeads = useMemo(() => filter === "All" ? leads : leads.filter((lead) => lead.status === filter), [filter, leads]);
  const counts = useMemo(() => Object.fromEntries(["New", "Verifying", "Verified", "Rejected", "Drafted"].map((status) => [status, leads.filter((lead) => lead.status === status).length])), [leads]);

  return (
    <section style={{ background: "#fff", border: "1px solid #e3e5dd", borderRadius: 12, padding: "clamp(16px, 3vw, 24px)", marginBottom: 20, boxShadow: "0 2px 10px #00000008" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div><p style={{ margin: "0 0 5px", color: "#98644e", letterSpacing: 2, fontSize: 11, fontWeight: 800 }}>EDITORIAL WORKSPACE</p><h2 style={{ margin: 0, color: "#202720" }}>Newsroom Research Desk</h2></div>
        <button type="button" style={buttonStyle} onClick={loadLeads}>Refresh leads</button>
      </div>
      <p style={{ color: "#68736b", lineHeight: 1.6 }}>Collect story leads, save their original sources and track verification before writing or publishing.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(105px, 1fr))", gap: 9, margin: "16px 0 22px" }}>
        {[["New", counts.New], ["Verifying", counts.Verifying], ["Verified", counts.Verified], ["Drafted", counts.Drafted], ["Rejected", counts.Rejected]].map(([label, value]) => <div key={label} style={{ background: "#f5f6f1", border: "1px solid #e5e7df", borderRadius: 8, padding: 11 }}><div style={{ color: "#737b70", fontSize: 12 }}>{label}</div><strong style={{ display: "block", fontSize: 23, color: "#294638" }}>{value}</strong></div>)}
      </div>

      <div style={{ borderTop: "1px solid #e5e7df", paddingTop: 18 }}>
        <h3 style={{ marginTop: 0 }}>Source Directory</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 9 }}>
          {SOURCES.map((source) => <a key={source.name} href={source.url} target="_blank" rel="noreferrer" style={{ display: "block", textDecoration: "none", color: "#294638", border: "1px solid #e1e4dc", borderRadius: 8, padding: 12, background: "#fbfcf9" }}><span style={{ display: "block", fontSize: 10, letterSpacing: 1.2, color: "#98644e", fontWeight: 800, textTransform: "uppercase" }}>{source.group}</span><strong style={{ display: "block", margin: "5px 0" }}>{source.name} ↗</strong><span style={{ color: "#737b70", fontSize: 12, lineHeight: 1.45 }}>{source.detail}</span></a>)}
        </div>
      </div>

      <div style={{ borderTop: "1px solid #e5e7df", paddingTop: 18, marginTop: 22 }}>
        <h3 style={{ marginTop: 0 }}>Add a News Lead</h3>
        <form onSubmit={addLead}>
          <label>News headline *</label><input style={fieldStyle} value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={300} placeholder="Enter the working headline" required />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
            <div><label>Category</label><select style={fieldStyle} value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></div>
            <div><label>Source / publisher name *</label><input style={fieldStyle} value={sourceName} onChange={(e) => setSourceName(e.target.value)} maxLength={160} placeholder="e.g. DIPR J&K" required /></div>
          </div>
          <label>Original source URL *</label><input type="url" style={fieldStyle} value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} maxLength={1200} placeholder="https://..." required />
          <label>Short factual summary</label><textarea style={{ ...fieldStyle, minHeight: 82, resize: "vertical" }} value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={1600} placeholder="What does the original source actually confirm?" />
          <label>Research / verification notes</label><textarea style={{ ...fieldStyle, minHeight: 82, resize: "vertical" }} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} placeholder="Record cross-checks, missing details, dates and questions to resolve." />
          <button type="submit" disabled={saving} style={{ ...buttonStyle, background: "#294638", color: "#fff", borderColor: "#294638", opacity: saving ? 0.7 : 1 }}>{saving ? "Saving lead…" : "Save News Lead"}</button>
        </form>
      </div>

      <div style={{ borderTop: "1px solid #e5e7df", paddingTop: 18, marginTop: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}><h3 style={{ margin: 0 }}>Research Pipeline</h3><select aria-label="Filter research leads" style={{ ...fieldStyle, width: "auto", minWidth: 145, margin: 0 }} value={filter} onChange={(e) => setFilter(e.target.value)}>{["All", ...STATUSES].map((item) => <option key={item}>{item}</option>)}</select></div>
        {message && <p role="status" style={{ padding: 10, background: "#f8f4eb", borderRadius: 7, color: "#73502e" }}>{message}</p>}
        {loading ? <p>Loading research leads…</p> : visibleLeads.length === 0 ? <p style={{ color: "#737b70" }}>No research leads in this view yet. Add your first lead above.</p> : visibleLeads.map((lead) => <article key={lead.id} style={{ borderBottom: "1px solid #e5e7df", padding: "16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 240px", minWidth: 0 }}><span style={{ color: "#98644e", fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>{lead.category} · {lead.source_name}</span><h4 style={{ margin: "6px 0", color: "#202720", fontSize: 17 }}>{lead.headline}</h4><p style={{ color: "#68736b", margin: "4px 0", lineHeight: 1.5 }}>{lead.summary || "No summary added."}</p><a href={lead.source_url} target="_blank" rel="noreferrer" style={{ color: "#315b4a", overflowWrap: "anywhere", fontSize: 13 }}>Open original source ↗</a>{lead.notes && <p style={{ background: "#f7f8f4", padding: 9, borderRadius: 6, color: "#606b60", fontSize: 13 }}>Notes: {lead.notes}</p>}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 145 }}><select aria-label={"Status for " + lead.headline} style={{ ...fieldStyle, margin: 0 }} value={lead.status} onChange={(e) => updateStatus(lead.id, e.target.value)}>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select><button type="button" style={buttonStyle} onClick={() => updateNotes(lead)}>Edit notes</button><button type="button" style={{ ...buttonStyle, color: "#9b3d35" }} onClick={() => deleteLead(lead.id)}>Delete lead</button></div>
          </div>
          <small style={{ color: "#8a9187" }}>Added {new Date(lead.created_at).toLocaleString("en-IN")}</small>
        </article>)}
      </div>
      <p style={{ color: "#7b8278", fontSize: 12, lineHeight: 1.5, marginTop: 18 }}>Editorial rule: a source link is a starting point, not automatic proof. Verify important claims independently, preserve attribution and check agency licensing before republishing material.</p>
    </section>
  );
}
