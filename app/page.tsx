"use client";

import { useEffect, useState } from "react";
import { CLUBS, OTHER_CLUB, cityOfClub, isNearby } from "@/lib/cities";

type HW = { id: string; name: string; quantity: number | null; owner: string; city: string | null };
type ClubHW = { id: string; name: string; city: string | null; quantity: number | null; availability: string | null; club: string; category: string | null };
type Sponsor = { id: string; name: string; status: string | null; provides: string[]; what: string; open: string; intro: boolean };
type Machine = { id: string; name: string; club: string; country: string; category: string; capabilities: string };
type Upload = { id: string; name: string };

const KINDS = ["Hardware", "Compute", "Manufacturing", "Sponsoring", "Hardware loan offer"] as const;
const DEFAULT_PLATFORMS = ["AWS", "Brev", "Project X", "Other"];

export default function Page() {
  const [hardware, setHardware] = useState<HW[]>([]);
  const [clubHardware, setClubHardware] = useState<ClubHW[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [f, setF] = useState<any>({
    kind: "", email: "", whatsapp: "", club: "", clubOther: "", contact: "",
    requesterCity: "",
    hardwareFor: "", requestedHardware: [], hardwareWishlist: "", neededBy: "", ackTransport: false,
    isHackathon: "", eventDate: "", expectedVisitors: "", hackathonWhatToDo: "",
    projectStatus: "", projectDesc: "", teamSize: "", projectTimeline: "", projectPdf: null,
    computePurpose: "", computeEstimate: "", platformsRanked: DEFAULT_PLATFORMS, computeNeededBy: "", timeframe: "",
    sponsoringInterest: [], whatToSponsor: [], sponsoringDetails: "",
    loanName: "", loanDesc: "", loanWhy: "", loanLimits: "",
    manufacturingMachine: [], material: "", manufacturingQuantity: "", manufacturingDetails: "",
    designFiles: [], ackMaterialOnly: false, neededByManufacturing: "",
  });
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const toggle = (k: string, v: string) =>
    setF((p: any) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x: string) => x !== v) : [...p[k], v] }));

  useEffect(() => {
    fetch("/api/options")
      .then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setHardware(d.hardware || []); setClubHardware(d.clubHardware || []); setSponsors(d.sponsors || []); setMachines(d.manufacturing || []); })
      .catch((e) => setError(String(e)))
      .finally(() => setLoadingOpts(false));
  }, []);

  // hardware item picker
  const selectedIds = f.requestedHardware.map((i: any) => i.id);
  function addItem(id: string) {
    const h = hardware.find((x) => x.id === id) || clubHardware.find((x) => x.id === id);
    if (!h || selectedIds.includes(id)) return;
    set("requestedHardware", [...f.requestedHardware, { id: h.id, name: h.name, reason: "" }]);
  }
  function setReason(id: string, reason: string) {
    set("requestedHardware", f.requestedHardware.map((i: any) => (i.id === id ? { ...i, reason } : i)));
  }
  function removeItem(id: string) {
    set("requestedHardware", f.requestedHardware.filter((i: any) => i.id !== id));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (f.kind === "Hardware" && !f.ackTransport) {
      setError("Please acknowledge the transportation fee to continue.");
      return;
    }
    if (f.kind === "Manufacturing" && !f.ackMaterialOnly) {
      setError("Please acknowledge the material-cost arrangement to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...f,
        club: f.club === OTHER_CLUB ? f.clubOther : f.club,
        teamSize: f.teamSize ? Number(f.teamSize) : undefined,
        expectedVisitors: f.expectedVisitors ? Number(f.expectedVisitors) : undefined,
        manufacturingQuantity: f.manufacturingQuantity ? Number(f.manufacturingQuantity) : undefined,
      };
      const res = await fetch("/api/submit", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Submission failed");
      setDone(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="card">
        <img src="/esra-logo.png" alt="ESRA" className="logo" />
        <h1>Request received ✓</h1>
        <p className="lead">Thanks — your request is now with the ESRA committee. We&apos;ll reach out via email or WhatsApp.</p>
        <button className="btn" onClick={() => { window.location.reload(); }}>Submit another</button>
      </main>
    );
  }

  return (
    <main className="card">
      <img src="/esra-logo.png" alt="ESRA" className="logo" />
      <h1>ESRA Requests</h1>
      <p className="lead">
        For ESRA member clubs: request hardware, compute, or a sponsor introduction — or offer hardware your club isn&apos;t
        using. A committee member will follow up. Questions? Email info@studentrobotics.eu.
      </p>

      <form onSubmit={submit}>
        <label className="q">What would you like to do?<span className="req">*</span></label>
        <div className="pills">
          {KINDS.map((k) => (
            <button type="button" key={k} className={`pill ${f.kind === k ? "on" : ""}`} onClick={() => set("kind", k)}>{k}</button>
          ))}
        </div>

        {f.kind && (
          <>
            <Field label="Your email" req><input type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="Phone number"><input type="tel" placeholder="+41 ..." value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></Field>
            <Field label="Club / organization" req>
              <select className="dropdown" required value={f.club} onChange={(e) => setF((p: any) => ({ ...p, club: e.target.value, requesterCity: cityOfClub(e.target.value) }))}>
                <option value="">Select your club…</option>
                {CLUBS.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
            {f.club === OTHER_CLUB && <Field label="Your club / organization name" req><input required value={f.clubOther} onChange={(e) => set("clubOther", e.target.value)} /></Field>}
            <Field label="Contact person"><input value={f.contact} onChange={(e) => set("contact", e.target.value)} /></Field>
          </>
        )}

        {/* HARDWARE */}
        {f.kind === "Hardware" && (
          <section>
            <h2>Hardware request</h2>
            <Field label="Is this for a project or an event?" req>
              <Radio options={["Project", "Event"]} value={f.hardwareFor} onChange={(v) => setF((p: any) => ({ ...p, hardwareFor: v, requestedHardware: [] }))} />
            </Field>

            {f.hardwareFor && (
              <>
                <label className="q">{f.hardwareFor === "Event" ? "Borrow hardware from ESRA member clubs" : "Select ESRA-owned hardware"}</label>
                {f.hardwareFor === "Event"
                  ? <p className="muted note">{f.requesterCity ? <>★ = near <strong>{f.requesterCity}</strong> (≤6h by train — quick pickup &amp; return). </> : "Pick your club above to see what's nearby. "}🟢 available · 🟠 on special request · 🔴 unavailable.</p>
                  : <p className="muted note">For projects we provide ESRA-owned hardware. 🟢 = available.</p>}
                {loadingOpts ? <p className="muted">Loading…</p> : (() => {
                  const dot = (a: string | null) => a === "Available" ? "🟢" : a === "On special request" ? "🟠" : a === "Unavailable" ? "🔴" : "⚪";
                  if (f.hardwareFor === "Event") {
                    const avail = clubHardware.filter((h) => !selectedIds.includes(h.id));
                    const label = (h: ClubHW, near: boolean) => `${near ? "★ " : ""}${dot(h.availability)} ${h.name}${h.quantity != null ? ` (×${h.quantity})` : ""}${h.city ? ` — ${h.city}` : ""}${h.club ? ` · ${h.club}` : ""}`;
                    const rec = f.requesterCity ? avail.filter((h) => h.city && isNearby(f.requesterCity, h.city)) : [];
                    const other = avail.filter((h) => !rec.includes(h));
                    return (
                      <select className="dropdown" value="" onChange={(e) => { addItem(e.target.value); e.target.value = ""; }}>
                        <option value="">+ Add hardware to borrow…</option>
                        {rec.length > 0 && <optgroup label={`★ Recommended — near ${f.requesterCity}`}>{rec.map((h) => <option key={h.id} value={h.id}>{label(h, true)}</option>)}</optgroup>}
                        {other.length > 0 && <optgroup label={f.requesterCity ? "Other clubs (further away)" : "All club hardware"}>{other.map((h) => <option key={h.id} value={h.id}>{label(h, false)}</option>)}</optgroup>}
                      </select>
                    );
                  }
                  const availP = hardware.filter((h) => !selectedIds.includes(h.id));
                  return (
                    <select className="dropdown" value="" onChange={(e) => { addItem(e.target.value); e.target.value = ""; }}>
                      <option value="">+ Add ESRA hardware…</option>
                      {availP.map((h) => <option key={h.id} value={h.id}>{`🟢 ${h.name}${h.quantity != null ? ` (×${h.quantity})` : ""}`}</option>)}
                    </select>
                  );
                })()}
              </>
            )}
            {f.requestedHardware.length > 0 && (
              <div className="items">
                {f.requestedHardware.map((i: any) => (
                  <div key={i.id} className="item">
                    <div className="item-head">
                      <strong>{i.name}</strong>
                      <button type="button" className="link" onClick={() => removeItem(i.id)}>remove</button>
                    </div>
                    <input placeholder="Why do you need this / what will you use it for?" value={i.reason} onChange={(e) => setReason(i.id, e.target.value)} />
                  </div>
                ))}
              </div>
            )}

            <p className="muted note">Not on the list? Describe what you&apos;d like and the quantities below — we&apos;ll make the connection to make it happen.</p>
            <textarea value={f.hardwareWishlist} onChange={(e) => set("hardwareWishlist", e.target.value)} placeholder="e.g. 2x RPLIDAR A2, 3x Jetson Orin Nano" />

            <Field label="Needed by"><input type="date" value={f.neededBy} onChange={(e) => set("neededBy", e.target.value)} /></Field>

            {f.hardwareFor === "Event" && (
              <>
                <Field label="Is it a hackathon?"><Radio options={["Yes", "No"]} value={f.isHackathon} onChange={(v) => set("isHackathon", v)} /></Field>
                {f.isHackathon && <Field label="Event date"><input type="date" value={f.eventDate} onChange={(e) => set("eventDate", e.target.value)} /></Field>}
                {f.isHackathon === "Yes" && (
                  <>
                    <Field label="Expected number of visitors"><input type="number" min="0" value={f.expectedVisitors} onChange={(e) => set("expectedVisitors", e.target.value)} /></Field>
                    <Field label="What would you like to do with the hardware at the hackathon?"><textarea value={f.hackathonWhatToDo} onChange={(e) => set("hackathonWhatToDo", e.target.value)} /></Field>
                  </>
                )}
              </>
            )}
            {f.hardwareFor === "Project" && (
              <>
                <Field label="Is the project existing or newly started?"><Radio options={["Existing", "Newly started"]} value={f.projectStatus} onChange={(v) => set("projectStatus", v)} /></Field>
                <Field label="What is the project trying to do? (2 sentences)"><textarea value={f.projectDesc} onChange={(e) => set("projectDesc", e.target.value)} /></Field>
                <Field label="Team size"><input type="number" min="1" value={f.teamSize} onChange={(e) => set("teamSize", e.target.value)} /></Field>
                <Field label="Project timeline"><input value={f.projectTimeline} onChange={(e) => set("projectTimeline", e.target.value)} /></Field>
                <Field label="Attach a PDF describing the project (optional)"><PdfUpload value={f.projectPdf} onChange={(v) => set("projectPdf", v)} /></Field>
              </>
            )}

            <label className="check ack">
              <input type="checkbox" checked={f.ackTransport} onChange={(e) => set("ackTransport", e.target.checked)} />
              <span>I understand the requesting club is expected to cover the transportation fee.<span className="req">*</span></span>
            </label>
          </section>
        )}

        {/* COMPUTE */}
        {f.kind === "Compute" && (
          <section>
            <h2>Compute request</h2>
            <Field label="What exactly would you use the compute for?" req><textarea required value={f.computePurpose} onChange={(e) => set("computePurpose", e.target.value)} /></Field>
            <Field label="Rough estimate of the compute you'd need"><textarea value={f.computeEstimate} onChange={(e) => set("computeEstimate", e.target.value)} placeholder="e.g. ~200 GPU-hours on an A100" /></Field>
            <label className="q">Rank the platforms you could use — drag to reorder (top = most preferred)</label>
            <RankList items={f.platformsRanked} onChange={(v) => set("platformsRanked", v)} />
            <Field label="By when do you need this?"><input type="date" value={f.computeNeededBy} onChange={(e) => set("computeNeededBy", e.target.value)} /></Field>
            <Field label="For how long, and any timing context"><input value={f.timeframe} onChange={(e) => set("timeframe", e.target.value)} placeholder="e.g. for 3 weeks starting June, flexible" /></Field>
            <Field label="Attach a PDF describing the project (optional)"><PdfUpload value={f.projectPdf} onChange={(v) => set("projectPdf", v)} /></Field>
          </section>
        )}

        {/* MANUFACTURING */}
        {f.kind === "Manufacturing" && (
          <section>
            <h2>Manufacturing request</h2>
            <p className="muted">Member clubs that offer their machines as a service are listed below. Pick the machine/club you&apos;d like to make your part, upload your design, and we&apos;ll connect you. Usually you only pay for the <strong>material</strong>, not the machining — though it depends on the job.</p>
            <label className="q">Which machine / club would you like to use?</label>
            {loadingOpts ? <p className="muted">Loading machines…</p> :
              machines.length === 0 ? <p className="muted">No machines are currently offered as a service. Leave this blank and describe your request below — we&apos;ll try to match you.</p> : (
              <select className="dropdown" value="" onChange={(e) => { const id = e.target.value; if (id && !f.manufacturingMachine.includes(id)) set("manufacturingMachine", [...f.manufacturingMachine, id]); e.target.value = ""; }}>
                <option value="">+ Add a machine… (or leave blank for ESRA to match)</option>
                {machines.filter((m) => !f.manufacturingMachine.includes(m.id)).map((m) => (
                  <option key={m.id} value={m.id}>{m.name}{m.club ? ` — ${m.club}` : ""}{m.country ? `, ${m.country}` : ""}</option>
                ))}
              </select>
            )}
            {f.manufacturingMachine.length > 0 && (
              <div className="sponsors">
                {machines.filter((m) => f.manufacturingMachine.includes(m.id)).map((m) => (
                  <div key={m.id} className="sponsor on">
                    <div>
                      <div className="sponsor-name">{m.name} {m.category ? <span className="tag">{m.category}</span> : null}</div>
                      <div className="sponsor-text">{m.club}{m.country ? `, ${m.country}` : ""}</div>
                      {m.capabilities ? <div className="sponsor-open">{m.capabilities}</div> : null}
                    </div>
                    <button type="button" className="link" onClick={() => set("manufacturingMachine", f.manufacturingMachine.filter((x: string) => x !== m.id))}>remove</button>
                  </div>
                ))}
              </div>
            )}

            <Field label="Upload your design file(s)"><MultiUpload value={f.designFiles} onChange={(v) => set("designFiles", v)} /></Field>
            <Field label="Material you'd like it made in"><input value={f.material} onChange={(e) => set("material", e.target.value)} placeholder="e.g. 6061 aluminium, PLA, 3mm acrylic" /></Field>
            <Field label="Quantity"><input type="number" min="1" value={f.manufacturingQuantity} onChange={(e) => set("manufacturingQuantity", e.target.value)} /></Field>
            <Field label="Needed by"><input type="date" value={f.neededByManufacturing} onChange={(e) => set("neededByManufacturing", e.target.value)} /></Field>
            <Field label="Describe the part / any tolerances or finishing notes"><textarea value={f.manufacturingDetails} onChange={(e) => set("manufacturingDetails", e.target.value)} /></Field>

            <label className="check ack">
              <input type="checkbox" checked={f.ackMaterialOnly} onChange={(e) => set("ackMaterialOnly", e.target.checked)} />
              <span>I understand I&apos;m typically expected to cover the material cost (not the machining/labour), depending on the job.<span className="req">*</span></span>
            </label>
          </section>
        )}

        {/* SPONSORING */}
        {f.kind === "Sponsoring" && (
          <section>
            <h2>Sponsoring request</h2>
            <label className="q">Which sponsors would you like an introduction to?</label>
            {loadingOpts ? <p className="muted">Loading sponsors…</p> : (
              <select className="dropdown" value="" onChange={(e) => { const id = e.target.value; if (id && !f.sponsoringInterest.includes(id)) set("sponsoringInterest", [...f.sponsoringInterest, id]); e.target.value = ""; }}>
                <option value="">+ Add a sponsor…</option>
                {sponsors.filter((s) => !f.sponsoringInterest.includes(s.id)).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.status ? ` — ${s.status}` : ""}{s.provides?.length ? ` (${s.provides.join(", ")})` : ""}</option>
                ))}
              </select>
            )}
            {f.sponsoringInterest.length > 0 && (
              <div className="sponsors">
                {sponsors.filter((s) => f.sponsoringInterest.includes(s.id)).map((s) => (
                  <div key={s.id} className="sponsor on">
                    <div>
                      <div className="sponsor-name">{s.name} {s.status ? <span className="tag">{s.status}</span> : null}</div>
                      {s.what ? <div className="sponsor-text">{s.what}</div> : null}
                      {s.open ? <div className="sponsor-open">Open to: {s.open}</div> : null}
                    </div>
                    <button type="button" className="link" onClick={() => set("sponsoringInterest", f.sponsoringInterest.filter((x: string) => x !== s.id))}>remove</button>
                  </div>
                ))}
              </div>
            )}
            <label className="q">What would you like sponsored?</label>
            <div className="checks">
              {["Project", "Hardware", "Compute"].map((w) => (
                <label key={w} className="check"><input type="checkbox" checked={f.whatToSponsor.includes(w)} onChange={() => toggle("whatToSponsor", w)} /><span>{w}</span></label>
              ))}
            </div>
            <Field label="Tell us about the project and what you need sponsored"><textarea value={f.sponsoringDetails} onChange={(e) => set("sponsoringDetails", e.target.value)} /></Field>
            <Field label="Attach a PDF that explains the project better (optional)"><PdfUpload value={f.projectPdf} onChange={(v) => set("projectPdf", v)} /></Field>
          </section>
        )}

        {/* LOAN OFFER */}
        {f.kind === "Hardware loan offer" && (
          <section>
            <h2>Offer hardware to lend out</h2>
            <p className="muted">Have hardware your club isn&apos;t using? Offer it to other ESRA clubs.</p>
            <Field label="Product name" req><input required value={f.loanName} onChange={(e) => set("loanName", e.target.value)} /></Field>
            <Field label="Short description"><textarea value={f.loanDesc} onChange={(e) => set("loanDesc", e.target.value)} placeholder="(Condition of the machine, how long you've used it, any wear or quirks, accessories included, etc.)" /></Field>
            <Field label="Why aren't you using it?"><textarea value={f.loanWhy} onChange={(e) => set("loanWhy", e.target.value)} /></Field>
            <Field label="How long do you think you can lend this out?"><input value={f.loanLimits} onChange={(e) => set("loanLimits", e.target.value)} placeholder="e.g. up to 2 months, this semester" /></Field>
          </section>
        )}

        {error && <p className="error">{error}</p>}
        {f.kind && <button className="btn" disabled={submitting} type="submit">{submitting ? "Submitting…" : "Submit request"}</button>}
      </form>
    </main>
  );
}

function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div className="field">
      <label className="q">{label}{req ? <span className="req">*</span> : null}</label>
      {children}
    </div>
  );
}

function Radio({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="pills small">
      {options.map((o) => (
        <button type="button" key={o} className={`pill ${value === o ? "on" : ""}`} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  );
}

function RankList({ items, onChange }: { items: string[]; onChange: (v: string[]) => void }) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  function move(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return;
    const a = [...items];
    const [x] = a.splice(from, 1);
    a.splice(to, 0, x);
    onChange(a);
  }
  return (
    <ol className="rank">
      {items.map((it, i) => (
        <li
          key={it}
          className="rankrow"
          draggable
          onDragStart={() => setDragIdx(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => { if (dragIdx !== null) move(dragIdx, i); setDragIdx(null); }}
        >
          <span className="rank-num">{i + 1}</span>
          <span className="rank-name">{it}</span>
          <span className="drag" title="drag to reorder">⠿</span>
        </li>
      ))}
    </ol>
  );
}

function MultiUpload({ value, onChange }: { value: Upload[]; onChange: (v: Upload[]) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    setErr(null);
    setBusy(true);
    try {
      const uploaded: Upload[] = [];
      for (const file of list) {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Upload failed");
        uploaded.push({ id: d.id, name: d.name });
      }
      onChange([...value, ...uploaded]);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }
  return (
    <div>
      {value.map((u, i) => (
        <div key={u.id} className="pdf-ok" style={{ marginBottom: 6 }}>📎 {u.name} <button type="button" className="link" onClick={() => onChange(value.filter((_, idx) => idx !== i))}>remove</button></div>
      ))}
      <input type="file" multiple accept=".pdf,.step,.stp,.stl,.iges,.igs,.dxf,.dwg,.zip,.png,.jpg,.jpeg,application/pdf,application/zip" onChange={pick} disabled={busy} />
      {busy && <p className="muted">Uploading…</p>}
      {err && <p className="error">{err}</p>}
    </div>
  );
}

function PdfUpload({ value, onChange }: { value: Upload | null; onChange: (v: Upload | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Upload failed");
      onChange({ id: d.id, name: d.name });
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }
  if (value) {
    return <div className="pdf-ok">📎 {value.name} <button type="button" className="link" onClick={() => onChange(null)}>remove</button></div>;
  }
  return (
    <div>
      <input type="file" accept="application/pdf" onChange={pick} disabled={busy} />
      {busy && <p className="muted">Uploading…</p>}
      {err && <p className="error">{err}</p>}
    </div>
  );
}
