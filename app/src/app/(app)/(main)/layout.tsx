import App from "./app.tsx";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <App>{children}</App>;
}
