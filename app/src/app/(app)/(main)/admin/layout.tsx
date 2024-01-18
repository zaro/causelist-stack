"use client";
import { UserRole } from "../../../../api/users.ts";
import useUser from "../use-user.hook.ts";

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdminUser } = useUser();

  return <div id="admin">{isAdminUser ? children : <h1>Forbidden</h1>}</div>;
}
