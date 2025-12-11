import { Box, Stack, Avatar, Typography, IconButton } from "@mui/material";
// import ChatReply from "./ChatReply";
import renderTime from "../../../../../utils/renderTime";

export default function MessageItem({ msg }) {
  const currentUserId = "68aa9e4a4e61ea8cf8705a21";
  const isFrom = msg?.from === currentUserId;
 
  return (
    <div className={`mb-2 sm:mb-3 flex ${isFrom ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
      <div className={`flex gap-1 sm:gap-2 max-w-[85%] sm:max-w-[75%] md:max-w-[65%] ${isFrom ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar - Only on non-sender messages */}
        {!isFrom && (
          <Avatar 
            sx={{ 
              width: { xs: 28, sm: 32 }, 
              height: { xs: 28, sm: 32 },
              bgcolor: 'primary.main',
              fontSize: { xs: '12px', sm: '14px' }
            }}
          >
            A
          </Avatar>
        )}
        
        <div className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl ${
          isFrom 
            ? 'bg-blue-600 dark:bg-blue-500 text-white rounded-br-sm' 
            : 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-sm'
        } shadow-sm`}>
          <div className="flex flex-col gap-1">
            <p className="text-xs sm:text-sm md:text-base break-words leading-relaxed">
              {msg?.message}
            </p>
            {msg?.message?.replies?.message && (
              <p className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 italic border-l-2 border-gray-400 dark:border-gray-500 pl-2 mt-1">
                {msg?.message?.replies?.message}
              </p>
            )}
          </div>
          <p className={`text-[9px] sm:text-[10px] text-right mt-1 ${
            isFrom ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'
          }`}>
            {renderTime(msg?.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
};
