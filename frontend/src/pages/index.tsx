import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/stores/auth";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="animate-spin">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    </div>
  );
}
