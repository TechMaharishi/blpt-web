
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { toast } from "sonner";
import { Loader2, Trash2, Search, AlertCircle, ArrowUpDown, ChevronLeft, ChevronRight, Plus, Filter } from "lucide-react";
import { apiClient } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// --- Types ---

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  status: "published" | "pending" | "rejected" | "draft";
  accessLevel: string;
  createdBy: User;
  thumbnailUrl: string;
  totalDurationSeconds: number;
  totalQuizzes: number;
  totalChapters: number;
  createdAt: string;
  updatedAt: string;
}

interface CoursesResponse {
  success: boolean;
  message: string;
  data: Course[];
  meta: {
    page: number;
    offset: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

interface CoursesManagerProps {
  pageTitle: string;
  defaultStatus: string; // "published" | "pending" | "draft"
  allowedStatuses?: string[]; // e.g. ["pending", "rejected"]
  showStatusFilter?: boolean;
  hideAddButton?: boolean;
}

// --- Helper Functions ---

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  }
  return `${m}m ${s}s`;
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays <= 7) {
        if (diffDays === 1) return "1 day ago";
        return `${diffDays} days ago`;
    }
    return date.toLocaleDateString();
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "published": return "default"; // Primary color (usually black/dark)
    case "pending": return "secondary"; // Gray/Yellowish depending on theme
    case "rejected": return "destructive"; // Red
    case "draft": return "outline";
    default: return "secondary";
  }
};

// --- API ---

const fetchCourses = async ({ page, limit, status, search, sortBy, sortOrder }: any) => {
  const params: any = {
    page,
    limit,
  };
  
  if (status) params.status = status;
  if (search) params.q = search;
  if (sortBy) params.sortBy = sortBy;
  if (sortOrder) params.order = sortOrder;

  const response = await apiClient.get<CoursesResponse>("/courses", { params });
  return response.data;
};

const deleteCourse = async (id: string) => {
  const response = await apiClient.delete(`/courses/${id}`);
  return response.data;
};

export function CoursesManager({ 
  pageTitle, 
  defaultStatus, 
  allowedStatuses, 
  showStatusFilter,
  hideAddButton
}: CoursesManagerProps) {
  // State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState(defaultStatus);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // Default to 10 to match design, can be 20

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedSearch(search);
        setPage(1); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset selection on filter change
  useEffect(() => {
    setSelectedId(null);
  }, [status, debouncedSearch, page]);

  const parentRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Query with Pagination
  const { data, isLoading, isError } = useQuery({
    queryKey: ["courses", page, limit, status, debouncedSearch, sortBy, sortOrder],
    queryFn: () => fetchCourses({ 
        page, 
        limit, 
        status, 
        search: debouncedSearch,
        sortBy,
        sortOrder
    }),
    placeholderData: keepPreviousData,
  });

  const courses = data?.data || [];
  const meta = data?.meta;
  const totalItems = meta?.total || 0;
  const totalPages = Math.ceil(totalItems / limit);

  // Virtualizer
  const rowVirtualizer = useVirtualizer({
    count: courses.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Adjusted for course row height
    overscan: 5,
  });

  const { getVirtualItems, getTotalSize } = rowVirtualizer;
  const virtualItems = getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? getTotalSize() - virtualItems[virtualItems.length - 1].end
      : 0;

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete course");
    },
  });

  // Handlers
  const handleDeleteClick = () => {
    if (selectedId) setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedId) deleteMutation.mutate(selectedId);
  };

  const handleSelect = (id: string) => {
    setSelectedId(prev => prev === id ? null : id);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
        setSortBy(field);
        setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-6 p-8 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
        <p className="text-muted-foreground mt-1">
          Manage courses
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
             <div className="relative w-full sm:w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search courses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                />
            </div>
            
            {showStatusFilter && allowedStatuses && (
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[150px]">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            <SelectValue placeholder="Status" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {allowedStatuses.map(s => (
                            <SelectItem key={s} value={s} className="capitalize">
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        </div>

        <div className="flex items-center gap-2">
           <Button 
                variant="destructive" 
                disabled={!selectedId} 
                onClick={handleDeleteClick}
                className="w-[100px]"
            >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
            </Button>
            {!hideAddButton && (
                <Button className="w-[140px]">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Course
                </Button>
            )}
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
                    <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="h-8 w-8" />
                        <p>Failed to load courses</p>
                        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["courses"] })}>
                            Retry
                        </Button>
                    </div>
                </div>
             ) : courses.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                    No courses found
                </div>
             ) : (
                <table className="w-full caption-bottom text-sm border-collapse table-fixed">
                    <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[50px] bg-background py-2"></TableHead>
                            <TableHead 
                                className="w-[20%] bg-background py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleSort("title")}
                            >
                                <div className="flex items-center gap-1">
                                    Title
                                    {sortBy === "title" && <ArrowUpDown className="h-3 w-3" />}
                                </div>
                            </TableHead>
                            <TableHead className="w-[10%] bg-background py-2">Status</TableHead>
                            <TableHead className="w-[10%] bg-background py-2">Access</TableHead>
                            <TableHead className="w-[15%] bg-background py-2">Tags</TableHead>
                            <TableHead className="w-[10%] bg-background py-2">Duration</TableHead>
                            <TableHead className="w-[15%] bg-background py-2">Created By</TableHead>
                            <TableHead 
                                className="w-[10%] bg-background py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleSort("createdAt")}
                            >
                                <div className="flex items-center gap-1">
                                    Created At
                                    {sortBy === "createdAt" && <ArrowUpDown className="h-3 w-3" />}
                                </div>
                            </TableHead>
                            <TableHead 
                                className="w-[10%] bg-background py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleSort("updatedAt")}
                            >
                                <div className="flex items-center gap-1">
                                    Updated At
                                    {sortBy === "updatedAt" && <ArrowUpDown className="h-3 w-3" />}
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paddingTop > 0 && (
                            <TableRow style={{ height: `${paddingTop}px` }}>
                                <TableCell colSpan={9} />
                            </TableRow>
                        )}
                        {virtualItems.map((virtualRow) => {
                            const course = courses[virtualRow.index];
                            return (
                                <TableRow 
                                    key={course._id} 
                                    className={`cursor-pointer hover:bg-muted/50 ${selectedId === course._id ? "bg-muted" : ""}`}
                                    data-index={virtualRow.index}
                                    onClick={() => handleSelect(course._id)}
                                >
                                    <TableCell className="py-2">
                                        <Checkbox 
                                            checked={selectedId === course._id}
                                            onCheckedChange={() => handleSelect(course._id)}
                                            onClick={(e) => e.stopPropagation()}
                                            aria-label={`Select ${course.title}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium truncate py-2" title={course.title}>
                                        {course.title}
                                    </TableCell>
                                    <TableCell className="py-2">
                                        <Badge variant={getStatusBadgeVariant(course.status)}>
                                            {course.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-2">
                                        <Badge variant="outline" className="capitalize">
                                            {course.accessLevel}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-2">
                                        <div className="flex flex-col gap-1">
                                            {course.tags.map(tag => (
                                                <Badge key={tag} variant="secondary" className="text-xs w-fit">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground py-2">
                                        {formatDuration(course.totalDurationSeconds)}
                                    </TableCell>
                                    <TableCell className="py-2">
                                        <div className="flex flex-col">
                                            <span className="font-medium truncate" title={course.createdBy?.name || "Unknown"}>
                                                {course.createdBy?.name || "Unknown"}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate" title={course.createdBy?.email}>
                                                {course.createdBy?.email}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground py-2">
                                        {formatDate(course.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground py-2">
                                        {formatDate(course.updatedAt)}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {paddingBottom > 0 && (
                            <TableRow style={{ height: `${paddingBottom}px` }}>
                                <TableCell colSpan={9} />
                            </TableRow>
                        )}
                    </TableBody>
                 </table>
             )}
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
            {isLoading ? (
                "Loading..."
            ) : totalItems > 0 ? (
                <>
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalItems)} of {totalItems} courses
                </>
            ) : (
                "Showing 0 to 0 of 0 courses"
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
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
            >
                <ChevronLeft className="h-4 w-4" />
                Previous
            </Button>
             <div className="text-sm font-medium">
                Page {page} of {totalPages || 1}
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages || isLoading}
            >
                Next
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Delete Course</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete this course? This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                <Button 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                >
                    {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
