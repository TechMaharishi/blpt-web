import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Search, Tag as TagIcon } from "lucide-react";
import { apiClient } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

// --- Types ---

interface Tag {
  _id: string;
  name: string;
  slug: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface TagsResponse {
  success: boolean;
  message: string;
  data: Tag[];
}

// --- API ---

const fetchTags = async () => {
  const response = await apiClient.get<TagsResponse>("/admin/tags");
  return response.data;
};

const createTag = async (name: string) => {
  const response = await apiClient.post("/admin/create-tags", { name });
  return response.data;
};

const deleteTag = async (id: string) => {
  const response = await apiClient.delete(`/admin/tags/${id}`);
  return response.data;
};

export default function VideoTagsPage() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch Tags
  const { data, isLoading, isError } = useQuery({
    queryKey: ["video-tags"],
    queryFn: fetchTags,
  });

  const tags = data?.data || [];
  
  // Filter tags based on search
  const filteredTags = tags.filter((tag) => 
    tag.name.toLowerCase().includes(search.toLowerCase()) || 
    tag.slug.toLowerCase().includes(search.toLowerCase())
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-tags"] });
      toast.success("Tag created successfully");
      setIsCreateOpen(false);
      setNewTagName("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create tag");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-tags"] });
      toast.success("Tag deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedTagId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete tag");
    },
  });

  // Handlers
  const handleCreate = () => {
    if (!newTagName.trim()) return;
    
    // Validation: Check if exists
    const exists = tags.some(t => t.name.toLowerCase() === newTagName.trim().toLowerCase());
    if (exists) {
      toast.error("A tag with this name already exists");
      return;
    }

    createMutation.mutate(newTagName.trim());
  };

  const handleDeleteClick = () => {
    if (selectedTagId) {
      setIsDeleteDialogOpen(true);
    }
  };

  const handleDelete = () => {
    if (selectedTagId) {
      deleteMutation.mutate(selectedTagId);
    }
  };

  const handleSelect = (id: string) => {
    if (selectedTagId === id) {
      setSelectedTagId(null);
    } else {
      setSelectedTagId(id);
    }
  };

  return (
    <div className="space-y-6 p-8 h-full flex flex-col">
       {/* Header */}
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Video Tags</h1>
        <p className="text-muted-foreground mt-1">
          Manage tags for video content classification.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex items-center gap-2">
            <Button 
                variant="destructive" 
                disabled={!selectedTagId} 
                onClick={handleDeleteClick}
            >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
            </Button>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
                <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Tag
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Create New Tag</DialogTitle>
                <DialogDescription>
                    Add a new tag to categorize video content.
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Tag Name</Label>
                    <Input
                    id="name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="e.g. Physiotherapy"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    />
                </div>
                </div>
                <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending || !newTagName.trim()}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create
                </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-md border bg-background">
        {isLoading ? (
             <div className="p-4 space-y-4">
               {Array.from({ length: 5 }).map((_, i) => (
                 <div key={i} className="flex items-center justify-between">
                   <Skeleton className="h-8 w-[200px]" />
                   <Skeleton className="h-8 w-[100px]" />
                 </div>
               ))}
             </div>
        ) : isError ? (
            <div className="p-8 text-center text-red-500">
                Failed to load tags. Please try again.
            </div>
        ) : filteredTags.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <TagIcon className="h-12 w-12 mb-4 opacity-20" />
                <h3 className="text-lg font-semibold">No tags found</h3>
                <p>Create a new tag to get started.</p>
            </div>
        ) : (
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead className="w-[30%]">Name</TableHead>
                            <TableHead className="w-[30%]">Slug</TableHead>
                            <TableHead className="w-[30%]">Created At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTags.map((tag) => (
                            <TableRow key={tag._id}>
                                <TableCell className="w-[50px]">
                                    <Checkbox 
                                        checked={selectedTagId === tag._id}
                                        onCheckedChange={() => handleSelect(tag._id)}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">
                                    {tag.name}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="font-mono font-normal">
                                        {tag.slug}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {new Date(tag.createdAt).toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </table>
            </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => !open && setIsDeleteDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the tag
              and remove it from our servers.
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
