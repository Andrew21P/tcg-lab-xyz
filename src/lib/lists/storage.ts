import { deflate, inflate } from "pako";
import type { DeckEntry, DeckList } from "@/lib/types";
import { getCardById } from "@/lib/cards";

const STORAGE_KEY = "tcglab.decklists.v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function saveDeck(list: DeckList): void {
  if (!canUseStorage()) return;
  const all = loadDecks();
  const idx = all.findIndex((d) => d.name === list.name);
  if (idx >= 0) all[idx] = list;
  else all.push(list);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all.map(serializeList)));
}

export function loadDecks(): DeckList[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SerializedList[];
    return parsed.map(hydrateList).filter(Boolean) as DeckList[];
  } catch {
    return [];
  }
}

export function deleteDeck(name: string): void {
  if (!canUseStorage()) return;
  const all = loadDecks().filter((d) => d.name !== name);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all.map(serializeList)));
}

type SerializedList = {
  name: string;
  archetypeId?: string;
  entries: { count: number; id: string }[];
};

function serializeList(list: DeckList): SerializedList {
  return {
    name: list.name,
    archetypeId: list.archetypeId,
    entries: list.entries.map((e) => ({ count: e.count, id: e.card.id })),
  };
}

function hydrateList(s: SerializedList): DeckList | null {
  const entries: DeckEntry[] = [];
  for (const e of s.entries) {
    const card = getCardById(e.id);
    if (!card) continue;
    entries.push({ count: e.count, card });
  }
  return { name: s.name, archetypeId: s.archetypeId, entries };
}

export type SharePayload = {
  n?: string;
  e: { c: number; id: string }[];
};

export function compressShare(entries: DeckEntry[], name?: string): string {
  const payload: SharePayload = {
    n: name,
    e: entries.map((x) => ({ c: x.count, id: x.card.id })),
  };
  const json = JSON.stringify(payload);
  const compressed = deflate(json);
  return bytesToBase64Url(compressed);
}

export function decompressShare(encoded: string): { name?: string; entries: DeckEntry[] } {
  const bytes = base64UrlToBytes(encoded);
  let json: string;
  try {
    const inflated = inflate(bytes, { toText: true });
    json =
      typeof inflated === "string"
        ? inflated
        : new TextDecoder().decode(inflated as Uint8Array);
  } catch {
    json = new TextDecoder().decode(bytes);
  }
  const payload = JSON.parse(json) as SharePayload;
  const entries: DeckEntry[] = [];
  for (const e of payload.e) {
    const card = getCardById(e.id);
    if (card) entries.push({ count: e.c, card });
  }
  return { name: payload.n, entries };
}

export const encodeShare = compressShare;
export const decodeShare = decompressShare;

function bytesToBase64Url(bytes: Uint8Array): string {
  if (typeof btoa === "function") {
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return Buffer.from(bytes).toString("base64url");
}

function base64UrlToBytes(s: string): Uint8Array {
  if (typeof atob === "function") {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(s, "base64url"));
}
