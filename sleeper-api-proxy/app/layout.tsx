export const metadata = {
  title: 'Sleeper API Proxy',
  description: 'CORS proxy for Sleeper Fantasy API',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}