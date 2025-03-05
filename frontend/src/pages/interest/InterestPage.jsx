import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { updateInterests } from "../../store/slices/authSlice";
import { user as userApi } from "../../services/api";
import { INTERESTS } from "../../utils/constants";
import { useInterests } from "../../hooks/useInterests";

function InterestPage() {
   const navigate = useNavigate();
   const dispatch = useDispatch();
   const {
      selectedInterests,
      error,
      toggleInterest,
      validateInterests,
      setError,
   } = useInterests();

   const handleSubmit = async (e) => {
      e.preventDefault();
      if (!validateInterests()) return;

      try {
         const response = await userApi.updateInterests(selectedInterests);
         dispatch(updateInterests(selectedInterests));
         navigate("/chat");
      } catch (error) {
         setError(
            error.response?.data?.message || "Failed to update interests"
         );
      }
   };

   return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
         <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6">
               Select Your Interests
            </h2>
            {error && (
               <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                  {error}
               </div>
            )}
            <div className="bg-white p-6 rounded-lg shadow">
               <div className="grid grid-cols-2 gap-3 mb-6">
                  {INTERESTS.map((interest) => (
                     <button
                        key={interest}
                        onClick={() => toggleInterest(interest)} // Call the hook function
                        className={`p-3 rounded-lg text-sm font-medium transition-colors
                           ${
                              selectedInterests.includes(interest)
                                 ? "bg-indigo-600 text-white"
                                 : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                           }`}
                     >
                        {interest}
                     </button>
                  ))}
               </div>
               <button
                  onClick={handleSubmit}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
               >
                  Continue
               </button>
            </div>
         </div>
      </div>
   );
}

export default InterestPage;
