import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

function ProtectedRoute({ children }) {
   const { isAuthenticated, hasSetInterests, loading } = useSelector(
      (state) => state.auth
   );
   const location = useLocation();

   if (loading) return <div>Loading...</div>;

   if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
   }

   if (!hasSetInterests && location.pathname !== "/interests") {
      return <Navigate to="/interests" state={{ from: location }} replace />;
   }

   return children;
}

export default ProtectedRoute;
