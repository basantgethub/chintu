import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Customers from "@/pages/Customers";
import DailySales from "@/pages/DailySales";
import GuestSales from "@/pages/GuestSales";
import Billing from "@/pages/Billing";
import BillDetails from "@/pages/BillDetails";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="customers" element={<Customers />} />
            <Route path="daily-sales" element={<DailySales />} />
            <Route path="guest-sales" element={<GuestSales />} />
            <Route path="billing" element={<Billing />} />
            <Route path="billing/:billId" element={<BillDetails />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
