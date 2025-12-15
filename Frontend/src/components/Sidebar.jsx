import React, { useState, useContext, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Home, Settings, LogOut, CornerDownLeft, CornerDownRight, BookOpen, Scale, TrendingUp, FileText } from "lucide-react";
import { AuthContext } from "@/context/AppContext";
import { toast } from "sonner";
import PropTypes from "prop-types";

const AppSidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { setToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're on a report route
  const isReportRoute = location.pathname.includes('/reports/');
  
  // Extract society ID from report routes
  const getSocietyId = useMemo(() => {
    const match = location.pathname.match(/\/reports\/([^/]+)/);
    return match ? match[1] : null;
  }, [location.pathname]);

  const societyId = getSocietyId;

  // Memoize menu items to prevent unnecessary re-renders
  const menuItems = useMemo(() => {
    const regularMenuItems = [
      { id: "dashboard", icon: Home, label: "Dashboard", page: "dashboard" },
      { id: "settings", icon: Settings, label: "Settings", page: "settings" },
    ];

    if (!isReportRoute) return regularMenuItems;

    return [
      { id: "dashboard", icon: Home, label: "Dashboard", page: "dashboard" },
      { id: "cashbook", icon: BookOpen, label: "Cashbook", page: `reports/${societyId}/cashbook` },
      { id: "trialbalance", icon: Scale, label: "Trial Balance", page: `reports/${societyId}/trialbalance` },
      { id: "profitloss", icon: TrendingUp, label: "Profit & Loss", page: `reports/${societyId}/profitloss` },
      { id: "balancesheet", icon: FileText, label: "Balance Sheet", page: `reports/${societyId}/balancesheet` },
      { id: "settings", icon: Settings, label: "Settings", page: "settings" },
    ];
  }, [isReportRoute, societyId]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <Sidebar className={`transition-all duration-300 ease-in-out ${isOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 h-screen flex flex-col`}>
        <SidebarHeader className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground text-lg">📊</span>
            </div>
            {isOpen && (
              <div className="flex flex-col">
                <h2 className="text-sm font-semibold">लेखा व्यवस्थापन</h2>
                <p className="text-xs text-muted-foreground">Accounting System</p>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="p-1">
            {isOpen ? <CornerDownLeft className="w-5 h-5" /> : <CornerDownRight className="w-5 h-5" />}
          </Button>
        </SidebarHeader>
        <SidebarContent className="flex-1">
          <SidebarMenu className="mt-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => {
                      if (item.page === "dashboard") {
                        navigate("/dashboard");
                      } else if (item.page === "settings") {
                        navigate("/settings");
                      } else if (item.page.startsWith("reports/")) {
                        navigate(`/${item.page}`);
                      } else {
                        navigate(`/${item.page}`);
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors hover:bg-gray-100 ${
                      location.pathname === `/${item.page}` || 
                      (item.page.startsWith("reports/") && location.pathname.includes(item.page)) ? 
                      "bg-accent" : ""
                    }`}
                  >
                    <Icon className="!w-5 !h-5" />
                    {isOpen && <span className="font-semibold text-base">{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        {/* FOOTER */}
        <SidebarFooter className="p-4 border-t">
          <Button
            variant="ghost"
            onClick={handleLogout} // use the internal logout function
            className="w-full flex items-center justify-start gap-3"
          >
            <LogOut className="w-6 h-6" />
            {isOpen && <span className="font-medium">Logout</span>}
          </Button>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
};

export default AppSidebar;
