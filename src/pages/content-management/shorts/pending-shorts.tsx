import { ShortsManager } from "./shorts-manager";

export function PendingShortsPage() {
  return (
    <ShortsManager
        pageTitle="Pending Reviews"
        defaultStatus="pending"
        allowedStatuses={["pending", "rejected"]}
        showStatusFilter={true}
        hideAddButton={true}
    />
  );
}
