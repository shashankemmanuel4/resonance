import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.js";
import { MobileNav } from "./MobileNav.js";

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col lg:flex-row antialiased">
      {/* Desktop Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-60 flex flex-col min-h-screen">
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 lg:pb-12 outline-none overflow-x-hidden"
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
};
