"use client";

import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LayoutDashboardIcon, ListChecksIcon, CommandIcon } from "lucide-react";

const navItems = [
	{
		title: "Dashboard",
		url: "/member/dashboard",
		icon: <LayoutDashboardIcon />,
	},
	{
		title: "My Tasks",
		url: "/member/tasks",
		icon: <ListChecksIcon />,
	},
];

export function MemberSidebar({ ...props }) {
	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
							<div>
								<CommandIcon className="size-5!" />
								<span className="text-base font-semibold">My Workspace</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navItems} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
