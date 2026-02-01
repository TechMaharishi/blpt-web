
import { CoursesManager } from "./courses-manager";

export function PendingCoursesPage() {
  return (
    <CoursesManager 
        pageTitle="Pending Reviews" 
        defaultStatus="pending" 
        allowedStatuses={["pending", "rejected"]}
        showStatusFilter={true}
        hideAddButton={true}
    />
  );
}
