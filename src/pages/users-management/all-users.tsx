import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { toast } from "sonner";
import { 
  Loader2, Trash2, Plus, MoreHorizontal, Copy, Edit, Shield, Ban, Lock, CheckCircle, 
  Search, ArrowUpDown, ChevronLeft, ChevronRight, Filter 
} from "lucide-react";
import { apiClient } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// --- Types ---

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "trainer" | "trainee" | "user";
  accountType: string;
  emailVerified: boolean;
  banned: boolean;
  createdAt: string;
  phone?: string;
}

interface UsersResponse {
  data: {
    users: User[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

interface FetchUsersParams {
  role?: string;
  search?: string;
  field?: "name" | "email";
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// --- API ---

const fetchUsers = async (params: FetchUsersParams) => {
  // Filter out undefined/null/empty values to keep URL clean
  const queryParams: Record<string, any> = {};
  if (params.role && params.role !== "all") queryParams.role = params.role;
  if (params.search) queryParams.search = params.search;
  if (params.field) queryParams.field = params.field;
  if (params.sortBy) queryParams.sortBy = params.sortBy;
  if (params.sortDirection) queryParams.sortDirection = params.sortDirection;
  if (params.page) queryParams.page = params.page;
  if (params.limit) queryParams.limit = params.limit;

  const response = await apiClient.get<UsersResponse>("/admin/list-user", { params: queryParams });
  return response.data;
};

const deleteUser = async (userId: string) => {
  const response = await apiClient.post("/admin/delete-user", { userId });
  return response.data;
};

const banUser = async (userId: string) => {
  const response = await apiClient.post("/admin/ban-user", { userId });
  return response.data;
};

const unbanUser = async (userId: string) => {
  const response = await apiClient.post("/admin/unban-user", { userId });
  return response.data;
};

const updateUser = async (payload: { userId: string; data: Partial<User> }) => {
  const response = await apiClient.post("/admin/update-user", payload);
  return response.data;
};

const setUserRole = async (payload: { userId: string; role: string }) => {
  const response = await apiClient.post("/admin/set-user-role", payload);
  return response.data;
};

const resetUserPassword = async (payload: { userId: string; newPassword: string }) => {
  const response = await apiClient.post("/admin/reset-user-password", payload);
  return response.data;
};

const createUser = async (payload: any) => {
  const response = await apiClient.post("/admin/create-user", payload);
  return response.data;
};

// --- Helpers ---

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
};

const getRoleBadge = (role: string) => {
  switch (role) {
    case "admin":
      return <Badge className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border-transparent shadow-none">Super Admin</Badge>;
    case "trainer":
      return <Badge className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-transparent shadow-none">Training Admin</Badge>;
    case "trainee":
      return <Badge className="bg-sky-100 hover:bg-sky-200 text-sky-800 border-transparent shadow-none">Clinical Learner</Badge>;
    case "user":
      return <Badge className="bg-slate-100 hover:bg-slate-200 text-slate-800 border-transparent shadow-none">Individual Learner</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
};

export default function AllUsersPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Edit User State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Role Change State
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [roleUser, setRoleUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  
  // Password Reset State
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Add User State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    accountType: "",
    phone: "",
  });

  // Filter, Sort & Pagination State
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<"name" | "email">("name");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const parentRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["users", page, limit, search, searchField, roleFilter, sortBy, sortDirection],
    queryFn: () => fetchUsers({
      page,
      limit,
      search: search || undefined,
      field: searchField,
      role: roleFilter,
      sortBy,
      sortDirection,
    }),
    placeholderData: keepPreviousData,
  });

  const users = data?.data.users || [];
  const meta = data?.data.meta;

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success("User deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedUserId(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete user");
    },
  });

  const banMutation = useMutation({
    mutationFn: banUser,
    onSuccess: () => {
      toast.success("User banned successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to ban user");
    },
  });

  const unbanMutation = useMutation({
    mutationFn: unbanUser,
    onSuccess: () => {
      toast.success("User unbanned successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to unban user");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      toast.success("User updated successfully");
      setIsEditOpen(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update user");
    },
  });

  const roleMutation = useMutation({
    mutationFn: setUserRole,
    onSuccess: () => {
      toast.success("User role updated successfully");
      setIsRoleOpen(false);
      setRoleUser(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update user role");
    },
  });

  const passwordResetMutation = useMutation({
    mutationFn: resetUserPassword,
    onSuccess: () => {
      toast.success("Password reset successfully");
      setIsPasswordResetOpen(false);
      setPasswordResetUser(null);
      setNewPassword("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to reset password");
    },
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success("User created successfully");
      setIsAddUserOpen(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "user",
        accountType: "",
        phone: "",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create user");
    },
  });

  // Virtualizer
  const rowVirtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Reduced row height for compact view
    overscan: 5,
  });

  // Handlers
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const handleSelect = (userId: string) => {
    if (selectedUserId === userId) {
      setSelectedUserId(null);
    } else {
      setSelectedUserId(userId);
    }
  };

  const handleDeleteClick = () => {
    if (selectedUserId) {
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = () => {
    if (selectedUserId) {
      deleteMutation.mutate(selectedUserId);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("User ID copied to clipboard");
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setIsEditOpen(true);
  };

  const handleRoleClick = (user: User) => {
    setRoleUser(user);
    setNewRole(user.role);
    setIsRoleOpen(true);
  };

  const handleBanClick = (user: User) => {
    if (user.banned) {
      unbanMutation.mutate(user.id);
    } else {
      banMutation.mutate(user.id);
    }
  };

  const handlePasswordResetClick = (user: User) => {
    setPasswordResetUser(user);
    setNewPassword("");
    setIsPasswordResetOpen(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    // Construct payload dynamically based on form (simplified here to just name/accountType/phone)
    // In a real form, we'd gather all inputs.
    // For this example, we assume editingUser state is updated via inputs
    updateMutation.mutate({
      userId: editingUser.id,
      data: {
        name: editingUser.name,
        accountType: editingUser.accountType,
        phone: editingUser.phone,
      },
    });
  };

  const handleRoleUpdate = () => {
    if (roleUser && newRole) {
      roleMutation.mutate({ userId: roleUser.id, role: newRole });
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordResetUser && newPassword) {
      passwordResetMutation.mutate({ userId: passwordResetUser.id, newPassword });
    }
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(newUser);
  };

  const { getVirtualItems, getTotalSize } = rowVirtualizer;
  const virtualItems = getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? getTotalSize() - virtualItems[virtualItems.length - 1].end
      : 0;

  return (
    <div className="space-y-6 p-8">
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage system users, roles, and account statuses.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            disabled={!selectedUserId}
            onClick={handleDeleteClick}
            className="w-[100px]"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button className="w-[120px]" onClick={() => setIsAddUserOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8"
            />
          </div>
          <Select
            value={searchField}
            onValueChange={(val: "name" | "email") => {
              setSearchField(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={roleFilter}
            onValueChange={(val) => {
              setRoleFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Role" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Super Admin</SelectItem>
              <SelectItem value="trainer">Training Admin</SelectItem>
              <SelectItem value="trainee">Clinical Learner</SelectItem>
              <SelectItem value="user">Individual Learner</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-md border bg-background overflow-hidden">
        <div
          ref={parentRef}
          className="max-h-[500px] overflow-auto relative w-full"
        >
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex h-40 items-center justify-center text-destructive">
              Error loading users: {(error as any).message}
            </div>
          ) : users.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              No users found.
            </div>
          ) : (
            <table className="w-full caption-bottom text-sm border-collapse table-fixed">
              <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px] bg-background py-2">
                    {/* Empty header for checkbox column */}
                  </TableHead>
                  <TableHead 
                    className="w-[25%] bg-background py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      User Details
                      {sortBy === "name" && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                  </TableHead>
                  <TableHead className="w-[15%] bg-background py-2">Role</TableHead>
                  <TableHead className="w-[15%] bg-background py-2">Account Type</TableHead>
                  <TableHead className="w-[10%] bg-background py-2">Verified</TableHead>
                  <TableHead className="w-[10%] bg-background py-2">Banned</TableHead>
                  <TableHead 
                    className="w-[20%] bg-background py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      Created At
                      {sortBy === "createdAt" && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                  </TableHead>
                  <TableHead className="w-[50px] bg-background py-2"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paddingTop > 0 && (
                  <TableRow style={{ height: `${paddingTop}px` }}>
                    <TableCell colSpan={8} />
                  </TableRow>
                )}
                {virtualItems.map((virtualRow) => {
                  const user = users[virtualRow.index];
                  const isSelected = selectedUserId === user.id;

                  return (
                    <TableRow
                      key={user.id}
                      data-index={virtualRow.index}
                      className="w-full"
                    >
                      <TableCell className="w-[50px] py-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelect(user.id)}
                          aria-label={`Select ${user.name}`}
                        />
                      </TableCell>
                      <TableCell className="w-[25%] py-2">
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="w-[15%] py-2">{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="capitalize w-[15%] py-2">
                        {user.accountType}
                      </TableCell>
                      <TableCell className="w-[10%] py-2">
                        {user.emailVerified ? (
                          <span className="text-green-600 font-medium">Yes</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="w-[10%] py-2">
                        {user.banned ? (
                          <span className="text-destructive font-bold">Yes</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="w-[20%] py-2">{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="w-[50px] py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleCopyId(user.id)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy User ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEditClick(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleClick(user)}>
                              <Shield className="mr-2 h-4 w-4" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBanClick(user)}>
                              {user.banned ? (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Unban User
                                </>
                              ) : (
                                <>
                                  <Ban className="mr-2 h-4 w-4" />
                                  Ban User
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handlePasswordResetClick(user)}
                            >
                              <Lock className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {paddingBottom > 0 && (
                  <TableRow style={{ height: `${paddingBottom}px` }}>
                    <TableCell colSpan={8} />
                  </TableRow>
                )}
              </TableBody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {meta ? (
            <>
              Showing {Math.min((meta.page - 1) * meta.limit + 1, meta.total)} to{" "}
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} users
            </>
          ) : (
            "Loading..."
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 mr-4">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select
              value={limit.toString()}
              onValueChange={(val) => {
                setLimit(Number(val));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={limit} />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!meta?.hasPrev || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm font-medium">
            Page {meta?.page || 1} of {meta?.totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!meta?.hasNext || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUserSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newName">Name</Label>
                <Input
                  id="newName"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newEmail">Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  placeholder="john@example.com"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPasswordInput">Password</Label>
                <Input
                  id="newPasswordInput"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength={8}
                  placeholder="********"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPhone">Phone</Label>
                <Input
                  id="newPhone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  required
                  placeholder="123-456-7890"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newRole">Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(val) => setNewUser({ ...newUser, role: val })}
                >
                  <SelectTrigger id="newRole">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Super Admin</SelectItem>
                    <SelectItem value="trainer">Training Admin</SelectItem>
                    <SelectItem value="trainee">Clinical Learner</SelectItem>
                    <SelectItem value="user">Individual Learner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newAccountType">Account Type</Label>
                <Select
                  value={newUser.accountType}
                  onValueChange={(val) => setNewUser({ ...newUser, accountType: val })}
                >
                  <SelectTrigger id="newAccountType">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="develop">Develop</SelectItem>
                    <SelectItem value="master">Master</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddUserOpen(false)}
                disabled={createUserMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the user
              account and remove their data from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to the user's profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type</Label>
                <Select
                  value={editingUser.accountType}
                  onValueChange={(value) =>
                    setEditingUser({ ...editingUser, accountType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="develop">Develop</SelectItem>
                    <SelectItem value="master">Master</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editingUser.phone || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, phone: e.target.value })
                  }
                  placeholder="e.g. 0412 345 678"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={isRoleOpen} onOpenChange={setIsRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Select a new role for this user. This will update their permissions immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Super Admin</SelectItem>
                  <SelectItem value="trainer">Training Admin</SelectItem>
                  <SelectItem value="trainee">Clinical Learner</SelectItem>
                  <SelectItem value="user">Individual Learner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoleOpen(false)}
              disabled={roleMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRoleUpdate} 
              disabled={roleMutation.isPending}
            >
              {roleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={isPasswordResetOpen} onOpenChange={setIsPasswordResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Reset Password</DialogTitle>
            <DialogDescription>
              This is a sensitive action. The new password will be set immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Enter new password"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordResetOpen(false)}
                disabled={passwordResetMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="destructive"
                disabled={passwordResetMutation.isPending}
              >
                {passwordResetMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Reset Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

