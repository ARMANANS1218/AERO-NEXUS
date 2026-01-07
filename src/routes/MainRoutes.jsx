import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import InboxDetail from '../main/email/InboxDetail';
import Loading from '../components/common/Loading';
import ErrorBoundary, { RouteErrorBoundary } from '../components/common/ErrorBoundary';

// ✅ Lazy load pages
const LandingPage = lazy(() => import('../pages/public/LandingPage'));
const Login = lazy(() => import('../pages/public/Login'));
const Register = lazy(() => import('../pages/public/Register'));
const SuperAdminLogin = lazy(() => import('../pages/superadmin/SuperAdminLogin'));
const SuperAdminDashboard = lazy(() => import('../pages/superadmin/SuperAdminDashboard'));
const OrgLocationSummary = lazy(() => import('../pages/superadmin/OrgLocationSummary'));
const OrganizationsList = lazy(() => import('../pages/superadmin/OrganizationsList'));
const OrganizationDetails = lazy(() => import('../pages/superadmin/OrganizationDetails'));
const LinkUnlinkedAdmins = lazy(() => import('../pages/superadmin/LinkUnlinkedAdmins'));
const SuperAdminLayout = lazy(() => import('../components/superadmin/SuperAdminLayout'));
const SuperAdminRoute = lazy(() => import('../components/superadmin/SuperAdminRoute'));
const AdminDashboard = lazy(() => import('../pages/private/admin/AdminDashboard'));
const EmailTicketDashboard = lazy(() => import('../pages/private/admin/EmailTicketDashboard'));
const CreateEmployee = lazy(() => import('../pages/private/admin/CreateEmployee'));
const EditEmployee = lazy(() => import('../pages/private/admin/EditEmployee'));
const EmployeeList = lazy(() => import('../pages/private/admin/EmployeeList'));
const PasswordManagement = lazy(() => import('../pages/private/admin/PasswordManagement'));
const AdminEmailConfig = lazy(() => import('../pages/private/admin/EmailConfig'));
const LocationAccess = lazy(() => import('../pages/private/admin/LocationAccess'));
const LocationSettings = lazy(() => import('../pages/private/admin/LocationSettings'));
const SuperAdminLocationSettings = lazy(() =>
  import('../pages/superadmin/SuperAdminLocationSettings')
);
const FaqManagement = lazy(() => import('../pages/private/admin/FAQManagement'));
const TrainingMaterialManagement = lazy(() =>
  import('../pages/private/training-material/TrainingMaterialManagement')
);
const TrainingMaterialView = lazy(() =>
  import('../pages/private/training-material/TrainingMaterialView')
);
const AttendanceMark = lazy(() => import('../components/common/attendance/AttendanceMark'));
const MyAttendance = lazy(() => import('../components/common/attendance/MyAttendance'));
const ShiftManagement = lazy(() => import('../components/common/attendance/ShiftManagement'));
const AttendanceManagement = lazy(() =>
  import('../components/common/attendance/AttendanceManagement')
);
const HolidayManagement = lazy(() => import('../components/common/attendance/HolidayManagement'));
const LeaveApply = lazy(() => import('../components/common/attendance/LeaveApply'));
const LeaveManagement = lazy(() => import('../components/common/attendance/LeaveManagement'));
const IpConfiguration = lazy(() => import('../pages/admin/IpConfiguration'));
const OrganizationIpConfig = lazy(() => import('../pages/admin/OrganizationIpConfig'));
const AgentsPerformance = lazy(() => import('../pages/private/admin/reports/AgentsPerformance'));
const AgentActivity = lazy(() => import('../pages/private/admin/reports/AgentActivity'));
const QAActivity = lazy(() => import('../pages/private/admin/reports/QAActivity'));
const TLActivity = lazy(() => import('../pages/private/admin/reports/TLActivity'));
const TLPerformanceDetail = lazy(() =>
  import('../pages/private/admin/reports/TLPerformanceDetail')
);
const AgentDashboard = lazy(() => import('../pages/private/agent/Dashboard'));
const QaDashboard = lazy(() => import('../pages/private/qa/QaDashboard'));
const AgentRatings = lazy(() => import('../pages/qa/AgentRatings'));
const AgentEmailPage = lazy(() => import('../pages/private/agent/EmailPage'));
const AgentEmailTicketsPage = lazy(() => import('../pages/private/agent/EmailTicketsPage'));
const QaEmailPage = lazy(() => import('../pages/private/qa/EmailPage'));
const QaEmailTicketsPage = lazy(() => import('../pages/private/qa/EmailTicketsPage'));
const TlEmailTicketsPage = lazy(() => import('../pages/private/tl/EmailTicketsPage'));
const CallScreenshotGallery = lazy(() => import('../pages/private/agent/CallScreenshotGallery'));
const AgentPerformanceDetail = lazy(() =>
  import('../pages/private/admin/reports/AgentPerformanceDetail')
);
const QAPerformanceDetail = lazy(() =>
  import('../pages/private/admin/reports/QAPerformanceDetail')
);
const TLAgentPerformanceDetail = lazy(() =>
  import('../pages/private/tl/reports/AgentPerformanceDetail')
);
const TLAgentActivity = lazy(() => import('../pages/private/tl/reports/AgentActivity'));
const TLQAPerformanceDetail = lazy(() => import('../pages/private/tl/reports/QAPerformanceDetail'));
const TLQAActivity = lazy(() => import('../pages/private/tl/reports/QAActivity'));
const AgentProfile = lazy(() => import('../pages/private/agent/Profile'));
const QAProfile = lazy(() => import('../pages/private/qa/Profile'));
const TLProfile = lazy(() => import('../pages/private/tl/Profile'));
const AdminProfile = lazy(() => import('../pages/private/admin/Profile'));
const Home = lazy(() => import('../pages/private/customer/Home'));
const CustomerChat = lazy(() => import('../pages/private/customer/CustomerChat'));
const CustomerProfile = lazy(() => import('../pages/private/customer/CustomerProfile'));
const CustomerEmailPage = lazy(() => import('../pages/private/customer/EmailPage'));
const QueryHistory = lazy(() => import('../pages/private/customer/QueryHistory'));
const QueryChat = lazy(() => import('../pages/private/customer/QueryChat'));
const QueryManagement = lazy(() => import('../pages/private/agent/QueryManagement'));
const Inbox = lazy(() => import('../main/email/Inbox'));
const FullPageChat = lazy(() => import('../main/chat/FullPageChat'));
const Calls = lazy(() => import('../pages/private/agent/Calls'));
const VideoCallPage = lazy(() => import('../pages/private/VideoCallPage'));
const WidgetDemo = lazy(() => import('../pages/demo/WidgetDemo'));
const GeocamCapture = lazy(() => import('../pages/public/GeocamCapture'));
const ClientLocationCapture = lazy(() => import('../pages/public/ClientLocationCapture'));
// New Ticketing System
const InboxLayout = lazy(() => import('../pages/private/ticketing/InboxLayout'));
const MyInboxEmailView = lazy(() => import('../pages/private/ticketing/MyInboxEmailView'));
const UnassignedEmailView = lazy(() => import('../pages/private/ticketing/UnassignedEmailView'));
const AllEmailView = lazy(() => import('../pages/private/ticketing/AllEmailView'));
const TeamInboxEmailView = lazy(() => import('../pages/private/ticketing/TeamInboxEmailView'));
const ViewEmailView = lazy(() => import('../pages/private/ticketing/ViewEmailView'));
const EmailTicketDetail = lazy(() => import('../pages/private/ticketing/EmailTicketDetail'));
// Customer Management
const CustomerList = lazy(() => import('../pages/private/customer-management/CustomerList'));
const CustomerDetails = lazy(() => import('../pages/private/customer-management/CustomerDetails'));
// ✅ Lazy load routers
const PublicRouter = lazy(() => import('./router/PublicRouter'));
const ProtectedRouter = lazy(() => import('./router/ProtectedRouter'));
const CustomerRouter = lazy(() => import('./router/CustomerRouter'));

// ✅ Route children configs
const adminChildren = [
  { path: '', index: true, element: <AdminDashboard /> },
  { path: 'queries', element: <QueryManagement /> },
  { path: 'query/:petitionId', element: <QueryChat /> },
  { path: 'email-dashboard', element: <EmailTicketDashboard /> },
  { path: 'create-employee', element: <CreateEmployee /> },
  { path: 'edit-employee/:id', element: <EditEmployee /> },
  { path: 'employees', element: <EmployeeList /> },
  { path: 'password-management', element: <PasswordManagement /> },
  { path: 'email-config', element: <AdminEmailConfig /> },
  { path: 'location-access', element: <LocationAccess /> },
  { path: 'location-settings', element: <LocationSettings /> },
  { path: 'faq-management', element: <FaqManagement /> },
  { path: 'training-material', element: <TrainingMaterialManagement /> },
  { path: 'ip-configuration', element: <IpConfiguration /> },
  { path: 'organization-ip-config', element: <OrganizationIpConfig /> },
  { path: 'screenshots', element: <CallScreenshotGallery /> },
  { path: 'reports/agents-performance', element: <AgentPerformanceDetail /> },
  { path: 'reports/agent-activity', element: <AgentActivity /> },
  { path: 'reports/qa-performance', element: <QAPerformanceDetail /> },
  { path: 'reports/qa-activity', element: <QAActivity /> },
  { path: 'reports/tl-performance', element: <TLPerformanceDetail /> },
  { path: 'reports/tl-activity', element: <TLActivity /> },
  { path: 'profile', element: <AdminProfile /> },
  { path: 'customers', element: <CustomerList /> },
  { path: 'customers/:customerId', element: <CustomerDetails /> },
  { path: 'shift-management', element: <ShiftManagement /> },
  { path: 'attendance-management', element: <AttendanceManagement /> },
  { path: 'holiday-management', element: <HolidayManagement /> },
  { path: 'leave-management', element: <LeaveManagement /> },
  {
    path: 'ticketing',
    element: <InboxLayout />,
    children: [
      { path: '', index: true, element: <MyInboxEmailView /> },
      {
        path: 'my-inbox',
        element: <MyInboxEmailView />,
        children: [{ path: ':ticketId', element: <EmailTicketDetail /> }],
      },
      {
        path: 'unassigned',
        element: <UnassignedEmailView />,
        children: [{ path: ':ticketId', element: <EmailTicketDetail /> }],
      },
      {
        path: 'all',
        element: <AllEmailView />,
        children: [{ path: ':ticketId', element: <EmailTicketDetail /> }],
      },
      {
        path: 'team/:teamName',
        element: <TeamInboxEmailView />,
        children: [{ path: ':ticketId', element: <EmailTicketDetail /> }],
      },
      {
        path: 'view/:viewName',
        element: <ViewEmailView />,
        children: [{ path: ':ticketId', element: <EmailTicketDetail /> }],
      },
    ],
  },
];
const qaChildren = [
  { path: '', index: true, element: <QaDashboard /> },
  { path: 'chat', element: <FullPageChat /> },
  { path: 'queries', element: <QueryManagement /> },
  { path: 'query/:petitionId', element: <QueryChat /> },
  { path: 'ratings', element: <AgentRatings /> },
  { path: 'calls', element: <Calls /> },
  { path: 'screenshots', element: <CallScreenshotGallery /> },
  { path: 'training-material', element: <TrainingMaterialView /> },
  { path: 'profile', element: <QAProfile /> },
  { path: 'customers', element: <CustomerList /> },
  { path: 'customers/:customerId', element: <CustomerDetails /> },
  { path: 'mark-attendance', element: <AttendanceMark /> },
  { path: 'my-attendance', element: <MyAttendance /> },
  { path: 'leave-apply', element: <LeaveApply /> },
  {
    path: 'ticketing',
    element: <InboxLayout />,
    children: [
      { path: '', index: true, element: <MyInboxEmailView /> },
      {
        path: 'my-inbox',
        element: <MyInboxEmailView />,
        children: [{ path: ':ticketId', element: <EmailTicketDetail /> }],
      },
      {
        path: 'unassigned',
        element: <UnassignedEmailView />,
        children: [{ path: ':ticketId', element: <EmailTicketDetail /> }],
      },
      {
        path: 'all',
        element: <AllEmailView />,
        children: [{ path: ':ticketId', element: <EmailTicketDetail /> }],
      },
      {
        path: 'team/:teamName',
        element: <TeamInboxEmailView />,
        children: [{ path: ':ticketId', element: <EmailTicketDetail /> }],
      },
      {
        path: 'view/:viewName',
        element: <ViewEmailView />,
        children: [{ path: ':ticketId', element: <EmailTicketDetail /> }],
      },
    ],
  },
];

// TL children - reuses QA components but has its own route namespace
const tlChildren = [
  { path: '', index: true, element: <QaDashboard /> },
  { path: 'chat', element: <FullPageChat /> },
  { path: 'queries', element: <QueryManagement /> },
  { path: 'query/:petitionId', element: <QueryChat /> },
  { path: 'ratings', element: <AgentRatings /> },
  { path: 'calls', element: <Calls /> },
  { path: 'screenshots', element: <CallScreenshotGallery /> },
  { path: 'training-material', element: <TrainingMaterialView /> },
  { path: 'profile', element: <TLProfile /> },
  { path: 'customers', element: <CustomerList /> },
  { path: 'customers/:customerId', element: <CustomerDetails /> },
  { path: 'reports/agents-performance', element: <TLAgentPerformanceDetail /> },
  { path: 'reports/agent-activity', element: <TLAgentActivity /> },
  { path: 'mark-attendance', element: <AttendanceMark /> },
  { path: 'my-attendance', element: <MyAttendance /> },
  { path: 'shift-management', element: <ShiftManagement /> },
  { path: 'attendance-management', element: <AttendanceManagement /> },
  { path: 'holiday-management', element: <HolidayManagement /> },
  { path: 'leave-management', element: <LeaveManagement /> },
  { path: 'leave-apply', element: <LeaveApply /> },
  { path: 'reports/qa-performance', element: <TLQAPerformanceDetail /> },
  { path: 'reports/qa-activity', element: <TLQAActivity /> },
  {
    path: 'ticketing',
    element: <InboxLayout />,
    children: [
      { path: '', index: true, element: <MyInboxEmailView /> },
      {
        path: 'my-inbox',
        element: <MyInboxEmailView />,
        children: [{ path: ':ticketId', element: <EmailTicketDetail /> }],
      },
      {
        path: 'unassigned',
        element: <UnassignedEmailView />,
        children: [{ path: ':ticketId', element: <EmailTicketDetail /> }],
      },
      {
        path: 'all',
        element: <AllEmailView />,
        children: [{ path: ':ticketId', element: <EmailTicketDetail /> }],
      },
      {
        path: 'team/:teamName',
        element: <TeamInboxEmailView />,
        children: [{ path: ':ticketId', element: <EmailTicketDetail /> }],
      },
      {
        path: 'view/:viewName',
        element: <ViewEmailView />,
        children: [{ path: ':ticketId', element: <EmailTicketDetail /> }],
      },
    ],
  },
];
const agentChildren = [
  { path: '', index: true, element: <AgentDashboard /> },
  { path: 'chat', element: <FullPageChat /> },
  { path: 'queries', element: <QueryManagement /> },
  { path: 'query/:petitionId', element: <QueryChat /> },
  { path: 'calls', element: <Calls /> },
  { path: 'mark-attendance', element: <AttendanceMark /> },
  { path: 'my-attendance', element: <MyAttendance /> },
  { path: 'leave-apply', element: <LeaveApply /> },
  { path: 'screenshots', element: <CallScreenshotGallery /> },
  { path: 'profile', element: <AgentProfile /> },
  { path: 'customers', element: <CustomerList /> },
  { path: 'customers/:customerId', element: <CustomerDetails /> },
  {
    path: 'ticketing',
    element: <InboxLayout />,
    children: [
      { path: '', index: true, element: <MyInboxEmailView /> },
      {
        path: 'my-inbox',
        element: <MyInboxEmailView />,
        children: [{ path: ':ticketId', element: <EmailTicketDetail /> }],
      },
      {
        path: 'unassigned',
        element: <UnassignedEmailView />,
        children: [{ path: ':ticketId', element: <EmailTicketDetail /> }],
      },
      {
        path: 'all',
        element: <AllEmailView />,
        children: [{ path: ':ticketId', element: <EmailTicketDetail /> }],
      },
      {
        path: 'team/:teamName',
        element: <TeamInboxEmailView />,
        children: [{ path: ':ticketId', element: <EmailTicketDetail /> }],
      },
      {
        path: 'view/:viewName',
        element: <ViewEmailView />,
        children: [{ path: ':ticketId', element: <EmailTicketDetail /> }],
      },
    ],
  },
];
const customerChildren = [
  { path: '', index: true, element: <Home /> },
  { path: 'chat', element: <CustomerChat /> },
  { path: 'profile', element: <CustomerProfile /> },
  { path: 'queries', element: <QueryHistory /> },
  { path: 'query/:petitionId', element: <QueryChat /> },
  { path: 'inbox', element: <CustomerEmailPage /> },
  { path: 'inbox/:ticketId', element: <InboxDetail /> },
  { path: 'calls', element: <Calls /> },
  { path: 'screenshots', element: <CallScreenshotGallery /> },
];

// ✅ Main Router
const routers = createBrowserRouter(
  [
    {
      path: '/',
      element: <PublicRouter />,
      errorElement: <RouteErrorBoundary />,
      children: [{ path: '', index: true, element: <LandingPage /> }],
    },
    {
      path: '/login',
      element: <PublicRouter />,
      errorElement: <RouteErrorBoundary />,
      children: [{ path: '', index: true, element: <Login /> }],
    },
    {
      path: '/superadmin/login',
      element: (
        <Suspense fallback={<Loading fullScreen={true} size="lg" />}>
          <SuperAdminLogin />
        </Suspense>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: '/superadmin',
      element: (
        <Suspense fallback={<Loading fullScreen={true} size="lg" />}>
          <SuperAdminRoute>
            <SuperAdminLayout />
          </SuperAdminRoute>
        </Suspense>
      ),
      errorElement: <RouteErrorBoundary />,
      children: [
        {
          path: 'dashboard',
          element: <SuperAdminDashboard />,
          errorElement: <RouteErrorBoundary />,
        },
        {
          path: 'organizations',
          element: <OrganizationsList />,
          errorElement: <RouteErrorBoundary />,
        },
        {
          path: 'location-summary',
          element: <OrgLocationSummary />,
          errorElement: <RouteErrorBoundary />,
        },
        {
          path: 'organizations/:id',
          element: <OrganizationDetails />,
          errorElement: <RouteErrorBoundary />,
        },
        {
          path: 'link-admins',
          element: <LinkUnlinkedAdmins />,
          errorElement: <RouteErrorBoundary />,
        },
        {
          path: 'location-settings',
          element: <SuperAdminLocationSettings />,
          errorElement: <RouteErrorBoundary />,
        },
      ],
    },
    {
      path: '/signup',
      element: <PublicRouter />,
      errorElement: <RouteErrorBoundary />,
      children: [{ path: '', index: true, element: <Register /> }],
    },
    {
      path: '/video-call',
      element: (
        <Suspense fallback={<Loading fullScreen={true} size="lg" />}>
          <VideoCallPage />
        </Suspense>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: '/widget-demo',
      element: (
        <Suspense fallback={<Loading fullScreen={true} size="lg" />}>
          <WidgetDemo />
        </Suspense>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: '/geocam/capture/:token',
      element: (
        <Suspense fallback={<Loading fullScreen={true} size="lg" />}>
          <GeocamCapture />
        </Suspense>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: '/location-access/capture/:token',
      element: (
        <Suspense fallback={<Loading fullScreen={true} size="lg" />}>
          <ClientLocationCapture />
        </Suspense>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: '/admin',
      element: (
        <Suspense fallback={<Loading fullScreen={true} size="lg" />}>
          <ProtectedRouter allowedRoles={['Admin']} />
        </Suspense>
      ),
      errorElement: <RouteErrorBoundary />,
      children: adminChildren.map((child) => ({
        ...child,
        errorElement: <RouteErrorBoundary />,
      })),
    },
    {
      path: '/qa',
      element: (
        <Suspense fallback={<Loading fullScreen={true} size="lg" />}>
          <ProtectedRouter allowedRoles={['QA']} />
        </Suspense>
      ),
      errorElement: <RouteErrorBoundary />,
      children: qaChildren.map((child) => ({
        ...child,
        errorElement: <RouteErrorBoundary />,
      })),
    },
    {
      path: '/tl',
      element: (
        <Suspense fallback={<Loading fullScreen={true} size="lg" />}>
          <ProtectedRouter allowedRoles={['TL']} />
        </Suspense>
      ),
      errorElement: <RouteErrorBoundary />,
      children: tlChildren.map((child) => ({
        ...child,
        errorElement: <RouteErrorBoundary />,
      })),
    },
    {
      path: '/agent',
      element: (
        <Suspense fallback={<Loading fullScreen={true} size="lg" />}>
          <ProtectedRouter allowedRoles={['Agent']} />
        </Suspense>
      ),
      errorElement: <RouteErrorBoundary />,
      children: agentChildren.map((child) => ({
        ...child,
        errorElement: <RouteErrorBoundary />,
      })),
    },
    {
      path: '/customer',
      element: (
        <Suspense fallback={<Loading fullScreen={true} size="lg" />}>
          <CustomerRouter allowedRoles={['Customer']} />
        </Suspense>
      ),
      errorElement: <RouteErrorBoundary />,
      children: customerChildren.map((child) => ({
        ...child,
        errorElement: <RouteErrorBoundary />,
      })),
    },
    {
      path: '*',
      element: <RouteErrorBoundary />,
    },
  ],
  { basename: '/UTC-99810035/' }
);

export default function MainRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading fullScreen={true} size="lg" />}>
        <RouterProvider router={routers} />
      </Suspense>
    </ErrorBoundary>
  );
}
