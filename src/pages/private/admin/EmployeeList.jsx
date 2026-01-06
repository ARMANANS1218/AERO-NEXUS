import React, { useState, useMemo } from 'react';
import { CircularProgress, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip, TextField } from '@mui/material';
import { Edit, Delete, Block, CheckCircle, Refresh, Search, Visibility, Lock, LockOpen, ContentCopy, VpnKey, VisibilityOff, NetworkCheck } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useGetAllEmployeesQuery, useUpdateEmployeeStatusMutation, useUnblockLoginAccountMutation, useUpdateAuthorizedIPMutation, useDeleteEmployeeMutation, useResetEmployeePasswordMutation } from '../../../features/admin/adminApi';
import { useNavigate } from 'react-router-dom';

const EmployeeList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');
  const [blockedFilter, setBlockedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, employee: null });
  const [viewDialog, setViewDialog] = useState({ open: false, employee: null });
  const [passwordDialog, setPasswordDialog] = useState({ open: false, employee: null, mode: 'auto', password: '', showCurrentPassword: false, showNewPassword: false });
  const [ipDialog, setIpDialog] = useState({ open: false, employee: null, newIP: '' });

  const { data: employeesData, isLoading, refetch } = useGetAllEmployeesQuery();
  const [updateStatus] = useUpdateEmployeeStatusMutation();
  const [unblockLogin] = useUnblockLoginAccountMutation();
  const [updateAuthorizedIP] = useUpdateAuthorizedIPMutation();
  const [deleteEmployee] = useDeleteEmployeeMutation();
  const [resetPassword] = useResetEmployeePasswordMutation();

  // Generate strong random password
  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)];
    
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const employees = employeesData?.data || [];

  // Filter and search logic
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesRole = roleFilter === 'All' || emp.role === roleFilter;
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Online' && emp.is_active && !emp.logout_time) ||
        (statusFilter === 'Offline' && (emp.logout_time || !emp.is_active));
      const matchesTier =
        tierFilter === 'All' || (emp.tier ? emp.tier === tierFilter : false);
      const matchesBlocked =
        blockedFilter === 'All' ||
        (blockedFilter === 'Blocked' && emp.isBlocked) ||
        (blockedFilter === 'Active' && !emp.isBlocked);
      const matchesSearch =
        searchQuery === '' ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_id?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesRole && matchesStatus && matchesTier && matchesBlocked && matchesSearch;
    });
  }, [employees, roleFilter, statusFilter, tierFilter, blockedFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const admins = employees.filter((e) => e.role === 'Admin').length;
    const agents = employees.filter((e) => e.role === 'Agent').length;
    const qa = employees.filter((e) => e.role === 'QA').length;
    const tl = employees.filter((e) => e.role === 'TL').length;
    const online = employees.filter((e) => e.is_active && !e.logout_time).length;
    const blocked = employees.filter((e) => e.isBlocked).length;
    
    return { admins, agents, qa, tl, online, blocked, total: employees.length };
  }, [employees]);

  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  const handleBlockUnblock = async (employeeId, currentStatus) => {
    try {
      await updateStatus({ id: employeeId, is_active: !currentStatus }).unwrap();
      toast.success(`Employee ${currentStatus ? 'blocked' : 'unblocked'} successfully`);
      refetch();
    } catch (error) {
      toast.error('Failed to update employee status');
    }
  };

  const handleUnblockLogin = async (employeeId, employeeName) => {
    if (window.confirm(`Unblock login for ${employeeName}? This will reset failed login attempts and allow them to login again.`)) {
      try {
        await unblockLogin(employeeId).unwrap();
        toast.success(`${employeeName}'s account unblocked successfully`);
        refetch();
      } catch (error) {
        toast.error('Failed to unblock account');
      }
    }
  };

  const handleUpdateIP = async () => {
    if (!ipDialog.newIP || !ipDialog.newIP.trim()) {
      toast.error('Please enter a valid IP address');
      return;
    }

    // Basic IP validation
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ipDialog.newIP.trim())) {
      toast.error('Invalid IP address format');
      return;
    }

    try {
      const response = await updateAuthorizedIP({ 
        employeeId: ipDialog.employee._id, 
        newIP: ipDialog.newIP.trim() 
      }).unwrap();
      
      toast.success(response.message || 'Authorized IP updated successfully');
      setIpDialog({ open: false, employee: null, newIP: '' });
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update authorized IP');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEmployee(deleteDialog.employee._id).unwrap();
      toast.success('Employee deleted successfully');
      setDeleteDialog({ open: false, employee: null });
      refetch();
    } catch (error) {
      toast.error('Failed to delete employee');
    }
  };

  const handleEdit = (employee) => {
    // Navigate to edit page with employee data
    navigate(`/admin/edit-employee/${employee._id}`, { state: { employee } });
  };

  const handleView = (employee) => {
    setViewDialog({ open: true, employee });
  };

  const getRoleBadgeColor = (role) => {
    if (role === 'Admin') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    if (role === 'Agent') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
  };

  const getStatusBadgeColor = (status) => {
    if (status === 'active') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (status === 'break') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-400';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <CircularProgress className="text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-950">
      <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
        Employee Management
      </h1>

      {/* Stats Cards */}
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 mb-6">
        <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
        </div>
        <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.admins}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
        </div>
        <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.agents}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Agents</p>
        </div>
        <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.qa}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">QA</p>
        </div>
        <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.tl}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">TL</p>
        </div>
        <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.online}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Online</p>
        </div>
        <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 shadow-sm">
          <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.blocked}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">🔒 Blocked</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-2 mb-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" fontSize="small" />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
                bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent
                placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
              bg-white dark:bg-slate-700 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          >
            <option value="All">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Agent">Agent</option>
            <option value="QA">QA</option>
            <option value="TL">TL</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
              bg-white dark:bg-slate-700 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          >
            <option value="All">All Status</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>

          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
              bg-white dark:bg-slate-700 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          >
            <option value="All">All Tiers</option>
            <option value="Tier-1">Tier-1</option>
            <option value="Tier-2">Tier-2</option>
            <option value="Tier-3">Tier-3</option>
          </select>

          {/* Blocked Filter */}
          <select
            value={blockedFilter}
            onChange={(e) => setBlockedFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
              bg-white dark:bg-slate-700 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          >
            <option value="All">All Accounts</option>
            <option value="Active">Active</option>
            <option value="Blocked">🔒 Blocked</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={refetch}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
              bg-white dark:bg-slate-700 text-gray-900 dark:text-white
              hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors duration-200
              flex items-center gap-2"
          >
            <Refresh fontSize="small" />
            Refresh
          </button>
        </div>
      </div>

      {/* Employee Table */}
      <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                  SL No
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                  Employee
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                  ID
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                  Role
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                  Tier
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                  Dept
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                  Mobile
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                  Status
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                  Work
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                  Login
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                  Pass
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {paginatedEmployees.map((employee, index) => (
                <tr key={employee._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-2 py-2 text-sm text-gray-900 dark:text-white">
                    {page * rowsPerPage + index + 1}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={employee.profileImage?.startsWith('http') ? employee.profileImage : `${import.meta.env.VITE_API_URL || ''}${employee.profileImage}`}
                        alt={employee.name}
                        className="w-8 h-8 bg-blue-500"
                      >
                        {employee.name.charAt(0)}
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {employee.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {employee.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-900 dark:text-white">
                    {employee.employee_id || 'N/A'}
                  </td>
                  <td className="px-2 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(employee.role)}`}>
                      {employee.role}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-900 dark:text-white">
                    {employee.tier || 'NA'}
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-900 dark:text-white">
                    {employee.department || 'N/A'}
                  </td>
                  <td className="px-2 py-2 text-sm text-gray-900 dark:text-white">
                    {employee.mobile}
                  </td>
                  <td className="px-2 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      employee.logout_time
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-400'
                        : employee.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-400'
                    }`}>
                      {employee.logout_time ? 'Offline' : (employee.is_active ? 'Online' : 'Offline')}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(employee.workStatus)}`}>
                      {employee.workStatus}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    {employee.isBlocked ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1 w-fit">
                        <Lock fontSize="small" sx={{ fontSize: 12 }} />
                        Blocked
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center justify-center gap-2">
                      <Tooltip title="Reset Password">
                        <IconButton
                          size="small"
                          onClick={() => {
                            const generatedPass = generatePassword();
                            setPasswordDialog({ 
                              open: true, 
                              employee, 
                              mode: 'auto', 
                              password: generatedPass,
                              showCurrentPassword: false,
                              showNewPassword: false 
                            });
                          }}
                          className="text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        >
                          <VpnKey fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center justify-center gap-1">
                      {employee.isBlocked && (
                        <button
                          onClick={() => handleUnblockLogin(employee._id, employee.name)}
                          className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                          title="Unblock Login"
                        >
                          <LockOpen sx={{ fontSize: 18 }} />
                        </button>
                      )}
                      
                      {(employee.role === 'Agent' || employee.role === 'TL' || employee.role === 'QA') && (
                        <button
                          onClick={() => setIpDialog({ open: true, employee, newIP: employee.ip || '' })}
                          className="p-1 rounded text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                          title="Update Authorized IP"
                        >
                          <NetworkCheck sx={{ fontSize: 18 }} />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleView(employee)}
                        className="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="View Details"
                      >
                        <Visibility sx={{ fontSize: 18 }} />
                      </button>

                      <button
                        onClick={() => handleEdit(employee)}
                        className="p-1 rounded text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                        title="Edit"
                      >
                        <Edit sx={{ fontSize: 18 }} />
                      </button>
                      
                      <button
                        onClick={() => handleBlockUnblock(employee._id, employee.is_active)}
                        className={`p-1 rounded transition-colors ${
                          employee.is_active
                            ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                            : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                        }`}
                        title={employee.is_active ? 'Block' : 'Unblock'}
                      >
                        {employee.is_active ? <Block sx={{ fontSize: 18 }} /> : <CheckCircle sx={{ fontSize: 18 }} />}
                      </button>
                      
                      <button
                        onClick={() => setDeleteDialog({ open: true, employee })}
                        className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete"
                      >
                        <Delete sx={{ fontSize: 18 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredEmployees.length)} of {filteredEmployees.length} entries
            </p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">Show:</label>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(0);
                }}
                className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                  border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700
                  focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={75}>75</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleChangePage(page - 1)}
              disabled={page === 0}
              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => handleChangePage(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View Employee Dialog */}
      <Dialog 
        open={viewDialog.open} 
        onClose={() => setViewDialog({ open: false, employee: null })}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: 'bg-white dark:bg-slate-800'
        }}
      >
        <DialogTitle className="text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700">
          Employee Details
        </DialogTitle>
        <DialogContent className="mt-4">
          {viewDialog.employee && (
            <div className="space-y-4">
              {/* Profile Section */}
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <Avatar
                  src={viewDialog.employee.profileImage?.startsWith('http') ? viewDialog.employee.profileImage : `${import.meta.env.VITE_API_URL || ''}${viewDialog.employee.profileImage}`}
                  alt={viewDialog.employee.name}
                  className="w-20 h-20 bg-blue-500"
                  sx={{ width: 80, height: 80 }}
                >
                  {viewDialog.employee.name.charAt(0)}
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {viewDialog.employee.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {viewDialog.employee.email}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(viewDialog.employee.role)}`}>
                      {viewDialog.employee.role}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      viewDialog.employee.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-400'
                    }`}>
                      {viewDialog.employee.is_active ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Employee ID</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {viewDialog.employee.employee_id || 'N/A'}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tier</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {viewDialog.employee.tier || 'NA'}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Department</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {viewDialog.employee.department || 'N/A'}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mobile</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {viewDialog.employee.mobile}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Work Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(viewDialog.employee.workStatus)}`}>
                    {viewDialog.employee.workStatus}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Login Status</p>
                  {viewDialog.employee.isBlocked ? (
                    <div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1 w-fit mb-2">
                        <Lock fontSize="small" sx={{ fontSize: 14 }} />
                        Blocked
                      </span>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Reason: {viewDialog.employee.blockedReason || 'Multiple failed login attempts'}
                      </p>
                      {viewDialog.employee.blockedAt && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Blocked: {new Date(viewDialog.employee.blockedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </span>
                  )}
                </div>

                <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg md:col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Full Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {viewDialog.employee.name}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg md:col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Address</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {viewDialog.employee.address || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className="p-2 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setViewDialog({ open: false, employee: null })}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 
              hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
          >
            Close
          </button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialog.open} 
        onClose={() => setDeleteDialog({ open: false, employee: null })}
        PaperProps={{
          className: 'bg-white dark:bg-slate-800'
        }}
      >
        <DialogTitle className="text-gray-900 dark:text-white">
          Confirm Delete
        </DialogTitle>
        <DialogContent className="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete employee <strong className="text-gray-900 dark:text-white">{deleteDialog.employee?.name}</strong>?
          This action cannot be undone.
        </DialogContent>
        <DialogActions className="p-2">
          <button
            onClick={() => setDeleteDialog({ open: false, employee: null })}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 
              hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            Delete
          </button>
        </DialogActions>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog
        open={passwordDialog.open}
        onClose={() => setPasswordDialog({ open: false, employee: null, mode: 'auto', password: '', showCurrentPassword: false, showNewPassword: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          Reset Password for {passwordDialog.employee?.name}
        </DialogTitle>
        <DialogContent className="p-4 dark:bg-slate-800">
          <div className="space-y-4 mt-4">
            {/* Current Password Display */}
            <div className="bg-blue-50 dark:bg-slate-700 p-4 rounded-lg border border-blue-200 dark:border-slate-600">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Current Password
              </label>
              <div className="flex items-center gap-2">
                <input
                  type={passwordDialog.showCurrentPassword ? 'text' : 'password'}
                  value={passwordDialog.employee?.visiblePassword || 'No password set'}
                  readOnly
                  className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg 
                    text-gray-700 dark:text-gray-300 font-mono"
                />
                {passwordDialog.employee?.visiblePassword && (
                  <>
                    <IconButton
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(passwordDialog.employee.visiblePassword);
                        toast.success('Current password copied!');
                      }}
                      className="text-blue-600 dark:text-blue-400"
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setPasswordDialog(prev => ({ ...prev, showCurrentPassword: !prev.showCurrentPassword }))}
                      className="text-blue-600 dark:text-blue-400"
                    >
                      {passwordDialog.showCurrentPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </>
                )}
              </div>
            </div>

            {/* Password Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  const generatedPass = generatePassword();
                  setPasswordDialog(prev => ({ ...prev, mode: 'auto', password: generatedPass }));
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  passwordDialog.mode === 'auto'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                🔐 Auto Generate
              </button>
              <button
                type="button"
                onClick={() => setPasswordDialog(prev => ({ ...prev, mode: 'manual', password: '' }))}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  passwordDialog.mode === 'manual'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                ✍️ Manual Entry
              </button>
            </div>

            {/* New Password Input */}
            <div className="relative">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <div className="relative">
                <input
                  type={passwordDialog.showNewPassword ? 'text' : 'password'}
                  value={passwordDialog.password}
                  onChange={(e) => setPasswordDialog(prev => ({ ...prev, password: e.target.value }))}
                  disabled={passwordDialog.mode === 'auto'}
                  className="w-full px-4 py-2 pr-20 border border-gray-300 dark:border-slate-600 rounded-lg 
                    focus:ring-2 focus:ring-purple-500 focus:border-transparent
                    disabled:bg-gray-100 dark:disabled:bg-slate-700
                    dark:bg-slate-800 dark:text-white"
                  placeholder={passwordDialog.mode === 'auto' ? 'Generated password' : 'Enter new password'}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  {passwordDialog.mode === 'auto' && passwordDialog.password && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(passwordDialog.password);
                        toast.success('New password copied to clipboard!');
                      }}
                      className="text-green-600 dark:text-green-400"
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => setPasswordDialog(prev => ({ ...prev, showNewPassword: !prev.showNewPassword }))}
                    className="text-gray-600 dark:text-gray-400"
                  >
                    {passwordDialog.showNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </div>
              </div>
              {passwordDialog.mode === 'auto' && passwordDialog.password && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  ✓ Strong password generated successfully!
                </p>
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions className="p-2">
          <button
            onClick={() => setPasswordDialog({ open: false, employee: null, mode: 'auto', password: '', showCurrentPassword: false, showNewPassword: false })}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 
              hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (!passwordDialog.password) {
                toast.error('Please enter a password');
                return;
              }
              try {
                await resetPassword({ 
                  id: passwordDialog.employee._id, 
                  password: passwordDialog.password 
                }).unwrap();
                toast.success('Password reset successfully!');
                setPasswordDialog({ open: false, employee: null, mode: 'auto', password: '', showCurrentPassword: false, showNewPassword: false });
                refetch();
              } catch (error) {
                toast.error(error?.data?.message || 'Failed to reset password');
              }
            }}
            disabled={!passwordDialog.password}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white
              hover:from-purple-700 hover:to-blue-700 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Password
          </button>
        </DialogActions>
      </Dialog>

      {/* Update Authorized IP Dialog */}
      <Dialog 
        open={ipDialog.open} 
        onClose={() => setIpDialog({ open: false, employee: null, newIP: '' })}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: "bg-white dark:bg-slate-800 rounded-xl shadow-2xl"
        }}
      >
        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white pb-2 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <NetworkCheck className="text-indigo-600 dark:text-indigo-400" />
            Update Authorized IP
          </div>
        </DialogTitle>
        <DialogContent className="pt-4">
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>{ipDialog.employee?.name}</strong> ({ipDialog.employee?.role})
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {ipDialog.employee?.email}
              </p>
            </div>

            {ipDialog.employee?.ip && (
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current Authorized IP:</p>
                <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                  {ipDialog.employee.ip}
                </p>
              </div>
            )}

            <TextField
              fullWidth
              label="New Authorized IP Address"
              placeholder="e.g., 103.154.247.122"
              value={ipDialog.newIP}
              onChange={(e) => setIpDialog({ ...ipDialog, newIP: e.target.value })}
              className="bg-white dark:bg-slate-700"
              InputLabelProps={{
                className: "text-gray-700 dark:text-gray-300"
              }}
              InputProps={{
                className: "text-gray-900 dark:text-white font-mono"
              }}
            />

            {ipDialog.employee?.isBlocked && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="text-red-600 dark:text-red-400" fontSize="small" />
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                    Account is Currently Blocked
                  </p>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Reason: {ipDialog.employee?.blockedReason || 'Multiple failed login attempts'}
                </p>
                {ipDialog.employee?.blockedAt && (
                  <p className="text-xs text-red-500 dark:text-red-500 mt-1">
                    Blocked at: {new Date(ipDialog.employee.blockedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                ⚠️ <strong>Note:</strong> This user will only be able to login from the new IP address after this update.
              </p>
            </div>
          </div>
        </DialogContent>
        <DialogActions className="p-4 border-t border-gray-200 dark:border-slate-700 gap-2">
          <button
            onClick={() => setIpDialog({ open: false, employee: null, newIP: '' })}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 
              hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          
          {ipDialog.employee?.isBlocked && (
            <button
              onClick={async () => {
                try {
                  await unblockLogin(ipDialog.employee._id).unwrap();
                  toast.success(`${ipDialog.employee.name}'s account unblocked successfully`);
                  setIpDialog({ open: false, employee: null, newIP: '' });
                  refetch();
                } catch (error) {
                  toast.error('Failed to unblock account');
                }
              }}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white
                hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2"
            >
              <LockOpen fontSize="small" />
              Unblock ID
            </button>
          )}
          
          <button
            onClick={handleUpdateIP}
            disabled={!ipDialog.newIP}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white
              hover:from-indigo-700 hover:to-blue-700 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update IP
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default EmployeeList;
