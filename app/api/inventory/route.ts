import { NextResponse } from "next/server";
import { DS, createPage, title, text, select, multi, number, email, phone } from "@/lib/notion";

export const dynamic = "force-dynamic";

type InvItem = {
  name: string;
  category?: string;
  model?: string;
  quantity?: number;
  condition?: string;
  offering?: string[];
  serviceCapabilities?: string;
  notes?: string;
};

type Body = {
  club: string;
  contact?: string;
  email: string;
  phoneNumber?: string;
  country?: string;
  city?: string;
  items: InvItem[];
};

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Body;
    if (!b.club) return NextResponse.json({ error: "Club is required" }, { status: 400 });
    if (!b.email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    const items = (b.items || []).filter((i) => i.name?.trim());
    if (items.length === 0) return NextResponse.json({ error: "Add at least one item" }, { status: 400 });

    // one Notion row per item, sharing the club/contact info
    const created: string[] = [];
    for (const it of items) {
      const p: Record<string, unknown> = {
        Equipment: title(it.name.trim()),
        "Club / organization": text(b.club),
        Email: email(b.email),
        Status: select("New"),
      };
      if (b.contact) p["Contact name"] = text(b.contact);
      if (b.phoneNumber) p["Phone number"] = phone(b.phoneNumber);
      if (b.country) p["Country"] = text(b.country);
      if (b.city) p["City"] = text(b.city);
      if (it.category) p["Category"] = select(it.category);
      if (it.model) p["Model / details"] = text(it.model);
      if (typeof it.quantity === "number" && !Number.isNaN(it.quantity)) p["Quantity"] = number(it.quantity);
      if (it.condition) p["Condition"] = select(it.condition);
      if (it.offering?.length) p["Offering"] = multi(it.offering);
      if (it.serviceCapabilities) p["Service capabilities"] = text(it.serviceCapabilities);
      if (it.notes) p["Notes"] = text(it.notes);

      const page = await createPage(DS.inventory, p);
      created.push(page.id);
    }

    return NextResponse.json({ ok: true, count: created.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
