import { NextResponse } from "next/server";
import {
  DS, createPage, title, text, select, multi, number, checkbox, date, email, phone, relation, files,
} from "@/lib/notion";

export const dynamic = "force-dynamic";

type Item = { id: string; name: string; reason?: string };
type Upload = { id: string; name: string };

type Body = {
  kind: string;
  email: string;
  whatsapp: string;
  club: string;
  contact?: string;
  // hardware
  requesterCity?: string;
  hardwareFor?: string;
  requestedHardware?: Item[];
  hardwareWishlist?: string;
  neededBy?: string;
  ackTransport?: boolean;
  // event / hackathon
  isHackathon?: string;
  eventDate?: string;
  expectedVisitors?: number;
  hackathonWhatToDo?: string;
  // project
  projectStatus?: string;
  projectDesc?: string;
  teamSize?: number;
  projectTimeline?: string;
  projectPdf?: Upload | null;
  // compute
  computePurpose?: string;
  computeEstimate?: string;
  platformsRanked?: string[];
  computeNeededBy?: string;
  timeframe?: string;
  // sponsoring
  sponsoringInterest?: string[];
  whatToSponsor?: string[];
  sponsoringDetails?: string;
  // loan
  loanName?: string;
  loanDesc?: string;
  loanWhy?: string;
  loanLimits?: string;
  // manufacturing
  manufacturingMachine?: string[];
  material?: string;
  manufacturingQuantity?: number;
  manufacturingDetails?: string;
  designFiles?: Upload[];
  ackMaterialOnly?: boolean;
  neededByManufacturing?: string;
};

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Body;
    if (!b.kind) return NextResponse.json({ error: "Missing request kind" }, { status: 400 });
    if (!b.email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const p: Record<string, unknown> = {
      Request: title(`${b.club || "Request"} — ${b.kind}`),
      "Request kind": select(b.kind),
      Email: email(b.email),
      Status: select("New"),
    };
    if (b.whatsapp) p["Phone number"] = phone(b.whatsapp);
    if (b.club) p["Club / organization"] = text(b.club);
    if (b.contact) p["Contact person"] = text(b.contact);
    if (b.projectPdf?.id) p["Project PDF"] = files([b.projectPdf]);

    if (b.kind === "Hardware") {
      if (b.requesterCity) p["Requester city"] = select(b.requesterCity);
      if (b.hardwareFor) p["Hardware for"] = select(b.hardwareFor);
      const items = b.requestedHardware ?? [];
      if (items.length) {
        // Event hardware comes from club inventory; project hardware from the ESRA catalog
        const relProp = b.hardwareFor === "Event" ? "Requested club hardware" : "Requested hardware";
        p[relProp] = relation(items.map((i) => i.id));
        const reasons = items.filter((i) => i.reason?.trim()).map((i) => `${i.name}: ${i.reason!.trim()}`).join("\n");
        if (reasons) p["Why each item is needed"] = text(reasons);
      }
      if (b.hardwareWishlist) p["Hardware requested (item + amount)"] = text(b.hardwareWishlist);
      if (b.neededBy) p["Needed by"] = date(b.neededBy);
      if (typeof b.ackTransport === "boolean") p["Acknowledge transportation fee"] = checkbox(b.ackTransport);

      if (b.hardwareFor === "Event") {
        if (b.isHackathon) p["Is it a hackathon?"] = select(b.isHackathon);
        if (b.eventDate) p["Event / deadline"] = date(b.eventDate);
        if (b.isHackathon === "Yes") {
          if (typeof b.expectedVisitors === "number" && !Number.isNaN(b.expectedVisitors))
            p["Expected number of visitors"] = number(b.expectedVisitors);
          if (b.hackathonWhatToDo) p["What you'd like to do"] = text(b.hackathonWhatToDo);
        }
      }
      if (b.hardwareFor === "Project") {
        if (b.projectStatus) p["Project status"] = select(b.projectStatus);
        if (b.projectDesc) p["Project description (2 sentences)"] = text(b.projectDesc);
        if (typeof b.teamSize === "number" && !Number.isNaN(b.teamSize)) p["Team size"] = number(b.teamSize);
        if (b.projectTimeline) p["Project timeline"] = text(b.projectTimeline);
      }
    }

    if (b.kind === "Compute") {
      if (b.computePurpose) p["Compute purpose"] = text(b.computePurpose);
      if (b.computeEstimate) p["Estimated compute needs"] = text(b.computeEstimate);
      if (b.platformsRanked?.length) {
        p["Platforms considered"] = multi(b.platformsRanked);
        p["Preferred platforms (ranked)"] = text(b.platformsRanked.map((pl, i) => `${i + 1}) ${pl}`).join("  "));
      }
      if (b.computeNeededBy) p["Needed by"] = date(b.computeNeededBy);
      if (b.timeframe) p["Timeframe"] = text(b.timeframe);
    }

    if (b.kind === "Sponsoring") {
      if (b.sponsoringInterest?.length) p["Partnership interest"] = relation(b.sponsoringInterest);
      if (b.whatToSponsor?.length) p["What to sponsor"] = multi(b.whatToSponsor);
      if (b.sponsoringDetails) p["Sponsoring details"] = text(b.sponsoringDetails);
    }

    if (b.kind === "Manufacturing") {
      if (b.manufacturingMachine?.length) p["Manufacturing machine"] = relation(b.manufacturingMachine);
      if (b.material) p["Material"] = text(b.material);
      if (typeof b.manufacturingQuantity === "number" && !Number.isNaN(b.manufacturingQuantity)) p["Manufacturing quantity"] = number(b.manufacturingQuantity);
      if (b.manufacturingDetails) p["Manufacturing details"] = text(b.manufacturingDetails);
      if (b.designFiles?.length) p["Design files"] = files(b.designFiles);
      if (b.neededByManufacturing) p["Needed by"] = date(b.neededByManufacturing);
      if (typeof b.ackMaterialOnly === "boolean") p["Acknowledge material-only"] = checkbox(b.ackMaterialOnly);
    }

    if (b.kind === "Hardware loan offer") {
      if (b.loanName) p["Loan: product name"] = text(b.loanName);
      if (b.loanDesc) p["Loan: short description"] = text(b.loanDesc);
      if (b.loanWhy) p["Loan: why not using it"] = text(b.loanWhy);
      if (b.loanLimits) p["Loan: time limits for lending"] = text(b.loanLimits);
    }

    const page = await createPage(DS.requests, p);
    return NextResponse.json({ ok: true, id: page.id });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
