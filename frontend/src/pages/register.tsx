import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/stores/auth";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";

export default function RegisterPage() {
  const router = useRouter();
  const { register, error, isLoading, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    if (!email || !username || !password || !confirmPassword) {
      setLocalError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    try {
      await register(email, username, password);
      // After registration, redirect to login
      router.push("/login?registered=true");
    } catch (err: any) {
      setLocalError(err.response?.data?.error || "Registration failed");
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
          <p className="text-gray-400 mt-2">Create Your Account</p>
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
              type="text"
              label="Username"
              placeholder="john_doe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Input
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              Create Account
            </Button>
          </form>

          <div className="text-center">
            <p className="text-gray-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-green-600 hover:text-green-500 font-medium"
              >
                Sign in
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
