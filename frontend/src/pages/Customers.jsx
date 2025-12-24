import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Search,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    credit_limit: "5000"
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        credit_limit: parseFloat(formData.credit_limit)
      };

      if (selectedCustomer) {
        await axios.put(`${API}/customers/${selectedCustomer.id}`, payload);
        toast.success("Customer updated successfully");
      } else {
        await axios.post(`${API}/customers`, payload);
        toast.success("Customer created successfully");
      }
      
      setDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save customer");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/customers/${selectedCustomer.id}`);
      toast.success("Customer deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      toast.error("Failed to delete customer");
    }
  };

  const openEditDialog = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      email: customer.email || "",
      credit_limit: customer.credit_limit.toString()
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setFormData({
      name: "",
      phone: "",
      address: "",
      email: "",
      credit_limit: "5000"
    });
  };

  const filteredCustomers = customers.filter(customer => {
    const query = searchQuery.toLowerCase();
    return customer.name.toLowerCase().includes(query) ||
      customer.phone.includes(query) ||
      customer.address.toLowerCase().includes(query);
  });

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

  return (
    <div className="space-y-6 animate-fade-in" data-testid="customers-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Customers</h1>
          <p className="page-description">Manage your customer database</p>
        </div>
        <Button 
          onClick={openCreateDialog}
          className="btn-primary"
          data-testid="add-customer-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Search by name, phone, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="search-customers"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      {filteredCustomers.length === 0 ? (
        <div className="empty-state">
          <Users className="empty-state-icon" />
          <h3 className="empty-state-title">No customers found</h3>
          <p className="empty-state-description">
            {searchQuery 
              ? "Try adjusting your search"
              : "Get started by adding your first customer"}
          </p>
          {!searchQuery && (
            <Button onClick={openCreateDialog} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          )}
        </div>
      ) : (
        <Card className="table-container">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50">
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold">Outstanding</TableHead>
                  <TableHead className="font-semibold">Credit Limit</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer, index) => (
                  <TableRow 
                    key={customer.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.03}s` }}
                    data-testid={`customer-row-${customer.id}`}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-stone-900">{customer.name}</p>
                        <p className="text-sm text-stone-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {customer.address}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-1">
                          <Phone className="w-3 h-3 text-stone-400" />
                          {customer.phone}
                        </p>
                        {customer.email && (
                          <p className="text-sm flex items-center gap-1 text-stone-500">
                            <Mail className="w-3 h-3 text-stone-400" />
                            {customer.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          customer.outstanding_balance > 0 
                            ? "bg-red-100 text-red-800" 
                            : "bg-green-100 text-green-800"
                        }
                      >
                        {formatCurrency(customer.outstanding_balance)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-stone-600">
                        {formatCurrency(customer.credit_limit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(customer)}
                          data-testid={`edit-customer-${customer.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`delete-customer-${customer.id}`}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedCustomer ? "Edit Customer" : "Add New Customer"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Customer name"
                required
                data-testid="customer-name-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit number"
                  required
                  data-testid="customer-phone-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  data-testid="customer-email-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address"
                rows={2}
                required
                data-testid="customer-address-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit_limit">Credit Limit (₹)</Label>
              <Input
                id="credit_limit"
                type="number"
                min="0"
                value={formData.credit_limit}
                onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                placeholder="5000"
                required
                data-testid="customer-credit-input"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="btn-primary" data-testid="save-customer-btn">
                {selectedCustomer ? "Update" : "Create"} Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCustomer?.name}"? This will also remove their purchase history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-customer-btn"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
