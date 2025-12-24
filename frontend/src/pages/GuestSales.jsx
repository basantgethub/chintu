import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Plus,
  UserPlus,
  Trash2,
  ShoppingBag,
  CreditCard,
  Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function GuestSales() {
  const [recentSales, setRecentSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Cart state
  const [cart, setCart] = useState([]);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  
  // New item state
  const [newItem, setNewItem] = useState({
    product_id: "",
    quantity: "1"
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [productsRes, salesRes] = await Promise.all([
        axios.get(`${API}/products?active_only=true`),
        axios.get(`${API}/guest-sales`)
      ]);
      setProducts(productsRes.data);
      setRecentSales(salesRes.data.slice(0, 10));
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
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

    // Check if product already in cart
    const existingIndex = cart.findIndex(item => item.product_id === product.id);
    
    if (existingIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += quantity;
      updatedCart[existingIndex].total = updatedCart[existingIndex].quantity * product.price;
      setCart(updatedCart);
    } else {
      const item = {
        product_id: product.id,
        product_name: product.name,
        quantity: quantity,
        unit: product.unit,
        price: product.price,
        total: product.price * quantity
      };
      setCart([...cart, item]);
    }

    setNewItem({ product_id: "", quantity: "1" });
  };

  const handleRemoveFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) return;
    const updatedCart = [...cart];
    updatedCart[index].quantity = newQuantity;
    updatedCart[index].total = newQuantity * updatedCart[index].price;
    setCart(updatedCart);
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        guest_name: guestName || "Walk-in Customer",
        guest_phone: guestPhone,
        items: cart,
        payment_method: paymentMethod
      };

      await axios.post(`${API}/guest-sales`, payload);
      toast.success("Sale completed successfully!");
      
      // Reset form
      setCart([]);
      setGuestName("");
      setGuestPhone("");
      setPaymentMethod("cash");
      
      // Refresh recent sales
      const salesRes = await axios.get(`${API}/guest-sales`);
      setRecentSales(salesRes.data.slice(0, 10));
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to complete sale");
    } finally {
      setSubmitting(false);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
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

  return (
    <div className="space-y-6 animate-fade-in" data-testid="guest-sales-page">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Guest Sales</h1>
        <p className="page-description">Quick sales for walk-in customers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* POS Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-900" />
                Add Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Select 
                    value={newItem.product_id}
                    onValueChange={(value) => setNewItem({ ...newItem, product_id: value })}
                  >
                    <SelectTrigger data-testid="guest-product-select">
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
                  data-testid="guest-quantity-input"
                />
                <Button 
                  onClick={handleAddToCart}
                  className="btn-primary"
                  data-testid="add-to-cart-btn"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Quick Product Buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                {products.slice(0, 8).map(product => (
                  <Button
                    key={product.id}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewItem({ product_id: product.id, quantity: "1" });
                      handleAddToCart();
                    }}
                    className="text-xs"
                  >
                    {product.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cart ({cart.length} items)</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-stone-500 text-center py-8">
                  Cart is empty. Add products above.
                </p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0"
                      data-testid={`cart-item-${index}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-stone-900">{item.product_name}</p>
                        <p className="text-sm text-stone-500">
                          {formatCurrency(item.price)} × {item.quantity} {item.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                            className="h-8 w-8 p-0"
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                            className="h-8 w-8 p-0"
                          >
                            +
                          </Button>
                        </div>
                        <span className="font-semibold w-24 text-right">
                          {formatCurrency(item.total)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromCart(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Checkout Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-700" />
                Customer Info (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Walk-in Customer"
                  data-testid="guest-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="Optional"
                  data-testid="guest-phone-input"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={paymentMethod === "cash" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("cash")}
                    className={paymentMethod === "cash" ? "bg-blue-900" : ""}
                    data-testid="cash-payment-btn"
                  >
                    <Banknote className="w-4 h-4 mr-2" />
                    Cash
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMethod === "upi" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("upi")}
                    className={paymentMethod === "upi" ? "bg-blue-900" : ""}
                    data-testid="upi-payment-btn"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    UPI
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-medium">Total</span>
                  <span className="text-2xl font-bold text-green-700">
                    {formatCurrency(getCartTotal())}
                  </span>
                </div>
                <Button
                  onClick={handleCompleteSale}
                  disabled={cart.length === 0 || submitting}
                  className="w-full btn-success h-12 text-lg"
                  data-testid="complete-sale-btn"
                >
                  {submitting ? (
                    <div className="spinner mr-2" />
                  ) : (
                    <ShoppingBag className="w-5 h-5 mr-2" />
                  )}
                  Complete Sale
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Guest Sales</CardTitle>
            </CardHeader>
            <CardContent>
              {recentSales.length === 0 ? (
                <p className="text-stone-500 text-center py-4">No recent sales</p>
              ) : (
                <div className="space-y-3">
                  {recentSales.map((sale, index) => (
                    <div 
                      key={sale.id}
                      className="flex justify-between items-center py-2 border-b border-stone-100 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{sale.guest_name}</p>
                        <p className="text-xs text-stone-500">
                          {sale.items.length} items • {sale.payment_method.toUpperCase()}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {formatCurrency(sale.total_amount)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
