import { useState, useCallback } from "react";

export function useInterests(initialInterests = []) {
   const [selectedInterests, setSelectedInterests] = useState(initialInterests);
   const [error, setError] = useState(null);

   const toggleInterest = useCallback((interest) => {
      setSelectedInterests((prev) =>
         prev.includes(interest)
            ? prev.filter((i) => i !== interest)
            : [...prev, interest]
      );
      setError(null);
   }, []);

   const validateInterests = useCallback(() => {
      if (selectedInterests.length < 3) {
         setError("Please select at least 3 interests");
         return false;
      }
      return true;
   }, [selectedInterests]);

   return {
      selectedInterests,
      error,
      toggleInterest,
      validateInterests,
      setError,
   };
}
