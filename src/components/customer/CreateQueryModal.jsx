import React, { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import { useCreateQueryMutation } from '../../features/query/queryApi';
import { toast } from 'react-toastify';

export default function CreateQueryModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    subject: '',
    category: 'Supports',
    priority: 'Medium',
    initialMessage: ''
  });
  const [errors, setErrors] = useState({});

  const [createQuery, { isLoading }] = useCreateQueryMutation();

  const categories = ['Accounts', 'Technicals', 'Billings', 'Supports'];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];

  const validate = () => {
    const newErrors = {};
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    if (!formData.initialMessage.trim()) {
      newErrors.initialMessage = 'Please describe your issue';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      const result = await createQuery(formData).unwrap();
      toast.success(`Query created successfully! Petition ID: ${result.data.petitionId}`);
      
      // Reset form
      setFormData({
        subject: '',
        category: 'Supports',
        priority: 'Medium',
        initialMessage: ''
      });
      setErrors({});
      
      if (onSuccess) {
        onSuccess(result.data);
      }
      onClose();
    } catch (error) {
      console.error('Create query error:', error);
      toast.error(error?.data?.message || 'Failed to create query');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Create New Query</h2>
            <p className="text-blue-100 text-sm mt-1">Get support from our team</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-5">
            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Brief description of your issue"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors
                  ${errors.subject 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-200'
                  }
                  bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400`}
                disabled={isLoading}
              />
              {errors.subject && (
                <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
                  <AlertCircle size={16} />
                  <span>{errors.subject}</span>
                </div>
              )}
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-200 transition-colors bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                  disabled={isLoading}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-200 transition-colors bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                  disabled={isLoading}
                >
                  {priorities.map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority Info */}
            <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 border-l-4 border-blue-500 p-2 rounded">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">Priority Guidelines:</p>
                  <ul className="space-y-1 text-xs">
                    <li><strong>Urgent:</strong> System down, critical business impact</li>
                    <li><strong>High:</strong> Major feature not working</li>
                    <li><strong>Medium:</strong> Feature working with issues</li>
                    <li><strong>Low:</strong> General questions, minor issues</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Describe Your Issue <span className="text-red-500">*</span>
              </label>
              <textarea
                name="initialMessage"
                value={formData.initialMessage}
                onChange={handleChange}
                placeholder="Please provide detailed information about your issue..."
                rows={6}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none
                  ${errors.initialMessage 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-200'
                  }
                  bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400`}
                disabled={isLoading}
              />
              {errors.initialMessage && (
                <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
                  <AlertCircle size={16} />
                  <span>{errors.initialMessage}</span>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {formData.initialMessage.length} characters
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Create Query
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
