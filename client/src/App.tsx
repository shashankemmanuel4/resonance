import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext.js";
import { DataVersionProvider } from "./context/DataVersionContext.js";
import { AppShell } from "./components/layout/AppShell.js";

// Core Pages
import { Landing } from "./pages/Landing.js";
import { Dashboard } from "./pages/Dashboard.js";
import { LogMoment } from "./pages/LogMoment.js";
import { History } from "./pages/History.js";
import { ResonanceMap } from "./pages/ResonanceMap.js";
import { Insights } from "./pages/Insights.js";
import { Settings } from "./pages/Settings.js";

export const App: React.FC = () => {
  return (
    <React.StrictMode>
      <DataVersionProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Standalone Landing Page */}
              <Route path="/" element={<Landing />} />

              {/* Application Shell Routes */}
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/log" element={<LogMoment />} />
                <Route path="/history" element={<History />} />
                <Route path="/map" element={<ResonanceMap />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </DataVersionProvider>
    </React.StrictMode>
  );
};

export default App;
