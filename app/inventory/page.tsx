"use client";

import { useState } from "react";

const CATEGORIES = ["Robot", "CNC / milling machine", "Lathe", "3D printer", "Laser cutter", "Other manufacturing machine", "Sensor / electronics", "Compute", "Tool", "Other"];
const CONDITIONS = ["Working", "Needs minor repair", "Not working", "Unknown"];
const OFFERINGS = ["Available to lend (unused)", "For donation", "Offer as a service", "Listing only"];

type Item = {
  name: string; category: string; model: string; quantity: string;
  condition: string; offering: string[]; serviceCapabilities: string; notes: string;
};
const emptyItem = (): Item => ({ name: "", category: "", model: "", quantity: "", condition: "", offering: [], serviceCapabilities: "", notes: "" });

export default function InventoryPage() {
  const [club, setClub] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upd = (i: number, k: keyof Item, v: any) => setItems((p) => p.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const toggleOffer = (i: number, v: string) => setItems((p) => p.map((it, idx) => idx === i ? { ...it, offering: it.offering.includes(v) ? it.offering.filter((x) => x !== v) : [...it.offering, v] } : it));
  const addItem = () => setItems((p) => [...p, emptyItem()]);
  const removeItem = (i: number) => setItems((p) => (p.length === 1 ? p : p.filter((_, idx) => idx !== i)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!items.some((it) => it.name.trim())) { setError("Add at least one item with a name."); return; }
    setSubmitting(true);
    try {
      const payload = {
        club, contact, email, phoneNumber, country, city,
        items: items.filter((it) => it.name.trim()).map((it) => ({
          name: it.name, category: it.category || undefined, model: it.model || undefined,
          quantity: it.quantity ? Number(it.quantity) : undefined, condition: it.condition || undefined,
          offering: it.offering, serviceCapabilities: it.serviceCapabilities || undefined, notes: it.notes || undefined,
        })),
      };
      const res = await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Submission failed");
      setDone(d.count);
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (done !== null) {
    return (
      <main className="card">
        <img src="/esra-logo.png" alt="ESRA" className="logo" />
        <h1>Thanks ✓</h1>
        <p className="lead">{done} item{done === 1 ? "" : "s"} added to the ESRA inventory. This helps clubs across Europe find and share hardware.</p>
        <button className="btn" onClick={() => window.location.reload()}>Add more</button>
      </main>
    );
  }

  return (
    <main className="card">
      <img src="/esra-logo.png" alt="ESRA" className="logo" />
      <h1>ESRA Club Inventory</h1>
      <p className="lead">
        Help ESRA build a Europe-wide picture of the hardware in our member clubs — robots, manufacturing machines (CNC,
        mills, lathes, 3D printers), tools and more. List what your club has, and whether you&apos;d lend it out when unused,
        donate it, or offer it as a service (e.g. CNC machining). Questions? Email info@studentrobotics.eu.
      </p>

      <form onSubmit={submit}>
        <div className="field"><label className="q">Club / organization<span className="req">*</span></label><input required value={club} onChange={(e) => setClub(e.target.value)} /></div>
        <div className="field"><label className="q">Contact name</label><input value={contact} onChange={(e) => setContact(e.target.value)} /></div>
        <div className="field"><label className="q">Email<span className="req">*</span></label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label className="q">Phone number</label><input type="tel" value={phoneNumber} onChange={(e) => setPhone(e.target.value)} /></div>
        <div className="field"><label className="q">Country</label><input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Switzerland" /></div>
        <div className="field"><label className="q">City</label><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Zürich" /></div>

        <h2>Equipment</h2>
        {items.map((it, i) => (
          <div key={i} className="item">
            <div className="item-head">
              <strong>Item {i + 1}</strong>
              {items.length > 1 && <button type="button" className="link" onClick={() => removeItem(i)}>remove</button>}
            </div>
            <div className="field"><label className="q">Name<span className="req">*</span></label><input value={it.name} onChange={(e) => upd(i, "name", e.target.value)} placeholder="e.g. Tormach CNC mill, UR5 arm, Prusa MK4" /></div>
            <div className="field"><label className="q">Category</label>
              <select className="dropdown" value={it.category} onChange={(e) => upd(i, "category", e.target.value)}>
                <option value="">Select a category…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field"><label className="q">Model / details</label><input value={it.model} onChange={(e) => upd(i, "model", e.target.value)} /></div>
            <div className="field"><label className="q">Quantity</label><input type="number" min="1" value={it.quantity} onChange={(e) => upd(i, "quantity", e.target.value)} /></div>
            <div className="field"><label className="q">Condition</label>
              <select className="dropdown" value={it.condition} onChange={(e) => upd(i, "condition", e.target.value)}>
                <option value="">Select…</option>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <label className="q">What are you offering?</label>
            <div className="checks">
              {OFFERINGS.map((o) => (
                <label key={o} className="check"><input type="checkbox" checked={it.offering.includes(o)} onChange={() => toggleOffer(i, o)} /><span>{o}</span></label>
              ))}
            </div>
            {it.offering.includes("Offer as a service") && (
              <div className="field"><label className="q">Service capabilities</label><textarea value={it.serviceCapabilities} onChange={(e) => upd(i, "serviceCapabilities", e.target.value)} placeholder="e.g. CNC milling up to 300×200mm, aluminium & plastics; turnaround ~1 week" /></div>
            )}
            <div className="field"><label className="q">Notes</label><textarea value={it.notes} onChange={(e) => upd(i, "notes", e.target.value)} /></div>
          </div>
        ))}

        <button type="button" className="pill" onClick={addItem} style={{ marginTop: 12 }}>+ Add another item</button>

        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={submitting} type="submit">{submitting ? "Submitting…" : "Submit inventory"}</button>
      </form>
    </main>
  );
}
