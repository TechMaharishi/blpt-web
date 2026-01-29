import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useVirtualizer,
} from "@tanstack/react-virtual";
import {
  CheckCircle2,
  Loader2,
  MoreHorizontal,
  Search,
  User as UserIcon,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

// --- Types ---

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  traineeId: string | null;
  traineeName: string | null;
  traineeEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Trainee {
  id: string;
  name: string;
  email: string;
}

interface AssignTraineePayload {
  userId: string;
  traineeId: string;
  traineeEmail: string;
  traineeName: string;
}

// --- API Functions ---

const fetchUsers = async ({ page = 1, limit = 100, search = "" }) => {
  const params: any = {
    page,
    limit,
    sortBy: "createdAt",
    sortDirection: "asc",
    role: "user",
    field: "name",
  };
  if (search) {
    params.search = search;
  }
  const response = await apiClient.get("/admin/list-user", { params });
  return response.data.data; // Assuming structure { data: { users: [], meta: {} } }
};

const fetchTrainees = async () => {
  // Fetch users with role 'trainee'
  // Note: The backend might not support filtering by role directly in list-user based on provided curl.
  // We will try to fetch all and filter, or use a specific endpoint if available.
  // Based on prompt, we use list-user. We'll fetch a larger list to find trainees.
  // In a real prod scenario, we'd want a dedicated endpoint or server-side filtering.
  // For now, we'll fetch up to 1000 users and filter client-side as a fallback,
  // or assume the backend supports role filtering if we pass it (common pattern).
  // Let's try passing role=trainee. If not supported, we filter.
  const response = await apiClient.get("/admin/list-user", {
    params: { page: 1, limit: 1000, role: "trainee" },
  });
  
  // If backend ignores 'role' param, we manually filter.
  const users = response.data.data.users || [];
  return users.filter((u: User) => u.role === "trainee");
};

const assignTrainee = async (payload: AssignTraineePayload) => {
  const response = await apiClient.post("/assign-clinical/assign", payload);
  return response.data;
};

// --- Component ---

export default function AssignTraineePage() {
  const queryClient = useQueryClient();
  const parentRef = useRef<HTMLDivElement>(null);

  // State
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Dialog States
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [actingUser, setActingUser] = useState<User | null>(null);
  const [selectedTraineeId, setSelectedTraineeId] = useState<string>("");

  // Queries
  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ["users-assignment", search],
    queryFn: () => fetchUsers({ search }),
    // keepPreviousData: true, // Deprecated in v5, use placeholderData if needed, but simple fetch is fine
  });

  const { data: traineesData } = useQuery({
    queryKey: ["trainees-list"],
    queryFn: fetchTrainees,
    staleTime: 5 * 60 * 1000, // Cache trainees for 5 mins
  });

  const users = useMemo(() => usersData?.users || [], [usersData]);

  // Mutations
  const assignMutation = useMutation({
    mutationFn: assignTrainee,
    onSuccess: () => {
      toast.success("Trainee assigned successfully");
      setIsAssignDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users-assignment"] });
      setActingUser(null);
      setSelectedTraineeId("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to assign trainee");
    },
  });

  // Virtualizer
  const rowVirtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Row height
    overscan: 5,
  });

  // Handlers
  const handleRowClick = (userId: string) => {
    if (selectedUserId === userId) {
      setSelectedUserId(null);
    } else {
      setSelectedUserId(userId);
    }
  };

  const openAssignDialog = (user: User) => {
    setActingUser(user);
    setSelectedTraineeId(user.traineeId || "");
    setIsAssignDialogOpen(true);
  };

  const openViewDialog = (user: User) => {
    setActingUser(user);
    setIsViewDialogOpen(true);
  };

  const handleAssignSubmit = () => {
    if (!actingUser || !selectedTraineeId) return;

    const trainee = traineesData?.find((t: User) => t.id === selectedTraineeId);
    if (!trainee) return;

    assignMutation.mutate({
      userId: actingUser.id,
      traineeId: trainee.id,
      traineeEmail: trainee.email,
      traineeName: trainee.name,
    });
  };

  const virtualItems = rowVirtualizer.getVirtualItems();

  // Columns Widths
  const COL_WIDTHS = {
    user: "w-[30%]",
    trainee: "w-[30%]",
    status: "w-[150px]",
    actions: "w-[60px]",
  };

  return (
    <div className="space-y-6 p-8 h-full flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User–Trainee Assignments</h1>
        <p className="text-muted-foreground mt-1">
          Manage clinical trainee assignments for users.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search individual learners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-md border bg-background flex-1 overflow-hidden flex flex-col min-h-[500px]">
        {/* Table Header */}
        <div className="flex items-center border-b bg-muted/50 font-medium text-sm h-10 shrink-0">
          <div className={`${COL_WIDTHS.user} px-4`}>Individual Learner</div>
          <div className={`${COL_WIDTHS.trainee} px-4`}>Assigned Trainee</div>
          <div className={`${COL_WIDTHS.status} px-4`}>Status</div>
          <div className={`${COL_WIDTHS.actions} px-4 text-right`}>Actions</div>
        </div>

        {/* Virtual List */}
        <div
          ref={parentRef}
          className="overflow-auto flex-1 w-full relative"
        >
          {isUsersLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Users className="h-10 w-10 mb-2 opacity-20" />
              <p>No users found</p>
            </div>
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualItems.map((virtualItem) => {
                const user = users[virtualItem.index];
                const isSelected = selectedUserId === user.id;
                const isAssigned = !!user.traineeId;

                return (
                  <div
                    key={user.id}
                    className={`absolute top-0 left-0 w-full flex items-center border-b text-sm transition-colors hover:bg-muted/30 ${
                      isSelected ? "bg-muted/50" : ""
                    }`}
                    style={{
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    onClick={() => handleRowClick(user.id)}
                  >
                    
                    <div className={`${COL_WIDTHS.user} px-4 truncate`}>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>

                    <div className={`${COL_WIDTHS.trainee} px-4 truncate`}>
                      {isAssigned ? (
                        <>
                          <div className="font-medium">{user.traineeName}</div>
                          <div className="text-xs text-muted-foreground">{user.traineeEmail}</div>
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">Not Assigned</span>
                      )}
                    </div>

                    <div className={`${COL_WIDTHS.status} px-4`}>
                      {isAssigned ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 shadow-none border-transparent">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Assigned
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground border-dashed">
                          Unassigned
                        </Badge>
                      )}
                    </div>

                    <div className={`${COL_WIDTHS.actions} px-4 flex justify-end`}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openAssignDialog(user)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            {isAssigned ? "Change Trainee" : "Assign Trainee"}
                          </DropdownMenuItem>
                          {isAssigned && (
                            <DropdownMenuItem onClick={() => openViewDialog(user)}>
                              <UserIcon className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Assign Trainee Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {actingUser?.traineeId ? "Change Assigned Trainee" : "Assign Trainee"}
            </DialogTitle>
            <DialogDescription>
              Select a clinical trainee to assign to this user.
            </DialogDescription>
          </DialogHeader>
          
          {actingUser && (
            <div className="space-y-6 py-4">
              {/* User Info (Read-only) */}
              <div className="rounded-lg border p-4 bg-muted/20">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Selected User</Label>
                <div className="mt-1 font-medium">{actingUser.name}</div>
                <div className="text-sm text-muted-foreground">{actingUser.email}</div>
              </div>

              {/* Trainee Selection */}
              <div className="space-y-3">
                <Label>Select Trainee</Label>
                <Select
                  value={selectedTraineeId}
                  onValueChange={setSelectedTraineeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a trainee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {traineesData?.map((trainee: User) => (
                      <SelectItem key={trainee.id} value={trainee.id}>
                        <div className="flex flex-col text-left">
                          <span>{trainee.name}</span>
                          <span className="text-xs text-muted-foreground">{trainee.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {actingUser.traineeId && (
                   <p className="text-xs text-amber-600 flex items-center mt-2">
                     <Users className="h-3 w-3 mr-1" />
                     Currently assigned to: {actingUser.traineeName}
                   </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
              disabled={assignMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssignSubmit}
              disabled={!selectedTraineeId || assignMutation.isPending || selectedTraineeId === actingUser?.traineeId}
            >
              {assignMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
          </DialogHeader>
          {actingUser && (
            <div className="space-y-6">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Individual Learner</Label>
                <div className="text-lg font-medium">{actingUser.name}</div>
                <div className="text-sm text-muted-foreground">{actingUser.email}</div>
              </div>
              
              <div className="border-t my-4" />

              <div className="space-y-1">
                <Label className="text-muted-foreground">Assigned Trainee</Label>
                <div className="text-lg font-medium text-emerald-700">{actingUser.traineeName}</div>
                <div className="text-sm text-muted-foreground">{actingUser.traineeEmail}</div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">ID: {actingUser.traineeId}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
