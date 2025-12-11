// src/pages/private/customer/CallList.jsx
import React from "react";
import { Phone } from "lucide-react";
import CallLogsDatewise from "../../../components/CallLogs/CallLogsDatewise";
import { useGetCallHistoryQuery, useDeleteCallLogMutation, useClearCallLogsDateMutation, useClearAllCallLogsMutation } from "../../../features/room/roomApi";

export default function CallList({ currentUserId }) {
  const { data, isLoading, refetch } = useGetCallHistoryQuery();
  const [deleteCallLog] = useDeleteCallLogMutation();
  const [clearCallLogsDate] = useClearCallLogsDateMutation();
  const [clearAllCallLogs] = useClearAllCallLogsMutation();

  const calls = data?.data || [];

  const handleDeleteCall = async (callId) => {
    await deleteCallLog(callId).unwrap();
    refetch();
  };

  const handleClearDate = async (dateKey) => {
    await clearCallLogsDate(dateKey).unwrap();
    refetch();
  };

  const handleClearAll = async () => {
    await clearAllCallLogs().unwrap();
    refetch();
  };

  return (
    <div className="h-full flex flex-col p-3 sm:p-2 md:p-6 bg-white dark:bg-slate-800">
      <div className="flex items-center gap-2 mb-6">
        <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
          Call Logs
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <CallLogsDatewise 
          calls={calls}
          isLoading={isLoading}
          onDeleteCall={handleDeleteCall}
          onClearDate={handleClearDate}
          onClearAll={handleClearAll}
          userRole="Customer"
        />
      </div>
    </div>
  );
}
