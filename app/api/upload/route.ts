import { NextResponse } from "next/server";
import { NOTION, VER, notionToken } from "@/lib/notion";

export const dynamic = "force-dynamic";
const MAX_BYTES = 20 * 1024 * 1024; // Notion single-part limit

// Accepts a PDF, uploads it to Notion, returns the file_upload id to attach on submit.
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "Max 20 MB" }, { status: 400 });
    const contentType = file.type || "application/octet-stream";

    const token = notionToken();
    // 1) create the upload
    const createRes = await fetch(`${NOTION}/file_uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Notion-Version": VER, "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, content_type: contentType }),
    });
    if (!createRes.ok) throw new Error(`create upload ${createRes.status}: ${await createRes.text()}`);
    const created = await createRes.json();

    // 2) send the bytes
    const fd = new FormData();
    fd.append("file", new Blob([await file.arrayBuffer()], { type: contentType }), file.name);
    const sendRes = await fetch(created.upload_url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Notion-Version": VER },
      body: fd,
    });
    if (!sendRes.ok) throw new Error(`send upload ${sendRes.status}: ${await sendRes.text()}`);

    return NextResponse.json({ id: created.id, name: file.name });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
