import React from "react";

class ErrorBoundary extends React.Component {
   constructor(props) {
      super(props);
      this.state = { hasError: false };
   }

   static getDerivedStateFromError(error) {
      return { hasError: true };
   }

   componentDidCatch(error, errorInfo) {
      console.error("Error caught by boundary:", error, errorInfo);
   }

   render() {
      if (this.state.hasError) {
         return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
               <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                     Something went wrong
                  </h2>
                  <button
                     onClick={() => window.location.reload()}
                     className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                     Reload Page
                  </button>
               </div>
            </div>
         );
      }

      return this.props.children;
   }
}

export default ErrorBoundary;
