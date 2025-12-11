import React, { useState, useEffect } from 'react';
import { ChatCRMWidget } from 'bitmax-crm-widget';
import { Building2, Users, MessageSquare, Globe } from 'lucide-react';

const WidgetDemo = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  // Simulate logged-in user
  const mockUser = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    userId: 'USER_12345'
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setUserData(mockUser);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="text-indigo-600 dark:text-indigo-400" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bitmax CRM Widget</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Test the chat widget integration</p>
              </div>
            </div>
            
            {/* Login/Logout Button */}
            <button
              onClick={isLoggedIn ? handleLogout : handleLogin}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isLoggedIn
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isLoggedIn ? 'Logout' : 'Login as Test User'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* User Status Card */}
        <div className="mb-8 bg-white dark:bg-gray-950 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Current User Status
              </h2>
              {isLoggedIn ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600 dark:text-green-400 font-medium">Logged In</span>
                  </div>
                  <div className="mt-4 space-y-1 text-sm">
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Name:</span> {userData.name}</p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Email:</span> {userData.email}</p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Phone:</span> {userData.phone}</p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">User ID:</span> {userData.userId}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Guest User</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Click "Login as Test User" to simulate a logged-in customer
                  </p>
                </div>
              )}
            </div>
            <Users className="text-gray-400 dark:text-gray-600" size={40} />
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {/* Widget Info */}
          <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <MessageSquare className="text-indigo-600 dark:text-indigo-400" size={32} />
              <span className="text-xs font-medium px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                Active
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Widget Status</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Chat widget is loaded and ready. Click the button in the bottom-right corner to start chatting!
            </p>
          </div>

          {/* Integration Type */}
          <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Globe className="text-purple-600 dark:text-purple-400" size={32} />
              <span className="text-xs font-medium px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                NPM
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Integration Method</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Installed via: <code className="bg-gray-100 dark:bg-gray-950 px-2 py-1 rounded text-xs">npm i bitmax-crm-widget</code>
            </p>
          </div>

          {/* User Data */}
          <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Users className="text-blue-600 dark:text-blue-400" size={32} />
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                isLoggedIn 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-300'
              }`}>
                {isLoggedIn ? 'Identified' : 'Anonymous'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">User Data</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isLoggedIn 
                ? 'Agents will see your full customer details'
                : 'Agents will see you as "Guest User"'
              }
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg p-8 border border-indigo-200 dark:border-gray-600">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🎯 How to Test
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Test as Guest User</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click the chat button (bottom-right) → Send a message → Agents see "Guest User"
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Test as Logged-in User</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click "Login as Test User" → Open chat → Send message → Agents see "John Doe" with email & phone
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Check Your CRM Dashboard</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Go to your Agent/Admin dashboard → See the query with customer details
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <span className="font-semibold">💡 Note:</span> Make sure you have an API key configured in the widget. 
              Update the <code className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">apiKey</code> prop below if needed.
            </p>
          </div>
        </div>

      </div>

      {/* Chat Widget Integration */}
      <ChatCRMWidget 
        apiKey={import.meta.env.VITE_CHAT_API_KEY || "test_api_key"}
        apiUrl={import.meta.env.VITE_API_URL || "http://localhost:5000"}
        userData={isLoggedIn ? userData : null}
        primaryColor="#4F46E5"
        position="bottom-right"
        welcomeMessage="👋 Welcome! This is the Bitmax CRM Widget demo. How can we help you?"
        companyName="Bitmax Support"
        showNotifications={true}
        theme="light"
      />
    </div>
  );
};

export default WidgetDemo;
