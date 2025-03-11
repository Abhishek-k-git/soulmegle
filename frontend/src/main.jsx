import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
// import ErrorBoundary from "./components/error/ErrorBoundary";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
   <React.StrictMode>
      {/* <ErrorBoundary> */}
         <Provider store={store}>
            <Router>
               <App />
            </Router>
         </Provider>
      {/* </ErrorBoundary> */}
   </React.StrictMode>
);
