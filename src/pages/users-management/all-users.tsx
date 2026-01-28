import { useState, useRef, useEffect, useMemo } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  ChevronDown,
  MoreHorizontal,
  Plus,
  Download,
  Trash2,
  Search,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Filter,
  X,
  ArrowUpDown
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// API Data Type
export type User = {
  id: string
  name: string
  email: string
  role: string
  accountType: string
  emailVerified: boolean
  banned: boolean
  createdAt: string
  updatedAt: string
  traineeName: string | null
  phone?: string
  avatarUrl?: string
}

type UsersResponse = {
  data: {
    users: User[]
    total: number
    limit: number
  }
}

const roleMap: Record<string, string> = {
  admin: "Super Admin",
  trainer: "Training Admin",
  trainee: "Clinical Learners",
  user: "Individual Learners",
}

// Helper for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function AllUsersPage() {
  const queryClient = useQueryClient()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  // Mutations
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.post("/admin/delete-user", { userId })
    },
    onSuccess: () => {
      toast.success("User deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      setRowSelection({})
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete user")
    }
  })

  const banUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.post("/admin/ban-user", { userId })
    },
    onSuccess: () => {
      toast.success("User banned successfully")
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to ban user")
    }
  })

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.post("/admin/unban-user", { userId })
    },
    onSuccess: () => {
      toast.success("User unbanned successfully")
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to unban user")
    }
  })

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("")
  const [searchField, setSearchField] = useState<"name" | "email">("name")
  const [roleFilter, setRoleFilter] = useState<string | null>(null)

  // Sorting State
  const [sortBy, setSortBy] = useState<"createdAt" | "name" | "email">("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const debouncedSearch = useDebounce(searchQuery, 500)

  const parentRef = useRef<HTMLDivElement>(null)

  // Data Fetching with Infinite Query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["users", roleFilter, debouncedSearch, searchField, sortBy, sortDirection],
    queryFn: async ({ pageParam = 0 }) => {
      const params: any = {
        limit: 10,
        offset: pageParam,
        sortBy,
        sortDirection,
      }

      if (roleFilter && roleFilter !== "all") {
        params.role = roleFilter
      }

      if (debouncedSearch) {
        params.search = debouncedSearch
        params.field = searchField
      }

      const response = await apiClient.get<UsersResponse>("/admin/list-user", {
        params,
      })
      return response.data.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const nextOffset = allPages.length * 10
      return nextOffset < lastPage.total ? nextOffset : undefined
    },
  })

  // Flatten data
  const flatUsers = useMemo(
    () => data?.pages.flatMap((page) => page.users) ?? [],
    [data]
  )

  const totalDBRows = data?.pages[0]?.total ?? 0

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
            <div className="flex flex-col">
              <span className="font-medium text-sm">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string
        const displayRole = roleMap[role] || role
        const getRoleBadge = (role: string) => {
          switch (role) {
            case "admin": return <Badge variant="default" className="bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 border-purple-200">{displayRole}</Badge>
            case "trainer": return <Badge variant="default" className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-200">{displayRole}</Badge>
            case "trainee": return <Badge variant="secondary" className="bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200">{displayRole}</Badge>
            default: return <Badge variant="outline" className="text-muted-foreground">{displayRole}</Badge>
          }
        }
        return getRoleBadge(role)
      },
    },
    {
      accessorKey: "accountType",
      header: "Account",
      cell: ({ row }) => {
        const type = row.getValue("accountType") as string
        return <span className="capitalize text-sm text-muted-foreground">{type}</span>
      },
    },
    {
      accessorKey: "emailVerified",
      header: "Verified",
      cell: ({ row }) => {
        const isVerified = row.getValue("emailVerified")
        return isVerified ? (
          <div className="flex items-center gap-1.5 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-amber-600">
            <ShieldAlert className="h-4 w-4" />
            <span className="text-xs font-medium">Pending</span>
          </div>
        )
      },
    },
    {
      accessorKey: "banned",
      header: "Status",
      cell: ({ row }) => {
        const isBanned = row.getValue("banned")
        return isBanned ? (
          <Badge variant="destructive" className="h-5 text-[10px] px-1.5">Banned</Badge>
        ) : (
          <Badge variant="outline" className="h-5 text-[10px] px-1.5 border-green-200 text-green-700 bg-green-50">Active</Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <Button
          variant="ghost"
          onClick={() => {
            if (sortBy === "createdAt") {
              setSortDirection(sortDirection === "asc" ? "desc" : "asc")
            } else {
              setSortBy("createdAt")
              setSortDirection("asc")
            }
          }}
          className="p-0 hover:bg-transparent font-semibold text-gray-700"
        >
          Joined
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">{new Date(row.getValue("createdAt")).toLocaleDateString()}</div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(user.id)}
                >
                  Copy User ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Edit User</DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (user.banned) {
                      unbanUserMutation.mutate(user.id)
                    } else {
                      banUserMutation.mutate(user.id)
                    }
                  }}
                >
                  {user.banned ? "Unban User" : "Ban User"}
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: flatUsers,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableMultiRowSelection: false,
    manualPagination: true,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Virtualization
  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 70,
    overscan: 6,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start || 0 : 0
  const paddingBottom = virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1].end || 0) : 0

  // Infinite Scroll Trigger
  useEffect(() => {
    const [lastItem] = [...virtualRows].reverse()

    if (!lastItem) {
      return
    }

    const scrollContainer = parentRef.current
    if (!scrollContainer) {
      return
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer
    const scrollOffset = scrollHeight - scrollTop - clientHeight

    if (
      lastItem.index >= flatUsers.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage &&
      scrollOffset < 100
    ) {
      fetchNextPage()
    }
  }, [hasNextPage, fetchNextPage, flatUsers.length, isFetchingNextPage, virtualRows])

  return (
    <div className="w-full h-full flex flex-col space-y-4 p-4 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">
            Manage your users, roles, and account statuses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-9"
            disabled={Object.keys(rowSelection).length === 0}
            onClick={() => {
              const selectedIndex = Object.keys(rowSelection)[0]
              if (selectedIndex !== undefined) {
                const selectedUser = flatUsers[parseInt(selectedIndex)]
                if (selectedUser) {
                  setUserToDelete(selectedUser)
                  setDeleteDialogOpen(true)
                }
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete ({Object.keys(rowSelection).length})
          </Button>
          <Button size="sm" className="h-9">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-2xl">
            {/* Search Input Group */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search by ${searchField}...`}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-8"
              />
            </div>

            {/* Field Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  Search In: <span className="ml-1 font-medium capitalize">{searchField}</span> <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuRadioGroup value={searchField} onValueChange={(v) => setSearchField(v as "name" | "email")}>
                  <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="email">Email</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Role Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={roleFilter && roleFilter !== "all" ? "bg-secondary" : "w-full sm:w-auto"}>
                  <Filter className="mr-2 h-4 w-4" />
                  {roleFilter && roleFilter !== "all" ? roleMap[roleFilter] : "All Roles"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={roleFilter || "all"} onValueChange={(v) => setRoleFilter(v)}>
                  <DropdownMenuRadioItem value="all">All Roles</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="admin">Super Admin</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="trainer">Training Admin</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="trainee">Clinical Learners</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="user">Individual Learners</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Reset Filters */}
            {(searchQuery || (roleFilter && roleFilter !== "all")) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setRoleFilter("all")
                  setSearchField("name")
                }}
                className="px-2"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Reset</span>
              </Button>
            )}
          </div>
        </div>

        <div
          ref={parentRef}
          className="rounded-md border border-gray-200 bg-white shadow-sm overflow-auto"
          style={{ maxHeight: 'calc(80vh - 200px)' }}
        >
          {isLoading && !flatUsers.length ? (
            <div className="h-24 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="h-24 flex items-center justify-center text-red-500">
              Error loading users: {error instanceof Error ? error.message : "Unknown error"}
            </div>
          ) : (
            <Table className="border-collapse border-spacing-0 w-full relative">
              <TableHeader className="bg-gray-50 sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-gray-200">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} className="border-r border-gray-200 font-semibold text-gray-700 h-12 last:border-r-0">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {/* Top Spacer */}
                {paddingTop > 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length} style={{ height: `${paddingTop}px`, padding: 0 }} />
                  </TableRow>
                )}

                {/* Virtual Rows */}
                {virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index]
                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="hover:bg-gray-50/50 border-b border-gray-200 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="border-r border-gray-200 py-3 last:border-r-0">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}

                {/* Bottom Spacer */}
                {paddingBottom > 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length} style={{ height: `${paddingBottom}px`, padding: 0 }} />
                  </TableRow>
                )}

                {/* Loading Indicator for Infinite Scroll */}
                {isFetchingNextPage && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-12 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                )}

                {flatUsers.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center border-r border-gray-200 last:border-r-0"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the user
                {userToDelete && <span className="font-medium text-foreground"> {userToDelete.name} </span>}
                and remove their data from our servers.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (userToDelete) {
                    deleteUserMutation.mutate(userToDelete.id)
                  }
                }}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
