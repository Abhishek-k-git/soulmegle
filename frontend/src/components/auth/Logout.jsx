import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../store/slices/authSlice";

function Logout({ className }) {
   const dispatch = useDispatch();
   const navigate = useNavigate();

   const handleLogout = () => {
      dispatch(logout());
      navigate("/login");
   };

   return (
      <button
         onClick={handleLogout}
         className={`px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md ${className}`}
      >
         Logout
      </button>
   );
}

export default Logout;
