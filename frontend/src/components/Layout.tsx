import React from "react";
import { Menu, LogOut, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/stores/auth";
import { useRouter } from "next/router";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <BarChart3 size={24} className="text-white" />
            </div>
            {sidebarOpen && (
              <span className="font-bold text-white">LinkHub</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              router.pathname === "/dashboard"
                ? "bg-green-600 text-white"
                : "text-gray-300 hover:bg-slate-700"
            }`}
          >
            <span>📊</span>
            {sidebarOpen && <span>Dashboard</span>}
          </Link>
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-slate-700 space-y-3">
          {sidebarOpen && user && (
            <div className="text-sm">
              <p className="text-gray-400">Logged in as</p>
              <p className="text-white font-medium truncate">{user.username}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-slate-700 rounded-lg transition-colors text-sm"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 border-t border-slate-700 text-gray-300 hover:text-white transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
