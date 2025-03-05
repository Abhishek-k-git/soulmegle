import React from "react";
import { useSelector } from "react-redux";
import Logout from "../auth/Logout";

function Header() {
   const { user } = useSelector((state) => state.auth);

   return (
      <header className="bg-white shadow">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
               <div className="flex-shrink-0">
                  <h1 className="text-2xl font-bold text-indigo-600">
                     soulmegle
                  </h1>
               </div>
               {user && (
                  <div className="flex items-center space-x-4">
                     <span className="text-gray-700">{user.email}</span>
                     <Logout />
                  </div>
               )}
            </div>
         </div>
      </header>
   );
}

export default Header;
