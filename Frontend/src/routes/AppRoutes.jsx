import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "@/context/AppContext";

import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import CreateSociety from "@/pages/CreateSociety";
import EditSociety from "@/pages/EditSociety";
import CashBook from "@/pages/CashBook";
import BalanceSheet from "@/pages/BalanceSheet";
import Ledger from "@/pages/Ledger";
import ProfitLoss from "@/pages/ProfitLoss";
import Reports from "@/pages/Reports";
import SocietyDetails from "@/pages/SocietyDetails";
import TrialBalance from "@/pages/TrialBalance";
import AppSidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

const AppRoutes = () => {
  const { isAuthenticated } = useContext(AuthContext);

  // Dashboard layout wrapper
  const DashboardLayout = ({ children }) => (
    <div className="min-h-screen flex">
      <aside className="w-64 flex-shrink-0">
        <AppSidebar />
      </aside>
      <div className="flex flex-col flex-1">
        <header className="w-full">
          <Navbar />
        </header>
        <main className="p-4 w-full h-[calc(100vh-56px)] overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Signup />}
      />

      {/* Private routes */}
      {isAuthenticated && (
        <>
          <Route
            path="/dashboard"
            element={
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            }
          />
          <Route
            path="/create-society"
            element={
              <DashboardLayout>
                <CreateSociety />
              </DashboardLayout>
            }
          />
          <Route
            path="/edit-society/:id"
            element={
              <DashboardLayout>
                <EditSociety />
              </DashboardLayout>
            }
          />
          <Route
            path="/society/:id"
            element={
              <DashboardLayout>
                <SocietyDetails />
              </DashboardLayout>
            }
          />

          {/* Reports Main Page */}
          <Route
            path="/reports/:id"
            element={
              <DashboardLayout>
                <Reports />
              </DashboardLayout>
            }
          />

          {/* Report detail pages */}
          <Route
            path="/reports/:id/cashbook"
            element={
              <DashboardLayout>
                <CashBook />
              </DashboardLayout>
            }
          />
          <Route
            path="/reports/:id/ledger"
            element={
              <DashboardLayout>
                <Ledger />
              </DashboardLayout>
            }
          />
          <Route
            path="/reports/:id/trialbalance"
            element={
              <DashboardLayout>
                <TrialBalance />
              </DashboardLayout>
            }
          />
          <Route
            path="/reports/:id/profitloss"
            element={
              <DashboardLayout>
                <ProfitLoss />
              </DashboardLayout>
            }
          />
          <Route
            path="/reports/:id/balancesheet"
            element={
              <DashboardLayout>
                <BalanceSheet />
              </DashboardLayout>
            }
          />

          {/* If you want construction statement */}
          <Route
            path="/reports/:id/construction"
            element={
              <DashboardLayout>
                <div>Construction Statement Page</div>
              </DashboardLayout>
            }
          />

          {/* Default fallback */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </>
      )}

      {/* Redirect non-authenticated users to login */}
      {!isAuthenticated && (
        <Route path="*" element={<Navigate to="/login" />} />
      )}
    </Routes>
  );
};

export default AppRoutes;