import PaymentMain from "./payment-main.tsx";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PaymentMain>{children}</PaymentMain>;
}
