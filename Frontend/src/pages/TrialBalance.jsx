import React, { useMemo, useState, useEffect, useContext, useRef, useTransition } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import { AuthContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle, Lock } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [loadingTB, setLoadingTB] = useState(false);
  const cacheRef = useRef({});
  const [isPending, startTransition] = useTransition();
  const [yearsLoaded, setYearsLoaded] = useState(false);

  useEffect(() => {
  const fetchSociety = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/societies/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const s = res?.data?.society || res?.data;

      setSocietyInfo(s);
      setSocietyInitialBalance(Number(s.initialBalance) || 0); // ✅ SOURCE OF TRUTH

      console.log("✅ INITIAL BALANCE FROM SOCIETY:", s.initialBalance);
      console.log("✅ FIRST FY:", s.financialYearStart);

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

      console.log("📘 Cashbook entries loaded:", list.length);

    } catch (err) {
      console.error("Failed to fetch entries:", err);
    }
  };

  if (id && token) fetchEntries();
}, [id, token]);


  // removed unused helper

  // fetch years
  useEffect(() => {
  const fetchYears = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/reports/trial-balance/years/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const list = Array.isArray(res.data?.years) ? res.data.years : [];
      const fyLabels = list
        .map((y) => (typeof y === "number" ? `${y}-${y + 1}` : y))
        .filter(Boolean)
        .sort((a, b) => parseInt(b) - parseInt(a));

      setYears(fyLabels);

      if (fyLabels.length > 0) {
        setSelectedYear(parseInt(fyLabels[0].split("-")[0], 10));
      }

      setYearsLoaded(true); // ✅ IMPORTANT
    } catch (err) {
      console.error(err);
    }
  };

  if (id && token) fetchYears();
}, [id, token]);

useEffect(() => {
  if (!id || !token || !selectedYear || !yearsLoaded) return;

  const fetchTrialBalance = async () => {
    try {
      setLoadingTB(true);

      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/reports/trial-balance/${id}?year=${selectedYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const rows = res.data?.trialBalance || [];

      const normalized = rows.map((it, idx) => ({
        accountHeadId: it.accountHeadId || `row-${idx}`,
        accountHeadName: it.accountHeadName || "",
        debit: it.debit || 0,
        credit: it.credit || 0,
      }));

      const nextDebit = normalized.filter((t) => t.debit > 0);
      const nextCredit = normalized.filter((t) => t.credit > 0);

      setDebitHeads(nextDebit);
      setCreditHeads(nextCredit);

      // ✅ cache AFTER valid load
      cacheRef.current[selectedYear] = {
        debitHeads: nextDebit,
        creditHeads: nextCredit,
      };
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTB(false);
    }
  };

  fetchTrialBalance();
}, [id, token, selectedYear, yearsLoaded]);

useEffect(() => {
  cacheRef.current = {};
}, [id]);

  // Opening & closing calculation
useEffect(() => {
  if (!selectedYear || !societyInfo) {
    setOpeningBalance(0);
    setClosingBalance(0);
    return;
  }

  const getFY = (dateStr) => {
    const d = new Date(dateStr);
    return d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  };

  // ✅ FIRST ACCOUNTING YEAR (SOURCE OF TRUTH)
  const firstFY = new Date(
    societyInfo.financialYearStart
  ).getFullYear();

  let running = societyInitialBalance;

  // ✅ FIRST YEAR LOGIC
  if (selectedYear === firstFY) {
    const fyEntries = entries.filter(
      (e) => getFY(e.date) === selectedYear
    );

    const net = fyEntries.reduce(
      (sum, e) => sum + (e.type === "debit" ? e.amount : -e.amount),
      0
    );

    setOpeningBalance(societyInitialBalance); // 💯 THIS WAS MISSING
    setClosingBalance(societyInitialBalance + net);
    return;
  }

  // ✅ SUBSEQUENT YEARS
  for (let y = firstFY; y <= selectedYear; y++) {
    const fyEntries = entries.filter(
      (e) => getFY(e.date) === y
    );

    const opening = running;

    const net = fyEntries.reduce(
      (sum, e) => sum + (e.type === "debit" ? e.amount : -e.amount),
      0
    );

    running = opening + net;

    if (y === selectedYear) {
      setOpeningBalance(opening);
      setClosingBalance(running);
      return;
    }
  }
}, [entries, selectedYear, societyInitialBalance, societyInfo]);


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
        const detail = Object.fromEntries(
          Object.entries(data).map(([k, v]) => [
            k,
            {
              reportType: v?.reportType || "",
              side: v?.side || "",
            },
          ])
        );
        setMappings(detail);
      } catch (err) {
        console.error("Failed to fetch saved mappings:", err);
      }
    };

    fetchMappings();
  }, [id, token, selectedYear]);

  const handleMapping = async (compositeKey, value, side) => {
    const prev = mappings[compositeKey];
    const headers = { Authorization: `Bearer ${token}` };
    if (!id || !token || !selectedYear) return;

    if (value === "__remove__" || value == null) {
      setMappings((prevState) => {
        const next = { ...prevState };
        delete next[compositeKey];
        return next;
      });
      try {
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/reports/mapping/remove/${id}`,
          { year: selectedYear, accountHeadId: compositeKey.split(":")[0], side },
          { headers }
        );
      } catch (err) {
        console.error("Error removing mapping:", err);
        setMappings((prevState) => ({ ...prevState, [compositeKey]: prev }));
      }
      return;
    }

    const routeByType = {
      profitLoss: "profit-loss",
      balanceSheet: "balance-sheet",
      construction: "construction",
    };
    const route = routeByType[value];
    if (!route) return;

    setMappings((prevState) => ({
      ...prevState,
      [compositeKey]: { reportType: value, side },
    }));

    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/reports/${route}/${id}`,
        {
          year: selectedYear,
          accountHeadId: compositeKey.split(":")[0],
          reportType: value,
          side,
        },
        { headers }
      );
    } catch (err) {
      console.error("Error saving mapping:", err);
      setMappings((prevState) => {
        const next = { ...prevState };
        if (prev) next[compositeKey] = prev;
        else delete next[compositeKey];
        return next;
      });
    }
  };

  const totalDebit = useMemo(
    () =>
      openingBalance +
      debitHeads.reduce((sum, h) => sum + (h.debit || 0), 0),
    [debitHeads, openingBalance]
  );
  const totalCredit = useMemo(
    () =>
      closingBalance +
      creditHeads.reduce((sum, h) => sum + (h.credit || 0), 0),
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
    <div className="px-4 sm:px-6 py-6">
      <div className="flex gap-2 mb-4">
        <Button variant="outline" onClick={exportToPDF} className="gap-2 w-full sm:w-auto">
          <Download className="w-4 h-4" /> Export PDF
        </Button>
      </div>
      {/* Header */}
      <div ref={printRef}>
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-4xl font-bold mt-5 print-hide">तेरीज पत्रक</h1>
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
              तेरिज पत्रक : {"    "}
              <span className="text-lg font-normal">
                सन {selectedYear} {"   "}  -  {"   "} {String(selectedYear + 1).slice(-2)}
              </span>
            </p>
          </div>
          <div className="mt-3 print-hide">
              <select
              value={selectedYear}
              onChange={(e) => startTransition(() => setSelectedYear(parseInt(e.target.value)))}
              className="border px-2 py-1 rounded w-full sm:w-auto"
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
        <div className="border-2 border-gray-200 shadow-lg overflow-x-auto -mx-4 sm:mx-0" aria-busy={loadingTB || isPending}>
          <Table className="border-collapse min-w-[640px] sm:min-w-full text-xs sm:text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center text-black font-bold p-2 sm:p-3 border-r border-gray-200">
                  तपशील जमा
                </TableHead>
                <TableHead className="text-center text-black font-bold p-2 sm:p-3 border-r border-gray-200">
                  रक्कम
                </TableHead>
                <TableHead className="text-center text-black font-bold p-2 sm:p-3 border-r border-gray-200">
                  तपशील खर्च
                </TableHead>
                <TableHead className="text-center text-black font-bold p-2 sm:p-3">
                  रक्कम
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(loadingTB || isPending) &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell colSpan={4} className="p-3">
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!loadingTB &&
                !isPending &&
                debitHeads.length === 0 &&
                creditHeads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center p-4 text-gray-500">
                      या आर्थिक वर्षासाठी माहिती उपलब्ध नाही
                    </TableCell>
                  </TableRow>
                )}

              {!loadingTB && !isPending && (
                <>
                  <TableRow className="font-bold bg-gray-50 hover:bg-gary-100 transition-colors text-xs sm:text-sm">
                    <TableCell className="font-semibold text-gray-800 border-r border-gray-200 p-2 sm:p-3">
                      आरंभी शिल्लक
                    </TableCell>
                    <TableCell className="text-center font-semibold text-green-600 border-r border-gray-200 p-2 sm:p-3">
                      ₹ {openingBalance.toLocaleString()}
                    </TableCell>
                    <TableCell className="border-r border-gray-200"></TableCell>
                    <TableCell></TableCell>
                  </TableRow>

                  {(() => {
                    const maxRows = Math.max(debitHeads.length, creditHeads.length);
                    return Array.from({ length: maxRows }).map((_, idx) => {
                      const d = debitHeads[idx];
                      const c = creditHeads[idx];

                      return (
                        <TableRow key={idx} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="border-r border-gray-200 p-2 sm:p-3 align-top">
                            {d?.accountHeadName || ""}
                            {d && d.accountHeadName !== "आरंभी शिल्लक" && (() => {
                              const key = `${d.accountHeadId}:debit`;
                              const m = mappings[key];
                              const isMapped = !!m?.reportType && m.side === "debit";
                              const opp = mappings[`${d.accountHeadId}:credit`];
                              const isAutoLocked = !!opp && opp.reportType === "balanceSheet";
                              if (isMapped) {
                                return (
                                  <div className="mt-1 sm:mt-0 ml-0 sm:ml-2 flex items-center gap-2 print-hide">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-xs sm:text-sm text-green-600">
                                      {m.reportType === "balanceSheet" ? "Mapped to Balance Sheet (Debit)" : "Mapped to Profit & Loss"}
                                    </span>
                                    <select
                                      className="ml-2 border px-1 py-0.5 rounded"
                                      value={m?.reportType || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "__remove__") {
                                          handleMapping(key, null, "debit");
                                        } else {
                                          handleMapping(key, val, "debit");
                                        }
                                      }}
                                    >
                                      <option value="">-- Select Mapping --</option>
                                      {options.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                      <option value="__remove__">Remove Mapping</option>
                                    </select>
                                  </div>
                                );
                              }
                              if (isAutoLocked) {
                                return (
                                  <div className="mt-1 sm:mt-0 ml-0 sm:ml-2 flex items-center gap-2 text-gray-500 print-hide">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Lock className="w-4 h-4" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Auto-locked because opposite side is used for Balance Sheet calculation
                                      </TooltipContent>
                                    </Tooltip>
                                    <span className="text-xs sm:text-sm">Auto-locked</span>
                                    <select
                                      className="ml-2 border px-1 py-0.5 rounded opacity-50 cursor-not-allowed"
                                      value=""
                                      disabled
                                    >
                                      <option value="">-- Select Mapping --</option>
                                      {options.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              }
                              return (
                                <select
                                  className="mt-1 sm:mt-0 ml-0 sm:ml-2 border px-1 py-0.5 rounded print-hide w-full sm:w-auto"
                                  value={m?.reportType || ""}
                                  onChange={(e) => handleMapping(key, e.target.value, "debit", d.debit)}
                                >
                                  <option value="">-- Select Mapping --</option>
                                  {options.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-center border-r border-gray-200 p-2 sm:p-3">
                            {d ? `₹ ${d.debit?.toLocaleString?.() || ""}` : ""}
                          </TableCell>

                          <TableCell className="border-r border-gray-200 p-2 sm:p-3 align-top">
                            {c?.accountHeadName || ""}
                            {c && c.accountHeadName !== "अखेरी शिल्लक" && (() => {
                              const key = `${c.accountHeadId}:credit`;
                              const m = mappings[key];
                              const isMapped = !!m?.reportType && m.side === "credit";
                              const opp = mappings[`${c.accountHeadId}:debit`];
                              const isAutoLocked = !!opp && opp.reportType === "balanceSheet";
                              if (isMapped) {
                                return (
                                  <div className="mt-1 sm:mt-0 ml-0 sm:ml-2 flex items-center gap-2 print-hide">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-xs sm:text-sm text-green-600">
                                      {m.reportType === "balanceSheet" ? "Mapped to Balance Sheet (Credit)" : "Mapped to Profit & Loss"}
                                    </span>
                                    <select
                                      className="ml-2 border px-1 py-0.5 rounded"
                                      value={m?.reportType || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "__remove__") handleMapping(key, null, "credit");
                                        else handleMapping(key, val, "credit");
                                      }}
                                    >
                                      <option value="">-- Select Mapping --</option>
                                      {options.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                      <option value="__remove__">Remove Mapping</option>
                                    </select>
                                  </div>
                                );
                              }
                              if (isAutoLocked) {
                                return (
                                  <div className="mt-1 sm:mt-0 ml-0 sm:ml-2 flex items-center gap-2 text-gray-500 print-hide">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Lock className="w-4 h-4" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Auto-locked because opposite side is used for Balance Sheet calculation
                                      </TooltipContent>
                                    </Tooltip>
                                    <span className="text-xs sm:text-sm">Auto-locked</span>
                                    <select className="ml-2 border px-1 py-0.5 rounded opacity-50 cursor-not-allowed" value="" disabled>
                                      <option value="">-- Select Mapping --</option>
                                      {options.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              }
                              return (
                                <select
                                  className="mt-1 sm:mt-0 ml-0 sm:ml-2 border px-1 py-0.5 rounded print-hide w-full sm:w-auto"
                                  value={m?.reportType || ""}
                                  onChange={(e) => handleMapping(key, e.target.value, "credit", c.credit)}
                                >
                                  <option value="">-- Select Mapping --</option>
                                  {options.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-center p-2 sm:p-3">
                            {c ? `₹ ${c.credit?.toLocaleString?.() || ""}` : ""}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}

                  <TableRow className="font-bold bg-gray-50 hover:bg-gray-100 transition-colors text-xs sm:text-sm">
                    <TableCell className="border-r border-gray-200"></TableCell>
                    <TableCell className="border-r border-gray-200"></TableCell>
                    <TableCell className="font-semibold text-gray-800 border-r border-gray-200 p-2 sm:p-3">
                      अखेरी शिल्लक
                    </TableCell>
                    <TableCell className="text-center font-semibold text-green-600 p-2 sm:p-3">
                      ₹ {closingBalance.toLocaleString()}
                    </TableCell>
                  </TableRow>

                  <TableRow className="font-bold bg-gray-100 hover:bg-gray-200 transition-colors text-xs sm:text-sm">
                    <TableCell className="font-semibold text-gray-800 border-r border-gray-300 p-2 sm:p-3">
                      एकूण
                    </TableCell>
                    <TableCell className="text-center font-semibold text-gray-700 border-r border-gray-300 p-2 sm:p-3">
                      ₹ {totalDebit.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-800 border-r border-gray-300 p-2 sm:p-3">
                      एकूण
                    </TableCell>
                    <TableCell className="text-center font-semibold text-gray-700 p-2 sm:p-3">
                      ₹ {totalCredit.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
