import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useVirtualizer,
} from "@tanstack/react-virtual";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api";

// API Types & Service
interface TicketType {
  _id: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TicketTypesResponse {
  success: boolean;
  message: string;
  data: TicketType[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

interface CreateTicketTypePayload {
  name: string;
  description: string;
}

const getTicketTypes = async () => {
  const response = await apiClient.get<TicketTypesResponse>("/support/ticket-types");
  return response.data;
};

const createTicketType = async (payload: CreateTicketTypePayload) => {
  const response = await apiClient.post("/support/create-ticket-type", payload);
  return response.data;
};

const deleteTicketType = async (id: string) => {
  const response = await apiClient.delete(`/support/delete-ticket-type/${id}`);
  return response.data;
};

export function TicketTypesPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Data Query
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["ticketTypes"],
    queryFn: getTicketTypes,
  });

  const ticketTypes = useMemo(() => response?.data || [], [response]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTicketType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticketTypes"] });
      toast.success("Ticket type created successfully");
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create ticket type");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTicketType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticketTypes"] });
      toast.success("Ticket type deleted successfully");
      setIsDeleteOpen(false);
      setSelectedId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete ticket type");
    },
  });

  // Virtualizer
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: ticketTypes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Approximate row height to fit ~8 rows in 445px
    overscan: 5,
  });

  // Create Form State
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [nameError, setNameError] = useState("");

  const handleCreateOpenChange = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) {
      setCreateForm({ name: "", description: "" });
      setNameError("");
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    
    // Client-side duplicate check
    const isDuplicate = ticketTypes.some(
      (t) => t.name.toLowerCase() === createForm.name.trim().toLowerCase()
    );
    if (isDuplicate) {
      setNameError("A ticket type with this name already exists.");
      return;
    }
    setNameError("");

    createMutation.mutate({
      name: createForm.name.trim(),
      description: createForm.description.trim(),
    });
  };

  const handleDeleteConfirm = () => {
    if (selectedId) {
      deleteMutation.mutate(selectedId);
    }
  };

  // Virtualizer items
  const { getVirtualItems, getTotalSize } = rowVirtualizer;
  const virtualItems = getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? getTotalSize() - virtualItems[virtualItems.length - 1].end
      : 0;

  return (
    <div className="h-full flex flex-col p-8 space-y-6">
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Ticket Types</h1>
          <p className="text-muted-foreground">
            Manage the categories available for support tickets.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            disabled={!selectedId}
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>

          <Dialog open={isCreateOpen} onOpenChange={handleCreateOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Ticket Type
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateSubmit}>
                <DialogHeader>
                  <DialogTitle>Add Ticket Type</DialogTitle>
                  <DialogDescription>
                    Create a new category for support tickets. Name must be unique.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={createForm.name}
                      onChange={(e) => {
                        setCreateForm({ ...createForm, name: e.target.value });
                        if (nameError) setNameError("");
                      }}
                      required
                    />
                    {nameError && (
                      <p className="text-sm text-destructive">{nameError}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={createForm.description}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, description: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md bg-background overflow-hidden">
        <div
          ref={parentRef}
          className="max-h-[445px] overflow-auto relative w-full"
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
            <div className="flex flex-col items-center justify-center h-40 text-destructive gap-2">
              <AlertCircle className="h-8 w-8" />
              <p>Failed to load ticket types</p>
            </div>
          ) : ticketTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <p>No ticket types found.</p>
            </div>
          ) : (
            <table className="w-full caption-bottom text-sm text-left border-collapse">
              <TableHeader className="sticky top-0 z-10 shadow-sm bg-background">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px] bg-background"></TableHead>
                  <TableHead className="bg-background">Name</TableHead>
                  <TableHead className="bg-background">Description</TableHead>
                  <TableHead className="bg-background">Slug</TableHead>
                  <TableHead className="bg-background">Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paddingTop > 0 && (
                  <tr>
                    <td style={{ height: `${paddingTop}px` }} />
                  </tr>
                )}
                {virtualItems.map((virtualRow) => {
                  const item = ticketTypes[virtualRow.index];
                  const isSelected = selectedId === item._id;

                  return (
                    <TableRow
                      key={item._id}
                      data-state={isSelected ? "selected" : undefined}
                      className="cursor-pointer"
                      onClick={() =>
                        setSelectedId(isSelected ? null : item._id)
                      }
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            setSelectedId(isSelected ? null : item._id)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="max-w-[300px] truncate" title={item.description}>
                        {item.description}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {item.slug}
                      </TableCell>
                      <TableCell>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {paddingBottom > 0 && (
                  <tr>
                    <td style={{ height: `${paddingBottom}px` }} />
                  </tr>
                )}
              </TableBody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              ticket type.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
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
    </div>
  );
}
