import { ShortsManager } from "./shorts-manager";

export function DraftShortsPage() {
  return <ShortsManager pageTitle="Draft Shorts" defaultStatus="draft" hideAddButton={true} />;
}
