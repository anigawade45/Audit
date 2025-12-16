import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import { AuthContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfitLoss() {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const printRef = useRef();

  const [incomeEntries, setIncomeEntries] = useState([]);
  const [expenseEntries, setExpenseEntries] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [societyInfo, setSocietyInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [, setRefreshing] = useState(false);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value || 0);

  // fetch society info
  useEffect(() => {
    const fetchSociety = async () => {
      try {
        setError(null);
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/societies/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSocietyInfo(res?.data?.society || res?.data);
      } catch (err) {
        console.error("Failed to fetch society:", err);
        setError("Failed to load society information");
      } finally {
        setLoading(false);
      }
    };
    if (id && token) fetchSociety();
  }, [id, token]);

  useEffect(() => {
    const fetchYears = async () => {
      try {
        setError(null);
        const res = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/reports/profit-loss-data/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const mappings = Array.isArray(res.data?.mappings)
          ? res.data.mappings
          : [];

        // Unique years from API
        const uniqueYears = [...new Set(mappings.map((m) => m.year))].sort(
          (a, b) => b - a
        );

        const fyLabels = uniqueYears.map((y) => `${y}-${y + 1}`);
        setYears(fyLabels);

        if (fyLabels.length > 0) {
          setSelectedYear(parseInt(fyLabels[0].split("-")[0], 10));
        }
      } catch (err) {
        console.error("Error fetching available years:", err);
        setError("Failed to load available years");
        const y = dayjs().year();
        setYears([`${y}-${y + 1}`]);
        setSelectedYear(y);
      }
    };
    if (id && token) fetchYears();
  }, [id, token]);

  // fetch profit loss data
  useEffect(() => {
    const fetchProfitLoss = async () => {
      if (!selectedYear) return;
      try {
        setRefreshing(true);
        setError(null);
        const res = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/reports/profit-loss-data/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Profit Loss API Response:", res.data);

        // Filter only selected year's mappings
        const mappings = Array.isArray(res.data?.mappings)
          ? res.data.mappings.filter((m) => m.year === selectedYear)
          : [];

        // Separate into income & expenses
        const income = mappings.filter((m) => m.side === "debit");
        const expenses = mappings.filter((m) => m.side === "credit");

        setIncomeEntries(income);
        setExpenseEntries(expenses);
      } catch (err) {
        console.error("Error fetching profit loss data:", err);
        setError("Failed to load profit loss data");
        setIncomeEntries([]);
        setExpenseEntries([]);
      } finally {
        setRefreshing(false);
      }
    };
    fetchProfitLoss();
  }, [id, token, selectedYear]);

  const totalIncome = incomeEntries.reduce(
    (sum, entry) => sum + (entry.amount || 0),
    0
  );
  const totalExpenses = expenseEntries.reduce(
    (sum, entry) => sum + (entry.amount || 0),
    0
  );
  const netResult = totalIncome - totalExpenses;
  const isProfit = netResult > 0;
  const balancingAmount = Math.abs(netResult);

  const incomeTotalWithBalance = isProfit
    ? totalIncome
    : totalIncome + balancingAmount;
  const expenseTotalWithBalance = isProfit
    ? totalExpenses + balancingAmount
    : totalExpenses;

  const exportToPDF = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${societyInfo?.name || "Profit-loss"}_${selectedYear}-${
      selectedYear + 1
    }`,
    pageStyle: `
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background: white;
            }
            .print-hide {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: center;
            }
            th {
              background-color: #f3f4f6 !important;
              font-weight: bold;
            }
            .bg-gray-100, .bg-gray-200 {
              background-color: #f3f4f6 !important;
            }
          }
        `,
    onBeforeGetContent: () => {
      // Hide non-essential elements before printing
      const elementsToHide = document.querySelectorAll(".print-hide");
      elementsToHide.forEach((el) => {
        el.classList.add("print-hidden");
        el.style.display = "none";
      });
    },
    onAfterPrint: () => {
      // Restore hidden elements after printing
      const elementsToRestore = document.querySelectorAll(".print-hidden");
      elementsToRestore.forEach((el) => {
        el.classList.remove("print-hidden");
        el.style.display = "";
      });
    },
  });

  if (loading) {
    return (
      <div className="px-4 sm:px-6 py-6">
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6">
      {/* Export Button */}
      <div className="flex gap-2 mb-4 print-hide">
        <Button variant="outline" onClick={exportToPDF} className="gap-2 w-full sm:w-auto">
          <Download className="w-4 h-4" /> Export PDF
        </Button>
      </div>

      {/* Header */}
      <div ref={printRef}>
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">नफा तोटा पत्रक</h1>
          <p className="mt-2 font-semibold">{societyInfo?.name}</p>
          <p>
            ता: {societyInfo?.taluka}, जि: {societyInfo?.district}
          </p>
          <p className="mt-2 font-bold">
            {selectedYear} ते {selectedYear + 1}
          </p>
          <div className="mt-3 print-hide">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border px-2 py-1 rounded w-full sm:w-auto"
            >
              {years.map((fy) => (
                <option key={fy} value={parseInt(fy.split("-")[0], 10)}>
                  {fy}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Two Column Table (Like Screenshot) */}
        <div className="border-2 border-gray-300 shadow-lg overflow-x-auto -mx-4 sm:mx-0">
          <Table className="min-w-[640px] sm:min-w-full text-xs sm:text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center font-bold p-2 sm:p-3">
                  तपशील जमा (Credit)
                </TableHead>
                <TableHead className="text-center font-bold p-2 sm:p-3">रक्कम</TableHead>
                <TableHead className="text-center font-bold p-2 sm:p-3">
                  तपशील खर्च (Debit)
                </TableHead>
                <TableHead className="text-center font-bold p-2 sm:p-3">रक्कम</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(
                {
                  length: Math.max(incomeEntries.length, expenseEntries.length),
                },
                (_, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-center p-2 sm:p-3">
                      {incomeEntries[i]?.accountHead || ""}
                    </TableCell>
                    <TableCell className="text-center p-2 sm:p-3">
                      {incomeEntries[i]
                        ? formatCurrency(incomeEntries[i].amount)
                        : ""}
                    </TableCell>
                    <TableCell className="text-center p-2 sm:p-3">
                      {expenseEntries[i]?.accountHead || ""}
                    </TableCell>
                    <TableCell className="text-center p-2 sm:p-3">
                      {expenseEntries[i]
                        ? formatCurrency(expenseEntries[i].amount)
                        : ""}
                    </TableCell>
                  </TableRow>
                )
              )}

              {/* Nafa/Tota Calculation */}
              <TableRow className="font-bold bg-gray-200 text-xs sm:text-sm">
                <TableCell className="text-center p-2 sm:p-3">
                  {isProfit ? "" : "तोटा"}
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3">
                  {isProfit ? "" : formatCurrency(balancingAmount)}
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3">
                  {isProfit ? "नफा" : ""}
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3">
                  {isProfit ? formatCurrency(balancingAmount) : ""}
                </TableCell>
              </TableRow>

              {/* Final Ekun */}
              <TableRow className="font-bold bg-gray-300 text-xs sm:text-sm">
                <TableCell className="text-center p-2 sm:p-3">एकूण</TableCell>
                <TableCell className="text-center p-2 sm:p-3">
                  {formatCurrency(incomeTotalWithBalance)}
                </TableCell>
                <TableCell className="text-center p-2 sm:p-3">एकूण</TableCell>
                <TableCell className="text-center p-2 sm:p-3">
                  {formatCurrency(expenseTotalWithBalance)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
