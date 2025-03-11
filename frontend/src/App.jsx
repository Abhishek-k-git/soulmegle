import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import useAuth from "./hooks/useAuth";
import ProtectedRoute from "./components/routing/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import InterestPage from "./pages/interest/InterestPage";
import ChatPage from "./pages/chat/ChatPage";

function App() {
   // Fetch authentication state
   const loading = useAuth();
   const { isAuthenticated, hasSetInterests } = useSelector(
      (state) => state.auth
   );

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <h2 className="text-xl font-semibold">Loading...</h2>
         </div>
      );
   }

   return (
      <Routes>
         {/* Redirect authenticated users away from login/register */}
         {!isAuthenticated ? (
            <>
               <Route path="/login" element={<LoginPage />} />
               <Route path="/register" element={<RegisterPage />} />
            </>
         ) : (
            <Route
               path="/*"
               element={
                  <Navigate
                     to={hasSetInterests ? "/chat" : "/interests"}
                     replace
                  />
               }
            />
         )}

         {/* Protected routes */}
         <Route
            path="/interests"
            element={
               <ProtectedRoute>
                  <InterestPage />
               </ProtectedRoute>
            }
         />
         <Route
            path="/chat"
            element={
               <ProtectedRoute>
                  <ChatPage />
               </ProtectedRoute>
            }
         />

         {/* Default redirect */}
         <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
   );
}

export default App;
