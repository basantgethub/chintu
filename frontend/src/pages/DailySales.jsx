import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Plus,
  ShoppingCart,
  Trash2,
  Calendar as CalendarIcon,
  IndianRupee,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DailySales() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    customer_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    paid_amount: "0",
    items: []
  });
  
  // New item state
  const [newItem, setNewItem] = useState({
    product_id: "",
    quantity: "1"
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [selectedDate]);

  const fetchInitialData = async () => {
    try {
      const [customersRes, productsRes] = await Promise.all([
        axios.get(`${API}/customers?active_only=true`),
        axios.get(`${API}/products?active_only=true`)
      ]);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await axios.get(`${API}/daily-sales?date=${dateStr}`);
      setSales(response.data);
    } catch (error) {
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    const product = products.find(p => p.id === newItem.product_id);
    if (!product) {
      toast.error("Please select a product");
      return;
    }
    
    const quantity = parseFloat(newItem.quantity);
    if (quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    const item = {
      product_id: product.id,
      product_name: product.name,
      quantity: quantity,
      unit: product.unit,
      price: product.price,
      total: product.price * quantity
    };

    setFormData({
      ...formData,
      items: [...formData.items, item]
    });

    setNewItem({ product_id: "", quantity: "1" });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    try {
      const payload = {
        customer_id: formData.customer_id,
        date: formData.date,
        items: formData.items,
        paid_amount: parseFloat(formData.paid_amount) || 0
      };

      await axios.post(`${API}/daily-sales`, payload);
      toast.success("Sale recorded successfully");
      setDialogOpen(false);
      resetForm();
      fetchSales();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to record sale");
    }
  };

  const handleDeleteSale = async (saleId) => {
    if (!window.confirm("Are you sure you want to delete this sale?")) return;
    
    try {
      await axios.delete(`${API}/daily-sales/${saleId}`);
      toast.success("Sale deleted successfully");
      fetchSales();
    } catch (error) {
      toast.error("Failed to delete sale");
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setFormData({
      ...formData,
      date: format(selectedDate, "yyyy-MM-dd")
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      date: format(new Date(), "yyyy-MM-dd"),
      paid_amount: "0",
      items: []
    });
    setNewItem({ product_id: "", quantity: "1" });
  };

  const getTotalAmount = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const dayTotal = sales.reduce((sum, sale) => sum + sale.total_amount, 0);

  if (loading && sales.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="daily-sales-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Daily Sales</h1>
          <p className="page-description">Record and manage customer purchases</p>
        </div>
        <Button 
          onClick={openCreateDialog}
          className="btn-success"
          data-testid="add-sale-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Sale
        </Button>
      </div>

      {/* Date Picker & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <Label className="text-sm font-medium text-stone-500 mb-2 block">Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                  data-testid="date-picker-btn"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-stone-500">Total Transactions</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">{sales.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-stone-500">Day's Revenue</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(dayTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales List */}
      {sales.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart className="empty-state-icon" />
          <h3 className="empty-state-title">No sales for this date</h3>
          <p className="empty-state-description">
            Start recording sales by clicking the "New Sale" button
          </p>
        </div>
      ) : (
        <Card className="table-container">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50">
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Items</TableHead>
                  <TableHead className="font-semibold">Total</TableHead>
                  <TableHead className="font-semibold">Paid</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale, index) => (
                  <TableRow 
                    key={sale.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.03}s` }}
                    data-testid={`sale-row-${sale.id}`}
                  >
                    <TableCell>
                      <p className="font-medium text-stone-900">{sale.customer_name}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-stone-600">{sale.items.length} items</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{formatCurrency(sale.total_amount)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-stone-600">{formatCurrency(sale.paid_amount)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={sale.is_paid ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                        {sale.is_paid ? "Paid" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSale(sale);
                            setDetailDialogOpen(true);
                          }}
                          data-testid={`view-sale-${sale.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSale(sale.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`delete-sale-${sale.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Create Sale Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record New Sale</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select 
                  value={formData.customer_id}
                  onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                  required
                >
                  <SelectTrigger data-testid="customer-select">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  data-testid="sale-date-input"
                />
              </div>
            </div>

            {/* Add Item Section */}
            <Card className="bg-stone-50">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">Add Items</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Select 
                      value={newItem.product_id}
                      onValueChange={(value) => setNewItem({ ...newItem, product_id: value })}
                    >
                      <SelectTrigger data-testid="product-select">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {formatCurrency(product.price)}/{product.unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    placeholder="Qty"
                    className="w-24"
                    data-testid="quantity-input"
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddItem}
                    className="btn-primary"
                    data-testid="add-item-btn"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Items List */}
            {formData.items.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50">
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Total & Payment */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-stone-500">Total Amount</p>
                <p className="text-2xl font-bold text-stone-900">{formatCurrency(getTotalAmount())}</p>
              </div>
              <div className="w-full sm:w-48">
                <Label>Amount Paid (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.paid_amount}
                  onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                  data-testid="paid-amount-input"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="btn-success" data-testid="save-sale-btn">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Record Sale
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sale Details Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-stone-500">Customer</span>
                <span className="font-medium">{selectedSale.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Date</span>
                <span>{selectedSale.date}</span>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Items</p>
                {selectedSale.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm py-1">
                    <span>{item.product_name} x {item.quantity}</span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(selectedSale.total_amount)}</span>
                </div>
                <div className="flex justify-between text-green-700">
                  <span>Paid</span>
                  <span>{formatCurrency(selectedSale.paid_amount)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Balance</span>
                  <span>{formatCurrency(selectedSale.total_amount - selectedSale.paid_amount)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
