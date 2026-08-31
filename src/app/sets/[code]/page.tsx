import { notFound } from "next/navigation";
import { getLegalSets } from "@/lib/cards";
import SetBrowser from "./set-browser";

export function generateStaticParams() {
  return getLegalSets().map((s) => ({ code: s.code }));
}

export default async function SetPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const set = getLegalSets().find(
    (s) => s.code.toUpperCase() === code.toUpperCase(),
  );
  if (!set) notFound();
  return <SetBrowser code={set.code} />;
}
