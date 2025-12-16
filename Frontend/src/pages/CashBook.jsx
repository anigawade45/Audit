import React, { useState, useMemo, useContext, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { AuthContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReactTransliterate } from "react-transliterate";
import "react-transliterate/dist/index.css";
import { useReactToPrint } from "react-to-print";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Download, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const debitHeads = [
  "सभासद जमा",
  "सभासद वर्गणी जमा",
  "नोंदणी पूर्व मेंटेनन्स जमा",
  "बँक व्याज",
  "अनामत",
  "सभासद वर्गणी येणे(जमा)",
];

const creditHeads = [
  "बँक सेव्हिंग",
  "नोंदणी फी",
  "स्टॅम्प पेपर",
  "स्टेशनरी",
  "किरकोळ खर्च",
  "दुरुस्ती देखभाल",
  "साफसफाई कामगार पगार",
  "पाणी सोडण्याचा पगार",
  "वीजबिल",
  "पाणीपट्टी",
  "सभासद वर्गणी येणे",
  "अनामत परत",
];

export default function CashBook() {
  const { token } = useContext(AuthContext);
  const { id } = useParams();
  const printRef = useRef();

  const [societyInfo, setSocietyInfo] = useState(null);
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "debit",
    accountHead: "",
    description: "",
    amount: "",
    customHead: "",
  });

  const [debitHeadsList, setDebitHeadsList] = useState(debitHeads);
  const [creditHeadsList, setCreditHeadsList] = useState(creditHeads);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one entry to delete");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/cashbook/batch-delete`,
        { ids: selectedIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setEntries((prev) => prev.filter((e) => !selectedIds.includes(e._id)));
        setSelectedIds([]);
        setDeleteMode(false);
        setShowConfirm(false);
        toast.success(`${selectedIds.length} entries deleted successfully!`);
      }
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error("Failed to delete entries. Please try again.");
    }
  };

  const cancelDeleteMode = () => {
  setDeleteMode(false);
  setSelectedIds([]);
  setShowConfirm(false);
};


  const [selectedFiscalYear, setSelectedFiscalYear] = useState("");

  const getCurrentFiscalYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (month <= 3) {
    return `${year - 1}-${String(year).slice(-2)}`;
  }
  return `${year}-${String(year + 1).slice(-2)}`;
};

const fiscalLabelFromDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const startYear = d.getFullYear();
    if (d.getMonth() + 1 <= 3) {
      const s = startYear - 1;
      return `${s}-${String(startYear).slice(-2)}`;
    }
    const endYear = startYear + 1;
    return `${startYear}-${String(endYear).slice(-2)}`;
  };

  const fiscalOptions = useMemo(() => {
    const availableYears = new Set();
    entries.forEach((entry) => {
      const year = fiscalLabelFromDate(entry.date);
      if (year) {
        availableYears.add(year);
      }
    });

    return Array.from(availableYears).sort((a, b) => {
      const yearA = parseInt(a.split("-")[0]);
      const yearB = parseInt(b.split("-")[0]);
      return yearB - yearA;
    });
  }, [entries]);

const hasEntriesForYear = (fy) => fiscalOptions.includes(fy);
const isDataReady = societyInfo !== null && entries.length > 0;

useEffect(() => {
  // ❗ Do nothing until data is ready
  if (!isDataReady) return;

  // ❗ Do not override user/manual selection
  if (selectedFiscalYear) return;

  // 1️⃣ Society current year ONLY if entries exist
  if (
    societyInfo?.currentYear &&
    fiscalOptions.includes(societyInfo.currentYear)
  ) {
    setSelectedFiscalYear(societyInfo.currentYear);
    return;
  }

  // 2️⃣ FIRST year of society (earliest entry year) ✅
  if (fiscalOptions.length > 0) {
    setSelectedFiscalYear(fiscalOptions[fiscalOptions.length - 1]);
    return;
  }

  // 3️⃣ Society financial start
  if (societyInfo?.financialYearStart) {
    setSelectedFiscalYear(
      fiscalLabelFromDate(societyInfo.financialYearStart)
    );
    return;
  }

  // 4️⃣ Final fallback (ONLY after everything else fails)
  setSelectedFiscalYear(getCurrentFiscalYear());

}, [
  isDataReady,
  selectedFiscalYear,
  fiscalOptions,
  societyInfo,
]);

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

useEffect(() => {
  const fetchSociety = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/societies/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const s = res?.data?.society || res?.data;
      setSocietyInfo(s);

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
          _id: e._id,
          date: (e.date || "").split("T")[0],
          type: String(e.type || "").toLowerCase(),
          accountHead:
            e.accountHeadName || e.accountHead?.name || e.accountHead,
          description: e.description,
          amount: Number(e.amount) || 0,
        }))
      );
    } catch (err) {
      console.error("Fetch Entries Error:", err);
      setEntries([]);
      toast.error("Failed to fetch cashbook entries.");
    }
  };

  if (id && token) fetchEntries();
}, [id, token]);

  useEffect(() => {
    const fetchAccountHeads = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/account-heads/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const { debit = [], credit = [] } = res.data || {};

        // Merge backend heads with prebuilt ones, avoiding duplicates
        setDebitHeadsList([...new Set([...debitHeads, ...debit])]);
        setCreditHeadsList([...new Set([...creditHeads, ...credit])]);
      } catch (err) {
        console.error("Failed to fetch account heads:", err);

        // Fallback: use prebuilt lists
        setDebitHeadsList(debitHeads);
        setCreditHeadsList(creditHeads);
      }
    };

    if (id && token) fetchAccountHeads();
  }, [id, token]);

  const addEntry = async () => {
    if (
      !newEntry.amount ||
      (!newEntry.accountHead && !newEntry.customHead) ||
      (newEntry.accountHead === "__other__" && !newEntry.customHead)
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    let accountToSave = newEntry.accountHead;
    if (accountToSave === "__other__") {
      accountToSave = newEntry.customHead.trim();

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/account-heads/${id}`,
        {
          type: newEntry.type.charAt(0).toUpperCase() + newEntry.type.slice(1),
          name: accountToSave,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (newEntry.type.toLowerCase() === "debit") {
        setDebitHeadsList((prev) => [...prev, response.data.head.name]);
      } else {
        setCreditHeadsList((prev) => [...prev, response.data.head.name]);
      }
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/cashbook/add/${id}`,
        {
          date: newEntry.date,
          type: newEntry.type,
          accountHeadName: accountToSave,
          amount: parseFloat(newEntry.amount),
          description: newEntry.description,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/cashbook/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const list = Array.isArray(res.data) ? res.data : res.data?.entries || [];
      setEntries(
        list.map((e) => ({
          _id: e._id,
          date: (e.date || "").split("T")[0],
          type: String(e.type || "").toLowerCase(),
          accountHead:
            e.accountHeadName || e.accountHead?.name || e.accountHead,
          description: e.description,
          amount: Number(e.amount) || 0,
        }))
      );

      setNewEntry({
        date: newEntry.date,
        type: "debit",
        accountHead: "",
        description: "",
        amount: "",
        customHead: "",
      });

      toast.success("Entry added successfully!");
    } catch (err) {
      console.error("Add Entry Error:", err);
      const errorMsg =
        err.response?.data?.message || "Failed to add entry. Please try again.";
      toast.error(errorMsg);
    }
  };

  /* removed unused yearlyBalances */

  const dailyData = useMemo(() => {
    if (!selectedFiscalYear) return {};

    // Step 1: sort all entries globally (not just current FY)
    const allSorted = [...entries].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Step 2: build fiscal year list in ascending order
    const fiscalOrder = [
      ...new Set(allSorted.map((e) => fiscalLabelFromDate(e.date))),
    ].sort((a, b) => parseInt(a) - parseInt(b));

    // Step 3: carry balances year by year
    let prevClosing = Number(societyInfo?.initialBalance) || 0;
    const balancesByYear = {};

    fiscalOrder.forEach((fy) => {
      const fyRange = fiscalRangeFromLabel(fy);
      const fyEntries = fyRange
        ? allSorted.filter(
            (e) => e.date >= fyRange.start && e.date <= fyRange.end
          )
        : [];

      let running = prevClosing;
      const grouped = {};
      const uniqueDates = [...new Set(fyEntries.map((e) => e.date))];

      uniqueDates.forEach((date) => {
        const debitEntries = fyEntries.filter(
          (e) => e.date === date && e.type === "debit"
        );
        const creditEntries = fyEntries.filter(
          (e) => e.date === date && e.type === "credit"
        );

        const totalDebit = debitEntries.reduce(
          (s, e) => s + (e.amount || 0),
          0
        );
        const totalCredit = creditEntries.reduce(
          (s, e) => s + (e.amount || 0),
          0
        );

        const opening = running;
        const todayExpense = totalCredit;
        const closing = opening + totalDebit - todayExpense;

        grouped[date] = {
          date,
          opening,
          debitEntries,
          creditEntries,
          todayExpense,
          closing,
        };

        running = closing;
      });

      balancesByYear[fy] = {
        daily: grouped,
        opening: prevClosing,
        closing: running,
      };
      prevClosing = running; // carry forward to next FY
    });

    // Step 4: return only the selected year’s daily data
    return balancesByYear[selectedFiscalYear]?.daily || {};
  }, [entries, societyInfo?.initialBalance, selectedFiscalYear]);

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  useEffect(() => {
    const savedDebit = JSON.parse(localStorage.getItem("debitHeads") || "[]");
    const savedCredit = JSON.parse(localStorage.getItem("creditHeads") || "[]");
    if (savedDebit.length)
      setDebitHeadsList((prev) => [...new Set([...prev, ...savedDebit])]);
    if (savedCredit.length)
      setCreditHeadsList((prev) => [...new Set([...prev, ...savedCredit])]);
  }, []);

  useEffect(() => {
    localStorage.setItem("debitHeads", JSON.stringify(debitHeadsList));
  }, [debitHeadsList]);

  const fiscalYearDisplay = useMemo(() => {
  if (!selectedFiscalYear) return null;

  const start = parseInt(selectedFiscalYear.split("-")[0], 10);
  return {
    start,
    end: start + 1,
  };
}, [selectedFiscalYear]);

  useEffect(() => {
    localStorage.setItem("creditHeads", JSON.stringify(creditHeadsList));
  }, [creditHeadsList]);

  const exportToPDF = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${societyInfo?.name || "Cashbook"}_${selectedFiscalYear}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

  return (
    
    <div className="px-4 sm:px-6 py-6">
       <div className="sm:ml-4 flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={exportToPDF} className="gap-2 w-full sm:w-auto">
            <Download className="w-4 h-4" /> Export PDF
          </Button>
          {!deleteMode ? (
  <Button
    variant="outline"
    onClick={() => setDeleteMode(true)}
    className="gap-2"
  >
    <Trash2 className="w-4 h-4" />
    Delete Entry
  </Button>
) : (
  <div className="flex gap-2">
    <Button
      variant="destructive"
      onClick={() => setShowConfirm(true)}
      className="gap-2"
    >
      <Trash2 className="w-4 h-4" />
      Confirm Delete
    </Button>

    <Button
      variant="outline"
      onClick={cancelDeleteMode}
    >
      Cancel
    </Button>
  </div>
)}

        </div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <div className="w-full text-center">
          <h1 className="text-2xl sm:text-4xl font-bold">
            रोजकिर्द
          </h1>
          <div className="mt-4 text-semibold">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="sm:mr-2">वर्ष (Year):</label>
              <Select
  value={selectedFiscalYear}
  onValueChange={setSelectedFiscalYear}
              >

                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="वर्ष निवडा" />
                </SelectTrigger>
                <SelectContent>
                  {fiscalOptions.map((fy) => (
                    <SelectItem key={fy} value={fy}>
                      {fy}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div> 
      </div>
      <Card className="mb-6">
        <CardHeader>
          <h3 className="font-bold">नवीन नोंद जोडा</h3>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addEntry();
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {" "}
              <Input
                type="date"
                value={newEntry.date}
                min={societyInfo?.financialYearStart || ""}
                onChange={(e) =>
                  setNewEntry((prev) => ({ ...prev, date: e.target.value }))
                }
                className="w-full"
              />{" "}
              <Select
                value={newEntry.type}
                onValueChange={(val) =>
                  setNewEntry((prev) => ({
                    ...prev,
                    type: val,
                    accountHead: "",
                  }))
                }
              >
                {" "}
                <SelectTrigger className="w-full">
                  {" "}
                  <SelectValue placeholder="जमा/खर्च निवडा" />{" "}
                </SelectTrigger>{" "}
                <SelectContent>
                  {" "}
                  <SelectItem value="debit">जमा (Debit)</SelectItem>{" "}
                  <SelectItem value="credit">खर्च (Credit)</SelectItem>{" "}
                </SelectContent>{" "}
              </Select>{" "}
              <Select
                value={newEntry.accountHead}
                onValueChange={(val) =>
                  setNewEntry((prev) => ({
                    ...prev,
                    accountHead: val,
                    customHead: val === "__other__" ? prev.customHead : "",
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="खाते शिर्षक निवडा" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto custom-scroll">
                  {/* 🔍 Search box at top */}
                  <div className="p-2 sticky top-0 bg-white z-10 border-b">
                    <ReactTransliterate
                      lang="mr"
                      value={newEntry.searchHead || ""}
                      onChangeText={(txt) =>
                        setNewEntry((prev) => ({ ...prev, searchHead: txt }))
                      }
                      placeholder="शोधा / Search"
                      renderComponent={(props) => (
                        <Input {...props} className="w-full text-sm" />
                      )}
                    />
                  </div>

                  {(newEntry.type === "debit"
                    ? debitHeadsList
                    : creditHeadsList
                  )
                    .filter(
                      (head) =>
                        !newEntry.searchHead ||
                        head.includes(newEntry.searchHead.trim())
                    )
                    .map((head) => (
                      <SelectItem key={head} value={head}>
                        {head}
                      </SelectItem>
                    ))}
                  <SelectItem value="__other__">इतर (Other)</SelectItem>
                </SelectContent>
              </Select>
              {/* Show custom input if "Other" selected */}
              {newEntry.accountHead === "__other__" && (
                <ReactTransliterate
                  lang="mr"
                  value={newEntry.customHead}
                  onChangeText={(txt) =>
                    setNewEntry((prev) => ({ ...prev, customHead: txt }))
                  }
                  placeholder="इतर शीर्षक (मराठीत टाका)"
                  renderComponent={(props) => <Input {...props} className="w-full" />}
                />
              )}
              <ReactTransliterate
                lang="mr"
                value={newEntry.description}
                onChangeText={(txt) =>
                  setNewEntry((prev) => ({ ...prev, description: txt }))
                }
                placeholder="वर्णन (Description)"
                renderComponent={(props) => (
                  <Textarea
                    {...props}
                    rows={1} // fixed 4 rows
                    className="w-full border rounded-lg p-2 resize-none overflow-y-auto"
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      maxHeight: "2rem",
                    }}
                  />
                )}
              />{" "}
              <Input
                type="number"
                placeholder="रक्कम (Amount)"
                value={newEntry.amount}
                onChange={(e) =>
                  setNewEntry((prev) => ({ ...prev, amount: e.target.value }))
                }
                className="w-full"
              />{" "}
            </div>{" "}
            <Button type="submit6" className="mt-4 gap-2 w-full sm:w-auto">
              {" "}
              <Plus className="w-4 h-4" /> Add Entry{" "}
            </Button>{" "}
          </form>
        </CardContent>
      </Card>
      <div ref={printRef}>
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
         {fiscalYearDisplay && (
  <p className="mt-2 text-lg font-bold">
    रोजकिर्द :{" "}
    <span className="text-lg font-medium">
      {fiscalYearDisplay.start} ते {fiscalYearDisplay.end}
    </span>
  </p>
)}

        </div>
        <Card>
          <CardContent className="p-0 overflow-x-auto -mx-4 sm:mx-0">
            <Table className="min-w-[480px] sm:min-w-full text-xs sm:text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center font-bold p-2 sm:p-3">
                    जमा तपशील
                  </TableHead>
                  <TableHead className="text-center font-bold p-2 sm:p-3">रक्कम</TableHead>
                  <TableHead className="text-center font-bold p-2 sm:p-3">
                    खर्च तपशील
                  </TableHead>
                  <TableHead className="text-center font-bold p-2 sm:p-3">रक्कम</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(dailyData).map((day) => {
                  const debitSum = day.debitEntries.reduce(
                    (s, e) => s + (Number(e.amount) || 0),
                    0
                  );
                  const ekunLeft = (Number(day.opening) || 0) + debitSum;
                  const ekunRight =
                    (Number(day.todayExpense) || 0) +
                    (Number(day.closing) || 0);
                  return (
                    <React.Fragment key={day.date}>
                      <TableRow className="bg-gray-100 border-t-2 border-b-2 text-xs sm:text-sm">
                        <TableCell className="font-bold p-2 sm:p-3">
                          तारीख: {formatDate(day.date)}
                          <br /> आरंभी शिल्लक
                        </TableCell>
                        <TableCell className="text-center p-2 sm:p-3">
                          ₹ {day.opening?.toLocaleString?.() ?? day.opening}
                        </TableCell>
                        <TableCell className="p-2 sm:p-3"></TableCell>
                        <TableCell className="p-2 sm:p-3"></TableCell>
                      </TableRow>
                      {(() => {
                        const maxRows = Math.max(
                          day.debitEntries.length,
                          day.creditEntries.length
                        );
                        return Array.from({ length: Math.max(1, maxRows) }).map(
                          (_, idx) => {
                            const d = day.debitEntries[idx];
                            const c = day.creditEntries[idx];
                            return (
                              <TableRow key={`${day.date}-${idx}`}>
                                <TableCell className="max-w-20 p-2 sm:p-3 align-top text-xs sm:text-sm">
                                  {d ? (
                                    <>
                                      {deleteMode && (
                                        <input
                                          type="checkbox"
                                          className="mr-2 size-4"
                                          checked={selectedIds.includes(d._id)}
                                          onChange={() => toggleSelect(d._id)}
                                        />
                                      )}
                                      <strong className="block">
                                        {d.accountHead}
                                      </strong>
                                      {d.description && (
                                        <div className="text-[10px] sm:text-xs whitespace-normal break-words">
                                          {d.description}
                                        </div>
                                      )}
                                    </>
                                  ) : null}
                                </TableCell>
                                <TableCell className="text-center p-2 sm:p-3 text-xs sm:text-sm">
                                  {d
                                    ? `₹ ${
                                        d.amount?.toLocaleString?.() ?? d.amount
                                      }`
                                    : ""}
                                </TableCell>
                                <TableCell className="max-w-20 p-2 sm:p-3 align-top text-xs sm:text-sm">
                                  {c ? (
                                    <>
                                      {deleteMode && (
                                        <input
                                          type="checkbox"
                                          className="mr-2 size-4"
                                          checked={selectedIds.includes(c._id)}
                                          onChange={() => toggleSelect(c._id)}
                                        />
                                      )}
                                      <strong className="block">
                                        {c.accountHead}
                                      </strong>
                                      {c.description && (
                                        <div className="text-[10px] sm:text-xs whitespace-normal break-words">
                                          {c.description}
                                        </div>
                                      )}
                                    </>
                                  ) : null}
                                </TableCell>
                                <TableCell className="text-center p-2 sm:p-3 text-xs sm:text-sm">
                                  {c
                                    ? `₹ ${
                                        c.amount?.toLocaleString?.() ?? c.amount
                                      }`
                                    : ""}
                                </TableCell>
                              </TableRow>
                            );
                          }
                        );
                      })()}
                      <TableRow className="h-[36px] text-xs sm:text-sm">
                        <TableCell className="p-2 sm:p-3"></TableCell>
                        <TableCell className="p-2 sm:p-3"></TableCell>
                      </TableRow>
                      <TableRow className="h-[36px] text-xs sm:text-sm">
                        <TableCell className="p-2 sm:p-3"></TableCell>
                        <TableCell className="p-2 sm:p-3"></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="p-2 sm:p-3"></TableCell>
                        <TableCell className="p-2 sm:p-3"></TableCell>
                        <TableCell className="font-bold p-2 sm:p-3 text-xs sm:text-sm">आजचा खर्च</TableCell>
                        <TableCell className="text-center p-2 sm:p-3 text-xs sm:text-sm">
                          ₹ {day.todayExpense}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="p-2 sm:p-3"></TableCell>
                        <TableCell className="p-2 sm:p-3"></TableCell>
                        <TableCell className="font-bold p-2 sm:p-3 text-xs sm:text-sm">
                          अखेरी शिल्लक
                        </TableCell>
                        <TableCell className="text-center p-2 sm:p-3 text-xs sm:text-sm">
                          ₹ {day.closing}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-bold p-2 sm:p-3 text-xs sm:text-sm">एकूण</TableCell>
                        <TableCell className="text-center p-2 sm:p-3 text-xs sm:text-sm">
                          ₹ {ekunLeft.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-bold p-2 sm:p-3 text-xs sm:text-sm">एकूण</TableCell>
                        <TableCell className="text-center p-2 sm:p-3 text-xs sm:text-sm">
                          ₹ {ekunRight.toLocaleString()}
                        </TableCell>
                      </TableRow>
                      <TableRow className="h-[45px]">
                        <TableCell className="p-2 sm:p-3"></TableCell>
                        <TableCell className="p-2 sm:p-3"></TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete {selectedIds.length} entries?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
