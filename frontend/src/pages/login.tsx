import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/stores/auth";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";

export default function LoginPage() {
  const router = useRouter();
  const { login, error, isLoading, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    if (!email || !password) {
      setLocalError("Please fill in all fields");
      return;
    }

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setLocalError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-lg mb-4">
            <span className="text-xl">🔗</span>
          </div>
          <h1 className="text-3xl font-bold text-white">LinkHub</h1>
          <p className="text-gray-400 mt-2">Smart Link Management</p>
        </div>

        {/* Form */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
          {(error || localError) && (
            <Alert
              type="error"
              message={error || localError}
              onClose={clearError}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              Sign In
            </Button>
          </form>

          <div className="text-center">
            <p className="text-gray-400">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-green-600 hover:text-green-500 font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Smart Link Hub Generator
        </p>
      </div>
    </div>
  );
}
