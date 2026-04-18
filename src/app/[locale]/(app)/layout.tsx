import { SideNav } from "@/components/SideNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SideNav />
      <main className="ml-16 md:ml-56">{children}</main>
    </div>
  )
}
