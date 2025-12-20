import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
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

export default function BalanceSheet() {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const printRef = useRef();

  const [incomeEntries, setIncomeEntries] = useState([]);
  const [expenseEntries, setExpenseEntries] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [societyInfo, setSocietyInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [Refreshing] = useState(false);
  const [yearsLoaded, setYearsLoaded] = useState(false);
  const [loadingReport, setLoadingReport] = useState(true);

  const [refreshKey, setRefreshKey] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("reportRefreshKey") || ""
      : ""
  );

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
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/reports/balance-sheet-data/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const mappings = Array.isArray(res.data?.mappings)
        ? res.data.mappings
        : [];

      const uniqueYears = [...new Set(mappings.map(m => m.year))].sort(
        (a, b) => b - a
      );

      const fyLabels = uniqueYears.map(y => `${y}-${y + 1}`);
      setYears(fyLabels);

      if (uniqueYears.length > 0) {
        setSelectedYear(uniqueYears[0]); // ✅ ONLY SOURCE OF TRUTH
      }

      setYearsLoaded(true);
    } catch (err) {
      console.error(err);
      setYearsLoaded(true);
    }
  };

  if (id && token) fetchYears();
}, [id, token]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "reportRefreshKey") {
        setRefreshKey(e.newValue);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // fetch profit loss data
  useEffect(() => {
    const fetchBalanceSheet = async () => {
      if (!id || !token || !selectedYear || !yearsLoaded) return;

      try {
        setLoadingReport(true);
        setError(null);
        const res = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/reports/balance-sheet-data/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Balance Sheet API Response:", res.data);

        // Filter only selected year's mappings
        const mappings = Array.isArray(res.data?.mappings)
          ? res.data.mappings.filter((m) => m.year === selectedYear)
          : [];

        // Separate into income & expenses
        const income = mappings.filter(
          (m) => m.side === "debit" && Number(m.amount) !== 0
        );
        const expenses = mappings.filter(
          (m) => m.side === "credit" && Number(m.amount) !== 0
        );

        setIncomeEntries(income);
        setExpenseEntries(expenses);
      } catch (err) {
        console.error("Error fetching profit loss data:", err);
        setError("Failed to load profit loss data");
        setIncomeEntries([]);
        setExpenseEntries([]);
      } finally {
        setLoadingReport(false);
      }
    };
    fetchBalanceSheet();
  }, [id, token, selectedYear, refreshKey, yearsLoaded]);

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
          <h1 className="text-2xl sm:text-3xl font-bold">ताळेबंद</h1>
          <p className="mt-2 font-semibold">{societyInfo?.name}</p>
          <p>
            ता: {societyInfo?.taluka}, जि: {societyInfo?.district}
          </p>
          <p className="mt-2 font-normal">
  सन {selectedYear}-{String(selectedYear + 1).slice(-2)}
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
          <Table className="min-w-[640px] sm:min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center font-bold">
                  तपशील जमा (Credit)
                </TableHead>
                <TableHead className="text-center font-bold">रक्कम</TableHead>
                <TableHead className="text-center font-bold">
                  तपशील खर्च (Debit)
                </TableHead>
                <TableHead className="text-center font-bold">रक्कम</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
  {/* 🔄 Loading */}
  {loadingReport &&
    Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={`skeleton-${i}`}>
        <TableCell colSpan={4} className="p-3">
          <Skeleton className="h-6 w-full" />
        </TableCell>
      </TableRow>
    ))}

  {/* ❌ No Data */}
  {!loadingReport &&
    incomeEntries.length === 0 &&
    expenseEntries.length === 0 && (
      <TableRow>
        <TableCell colSpan={4} className="text-center p-4 text-gray-500">
          या आर्थिक वर्षासाठी माहिती उपलब्ध नाही
        </TableCell>
      </TableRow>
    )}

  {/* ✅ Data Rows */}
  {!loadingReport &&
    Array.from(
      { length: Math.max(incomeEntries.length, expenseEntries.length) },
      (_, i) => (
        <TableRow key={i}>
          <TableCell className="text-center">
            {incomeEntries[i]?.accountHead || ""}
          </TableCell>
          <TableCell className="text-center">
            {incomeEntries[i]
              ? formatCurrency(incomeEntries[i].amount)
              : ""}
          </TableCell>
          <TableCell className="text-center">
            {expenseEntries[i]?.accountHead || ""}
          </TableCell>
          <TableCell className="text-center">
            {expenseEntries[i]
              ? formatCurrency(expenseEntries[i].amount)
              : ""}
          </TableCell>
        </TableRow>
      )
    )}

  {/* ➕ Profit / Loss Row */}
  {!loadingReport &&
    (incomeEntries.length > 0 || expenseEntries.length > 0) && (
      <TableRow className="font-bold bg-gray-200">
        <TableCell className="text-center">
          {isProfit ? "" : "तोटा"}
        </TableCell>
        <TableCell className="text-center">
          {isProfit ? "" : formatCurrency(balancingAmount)}
        </TableCell>
        <TableCell className="text-center">
          {isProfit ? "नफा" : ""}
        </TableCell>
        <TableCell className="text-center">
          {isProfit ? formatCurrency(balancingAmount) : ""}
        </TableCell>
      </TableRow>
    )}

  {/* ➕ Totals */}
  {!loadingReport &&
    (incomeEntries.length > 0 || expenseEntries.length > 0) && (
      <TableRow className="font-bold bg-gray-300">
        <TableCell className="text-center">एकूण</TableCell>
        <TableCell className="text-center">
          {formatCurrency(incomeTotalWithBalance)}
        </TableCell>
        <TableCell className="text-center">एकूण</TableCell>
        <TableCell className="text-center">
          {formatCurrency(expenseTotalWithBalance)}
        </TableCell>
      </TableRow>
    )}
</TableBody>

          </Table>
        </div>
      </div>
    </div>
  );
}
