import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/auth/session";
import { useTranslation } from "@/i18n";
export function UserDropdown() {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [errorKey, setErrorKey] = useState<string | null>(null);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">{user?.name}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/account/security">{t("nav.accountSecurity")}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              void logout()
                .then(() => navigate("/auth/login"))
                .catch(() => setErrorKey("user.signOutFailed"));
            }}
          >
            {t("nav.signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {errorKey && <span role="alert">{t(errorKey)}</span>}
    </>
  );
}
