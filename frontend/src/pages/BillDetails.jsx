import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  Printer,
  Mail,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MONTHS = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function BillDetails() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchBillDetails();
  }, [billId]);

  const fetchBillDetails = async () => {
    try {
      const response = await axios.get(`${API}/billing/${billId}`);
      setBill(response.data.bill);
      setSales(response.data.sales);
    } catch (error) {
      toast.error("Failed to load bill details");
      navigate("/billing");
    } finally {
      setLoading(false);
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
        bill_id: billId,
        recipient_email: recipientEmail
      });
      toast.success("Bill sent successfully!");
      setEmailDialogOpen(false);
      fetchBillDetails();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-500">Bill not found</p>
        <Button onClick={() => navigate("/billing")} className="mt-4">
          Back to Billing
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="bill-details-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/billing")}
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 font-fraunces">
              Bill Statement
            </h1>
            <p className="text-stone-500">
              {MONTHS[bill.month]} {bill.year}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            data-testid="print-btn"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button
            onClick={() => setEmailDialogOpen(true)}
            className="btn-primary"
            data-testid="email-btn"
          >
            <Mail className="w-4 h-4 mr-2" />
            Send Email
          </Button>
        </div>
      </div>

      {/* Printable Bill */}
      <Card className="max-w-4xl mx-auto">
        {/* Bill Header */}
        <div className="bg-blue-900 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold font-fraunces">Lata Dairy</h2>
              <p className="text-blue-200 mt-1">Monthly Bill Statement</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-200">Bill Period</p>
              <p className="text-lg font-semibold">
                {MONTHS[bill.month]} {bill.year}
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          {/* Customer Info */}
          <div className="flex justify-between items-start mb-6 pb-6 border-b border-stone-200">
            <div>
              <p className="text-sm text-stone-500">Bill To</p>
              <p className="text-lg font-semibold text-stone-900">{bill.customer_name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-stone-500">Generated On</p>
              <p className="text-stone-700">
                {new Date(bill.generated_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-stone-50 rounded-lg p-4 text-center">
              <p className="text-sm text-stone-500">Total Purchases</p>
              <p className="text-xl font-bold text-stone-900">{formatCurrency(bill.total_sales)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-green-700">Amount Paid</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(bill.total_paid)}</p>
            </div>
            <div className={`${bill.balance_due > 0 ? 'bg-red-50' : 'bg-green-50'} rounded-lg p-4 text-center`}>
              <p className={`text-sm ${bill.balance_due > 0 ? 'text-red-700' : 'text-green-700'}`}>
                Balance Due
              </p>
              <p className={`text-xl font-bold ${bill.balance_due > 0 ? 'text-red-700' : 'text-green-700'}`}>
                {formatCurrency(bill.balance_due)}
              </p>
            </div>
          </div>

          {/* Sales Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Transaction Details</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-stone-50">
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        {new Date(sale.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {sale.items.map((item, i) => (
                            <span key={i}>
                              {item.product_name} ({item.quantity})
                              {i < sale.items.length - 1 && ", "}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(sale.total_amount)}
                      </TableCell>
                      <TableCell className="text-right text-green-700">
                        {formatCurrency(sale.paid_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {sale.total_amount - sale.paid_amount > 0 ? (
                          <span className="text-red-600">
                            {formatCurrency(sale.total_amount - sale.paid_amount)}
                          </span>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">Paid</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-stone-200">
            <p className="text-stone-500 text-sm">
              Thank you for your continued trust in Lata Dairy
            </p>
            <p className="text-stone-400 text-xs mt-2">
              For any queries, please contact us
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Bill via Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
              {sendingEmail ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
