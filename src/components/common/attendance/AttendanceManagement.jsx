import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Image as ImageIcon,
  Download,
  Edit2,
  Plus,
  Filter,
  Search,
  X,
  Save,
  Eye
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../../config/api';

export default function AttendanceManagement() {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManualMarkModal, setShowManualMarkModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-11
  const currentYear = currentDate.getFullYear();
  
  // Generate month options (last 12 months)
  const generateMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      options.push({ label: monthName, value: monthValue });
    }
    return options;
  };

  const [selectedMonth, setSelectedMonth] = useState(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);

  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    shiftId: '',
    userId: '',
    status: '',
    role: ''
  });

  // Update filters when month changes
  const handleMonthChange = (monthValue) => {
    setSelectedMonth(monthValue);
    const [year, month] = monthValue.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    setFilters({ ...filters, date: firstDay.toISOString().split('T')[0] });
  };

  const [editForm, setEditForm] = useState({
    checkInTime: '',
    checkOutTime: '',
    status: '',
    editRemark: ''
  });

  const [manualMarkForm, setManualMarkForm] = useState({
    userId: '',
    shiftId: '',
    date: new Date().toISOString().split('T')[0],
    checkInTime: '',
    checkOutTime: '',
    status: 'Present',
    remarks: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchShifts();
    fetchAttendance();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [filters.date, filters.shiftId, filters.userId, filters.status, filters.role]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/user/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter out Admin role - only show Agent, TL, QA
      const filteredEmployees = (response.data.data || []).filter(
        emp => emp.role !== 'Admin'
      );
      setEmployees(filteredEmployees);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  // Filter employees based on search
  const filteredEmployees = employees.filter(emp => {
    const searchLower = employeeSearch.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(searchLower) ||
      emp.employee_id?.toLowerCase().includes(searchLower)
    );
  });

  const fetchShifts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/shift`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShifts(response.data.shifts || []);
    } catch (err) {
      console.error('Error fetching shifts:', err);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.shiftId) params.shiftId = filters.shiftId;
      if (filters.userId) params.userId = filters.userId;
      if (filters.status) params.status = filters.status;

      const response = await axios.get(`${API_URL}/api/v1/attendance/all`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendance(response.data.attendance || []);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Error loading attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setEditForm({
      checkInTime: record.checkInTime ? new Date(record.checkInTime).toISOString().slice(0, 16) : '',
      checkOutTime: record.checkOutTime ? new Date(record.checkOutTime).toISOString().slice(0, 16) : '',
      status: record.status,
      editRemark: ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/v1/attendance/${editingRecord._id}`,
        editForm,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSuccess('Attendance updated successfully');
      setShowEditModal(false);
      fetchAttendance();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating attendance');
    }
  };

  const handleManualMarkSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/v1/attendance/manual-mark`,
        manualMarkForm,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSuccess('Attendance marked successfully');
      setShowManualMarkModal(false);
      setManualMarkForm({
        userId: '',
        shiftId: '',
        date: new Date().toISOString().split('T')[0],
        checkInTime: '',
        checkOutTime: '',
        status: 'Present',
        remarks: ''
      });
      fetchAttendance();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error marking attendance');
    }
  };

  const downloadDailyReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {
        date: filters.date,
        format: 'csv'
      };
      if (filters.shiftId) params.shiftId = filters.shiftId;

      const response = await axios.get(`${API_URL}/api/v1/attendance/download/report`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      // Convert to CSV and download
      const csvData = response.data.data;
      const csv = convertToCSV(csvData);
      downloadCSV(csv, `attendance-${filters.date}.csv`);
      setSuccess('Report downloaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error downloading report');
    }
  };

  const downloadDailyReportPDF = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {
        date: filters.date
      };
      if (filters.shiftId) params.shiftId = filters.shiftId;

      const response = await axios.get(`${API_URL}/api/v1/attendance/all`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      const attendanceData = response.data.attendance || [];
      
      // Generate PDF HTML
      const pdfHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Daily Attendance Report - ${filters.date}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #4CAF50; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .status-on-time { color: green; font-weight: bold; }
            .status-late { color: orange; font-weight: bold; }
            .status-absent { color: red; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Daily Attendance Report</h1>
          <p style="text-align: center;">Date: ${filters.date}</p>
          <table>
            <thead>
              <tr>
                <th>SL No</th>
                <th>Employee</th>
                <th>Shift</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Hours</th>
                <th>Status</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              ${attendanceData.map((record, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${record.userId?.name || 'N/A'}<br><small>${record.userId?.employee_id || 'N/A'}</small></td>
                  <td>${record.shiftId?.shiftName || 'N/A'}</td>
                  <td>${formatTime(record.checkInTime)}</td>
                  <td>${formatTime(record.checkOutTime)}</td>
                  <td>${record.totalHours.toFixed(2)}h</td>
                  <td class="status-${record.status.toLowerCase().replace(' ', '-')}">${record.status}</td>
                  <td>${record.checkInIp || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p style="margin-top: 20px; text-align: center; font-size: 11px; color: #666;">
            Generated on ${new Date().toLocaleString()}
          </p>
        </body>
        </html>
      `;

      // Open print dialog
      const printWindow = window.open('', '_blank');
      printWindow.document.write(pdfHTML);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        setSuccess('PDF report generated successfully');
        setTimeout(() => setSuccess(''), 3000);
      }, 500);
    } catch (err) {
      setError('Error generating PDF report');
    } finally {
      setLoading(false);
    }
  };

  const downloadMonthlyReport = async (userId = null) => {
    try {
      const token = localStorage.getItem('token');
      const date = new Date(filters.date);
      const params = {
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        format: 'csv'
      };
      if (userId) params.userId = userId;
      if (filters.shiftId) params.shiftId = filters.shiftId;

      const response = await axios.get(`${API_URL}/api/v1/attendance/download/report`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      const csvData = response.data.data;
      const csv = convertToCSV(csvData);
      const fileName = userId 
        ? `attendance-monthly-${userId}-${date.getMonth() + 1}-${date.getFullYear()}.csv`
        : `attendance-monthly-all-${date.getMonth() + 1}-${date.getFullYear()}.csv`;
      downloadCSV(csv, fileName);
      setSuccess('Monthly report downloaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error downloading monthly report');
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'On Time': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Late': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Half Day': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Absent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  return (
    <div className="p-6 min-h-screen dark:bg-gray-950">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Attendance Management
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowManualMarkModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Mark Manually
          </button>
          <button
            onClick={downloadDailyReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download size={20} />
            Daily CSV
          </button>
          <button
            onClick={downloadDailyReportPDF}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Download size={20} />
            Daily PDF
          </button>
          <button
            onClick={() => downloadMonthlyReport()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Download size={20} />
            Monthly Report
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={18} /></button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}><X size={18} /></button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              {generateMonthOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Shift
            </label>
            <select
              value={filters.shiftId}
              onChange={(e) => setFilters({ ...filters, shiftId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Shifts</option>
              {shifts.map((shift) => (
                <option key={shift._id} value={shift._id}>
                  {shift.shiftName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Employee
            </label>
            <select
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.employee_id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Roles</option>
              <option value="Agent">Agent</option>
              <option value="TL">TL</option>
              <option value="QA">QA</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="On Time">On Time</option>
              <option value="Late">Late</option>
              <option value="Half Day">Half Day</option>
              <option value="Absent">Absent</option>
              <option value="Present">Present</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ date: new Date().toISOString().split('T')[0], shiftId: '', userId: '', status: '', role: '' })}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  SL No
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Shift
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Check-in
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Check-out
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Images
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Hours
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  IP
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                attendance.map((record, index) => (
                  <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {record.userId?.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {record.userId?.employee_id} • {record.userId?.role}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {record.shiftId?.shiftName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock size={12} className="text-gray-500" />
                        <span className="text-gray-900 dark:text-white">{formatTime(record.checkInTime)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock size={12} className="text-gray-500" />
                        <span className="text-gray-900 dark:text-white">{formatTime(record.checkOutTime)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {record.checkInImage ? (
                          <div className="relative group">
                            <img
                              src={record.checkInImage}
                              alt="Check-in"
                              onClick={() => setSelectedImage(record.checkInImage)}
                              className="w-20 h-12 object-cover rounded border border-green-300 cursor-pointer hover:opacity-80 transition-opacity"
                              title="Click to view full image"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[8px] px-1 rounded-full">IN</div>
                          </div>
                        ) : (
                          <div className="w-20 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">
                            <span className="text-[10px] text-gray-400">No Image</span>
                          </div>
                        )}
                        {record.checkOutImage ? (
                          <div className="relative group">
                            <img
                              src={record.checkOutImage}
                              alt="Check-out"
                              onClick={() => setSelectedImage(record.checkOutImage)}
                              className="w-20 h-12 object-cover rounded border border-red-300 cursor-pointer hover:opacity-80 transition-opacity"
                              title="Click to view full image"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[8px] px-1 rounded-full">OUT</div>
                          </div>
                        ) : (
                          <div className="w-20 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">
                            <span className="text-[10px] text-gray-400">No Image</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {record.totalHours.toFixed(2)}h
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                      {record.isManuallyMarked && (
                        <span className="ml-1 text-xs text-gray-500">(Manual)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">
                      <div className="flex items-start gap-1">
                        <MapPin size={12} className="text-gray-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-900 dark:text-white text-xs">
                          {record.checkInLocation?.address?.substring(0, 40)}...
                        </span>
                      </div>
                      {record.checkInLocation && (
                        <div className="text-xs text-gray-500 mt-1">
                          {record.checkInLocation.latitude?.toFixed(4)}, {record.checkInLocation.longitude?.toFixed(4)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {record.checkInIp || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                        title="Edit attendance"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => downloadMonthlyReport(record.userId._id)}
                        className="text-green-600 hover:text-green-800"
                        title="Download monthly report"
                      >
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Edit Attendance
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Employee
                    </label>
                    <input
                      type="text"
                      value={`${editingRecord?.userId?.name} (${editingRecord?.userId?.employee_id})`}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white bg-gray-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Check-in Time
                      </label>
                      <input
                        type="datetime-local"
                        value={editForm.checkInTime}
                        onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Check-out Time
                      </label>
                      <input
                        type="datetime-local"
                        value={editForm.checkOutTime}
                        onChange={(e) => setEditForm({ ...editForm, checkOutTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                      <option value="On Time">On Time</option>
                      <option value="Late">Late</option>
                      <option value="Half Day">Half Day</option>
                      <option value="Absent">Absent</option>
                      <option value="Present">Present</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Edit Remark * (Why are you changing?)
                    </label>
                    <textarea
                      value={editForm.editRemark}
                      onChange={(e) => setEditForm({ ...editForm, editRemark: e.target.value })}
                      required
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      placeholder="Enter the reason for editing this attendance record"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Save size={20} />
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Manual Mark Modal */}
      {showManualMarkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Mark Attendance Manually
                </h2>
                <button
                  onClick={() => setShowManualMarkModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleManualMarkSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Employee *
                    </label>
                    <div className="relative mb-2">
                      <input
                        type="text"
                        placeholder="Search by name or employee ID..."
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                      <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
                    </div>
                    {manualMarkForm.userId && (
                      <div className="mb-2 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Selected: {employees.find(e => e._id === manualMarkForm.userId)?.name}
                            </span>
                            <span className="text-xs text-blue-700 dark:text-blue-300 ml-2">
                              ({employees.find(e => e._id === manualMarkForm.userId)?.employee_id})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setManualMarkForm({ ...manualMarkForm, userId: '' });
                              setEmployeeSearch('');
                            }}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                    <select
                      value={manualMarkForm.userId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setManualMarkForm({ ...manualMarkForm, userId: selectedId });
                        // Update search to show selected employee name
                        const selectedEmp = employees.find(emp => emp._id === selectedId);
                        if (selectedEmp) {
                          setEmployeeSearch(selectedEmp.name);
                        }
                      }}
                      required
                      size="5"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                      <option value="" disabled>Select Employee</option>
                      {filteredEmployees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} - {emp.employee_id} ({emp.role})
                        </option>
                      ))}
                    </select>
                    {filteredEmployees.length === 0 && employeeSearch && (
                      <p className="text-sm text-gray-500 mt-2">No employees found matching "{employeeSearch}"</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Shift *
                    </label>
                    <select
                      value={manualMarkForm.shiftId}
                      onChange={(e) => setManualMarkForm({ ...manualMarkForm, shiftId: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Shift</option>
                      {shifts.map((shift) => (
                        <option key={shift._id} value={shift._id}>
                          {shift.shiftName} ({shift.startTime} - {shift.endTime})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={manualMarkForm.date}
                      onChange={(e) => setManualMarkForm({ ...manualMarkForm, date: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Check-in Time
                      </label>
                      <input
                        type="time"
                        value={manualMarkForm.checkInTime}
                        onChange={(e) => setManualMarkForm({ ...manualMarkForm, checkInTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Check-out Time
                      </label>
                      <input
                        type="time"
                        value={manualMarkForm.checkOutTime}
                        onChange={(e) => setManualMarkForm({ ...manualMarkForm, checkOutTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status *
                    </label>
                    <select
                      value={manualMarkForm.status}
                      onChange={(e) => setManualMarkForm({ ...manualMarkForm, status: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                      <option value="On Time">On Time</option>
                      <option value="Late">Late</option>
                      <option value="Half Day">Half Day</option>
                      <option value="Absent">Absent</option>
                      <option value="Present">Present</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Remarks
                    </label>
                    <textarea
                      value={manualMarkForm.remarks}
                      onChange={(e) => setManualMarkForm({ ...manualMarkForm, remarks: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      placeholder="Enter any remarks"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Save size={20} />
                    Mark Attendance
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManualMarkModal(false)}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Attendance"
              className="max-w-full max-h-[90vh] rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white text-gray-800 rounded-full p-2 hover:bg-gray-200"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
