import OperationsWorkspace from "@/pages/operations/OperationsWorkspace";
import Invitation from "@/pages/operations/Invitation";
import VistaCallback from "@/pages/integrations/VistaAuth";
import VistaPage from "@/pages/integrations/VistaPage";
import EcommerceDashboard from "@/pages/dashboard/eCommerce/EcommerceDashboard";
import SalesReport from "@/pages/reports/SalesReport";
import OrderList from "@/pages/eCommerce/OrderList";
import OrderDetails from "@/pages/eCommerce/OrderDetails";
import OrderForm from "@/pages/eCommerce/OrderForm";
import OrderSheet from "@/pages/eCommerce/OrderSheet";
import ProductList from "@/pages/eCommerce/ProductList";
import ProductGrid from "@/pages/eCommerce/ProductGrid";
import ProductDetails from "@/pages/eCommerce/ProductDetails";
import AddProduct from "@/pages/eCommerce/AddProduct";
import CategoryList from "@/pages/eCommerce/CategoryList";
import Inventory from "@/pages/eCommerce/Inventory";
import ShopSettings from "@/pages/account/ShopSettings";
import CustomerImports, {
  CustomerImportDetails,
} from "@/pages/imports/CustomerImports";
import FileManager from "@/pages/apps/FileManager";
import CalendarPage from "@/pages/apps/CalendarPage";
import OpticalSheet from "@/pages/optical/OpticalSheet";
import CustomerList from "@/pages/eCommerce/CustomerList";
import CustomerDetails from "@/pages/eCommerce/CustomerDetails";
import ActiveShopRoute from "@/auth/ActiveShopRoute";
import RegisterPage from "@/auth/RegisterPage";
import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import ProtectedRoute from "@/auth/ProtectedRoute";
import AuthPage from "@/auth/AuthPage";
import VerifyPage from "@/auth/VerifyPage";
import FoundationHome from "@/pages/FoundationHome";
import AccountSecurity from "@/pages/account/AccountSecurity";
import NotFound from "@/pages/NotFound";
export const router = createBrowserRouter(
  [
    { path: "/auth/vista/callback", element: <VistaCallback /> },
    { path: "/auth/invitation", element: <Invitation /> },
    { path: "/auth/login", element: <AuthPage mode="login" /> },
    { path: "/auth/register", element: <RegisterPage /> },
    { path: "/auth/forgot-password", element: <AuthPage mode="forgot" /> },
    { path: "/auth/reset-password", element: <AuthPage mode="reset" /> },
    { path: "/auth/verify-email", element: <VerifyPage /> },
    {
      path: "/auth/basic/login",
      element: <Navigate to="/auth/login" replace />,
    },
    {
      element: <ProtectedRoute />,
      children: [
        {
          element: <AppLayout />,
          children: [
            { index: true, element: <FoundationHome /> },
            { path: "/account/security", element: <AccountSecurity /> },
            {
              element: <ActiveShopRoute />,
              children: [
                { path: "/operations", element: <OperationsWorkspace module="daily" /> },
{ path: "/employees", element: <OperationsWorkspace module="employees" /> },
{ path: "/activity", element: <OperationsWorkspace module="activity" /> },
{ path: "/reminders", element: <OperationsWorkspace module="reminders" /> },
{ path: "/followups", element: <OperationsWorkspace module="followups" /> },
{ path: "/communications", element: <OperationsWorkspace module="communications" /> },
{ path: "/payments", element: <OperationsWorkspace module="payments" /> },
                { path: "/dashboard", element: <EcommerceDashboard /> },
                { path: "/reports/sales", element: <SalesReport /> },
                { path: "/orders", element: <OrderList /> },
                { path: "/orders/new", element: <OrderForm /> },
                { path: "/orders/:id", element: <OrderDetails /> },
                { path: "/orders/:id/edit", element: <OrderForm /> },
                { path: "/orders/:id/print", element: <OrderSheet /> },
                { path: "/products", element: <ProductList /> },
                { path: "/products/grid", element: <ProductGrid /> },
                { path: "/products/new", element: <AddProduct /> },
                { path: "/products/:id", element: <ProductDetails /> },
                { path: "/products/:id/edit", element: <AddProduct /> },
                { path: "/product-categories", element: <CategoryList /> },
                { path: "/integrations/vista", element: <VistaPage /> },
                { path: "/inventory", element: <Inventory /> },
                { path: "/shop/settings", element: <ShopSettings /> },
                { path: "/customers", element: <CustomerList /> },
                { path: "/customer-imports", element: <CustomerImports /> },
                {
                  path: "/customer-imports/:id",
                  element: <CustomerImportDetails />,
                },
                { path: "/agenda", element: <CalendarPage /> },
                { path: "/documents", element: <FileManager /> },
                { path: "/customers/:id", element: <CustomerDetails /> },
                {
                  path: "/customers/:id/optical/:recordId/print",
                  element: <OpticalSheet />,
                },
              ],
            },
            { path: "*", element: <NotFound /> },
          ],
        },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
);
