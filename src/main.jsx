import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Az admin felület lazy — az 1200 soros Admin.jsx nem kerül bele
// minden látogató bundle-jébe, csak a /admin útvonalon töltődik be
const Admin = lazy(() => import("./Admin.jsx"));

const isAdmin = window.location.pathname === "/admin";

ReactDOM.createRoot(document.getElementById("root")).render(
  isAdmin ? (
    <Suspense fallback={<div style={{ background:"#080b10", minHeight:"100vh" }} />}>
      <Admin />
    </Suspense>
  ) : (
    <App />
  )
);
