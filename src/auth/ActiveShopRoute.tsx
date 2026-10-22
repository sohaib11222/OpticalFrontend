import { canAccessVerifiedAccount } from "../../../contracts/session";
import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "./session";
export default function ActiveShopRoute() {
  const { user } = useSession();
  return canAccessVerifiedAccount(user) && user.shop?.status === "active" ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace />
  );
}
