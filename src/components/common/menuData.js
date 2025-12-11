import { 
    LayoutDashboard, 
    Inbox, 
    Mail, 
    Users, 
    UserPlus, 
    UsersRound, 
    Camera, 
    MapPin, 
    Shield, 
    BarChart3, 
    TrendingUp, 
    Activity, 
    MessageSquare,
    FileText,
    Headphones,
    UserCheck,
    Settings
} from "lucide-react";

export const menuData = {
    Admin:[
        {
        label: "Main",
        items: [
            {
                name: "Dashboard", icon: LayoutDashboard, route: "/admin",
            },
            {
                name: "Tickets", icon: Inbox, route: "/admin/ticketing/my-inbox",
            },
            {
                name: "Email Config", icon: Mail, route: "/admin/email-config",
            },
            // {
            //     name: "IP Config", icon: Shield, route: "/admin/ip-configuration",
            // },
            {
                name: "Employees", icon: Users,
                subMenu: [
                    { name: "Create", icon: UserPlus, route: "/admin/create-employee" },
                    { name: "Manage", icon: UsersRound, route: "/admin/employees" },
                ]
            },
            {
                name: "Screenshots", icon: Camera, route: "/admin/screenshots",
            },
            {
                name: "Location Access", icon: MapPin, route: "/admin/location-access",
            },
            {
                name: "Location Settings", icon: Settings, route: "/admin/location-settings",
            },
            {
                name: "Org IP Config", icon: Shield, route: "/admin/organization-ip-config",
            },
            {
                name: "FAQs Management", icon: FileText, route: "/admin/faq-management",
            },

            {
                 name: "Reports", icon: BarChart3,
                subMenu: [
                    {
                        name: "Agents",
                        icon: Headphones,
                        nestedSubMenu: [
                            { name: "Performance", icon: TrendingUp, route: "/admin/reports/agents-performance" },
                            { name: "Activity", icon: Activity, route: "/admin/reports/agent-activity" },
                        ],
                    },
                    {
                        name: "QA",
                        icon: UserCheck,
                        nestedSubMenu: [
                            { name: "Performance", icon: TrendingUp, route: "/admin/reports/qa-performance" },
                            { name: "Activity", icon: Activity, route: "/admin/reports/qa-activity" },
                        ],
                    },
                ]
            }

        ]
    }],
    Agent:[
        {
        label: "Main",
        items: [
            {
                name: "Dashboard", icon: LayoutDashboard, route: "/agent",
            },
            {
                name: "Chat", icon: MessageSquare, route: "/agent/queries",
            },
            // {
            //     name: "Chat", icon: MessageSquare, route: "/agent/chat",
            // },
            {
                name: "Tickets", icon: Inbox, route: "/agent/ticketing/my-inbox",
            },
            // {
            //     name: "Calls", icon: Phone, route: "/agent/calls",
            // },
            {
                name: "Screenshots", icon: Camera, route: "/agent/screenshots",
            },
        ]
    }],
    QA:[
        {
        label: "Main",
        items: [
            {
                name: "Dashboard", icon: LayoutDashboard, route: "/qa",
            },
            {
                name: "Chat", icon: MessageSquare, route: "/qa/queries",
            },
            {
                name: "Weightage", icon: TrendingUp, route: "/qa/ratings",
            },
            // {
            //     name: "Chat", icon: MessageSquare, route: "/qa/chat",
            // },
            {
                name: "Tickets", icon: Inbox, route: "/qa/ticketing/my-inbox",
            },
            // {
            //     name: "Calls", icon: Phone, route: "/qa/calls",
            // },
            {
                name: "Screenshots", icon: Camera, route: "/qa/screenshots",
            },
            // {
            //     name: "Team", icon: UsersRound, route: "/qa/team",
            // },
        ]
    }],
    TL:[
        {
        label: "Main",
        items: [
            { name: "Dashboard", icon: LayoutDashboard, route: "/tl" },
            { name: "Chat", icon: MessageSquare, route: "/tl/queries" },
            { name: "Weightage", icon: TrendingUp, route: "/tl/ratings" },
            { name: "Tickets", icon: Inbox, route: "/tl/ticketing/my-inbox" },
            // { name: "Calls", icon: Phone, route: "/tl/calls" },
            { name: "Screenshots", icon: Camera, route: "/tl/screenshots" },
        ]
    }],
    Customer: [
        {
            label: "Main",
            items: [
                { name: "Home", icon: LayoutDashboard, route: "/customer" },
                { name: "Chat", icon: MessageSquare, route: "/customer/queries" },
                // { name: "Chat", icon: MessageSquare, route: "/customer/chat" },
                { name: "Tickets", icon: Inbox, route: "/customer/inbox" },
                // { name: "Calls", icon: Phone, route: "/customer/calls" },
            ]
        }
    ],
}



