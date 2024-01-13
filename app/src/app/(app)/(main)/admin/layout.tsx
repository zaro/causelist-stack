"use client";
import { UserRole } from "../../../../api/users.ts";
import useUser from "../use-user.hook.ts";

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();

  return (
    <div id="admin">
      {user?.role === UserRole.Admin ? children : <h1>Forbidden</h1>}
    </div>
  );
}
