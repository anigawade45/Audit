// src/pages/Ledger.jsx
import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Download } from "lucide-react";

// A fully standalone Ledger component - no backend needed
export default function Ledger() {
  const [ledgerEntries] = useState([
    {
      id: "1",
      date: "2025-04-01",
      particulars: "Opening Balance",
      debit: 0,
      credit: 5000,
    },
    {
      id: "2",
      date: "2025-04-05",
      particulars: "Purchase Materials",
      debit: 2000,
      credit: 0,
    },
    {
      id: "3",
      date: "2025-04-10",
      particulars: "Sale of Goods",
      debit: 0,
      credit: 3000,
    },
    {
      id: "4",
      date: "2025-04-15",
      particulars: "Rent Expense",
      debit: 1000,
      credit: 0,
    },
    {
      id: "5",
      date: "2025-04-20",
      particulars: "Misc Income",
      debit: 0,
      credit: 1500,
    },
  ]);

  const totalDebit = ledgerEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = ledgerEntries.reduce((sum, e) => sum + e.credit, 0);
  const closingBalance = totalCredit - totalDebit;

  const exportToPDF = () => {
    window.print();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Ledger</h1>
        <Button variant="outline" onClick={exportToPDF} className="gap-2">
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Ledger Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg">General Ledger</h2>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Particulars</TableHead>
                <TableHead className="text-right">Debit (₹)</TableHead>
                <TableHead className="text-right">Credit (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgerEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>{entry.particulars}</TableCell>
                  <TableCell className="text-right">
                    {entry.debit.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.credit.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 border-black font-bold">
                <TableCell colSpan={2} className="text-center">
                  Total
                </TableCell>
                <TableCell className="text-right">
                  {totalDebit.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {totalCredit.toLocaleString()}
                </TableCell>
              </TableRow>
              <TableRow className="font-bold">
                <TableCell colSpan={3} className="text-center">
                  Closing Balance
                </TableCell>
                <TableCell
                  className={`text-right ${
                    closingBalance >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {closingBalance.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
