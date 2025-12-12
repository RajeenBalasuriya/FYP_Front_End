"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  GalleryVerticalEnd,
  PieChart,
  Settings2,
  SquareTerminal,
  BrainCircuit,
  Cpu,
  Sparkles,
  FolderClock,
} from "lucide-react"

import { useAuth } from "@/context/auth-context"
import { NavMain } from "@/components/side-bar/nav-main"
import { NavProjects } from "@/components/side-bar/nav-projects"
import { NavUser } from "@/components/side-bar/nav-user"
import { TeamSwitcher } from "@/components/side-bar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"


const data = {
  teams: [
    {
      name: "Weather  Former",
      logo: GalleryVerticalEnd,
      plan: "Research Project",
    }
  ],
  navMain: [
    {
      title: "Gallery Management",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Folder A",
          url: "#",
        },
        {
          title: "Folder B",
          url: "#",
        },
        {
          title: "Folder C",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Model A",
          url: "/dashboard/file-upload",
          icon: BrainCircuit,
        },
        {
          title: "Model B",
          url: "/dashboard/model-b",
          icon: Cpu,
        },
        {
          title: "Model C",
          url: "#",
          icon: Sparkles,
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  Activity: [
    {
      name: "Job History",
      url: "/dashboard/folder-management",
      icon: FolderClock,
    },
    {
      name: "Analytics",
      url: "#",
      icon: PieChart,
    }

  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  const userData = {
    name: user?.userName || "Guest",
    email: user?.email || "guest@example.com",
    avatar: "/avatars/shadcn.jpg", // Fallback or dynamic if available
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects Activity={data.Activity} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
