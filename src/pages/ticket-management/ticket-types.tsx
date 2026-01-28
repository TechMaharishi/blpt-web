import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useCallback, useState } from 'react'
import { EditableTable, type EditableTableColumn } from '@/components/ui/editable-table'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { RowSelectionState } from '@tanstack/react-table'

import { Skeleton } from '@/components/ui/skeleton'

// Define the data type matching API response
type TicketType = {
    id: string
    _id?: string
    slug: string
    name: string
    description: string
    active?: boolean
    createdAt?: string
}

// API Response type
interface TicketTypesResponse {
    success: boolean
    message: string
    data: TicketType[]
    meta: {
        page: number
        limit: number
        total: number
        hasNext: boolean
    }
}

// Create ticket type request type
interface CreateTicketTypeRequest {
    name: string
    description: string
}

// Fetch ticket types from API with pagination
const fetchTicketTypes = async ({ pageParam = 1 }): Promise<TicketTypesResponse> => {
    const response = await apiClient.get<TicketTypesResponse>('/support/ticket-types', {
        params: {
            page: pageParam,
            limit: 10,
        }
    })

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch ticket types')
    }

    return response.data
}

// Create ticket type API call
const createTicketType = async (data: CreateTicketTypeRequest) => {
    const response = await apiClient.post('/support/create-ticket-type', data)
    return response.data
}

// Delete ticket type API call
const deleteTicketType = async (id: string) => {
    const response = await apiClient.delete(`/support/delete-ticket-type/${id}`)
    return response.data
}

// Reusable Page Header Component
const PageHeader = () => (
    <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Ticket Types</h2>
        <p className="text-muted-foreground">
            Manage the types of tickets available in the system.
        </p>
    </div>
)

export function TicketTypesPage() {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const queryClient = useQueryClient()

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [formData, setFormData] = useState({ name: '', description: '' })
    const [formError, setFormError] = useState('')
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

    // Use TanStack Query's infinite query for pagination
    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['ticket-types'],
        queryFn: fetchTicketTypes,
        getNextPageParam: (lastPage) => {
            return lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined
        },
        initialPageParam: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    })

    // Create ticket type mutation
    const createMutation = useMutation({
        mutationFn: createTicketType,
        onSuccess: () => {
            // Close dialog and reset form
            setIsDialogOpen(false)
            setFormData({ name: '', description: '' })
            setFormError('')

            // Invalidate and refetch ticket types
            queryClient.invalidateQueries({ queryKey: ['ticket-types'] })
            toast.success('Ticket type created successfully')
        },
        onError: (error: any) => {
            setFormError(error.response?.data?.message || 'Failed to create ticket type')
        },
    })

    // Delete ticket type mutation
    const deleteMutation = useMutation({
        mutationFn: deleteTicketType,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ticket-types'] })
            toast.success('Ticket type deleted successfully')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete ticket type')
        },
    })

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setFormError('')

        // Validation
        if (!formData.name.trim()) {
            setFormError('Name is required')
            return
        }
        if (!formData.description.trim()) {
            setFormError('Description is required')
            return
        }

        createMutation.mutate(formData)
    }

    // Handle dialog open
    const handleAddClick = () => {
        setIsDialogOpen(true)
        setFormData({ name: '', description: '' })
        setFormError('')
    }

    // Handle delete with confirmation
    const handleDeleteClick = () => {
        // Get the selected ticket type ID (single selection mode)
        const selectedIndex = Object.keys(rowSelection)[0]
        if (!selectedIndex) return

        // In TanStack Table, the selection key is the row index
        const index = parseInt(selectedIndex)
        const ticketType = allTicketTypes[index]

        if (!ticketType) return

        toast('Delete Ticket Type', {
            description: `Are you sure you want to delete "${ticketType.name}"? This action cannot be undone.`,
            action: {
                label: 'Delete',
                onClick: () => {
                    deleteMutation.mutate(ticketType.id)
                    setRowSelection({})
                },
            },
            cancel: {
                label: 'Cancel',
                onClick: () => { },
            },
        })
    }

    // Flatten all pages into a single array
    const allTicketTypes = data?.pages.flatMap(page =>
        page.data.map(item => ({
            id: item._id || item.id,
            slug: item.slug,
            name: item.name,
            description: item.description,
            active: item.active,
            createdAt: item.createdAt,
        }))
    ) || []

    // Infinite scroll handler
    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current
        if (!container) return

        const { scrollTop, scrollHeight, clientHeight } = container
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

        // Load more when scrolled 80% down
        if (scrollPercentage > 0.8 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    // Attach scroll listener
    useEffect(() => {
        const container = scrollContainerRef.current
        if (!container) return

        container.addEventListener('scroll', handleScroll)
        return () => container.removeEventListener('scroll', handleScroll)
    }, [handleScroll])

    const columns: EditableTableColumn<TicketType>[] = [
        {
            accessorKey: 'slug',
            header: 'Slug',
            editable: false,
            hasCheckbox: true,
        },
        {
            accessorKey: 'name',
            header: 'Name',
            editable: true,
            cellPadding: '12px',
        },
        {
            accessorKey: 'description',
            header: 'Description',
            editable: true,
            cellPadding: '12px',
        },
    ]



    if (isLoading) {
        return (
            <div className="w-full h-full flex flex-col space-y-4 p-4 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <PageHeader />
                    {/* Action Buttons Skeleton */}
                    <div className="flex justify-end gap-2">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-36" />
                    </div>
                </div>
                
                {/* Table Skeleton */}
                <div className="border rounded-md">
                    {/* Table Header */}
                    <div className="border-b p-4 bg-muted/40 grid grid-cols-12 gap-4">
                         <Skeleton className="h-6 col-span-3" />
                         <Skeleton className="h-6 col-span-3" />
                         <Skeleton className="h-6 col-span-6" />
                    </div>
                    
                    {/* Table Rows */}
                    <div className="p-4 space-y-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-12 gap-4 items-center border-b pb-4 last:border-0 last:pb-0">
                                <Skeleton className="h-4 col-span-3" />
                                <Skeleton className="h-4 col-span-3" />
                                <Skeleton className="h-4 col-span-6" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="w-full h-full flex flex-col space-y-4 p-4 md:p-8">
                <PageHeader />
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
                        <p className="text-gray-600">
                            {error instanceof Error ? error.message : 'Failed to load ticket types'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col space-y-4 p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Ticket Types</h2>
                    <p className="text-muted-foreground">
                        Manage the types of tickets available in the system.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="destructive"
                        className="gap-2"
                        disabled={Object.keys(rowSelection).length === 0}
                        onClick={handleDeleteClick}
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </Button>
                    <Button onClick={handleAddClick} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Ticket Type
                    </Button>
                </div>
            </div>

            {/* Create Ticket Type Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Ticket Type</DialogTitle>
                        <DialogDescription>
                            Create a new ticket type for your support system.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Technical Support"
                                    disabled={createMutation.isPending}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe this ticket type..."
                                    disabled={createMutation.isPending}
                                    rows={4}
                                />
                            </div>
                            {formError && (
                                <div className="text-sm text-red-600">
                                    {formError}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                disabled={createMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Creating...' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Scrollable Content Area */}
            <div ref={scrollContainerRef} style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
                <EditableTable
                    data={allTicketTypes}
                    columns={columns}
                    title=""
                    description=""
                    searchPlaceholder="Search all columns..."
                    enableSearch={false}
                    rowSelection={rowSelection}
                    enableRowSelection={true}
                    onRowSelectionChange={setRowSelection}
                    enableMultiRowSelection={false}
                    enableDelete={false}
                    maxVisibleRows={10}
                />

                {/* Loading indicator for next page */}
                {isFetchingNextPage && (
                    <div className="flex items-center justify-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                        <p className="ml-2 text-gray-600">Loading more...</p>
                    </div>
                )}
            </div>
        </div>
    )
}

