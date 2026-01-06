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
    BookOpen,
    Headphones,
    UserCheck,
    Settings,
    UserCog,
    Clock,
    Calendar,
    ClipboardCheck,
    CalendarDays,
    FileCheck,
    Key
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
                name: "Chat", icon: MessageSquare, route: "/admin/queries",
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
                    { name: "View Passwords", icon: Key, route: "/admin/password-management" },
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
                name: "Training Material", icon: BookOpen, route: "/admin/training-material",
            },
            {
                name: "Customers", icon: UserCog, route: "/admin/customers",
            },
            {
                name: "Attendance", icon: Calendar,
                subMenu: [
                    { name: "Shift Management", icon: Clock, route: "/admin/shift-management" },
                    { name: "Manage Attendance", icon: ClipboardCheck, route: "/admin/attendance-management" },
                    { name: "Holiday Management", icon: CalendarDays, route: "/admin/holiday-management" },
                    { name: "Leave Management", icon: FileCheck, route: "/admin/leave-management" },
                ]
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
                    {
                        name: "TL",
                        icon: Users,
                        nestedSubMenu: [
                            { name: "Performance", icon: TrendingUp, route: "/admin/reports/tl-performance" },
                            { name: "Activity", icon: Activity, route: "/admin/reports/tl-activity" },
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
            {
                name: "Customers", icon: UserCog, route: "/agent/customers",
            },
            {
                name: "Attendance", icon: Calendar,
                subMenu: [
                    { name: "Mark Attendance", icon: Clock, route: "/agent/mark-attendance" },
                    { name: "My Attendance", icon: ClipboardCheck, route: "/agent/my-attendance" },
                    // { name: "Apply Leave", icon: FileText, route: "/agent/leave-apply" },
                ]
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
                name: "Weightage", icon: TrendingUp, route: "/qa/ratings",
            },
            {
                name: "Screenshots", icon: Camera, route: "/qa/screenshots",
            },
            {
                name: "Customers", icon: UserCog, route: "/qa/customers",
            },
            {
                name: "Training Material", icon: BookOpen, route: "/qa/training-material",
            },
            {
                name: "Attendance", icon: Calendar,
                subMenu: [
                    { name: "Mark Attendance", icon: Clock, route: "/qa/mark-attendance" },
                    { name: "My Attendance", icon: ClipboardCheck, route: "/qa/my-attendance" },
                    // { name: "Apply Leave", icon: FileText, route: "/qa/leave-apply" },
                ]
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
            { name: "Customers", icon: UserCog, route: "/tl/customers" },
            { name: "Training Material", icon: BookOpen, route: "/tl/training-material" },
            {
                name: "Attendance", icon: Calendar,
                subMenu: [
                    { name: "Mark Attendance", icon: Clock, route: "/tl/mark-attendance" },
                    { name: "My Attendance", icon: ClipboardCheck, route: "/tl/my-attendance" },
                    // { name: "Shift Management", icon: Clock, route: "/tl/shift-management" },
                    // { name: "Manage Attendance", icon: ClipboardCheck, route: "/tl/attendance-management" },
                    // { name: "Holiday Management", icon: CalendarDays, route: "/tl/holiday-management" },
                    // { name: "Leave Management", icon: FileCheck, route: "/tl/leave-management" },
                    // { name: "Apply Leave", icon: FileText, route: "/tl/leave-apply" },
                ]
            },
            {
                 name: "Reports", icon: BarChart3,
                subMenu: [
                    {
                        name: "Agents",
                        icon: Headphones,
                        nestedSubMenu: [
                            { name: "Performance", icon: TrendingUp, route: "/tl/reports/agents-performance" },
                            { name: "Activity", icon: Activity, route: "/tl/reports/agent-activity" },
                        ],
                    },
                    // {
                    //     name: "QA",
                    //     icon: UserCheck,
                    //     nestedSubMenu: [
                    //         { name: "Performance", icon: TrendingUp, route: "/tl/reports/qa-performance" },
                    //         { name: "Activity", icon: Activity, route: "/tl/reports/qa-activity" },
                    //     ],
                    // },
                ]
            }
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



