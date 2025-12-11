import React from "react";
import { Box } from "@mui/material";
import CallLogsDatewise from "../../../components/CallLogs/CallLogsDatewise";
import { useGetCallHistoryQuery, useDeleteCallLogMutation, useClearCallLogsDateMutation, useClearAllCallLogsMutation } from "../../../features/room/roomApi";

export default function Calls() {
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
    <Box className="p-2 md:p-6">
      <CallLogsDatewise 
        calls={calls}
        isLoading={isLoading}
        onDeleteCall={handleDeleteCall}
        onClearDate={handleClearDate}
        onClearAll={handleClearAll}
        userRole="Agent"
      />
    </Box>
  );
}
