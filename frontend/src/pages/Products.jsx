import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Search,
  Filter
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEFAULT_CATEGORIES = ["Milk", "Curd", "Butter", "Paneer", "Ghee", "Other"];
const UNITS = ["Liter", "Kg", "Piece", "Packet", "500ml", "250ml", "500g", "250g"];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    unit: "",
    price: "",
    description: ""
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/product-categories`);
      if (response.data.length > 0) {
        setCategories([...new Set([...DEFAULT_CATEGORIES, ...response.data])]);
      }
    } catch (error) {
      console.error("Failed to fetch categories");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price)
      };

      if (selectedProduct) {
        await axios.put(`${API}/products/${selectedProduct.id}`, payload);
        toast.success("Product updated successfully");
      } else {
        await axios.post(`${API}/products`, payload);
        toast.success("Product created successfully");
      }
      
      setDialogOpen(false);
      resetForm();
      fetchProducts();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save product");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/products/${selectedProduct.id}`);
      toast.success("Product deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const openEditDialog = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      unit: product.unit,
      price: product.price.toString(),
      description: product.description || ""
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setFormData({
      name: "",
      category: "",
      unit: "",
      price: "",
      description: ""
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
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
    <div className="space-y-6 animate-fade-in" data-testid="products-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Products</h1>
          <p className="page-description">Manage your dairy products catalog</p>
        </div>
        <Button 
          onClick={openCreateDialog}
          className="btn-primary"
          data-testid="add-product-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-products"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-48" data-testid="filter-category">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <Package className="empty-state-icon" />
          <h3 className="empty-state-title">No products found</h3>
          <p className="empty-state-description">
            {searchQuery || filterCategory !== "all" 
              ? "Try adjusting your search or filters"
              : "Get started by adding your first product"}
          </p>
          {!searchQuery && filterCategory === "all" && (
            <Button onClick={openCreateDialog} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product, index) => (
            <Card 
              key={product.id} 
              className="card-hover animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
              data-testid={`product-card-${product.id}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="secondary" className="bg-stone-100 text-stone-700">
                    {product.category}
                  </Badge>
                  {!product.is_active && (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                </div>
                <h3 className="font-semibold text-stone-900 text-lg mb-1">
                  {product.name}
                </h3>
                <p className="text-sm text-stone-500 mb-3">
                  {product.unit}
                </p>
                <p className="text-2xl font-bold text-blue-900 mb-4">
                  {formatCurrency(product.price)}
                </p>
                {product.description && (
                  <p className="text-sm text-stone-500 mb-4 line-clamp-2">
                    {product.description}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(product)}
                    className="flex-1"
                    data-testid={`edit-product-${product.id}`}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedProduct(product);
                      setDeleteDialogOpen(true);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    data-testid={`delete-product-${product.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Full Cream Milk"
                required
                data-testid="product-name-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger data-testid="product-category-select">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select 
                  value={formData.unit} 
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  required
                >
                  <SelectTrigger data-testid="product-unit-select">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
                data-testid="product-price-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description..."
                rows={3}
                data-testid="product-description-input"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="btn-primary" data-testid="save-product-btn">
                {selectedProduct ? "Update" : "Create"} Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-btn"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
