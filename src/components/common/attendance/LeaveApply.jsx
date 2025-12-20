import React, { useState, useEffect } from 'react';
import {
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Eye
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../../config/api';

export default function LeaveApply() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    leaveType: 'Sick Leave',
    reason: ''
  });

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const fetchMyLeaves = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/leave/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaves(response.data.leaves || []);
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate dates
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('End date cannot be before start date');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/v1/leave/apply`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Leave application submitted successfully');
      setShowModal(false);
      setFormData({
        startDate: '',
        endDate: '',
        leaveType: 'Sick Leave',
        reason: ''
      });
      fetchMyLeaves();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error applying for leave');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this leave application?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/v1/leave/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Leave application cancelled successfully');
      fetchMyLeaves();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error cancelling leave');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'Rejected':
        return <XCircle size={20} className="text-red-600" />;
      case 'Pending':
        return <AlertCircle size={20} className="text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="p-6 min-h-screen dark:bg-gray-950">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          My Leave Applications
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Calendar size={20} />
          Apply for Leave
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      {/* Leaves List */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : leaves.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No leave applications yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaves.map((leave) => (
            <div
              key={leave._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(leave.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {leave.leaveType}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)} ({leave.totalDays} days)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                    {leave.status}
                  </span>
                  {leave.status === 'Pending' && (
                    <button
                      onClick={() => handleCancel(leave._id)}
                      className="text-red-600 hover:text-red-800"
                      title="Cancel"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mb-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Reason:</strong> {leave.reason}
                </p>
              </div>

              {leave.status !== 'Pending' && (
                <div className={`border-l-4 pl-3 ${leave.status === 'Approved' ? 'border-green-500' : 'border-red-500'}`}>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Reviewed by:</strong> {leave.reviewedBy?.name}
                  </p>
                  {leave.reviewComment && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <strong>Comment:</strong> {leave.reviewComment}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {formatDate(leave.reviewedAt)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Apply for Leave
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Leave Type *
                    </label>
                    <select
                      value={formData.leaveType}
                      onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Paid Leave">Paid Leave</option>
                      <option value="Unpaid Leave">Unpaid Leave</option>
                      <option value="Emergency Leave">Emergency Leave</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reason *
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      required
                      rows="4"
                      placeholder="Please provide a reason for your leave"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Submit Application
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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
    </div>
  );
}
