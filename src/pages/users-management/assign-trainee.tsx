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
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

// --- Types ---

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  traineeId: string | null;
  traineeName: string | null;
  traineeEmail: string | null;
  createdAt: string;
  updatedAt: string;
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
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? totalSize - virtualItems[virtualItems.length - 1].end
      : 0;



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
      <div className="rounded-md border bg-background overflow-hidden">
        <div
          ref={parentRef}
          className="max-h-[500px] overflow-auto relative w-full"
        >
          {isUsersLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <Users className="h-10 w-10 mb-2 opacity-20" />
              <p>No users found</p>
            </div>
          ) : (
            <table className="w-full caption-bottom text-sm border-collapse table-fixed">
              <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[25%] bg-background py-2">Individual Learner</TableHead>
                  <TableHead className="w-[15%] bg-background py-2">Email Verified</TableHead>
                  <TableHead className="w-[25%] bg-background py-2">Assigned Trainee</TableHead>
                  <TableHead className="w-[20%] bg-background py-2">Status</TableHead>
                  <TableHead className="w-[15%] bg-background py-2 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paddingTop > 0 && (
                  <TableRow style={{ height: `${paddingTop}px` }}>
                    <TableCell colSpan={5} />
                  </TableRow>
                )}
                {virtualItems.map((virtualItem) => {
                  const user = users[virtualItem.index];
                  const isSelected = selectedUserId === user.id;
                  const isAssigned = !!user.traineeId;

                  return (
                    <TableRow
                      key={user.id}
                      data-index={virtualItem.index}
                      className={`w-full cursor-pointer hover:bg-muted/50 ${isSelected ? "bg-muted/50" : ""}`}
                      onClick={() => handleRowClick(user.id)}
                    >
                      <TableCell className="w-[25%] py-2">
                        <div className="flex flex-col truncate">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="w-[15%] py-2">
                        {user.emailVerified ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="w-[25%] py-2">
                        <div className="flex flex-col truncate">
                          {isAssigned ? (
                            <>
                              <span className="font-medium">{user.traineeName}</span>
                              <span className="text-xs text-muted-foreground">{user.traineeEmail}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground italic">Not Assigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="w-[20%] py-2">
                        {isAssigned ? (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 shadow-none border-transparent">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Assigned
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted shadow-none">
                            Unassigned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="w-[15%] py-2 text-right">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openAssignDialog(user); }}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                {isAssigned ? "Change Trainee" : "Assign Trainee"}
                              </DropdownMenuItem>
                              {isAssigned && (
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openViewDialog(user); }}>
                                  <UserIcon className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {paddingBottom > 0 && (
                  <TableRow style={{ height: `${paddingBottom}px` }}>
                    <TableCell colSpan={5} />
                  </TableRow>
                )}
              </TableBody>
            </table>
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
