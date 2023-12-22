import LoginMain from "./login-main.tsx";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LoginMain>{children}</LoginMain>;
}
