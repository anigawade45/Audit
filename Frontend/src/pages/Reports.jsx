import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/AppContext";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  ClipboardList,
  BarChart2,
  FileText,
  Layers,
} from "lucide-react";
import axios from "axios";

export default function Reports() {
  const { id } = useParams(); // societyId from route
  const navigate = useNavigate();
  const [society, setSociety] = useState(null);
  const { token } = useContext(AuthContext);

  // Fetch society details by ID
  useEffect(() => {
    const fetchSociety = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/societies/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSociety(res.data.society); // <- important: your API wraps inside "society"
      } catch (err) {
        console.error("Failed to fetch society:", err);
      }
    };
    fetchSociety();
  }, [id, token]);

  if (!society) {
    return <p className="text-center py-12">Loading...</p>;
  }

  // Common 4 cards
  const baseCards = [
    {
      key: "cashbook",
      label: "Cash Book (रोख वह्या)",
      icon: <BookOpen className="w-6 h-6" />,
    },
    {
      key: "trialbalance",
      label: "Trial Balance (ताळे पत्रक)",
      icon: <ClipboardList className="w-6 h-6" />,
    },
    {
      key: "profitloss",
      label: "Profit & Loss (नफा तोटा पत्रक)",
      icon: <BarChart2 className="w-6 h-6" />,
    },
    {
      key: "balancesheet",
      label: "Balance Sheet (ताळेबंद)",
      icon: <FileText className="w-6 h-6" />,
    },
  ];

  // Add 5th card only if type is "labour"
  const reportCards =
    society.type === "labour"
      ? [
          ...baseCards,
          {
            key: "construction",
            label: "Construction Statement (बांधकाम हिशोब पत्रक)",
            icon: <Layers className="w-6 h-6" />,
          },
        ]
      : baseCards;

  return (
    <div className="px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">{society.name} Reports (अहवाल)</h1>
        <p className="text-muted-foreground">
          Select a report to view (अहवाल प्रकार निवडा)
        </p>
      </div>

      {/* Report Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((report) => (
          <Card
            key={report.key}
            className="p-4 sm:p-6 cursor-pointer hover:shadow-xl transition-all rounded-2xl flex flex-col items-center justify-center text-center border border-gray-200"
            onClick={() => navigate(`/reports/${id}/${report.key}`)}
          >
            <CardHeader className="mb-3 sm:mb-4">{report.icon}</CardHeader>
            <CardContent>
              <h3 className="font-semibold">{report.label}</h3>
              <p className="text-xs text-muted-foreground">
                Click to view {report.label} (पाहण्यासाठी क्लिक करा)
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
