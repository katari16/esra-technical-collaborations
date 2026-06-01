import { NextResponse } from "next/server";
import {
  DS, queryDataSource, getTitle, getNum, getSelect, getMulti, getRich, getCheck,
} from "@/lib/notion";

export const dynamic = "force-dynamic";

// Live read of available hardware + sponsors, straight from Notion.
export async function GET() {
  try {
    const hw = await queryDataSource(DS.catalog, {
      filter: { property: "Available for request", checkbox: { equals: true } },
      page_size: 100,
    });
    const hardware = hw.results.map((p: any) => ({
      id: p.id,
      name: getTitle(p, "Item"),
      quantity: getNum(p, "Quantity"),
      owner: getRich(p, "Owner / club"),
      city: getSelect(p, "City"),
    }));

    const sp = await queryDataSource(DS.sponsors, { page_size: 100 });
    const sponsors = sp.results
      .map((p: any) => ({
        id: p.id,
        name: getTitle(p, "Partnership") || getTitle(p, "Sponsor"),
        status: getSelect(p, "Status"),
        provides: getMulti(p, "Contribution Type") || getMulti(p, "Provides"),
        what: getRich(p, "Summary") || getRich(p, "What they provide"),
        open: getRich(p, "Open to provide"),
        intro: getCheck(p, "Intro available"),
      }))
      // never expose amounts; only show sponsors we can actually act on
      .filter((s: any) => s.name);

    // club-owned hardware (from Club Inventory) — only items a club flagged as loanable
    const ch = await queryDataSource(DS.inventory, {
      filter: { property: "Loanable", checkbox: { equals: true } },
      page_size: 100,
    });
    const clubHardware = ch.results
      .map((p: any) => ({
        id: p.id,
        name: getTitle(p, "Equipment"),
        city: getRich(p, "City"),
        quantity: getNum(p, "Quantity"),
        availability: getSelect(p, "Availability"),
        club: getRich(p, "Club / organization"),
        category: getSelect(p, "Category"),
      }))
      .filter((m: any) => m.name);

    // manufacturing machines that clubs offer as a service (from Club Inventory)
    const mf = await queryDataSource(DS.inventory, {
      filter: { property: "Offering", multi_select: { contains: "Offer as a service" } },
      page_size: 100,
    });
    const manufacturing = mf.results
      .map((p: any) => ({
        id: p.id,
        name: getTitle(p, "Equipment"),
        club: getRich(p, "Club / organization"),
        country: getRich(p, "Country"),
        category: getSelect(p, "Category"),
        capabilities: getRich(p, "Service capabilities"),
      }))
      .filter((m: any) => m.name);

    return NextResponse.json({ hardware, clubHardware, sponsors, manufacturing });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
