import OfflineMain from "./offline-main.tsx";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OfflineMain>{children}</OfflineMain>;
}
