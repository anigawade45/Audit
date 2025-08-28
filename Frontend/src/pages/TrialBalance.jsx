import React, { useMemo, useState, useEffect, useContext, useRef } from "react";
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

export default function TrialBalance() {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const printRef = useRef();

  const [debitHeads, setDebitHeads] = useState([]);
  const [creditHeads, setCreditHeads] = useState([]);
  const [mappings, setMappings] = useState({});
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [entries, setEntries] = useState([]);
  const [societyInitialBalance, setSocietyInitialBalance] = useState(0);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [societyInfo, setSocietyInfo] = useState(null);

  useEffect(() => {
    const fetchSociety = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/societies/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const s = res?.data?.society || res?.data;
        setSocietyInfo(s);
        console.log("Fetched society info:", s);
      } catch (err) {
        console.error("Failed to fetch society:", err);
      }
    };
    if (id && token) fetchSociety();
  }, [id, token]);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/cashbook/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.entries || [];
        setEntries(
          list.map((e) => ({
            date: (e.date || "").split("T")[0],
            type: String(e.type || "").toLowerCase(),
            amount: Number(e.amount) || 0,
          }))
        );
        setSocietyInitialBalance(res.data?.initialBalance || 0);
      } catch (err) {
        console.error("Failed to fetch entries:", err);
      }
    };
    if (id && token) fetchEntries();
  }, [id, token]);

  const fiscalRangeFromLabel = (label) => {
    const parts = label.split("-");
    if (parts.length < 2) return null;
    const startYear = parseInt(parts[0], 10);
    const endYear = startYear + 1;
    return {
      start: `${startYear}-04-01`,
      end: `${endYear}-03-31`,
    };
  };

  // fetch years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/reports/trial-balance/years/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const list = Array.isArray(res.data?.years) ? res.data.years : [];
        const fyLabels = list
          .map((y) => (typeof y === "number" ? `${y}-${y + 1}` : y))
          .filter(Boolean);

        fyLabels.sort((a, b) => {
          const aStart = parseInt(a.split("-")[0], 10);
          const bStart = parseInt(b.split("-")[0], 10);
          return bStart - aStart;
        });

        setYears(fyLabels);
        if (fyLabels.length > 0) {
          setSelectedYear(parseInt(fyLabels[0].split("-")[0], 10));
        }
      } catch (err) {
        console.error("Error fetching available years:", err);
        const y = dayjs().year();
        setYears([`${y}-${y + 1}`]);
        setSelectedYear(y);
      }
    };
    if (id && token) fetchYears();
  }, [id, token]);

  // fetch trial balance
  useEffect(() => {
    const fetchTrialBalance = async () => {
      if (!selectedYear) return;
      try {
        const res = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/reports/trial-balance/${id}?year=${selectedYear}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const rows = Array.isArray(res.data?.trialBalance)
          ? res.data.trialBalance
          : [];

        const normalized = rows.map((it, idx) => {
          const debit = it.debit || 0;
          const credit = it.credit || 0;
          let name = it.accountHeadName || "";
          let type = debit > 0 ? "Debit" : "Credit";

          if (name === "आरंभी शिल्लक") type = "Debit";
          if (name === "अखेरी शिल्लक") type = "Credit";

          return {
            _id: it.accountHeadId || it.accountHeadName || `row-${idx}`,
            totalDebit: debit,
            totalCredit: credit,
            accountHeadDetails: {
              name: name,
              type,
            },
          };
        });

        setDebitHeads(
          normalized.filter((t) => t.accountHeadDetails?.type === "Debit")
        );
        setCreditHeads(
          normalized.filter((t) => t.accountHeadDetails?.type === "Credit")
        );
      } catch (err) {
        console.error("Error fetching trial balance:", err);
      }
    };

    fetchTrialBalance();
  }, [id, token, selectedYear]);

  // Opening & closing calculation
  useEffect(() => {
    if (!selectedYear) {
      setOpeningBalance(0);
      setClosingBalance(0);
      return;
    }

    const selectedFYLabel = `${selectedYear}-${selectedYear + 1}`;
    const sortedYears = [...years].sort(
      (a, b) => parseInt(a.split("-")[0]) - parseInt(b.split("-")[0])
    );

    let running = societyInitialBalance;
    let found = false;

    for (let fy of sortedYears) {
      const range = fiscalRangeFromLabel(fy);
      const fyEntries = entries.filter(
        (e) => e.date >= range.start && e.date <= range.end
      );

      const opening = running;
      fyEntries.forEach((e) => {
        running += e.type === "debit" ? e.amount : -e.amount;
      });
      const closing = running;

      if (fy === selectedFYLabel) {
        setOpeningBalance(opening);
        setClosingBalance(closing);
        found = true;
        break;
      }
    }
    if (!found) {
      setOpeningBalance(running);
      setClosingBalance(running);
    }
  }, [entries, years, selectedYear, societyInitialBalance]);

  useEffect(() => {
    const fetchMappings = async () => {
      if (!selectedYear || !id || !token) return;
      try {
        const res = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/reports/mappings/${id}?year=${selectedYear}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = res.data?.data?.mappings || {};
        const flat = Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, v?.reportType || ""])
        );
        setMappings(flat);
      } catch (err) {
        console.error("Failed to fetch saved mappings:", err);
      }
    };

    fetchMappings();
  }, [id, token, selectedYear]);

  const handleMapping = async (entryName, value, isDebit) => {
    setMappings((prev) => ({ ...prev, [entryName]: value }));

    if (!value || !id || !token || !selectedYear) return;

    const routeByType = {
      profitLoss: "profit-loss",
      balanceSheet: "balance-sheet",
      construction: "construction",
    };
    const route = routeByType[value];
    if (!route) return;

    // Find the account head (check both debit and credit arrays)
    const accountHead =
      debitHeads.find((d) => d.accountHeadDetails?.name === entryName) ||
      creditHeads.find((c) => c.accountHeadDetails?.name === entryName);

    const totalAmount =
      accountHead?.totalDebit || accountHead?.totalCredit || 0;

    // ✅ Use actual type, not just isDebit flag
    const side = accountHead?.accountHeadDetails?.type?.toLowerCase();

    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/reports/${route}/${id}`,
        {
          year: selectedYear,
          mappings: {
            [entryName]: {
              reportType: value,
              totalAmount,
              side, // <-- fixed
            },
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Error saving mapping:", err);
      setMappings((prev) => {
        const next = { ...prev };
        delete next[entryName];
        return next;
      });
    }
  };

  const totalDebit = useMemo(
    () =>
      openingBalance +
      debitHeads.reduce((sum, h) => sum + (h.totalDebit || 0), 0),
    [debitHeads, openingBalance]
  );
  const totalCredit = useMemo(
    () =>
      closingBalance +
      creditHeads.reduce((sum, h) => sum + (h.totalCredit || 0), 0),
    [creditHeads, closingBalance]
  );

  const baseOptions = [
    { value: "profitLoss", label: "Profit & Loss" },
    { value: "balanceSheet", label: "Balance Sheet" },
  ];
  if (societyInfo?.type === "labour") {
    baseOptions.push({
      value: "construction",
      label: "Construction Statement",
    });
  }

  // Allow same report type to be mapped to multiple account heads
  // Only filter out options that are already selected for the current account head
  const options = baseOptions;
  console.log("Available Options:", options);
  console.log("Mappings State:", mappings);

  const exportToPDF = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${societyInfo?.name || "Trial Balance"}_${selectedYear}-${
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

  return (
    <div className="p-6">
      <div className="ml-4 flex gap-2">
        <Button variant="outline" onClick={exportToPDF} className="gap-2">
          <Download className="w-4 h-4" /> Export PDF
        </Button>
      </div>
      {/* Header */}
      <div ref={printRef}>
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mt-5 print-hide">तेरीज पत्रक</h1>
          <div className="p-3 text-center">
            {" "}
            <p className="text-lg font-semibold">{societyInfo?.name},</p>{" "}
            <p>
              {" "}
              <span className="text-lg font-semibold">
                {" "}
                ता: {societyInfo?.taluka}, जि: {societyInfo?.district}{" "}
              </span>{" "}
            </p>{" "}
            <p className="mt-2 text-lg font-bold">
              तेरिज पत्रक{"    "}
              <span className="text-lg font-medium">
                01-04-{selectedYear}
                {"  "} ते {"  "}31-03-{selectedYear + 1}
              </span>
            </p>
          </div>
          <div className="mt-3 print-hide">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border px-2 py-1 rounded"
            >
              {years.map((fy) => (
                <option key={fy} value={parseInt(fy.split("-")[0], 10)}>
                  {fy} (01-Apr-{fy.split("-")[0]} to 31-Mar-{fy.split("-")[1]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="border-2 border-gray-200 shadow-lg overflow-hidden">
          <Table className="border-collapse w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center text-black font-bold text-lg py-4 border-r border-gray-200">
                  तपशील जमा
                </TableHead>
                <TableHead className="text-center text-black font-bold text-lg py-4 border-r border-gray-200">
                  रक्कम
                </TableHead>
                <TableHead className="text-center text-black font-bold text-lg py-4 border-r border-gray-200">
                  तपशील खर्च
                </TableHead>
                <TableHead className="text-center text-black font-bold text-lg py-4">
                  रक्कम
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Opening Balance Row */}
              <TableRow className="font-bold bg-gray-50 hover:bg-gary-100 transition-colors">
                <TableCell className="font-semibold text-gray-800 border-r border-gray-200 py-3">
                  आरंभी शिल्लक
                </TableCell>
                <TableCell className="text-center font-semibold text-green-600 border-r border-gray-200 py-3">
                  ₹ {openingBalance.toLocaleString()}
                </TableCell>
                <TableCell className="border-r border-gray-200"></TableCell>
                <TableCell></TableCell>
              </TableRow>

              {/* Dynamic Rows */}
              {(() => {
                const maxRows = Math.max(debitHeads.length, creditHeads.length);
                return Array.from({ length: maxRows }).map((_, idx) => {
                  const d = debitHeads[idx];
                  const c = creditHeads[idx];

                  return (
                    <TableRow
                      key={idx}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Debit Side */}
                      <TableCell className="border-r border-gray-200 py-2">
                        {d?.accountHeadDetails?.name || ""}
                        {d && d.accountHeadDetails?.name !== "आरंभी शिल्लक" && (
                          <select
                            className="ml-2 border px-1 py-0.5 rounded print-hide"
                            value={mappings[d.accountHeadDetails.name] || ""}
                            onChange={(e) =>
                              handleMapping(
                                d.accountHeadDetails.name,
                                e.target.value,
                                true
                              )
                            }
                          >
                            <option value="">-- Select Mapping --</option>
                            {options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </TableCell>
                      <TableCell className="text-center border-r border-gray-200 py-2">
                        {d ? `₹ ${d.totalDebit?.toLocaleString?.() || ""}` : ""}
                      </TableCell>

                      {/* Credit Side */}
                      <TableCell className="border-r border-gray-200 py-2">
                        {c?.accountHeadDetails?.name || ""}
                        {c && c.accountHeadDetails?.name !== "अखेरी शिल्लक" && (
                          <select
                            className="ml-2 border px-1 py-0.5 rounded print-hide"
                            value={mappings[c.accountHeadDetails.name] || ""}
                            onChange={(e) =>
                              handleMapping(
                                c.accountHeadDetails.name,
                                e.target.value,
                                false
                              )
                            }
                          >
                            <option value="">-- Select Mapping --</option>
                            {options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </TableCell>
                      <TableCell className="text-center py-2">
                        {c
                          ? `₹ ${c.totalCredit?.toLocaleString?.() || ""}`
                          : ""}
                      </TableCell>
                    </TableRow>
                  );
                });
              })()}

              {/* Closing Balance Row */}
              <TableRow className="font-bold bg-gray-50 hover:bg-gray-100 transition-colors">
                <TableCell className="border-r border-gray-200"></TableCell>
                <TableCell className="border-r border-gray-200"></TableCell>
                <TableCell className="font-semibold text-gray-800 border-r border-gray-200 py-3">
                  अखेरी शिल्लक
                </TableCell>
                <TableCell className="text-center font-semibold text-green-600 py-3">
                  ₹ {closingBalance.toLocaleString()}
                </TableCell>
              </TableRow>

              {/* Totals */}
              <TableRow className="font-bold bg-gray-100 hover:bg-gray-200 transition-colors">
                <TableCell className="font-semibold text-gray-800 border-r border-gray-300 py-3">
                  एकूण
                </TableCell>
                <TableCell className="text-center font-semibold text-gray-700 border-r border-gray-300 py-3">
                  ₹ {totalDebit.toLocaleString()}
                </TableCell>
                <TableCell className="font-semibold text-gray-800 border-r border-gray-300 py-3">
                  एकूण
                </TableCell>
                <TableCell className="text-center font-semibold text-gray-700 py-3">
                  ₹ {totalCredit.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
