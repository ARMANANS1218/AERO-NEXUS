import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '../features/auth/authApi';
import { ticketApi } from '../features/ticket/ticketApi';
import { chatApi } from '../features/chat/chatApi';
import { roomApi } from '../features/room/roomApi';
import { adminApi } from '../features/admin/adminApi';
import { customerApi } from '../features/customer/customerApi';
import { queryApi } from '../features/query/queryApi';
import { qaEvaluationApi } from '../features/qa/qaEvaluationApi';
import { screenshotApi } from '../features/screenshot/screenshotApi';
import { dashboardApi } from '../features/dashboard/dashboardApi';
import { emailApi } from '../features/email/emailApi';
import { geocamApi } from '../features/geocam/geocamApi';
import { emailTicketApi } from '../features/emailTicket/emailTicketApi';
import { faqApi } from '../features/faq/faqApi';


export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [ticketApi.reducerPath]: ticketApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [roomApi.reducerPath]: roomApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [customerApi.reducerPath]: customerApi.reducer,
    [queryApi.reducerPath]: queryApi.reducer,
    [screenshotApi.reducerPath]: screenshotApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [emailApi.reducerPath]: emailApi.reducer,
    [qaEvaluationApi.reducerPath]: qaEvaluationApi.reducer,
    [geocamApi.reducerPath]: geocamApi.reducer,
    [emailTicketApi.reducerPath]: emailTicketApi.reducer,
    [faqApi.reducerPath]: faqApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(ticketApi.middleware)
      .concat(chatApi.middleware)
      .concat(roomApi.middleware)
      .concat(adminApi.middleware)
      .concat(customerApi.middleware)
      .concat(queryApi.middleware)
      .concat(screenshotApi.middleware)
      .concat(dashboardApi.middleware)
      .concat(emailApi.middleware)
      .concat(qaEvaluationApi.middleware)
      .concat(geocamApi.middleware)
      .concat(emailTicketApi.middleware)
      .concat(faqApi.middleware),
});
