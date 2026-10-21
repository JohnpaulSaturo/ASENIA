import "./globals.css";

export const metadata = {
  title: "E-QR Attendance",
  description: "QR ID attendance monitoring system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
