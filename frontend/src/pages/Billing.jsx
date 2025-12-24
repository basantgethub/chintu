import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Receipt,
  Mail,
  Eye,
  RefreshCw,
  Calendar,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" }
];

export default function Billing() {
  const navigate = useNavigate();
  const currentDate = new Date();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const years = Array.from(
    { length: 5 }, 
    (_, i) => currentDate.getFullYear() - i
  );

  useEffect(() => {
    fetchBills();
  }, [selectedMonth, selectedYear]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API}/billing/monthly?month=${selectedMonth}&year=${selectedYear}`
      );
      setBills(response.data);
    } catch (error) {
      toast.error("Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBills = async () => {
    setGenerating(true);
    try {
      const response = await axios.post(
        `${API}/billing/generate?month=${selectedMonth}&year=${selectedYear}`
      );
      toast.success(response.data.message);
      fetchBills();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to generate bills");
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      toast.error("Please enter email address");
      return;
    }

    setSendingEmail(true);
    try {
      await axios.post(`${API}/billing/send-email`, {
        bill_id: selectedBill.id,
        recipient_email: recipientEmail
      });
      toast.success("Bill sent successfully!");
      setEmailDialogOpen(false);
      setRecipientEmail("");
      fetchBills();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  const openEmailDialog = (bill) => {
    setSelectedBill(bill);
    setRecipientEmail("");
    setEmailDialogOpen(true);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const totalSales = bills.reduce((sum, bill) => sum + bill.total_sales, 0);
  const totalPaid = bills.reduce((sum, bill) => sum + bill.total_paid, 0);
  const totalDue = bills.reduce((sum, bill) => sum + bill.balance_due, 0);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="billing-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Monthly Billing</h1>
          <p className="page-description">Generate and manage customer bills</p>
        </div>
        <Button 
          onClick={handleGenerateBills}
          disabled={generating}
          className="btn-primary"
          data-testid="generate-bills-btn"
        >
          {generating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Receipt className="w-4 h-4 mr-2" />
              Generate Bills
            </>
          )}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-sm text-stone-500 mb-1 block">Month</Label>
              <Select 
                value={selectedMonth.toString()} 
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger data-testid="month-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-sm text-stone-500 mb-1 block">Year</Label>
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger data-testid="year-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-stone-500">Total Sales</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">{formatCurrency(totalSales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-stone-500">Total Collected</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-stone-500">Total Outstanding</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalDue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bills Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      ) : bills.length === 0 ? (
        <div className="empty-state">
          <Receipt className="empty-state-icon" />
          <h3 className="empty-state-title">No bills for this period</h3>
          <p className="empty-state-description">
            Click "Generate Bills" to create bills for customers with sales in {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </p>
        </div>
      ) : (
        <Card className="table-container">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50">
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold text-right">Total Sales</TableHead>
                  <TableHead className="font-semibold text-right">Paid</TableHead>
                  <TableHead className="font-semibold text-right">Balance</TableHead>
                  <TableHead className="font-semibold text-center">Transactions</TableHead>
                  <TableHead className="font-semibold text-center">Email</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill, index) => (
                  <TableRow 
                    key={bill.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.03}s` }}
                    data-testid={`bill-row-${bill.id}`}
                  >
                    <TableCell>
                      <p className="font-medium text-stone-900">{bill.customer_name}</p>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(bill.total_sales)}
                    </TableCell>
                    <TableCell className="text-right text-green-700">
                      {formatCurrency(bill.total_paid)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={
                        bill.balance_due > 0 
                          ? "bg-red-100 text-red-800" 
                          : "bg-green-100 text-green-800"
                      }>
                        {formatCurrency(bill.balance_due)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {bill.sales_count}
                    </TableCell>
                    <TableCell className="text-center">
                      {bill.email_sent ? (
                        <Badge className="bg-green-100 text-green-800">Sent</Badge>
                      ) : (
                        <Badge variant="outline">Not sent</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/billing/${bill.id}`)}
                          data-testid={`view-bill-${bill.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEmailDialog(bill)}
                          data-testid={`email-bill-${bill.id}`}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Bill via Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-stone-500 mb-2">
                Send bill for <strong>{selectedBill?.customer_name}</strong>
              </p>
              <p className="text-sm text-stone-500">
                Period: {MONTHS.find(m => m.value === selectedBill?.month)?.label} {selectedBill?.year}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Recipient Email</Label>
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="customer@example.com"
                data-testid="email-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="btn-primary"
              data-testid="send-email-btn"
            >
              {sendingEmail ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
