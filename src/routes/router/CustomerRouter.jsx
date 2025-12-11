import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import UniversalAppbar from "../../components/private/UniversalAppbar";
import CustomerAppbar from "../../components/private/CustomerAppbar";
import GlobalTransferListener from "../../components/GlobalTransferListener.jsx";
import IncomingCallListener from "../../components/call/IncomingCallListener.jsx";

const CustomerRouter = ({ allowedRoles }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    if (decoded.exp && decoded.exp < currentTime) {
      localStorage.removeItem("token");
      return <Navigate to="/login" replace />;
    }

    // ✅ Check role access
    if (!allowedRoles.includes(decoded.role)) {
      return <Navigate to="/login" replace />;
    }

    // ✅ Render layout with UniversalAppbar
    return (
      <CustomerAppbar role={decoded.role}>
        <GlobalTransferListener />
        <IncomingCallListener />
        <Outlet />
      </CustomerAppbar>
    );
  } catch (error) {
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }
};

export default CustomerRouter;
