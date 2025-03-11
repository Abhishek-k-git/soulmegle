import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
   loginStart,
   loginSuccess,
   loginFailure,
} from "../../store/slices/authSlice";
import { auth } from "../../services/api";

function LoginPage() {
   const navigate = useNavigate();
   const dispatch = useDispatch();
   const { loading, error } = useSelector((state) => state.auth);
   const [formData, setFormData] = useState({
      email: "xoyaje2919@codverts.com",
      password: "xoyaje2919@codverts.com",
   });

   const handleChange = (e) => {
      setFormData({
         ...formData,
         [e.target.name]: e.target.value,
      });
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      dispatch(loginStart());

      try {
         if (!formData.email || !formData.password) {
            throw new Error("Please enter both email and password");
         }

         const response = await auth.login(formData.email, formData.password);
         if (!response.data || !response.data.user) {
            throw new Error("Invalid response from server");
         }

         // Dispatch success and navigate
         dispatch(loginSuccess(response.data));
         navigate(
            response.data.user.interests?.length ? "/chat" : "/interests"
         );
      } catch (error) {
         const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Login failed. Please check your credentials.";
         dispatch(loginFailure(errorMessage));
      }
   };

   return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
         <div className="max-w-md w-full space-y-8">
            <div>
               <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                  Welcome back
               </h2>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
               {error && (
                  <div className="rounded-md bg-red-50 p-4">
                     <div className="text-sm text-red-700">{error}</div>
                  </div>
               )}
               <div className="rounded-md shadow-sm -space-y-px">
                  <div>
                     <input
                        type="email"
                        name="email"
                        required
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="email"
                     />
                  </div>

                  <div>
                     <input
                        type="password"
                        name="password"
                        required
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                     />
                  </div>
               </div>
               <div>
                  <button
                     type="submit"
                     disabled={loading}
                     className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                     {loading ? "Logging in..." : "Login"}
                  </button>
               </div>
               <div className="text-sm text-center">
                  <Link
                     to="/register"
                     className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                     Don't have an account? Sign up
                  </Link>
               </div>
            </form>
         </div>
      </div>
   );
}

export default LoginPage;
