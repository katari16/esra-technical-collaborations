// Direct Notion REST calls (2025-09-03 data-source API). No SDK, full control of headers.
export const NOTION = "https://api.notion.com/v1";
export const VER = "2025-09-03";

export const DS = {
  requests: process.env.REQUESTS_DS ?? "ac05a66d-eb5a-4fce-9bf5-f41c061c6590",
  sponsors: process.env.SPONSORS_DS ?? "9634147a-5a23-43a3-9498-ff150d9fd945",
  catalog: process.env.CATALOG_DS ?? "207e23c1-8145-445d-8d40-2fd394e62d25",
  inventory: process.env.INVENTORY_DS ?? "6fde129e-7cd3-46dc-8bd9-d724abda9685",
};

function headers() {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN is not set");
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": VER,
    "Content-Type": "application/json",
  };
}

export async function queryDataSource(ds: string, body?: unknown) {
  const res = await fetch(`${NOTION}/data_sources/${ds}/query`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Notion query ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function createPage(ds: string, properties: Record<string, unknown>) {
  const res = await fetch(`${NOTION}/pages`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ parent: { type: "data_source_id", data_source_id: ds }, properties }),
  });
  if (!res.ok) throw new Error(`Notion create ${res.status}: ${await res.text()}`);
  return res.json();
}

/* ---- read helpers ---- */
type Page = { id: string; properties: Record<string, any> };
export const getTitle = (p: Page, k: string) =>
  (p.properties[k]?.title ?? []).map((t: any) => t.plain_text).join("");
export const getRich = (p: Page, k: string) =>
  (p.properties[k]?.rich_text ?? []).map((t: any) => t.plain_text).join("");
export const getNum = (p: Page, k: string) => p.properties[k]?.number ?? null;
export const getSelect = (p: Page, k: string) => p.properties[k]?.select?.name ?? null;
export const getMulti = (p: Page, k: string) =>
  (p.properties[k]?.multi_select ?? []).map((o: any) => o.name);
export const getCheck = (p: Page, k: string) => Boolean(p.properties[k]?.checkbox);

/* ---- write helpers ---- */
export const title = (s: string) => ({ title: [{ type: "text", text: { content: s } }] });
export const text = (s: string) => ({ rich_text: [{ type: "text", text: { content: s } }] });
export const select = (s: string) => ({ select: { name: s } });
export const multi = (arr: string[]) => ({ multi_select: arr.map((name) => ({ name })) });
export const number = (n: number) => ({ number: n });
export const checkbox = (b: boolean) => ({ checkbox: b });
export const date = (s: string) => ({ date: { start: s } });
export const email = (s: string) => ({ email: s });
export const phone = (s: string) => ({ phone_number: s });
export const relation = (ids: string[]) => ({ relation: ids.map((id) => ({ id })) });
export const files = (uploads: { id: string; name: string }[]) => ({
  files: uploads.map((u) => ({ type: "file_upload", name: u.name, file_upload: { id: u.id } })),
});

export function notionToken() {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN is not set");
  return token;
}
