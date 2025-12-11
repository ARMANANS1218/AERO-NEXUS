import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import UniversalAppbar from "../../components/private/UniversalAppbar";
import GlobalTransferListener from "../../components/GlobalTransferListener.jsx";
import ScreenshotProtection from "../../components/security/ScreenshotProtection";

const ProtectedRouter = ({ allowedRoles }) => {
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

    // ✅ Roles that need screenshot protection (Admin, TL, QA, Agent)
    const protectedRoles = ['Admin', 'TL', 'QA', 'Agent'];
    const needsProtection = protectedRoles.includes(decoded.role);

    // ✅ Render layout with UniversalAppbar and screenshot protection
    const content = (
      <UniversalAppbar role={decoded.role}>
        <GlobalTransferListener />
        <Outlet />
      </UniversalAppbar>
    );

    return needsProtection ? (
      <ScreenshotProtection>
        {content}
      </ScreenshotProtection>
    ) : content;
  } catch (error) {
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRouter;
