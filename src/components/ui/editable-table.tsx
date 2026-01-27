import { useState, useRef, useEffect } from "react"
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type Row,
    type RowSelectionState,
    type CellContext,
} from "@tanstack/react-table"

// Editable cell component with no layout shift
interface EditableCellProps<TData> {
    getValue: () => any
    row: Row<TData>
    column: any
    updateData: (rowIndex: number, columnId: string, value: string) => void
}

function EditableCell<TData>({
    getValue,
    row,
    column,
    updateData,
}: EditableCellProps<TData>) {
    const initialValue = getValue()
    const [value, setValue] = useState(String(initialValue))
    const [isEditing, setIsEditing] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setValue(String(initialValue))
    }, [initialValue])

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            // Don't select text - just place cursor at the end
            const length = inputRef.current.value.length
            inputRef.current.setSelectionRange(length, length)
        }
    }, [isEditing])

    const handleSave = () => {
        updateData(row.index, column.id, value)
        setIsEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSave()
        } else if (e.key === "Escape") {
            setValue(String(initialValue))
            setIsEditing(false)
        } else if (e.key === "Tab") {
            e.preventDefault()
            handleSave()
        }
    }

    return (
        <div
            onDoubleClick={() => setIsEditing(true)}
            className="w-full h-full cursor-text relative flex items-center"
            style={{ minHeight: "40px", paddingRight: "12px" }}
        >
            {isEditing ? (
                <input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    className="w-full h-full"
                    style={{
                        padding: 0,
                        margin: 0,
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: "inherit",
                        fontFamily: "inherit",
                        fontWeight: "inherit",
                        lineHeight: "inherit",
                        color: "inherit",
                        boxShadow: "none",
                        WebkitAppearance: "none",
                        MozAppearance: "none",
                        appearance: "none",
                    }}
                />
            ) : (
                <span
                    style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "block",
                    }}
                    title={String(value)}
                >
                    {String(value)}
                </span>
            )}
        </div>
    )
}

// Column configuration type
export interface EditableTableColumn<TData> {
    accessorKey: keyof TData
    header: string
    editable?: boolean
    hasCheckbox?: boolean
    cellPadding?: string
}

// Props for the EditableTable component
interface EditableTableProps<TData extends { id: string }> {
    data: TData[]
    columns: EditableTableColumn<TData>[]
    onDataChange?: (data: TData[]) => void
    searchPlaceholder?: string
    title?: string
    description?: string
    height?: string
    enableSearch?: boolean
    rowSelection?: RowSelectionState
    enableRowSelection?: boolean
    onRowSelectionChange?: (rowSelection: RowSelectionState) => void
    enableMultiRowSelection?: boolean
    enableDelete?: boolean
    onDelete?: (selectedIds: string[]) => void
    enableRowDelete?: boolean
    onRowDelete?: (row: TData) => void
    maxVisibleRows?: number
}

export function EditableTable<TData extends { id: string }>({
    data: initialData,
    columns: columnConfigs,
    onDataChange,
    searchPlaceholder = "Search all columns...",
    title,
    description,
    height,
    enableSearch = true,
    rowSelection: externalRowSelection,
    enableRowSelection = false,
    onRowSelectionChange,
    enableMultiRowSelection = false,
    enableDelete = false,
    onDelete,
    enableRowDelete = false,
    onRowDelete,
    maxVisibleRows = 10,
}: EditableTableProps<TData>) {
    const [data, setData] = useState<TData[]>(initialData)
    const [globalFilter, setGlobalFilter] = useState("")
    const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({})

    const rowSelection = externalRowSelection ?? internalRowSelection

    const handleRowSelectionChange = (updaterOrValue: any) => {
        const newSelection = typeof updaterOrValue === 'function' 
            ? updaterOrValue(rowSelection) 
            : updaterOrValue
            
        if (!externalRowSelection) {
            setInternalRowSelection(newSelection)
        }
        
        if (onRowSelectionChange) {
            onRowSelectionChange(newSelection)
        }
    }

    // Sync with external data changes
    useEffect(() => {
        setData(initialData)
    }, [initialData])

    const updateData = (rowIndex: number, columnId: string, value: string) => {
        setData((old) =>
            old.map((row, index) => {
                if (index === rowIndex) {
                    return {
                        ...old[rowIndex],
                        [columnId as keyof TData]: value,
                    }
                }
                return row
            })
        )
    }

    // Notify parent of data changes
    useEffect(() => {
        if (onDataChange) {
            onDataChange(data)
        }
    }, [data, onDataChange])

    // Build column definitions from config
    const columns: ColumnDef<TData>[] = [
        ...columnConfigs.map((config) => {
            const isFirstColumn = columnConfigs.indexOf(config) === 0
            const hasCheckbox = enableRowSelection && config.hasCheckbox

            return {
                accessorKey: config.accessorKey as string,
                header: hasCheckbox
                    ? () => (
                        <div className="flex items-center gap-2">
                            <span>{config.header}</span>
                        </div>
                    )
                    : config.header,
                cell: ({ getValue, row, column }: CellContext<TData, unknown>) => {
                    const cellValue = getValue()

                    if (hasCheckbox) {
                        // First column with checkbox
                        return (
                            <div className="flex items-center gap-2 w-full h-full px-3 py-2">
                                <input
                                    type="checkbox"
                                    checked={row.getIsSelected()}
                                    onChange={row.getToggleSelectedHandler()}
                                    className="w-4 h-4 cursor-pointer flex-shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <span
                                    className="flex-1 min-w-0"
                                    style={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        display: "block",
                                    }}
                                    title={String(cellValue)}
                                >
                                    {String(cellValue)}
                                </span>
                            </div>
                        )
                    } else if (config.editable !== false) {
                        // Editable cell
                        return (
                            <div style={{ paddingLeft: config.cellPadding || (isFirstColumn ? "0" : "12px") }}>
                                <EditableCell
                                    getValue={getValue}
                                    row={row}
                                    column={column}
                                    updateData={updateData}
                                />
                            </div>
                        )
                    } else {
                        // Read-only cell
                        return (
                            <div
                                className="w-full h-full px-3 py-2 flex items-center"
                                style={{ minHeight: "40px" }}
                            >
                                <span
                                    style={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        display: "block",
                                    }}
                                    title={String(cellValue)}
                                >
                                    {String(cellValue)}
                                </span>
                            </div>
                        )
                    }
                },
            }
        }),
        ...(enableRowDelete
            ? [
                {
                    id: "actions",
                    header: "",
                    size: 50,
                    cell: ({ row }: CellContext<TData, unknown>) => (
                        <div className="flex items-center justify-center h-full w-full">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onRowDelete?.(row.original)
                                }}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                                title="Delete"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                            </button>
                        </div>
                    ),
                } as ColumnDef<TData>,
            ]
            : []),
    ]

    const equalColumnWidth = 100 / columns.length

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableColumnResizing: true,
        columnResizeMode: "onChange",
        state: {
            globalFilter,
            rowSelection,
        },
        onGlobalFilterChange: setGlobalFilter,
        onRowSelectionChange: handleRowSelectionChange,
        enableRowSelection: enableRowSelection,
        enableMultiRowSelection: enableMultiRowSelection,
        defaultColumn: {
            size: equalColumnWidth,
            minSize: 50,
            maxSize: 800,
        },
    })

    const selectedRowCount = Object.keys(rowSelection).length

    const handleDelete = () => {
        const selectedIds = Object.keys(rowSelection)

        if (onDelete) {
            onDelete(selectedIds)
        } else {
            const newData = data.filter((row) => !selectedIds.includes(row.id))
            setData(newData)
        }

        setInternalRowSelection({})
        if (onRowSelectionChange) {
            onRowSelectionChange({})
        }
    }

    // Calculate dynamic height based on actual row count and maxVisibleRows
    // Each row is 40px, header is 48px
    const actualRowCount = table.getRowModel().rows.length
    const visibleRows = Math.min(actualRowCount, maxVisibleRows)
    const calculatedHeight = height || `calc(40px * ${visibleRows} + 48px)`
    const maxHeight = `calc(40px * ${maxVisibleRows} + 48px)`

    return (
        <div className="flex flex-col gap-4">
            {(title || description) && (
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        {title && <h2 className="text-3xl font-bold tracking-tight">{title}</h2>}
                        {description && <p className="text-muted-foreground">{description}</p>}
                    </div>
                </div>
            )}

            <div className="w-full">
                <div className="mb-6 flex items-center justify-between">
                    {enableSearch && (
                        <div className="relative w-full max-w-sm">
                            <svg
                                className="absolute left-3 top-3 h-4 w-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={globalFilter ?? ""}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            />
                        </div>
                    )}
                    {enableDelete && selectedRowCount > 0 && (
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                            Delete ({selectedRowCount})
                        </button>
                    )}
                </div>

                <div
                    className="bg-white rounded-lg shadow-sm overflow-hidden"
                    style={{
                        height: calculatedHeight,
                        maxHeight: maxHeight,
                        border: "1px solid #d1d5db",
                    }}
                >
                    <div className="overflow-auto h-full">
                        <table
                            style={{
                                width: "100%",
                                tableLayout: "fixed",
                                borderCollapse: "collapse",
                                borderSpacing: 0,
                            }}
                        >
                            <thead className="sticky top-0 z-10">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                style={{
                                                    width: `${header.getSize()}%`,
                                                    position: "relative",
                                                    backgroundColor: "#f9fafb",
                                                    borderBottom: "1px solid #d1d5db",
                                                    borderRight: "1px solid #d1d5db",
                                                    padding: "12px",
                                                    textAlign: "left",
                                                    fontWeight: 600,
                                                    fontSize: "14px",
                                                    color: "#374151",
                                                }}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}

                                                {/* Resizer handle */}
                                                <div
                                                    onMouseDown={header.getResizeHandler()}
                                                    onTouchStart={header.getResizeHandler()}
                                                    style={{
                                                        position: "absolute",
                                                        right: 0,
                                                        top: 0,
                                                        height: "100%",
                                                        width: "3px",
                                                        cursor: "col-resize",
                                                        userSelect: "none",
                                                        touchAction: "none",
                                                        backgroundColor: header.column.getIsResizing()
                                                            ? "#3b82f6"
                                                            : "transparent",
                                                        zIndex: 1,
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!header.column.getIsResizing()) {
                                                            e.currentTarget.style.backgroundColor = "#93c5fd"
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!header.column.getIsResizing()) {
                                                            e.currentTarget.style.backgroundColor =
                                                                "transparent"
                                                        }
                                                    }}
                                                />
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>
                                {table.getRowModel().rows.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            style={{
                                                transition: "background-color 0.15s ease",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = "#f9fafb"
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = "white"
                                            }}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <td
                                                    key={cell.id}
                                                    style={{
                                                        width: `${cell.column.getSize()}%`,
                                                        padding: 0,
                                                        height: "40px",
                                                        borderBottom: "1px solid #d1d5db",
                                                        borderRight: "1px solid #d1d5db",
                                                        backgroundColor: "inherit",
                                                    }}
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={columns.length}
                                            style={{
                                                padding: "32px",
                                                textAlign: "center",
                                                color: "#6b7280",
                                                borderBottom: "1px solid #d1d5db",
                                                borderRight: "1px solid #d1d5db",
                                            }}
                                        >
                                            No results found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}