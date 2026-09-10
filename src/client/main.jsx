import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AdminPage from "./AdminPage.jsx";
import "./styles.css";

const isAdminPage = window.location.pathname === "/admin" || window.location.hash === "#/admin";
const Page = isAdminPage ? AdminPage : App;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>
);