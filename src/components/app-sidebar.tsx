import { authClient } from "@/lib/auth-client"
import {
    Home,   
    Library,
    Users,
    Ticket,
    ChevronRight,
    type LucideIcon
} from "lucide-react"
import { Link } from "react-router-dom"
import logo from "@/assets/logo.png"
import { Spinner } from "./ui/spinner"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { NavUser } from "./nav-user"

import { getRolePath } from "@/lib/utils"

type MenuItem = {
    title: string
    url?: string
    icon?: LucideIcon
    items?: MenuItem[]
}

const getMenuItems = (rolePath: string): MenuItem[] => [
    {
        title: "Dashboard",
        url: `/${rolePath}/dashboard`,
        icon: Home,
    },
    {
        title: "Content Management",
        icon: Library,
        items: [
            { title: "Short Videos", url: `/${rolePath}/content/shorts` },
            { title: "Courses", url: `/${rolePath}/content/courses` },
            {
                title: "Reviews",
                items: [
                    { title: "Pending Shorts", url: `/${rolePath}/content/reviews/shorts` },
                    { title: "Pending Courses", url: `/${rolePath}/content/reviews/courses` },
                ]
            },
            { title: "Video Tags", url: `/${rolePath}/content/tags` },
        ]
    },
    {
        title: "User Management",
        icon: Users,
        items: [
            { title: "All Users", url: `/${rolePath}/users/all` },
            {
                title: "Assignments",
                items: [
                    { title: "Assign Courses", url: `/${rolePath}/users/assignments/courses` },
                    { title: "Assign Clinical Learner", url: `/${rolePath}/users/assignments/clinical` },
                ]
            }
        ]
    },
    {
        title: "Ticket Management",
        icon: Ticket,
        items: [
            { title: "All Tickets", url: `/${rolePath}/tickets/all` },
            { title: "Create Ticket", url: `/${rolePath}/tickets/create` },
            { title: "Ticket Types", url: `/${rolePath}/tickets/types` },
        ]
    }
]

export function AppSidebar() {
    const { data: session, isPending } = authClient.useSession()
    
    const user = {
        name: session?.user?.name || "",
        email: session?.user?.email || "",
        avatar: session?.user?.image || "",
    }

    const rolePath = session?.user ? getRolePath((session.user as any).role || "user") : "app";
    const items = getMenuItems(rolePath);

    return (
        <Sidebar>
            <SidebarHeader className="flex items-center justify-center border-b border-sidebar-border p-2">
                <Link to={`/${rolePath}/dashboard`}>
                    <img src={logo} alt="Beyond Limit Logo" className="h-24 w-32" />
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    {item.items ? (
                                        <Collapsible className="group/collapsible" defaultOpen>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton className="font-semibold text-sidebar-foreground">
                                                    {item.icon && <item.icon />}
                                                    <span>{item.title}</span>
                                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <SidebarMenuSub>
                                                    {item.items.map((subItem) => (
                                                        <SubMenuItem key={subItem.title} item={subItem} />
                                                    ))}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    ) : (
                                        <SidebarMenuButton asChild>
                                            <Link to={item.url!}>
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    )}
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="border-t border-sidebar-border p-4">
                {isPending ? (
                    <div className="flex justify-center p-2">
                        <Spinner />
                    </div>
                ) : (
                    <NavUser user={user} />
                )}
            </SidebarFooter>
        </Sidebar>
    )
}

function SubMenuItem({ item }: { item: MenuItem }) {
    if (item.items) {
        return (
            <SidebarMenuSubItem>
                <Collapsible className="group/collapsible" defaultOpen>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuSubButton className="font-medium">
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuSubButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {item.items.map((subItem) => (
                                <SubMenuItem key={subItem.title} item={subItem} />
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </Collapsible>
            </SidebarMenuSubItem>
        )
    }

    return (
        <SidebarMenuSubItem>
            <SidebarMenuSubButton asChild>
                <Link to={item.url!}>
                    <span>{item.title}</span>
                </Link>
            </SidebarMenuSubButton>
        </SidebarMenuSubItem>
    )
}
