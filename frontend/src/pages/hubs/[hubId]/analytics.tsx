import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { api, LinkHub, Link as LinkItem } from "@/lib/api";
import { ChevronLeft, Eye, Share2, Download } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsPage() {
  const router = useRouter();
  const { hubId } = router.query;

  const [hub, setHub] = useState<LinkHub | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [linkAnalytics, setLinkAnalytics] = useState<LinkItem[]>([]);
  const [timeWindow, setTimeWindow] = useState<"24h" | "7d" | "30d" | "90d">(
    "7d",
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (hubId) {
      loadAnalytics();
    }
  }, [hubId, timeWindow]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const hubData = await api.getHub(hubId as string);
      setHub(hubData);
      const analyticsData = await api.getAnalytics(hubId as string, timeWindow);
      setAnalytics(analyticsData);
      const linkAnalyticsData = await api.getLinkAnalytics(
        hubId as string,
        timeWindow,
      );
      setLinkAnalytics(linkAnalyticsData);
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: "csv" | "json") => {
    try {
      const url = await api.exportAnalytics(
        hubId as string,
        format,
        timeWindow,
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics.${format}`;
      a.click();
    } catch (err) {
      console.error("Failed to export analytics", err);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">
              {hub?.title} Analytics
            </h1>
            <p className="text-gray-400 mt-1">Track views and clicks</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExport("csv")}
            >
              <Download size={16} /> CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExport("json")}
            >
              <Download size={16} /> JSON
            </Button>
          </div>
        </div>

        {/* Time Window Selector */}
        <div className="flex gap-2 mb-6">
          {(["24h", "7d", "30d", "90d"] as const).map((window) => (
            <Button
              key={window}
              variant={timeWindow === window ? "primary" : "secondary"}
              size="sm"
              onClick={() => setTimeWindow(window)}
            >
              {window === "24h" && "24 Hours"}
              {window === "7d" && "7 Days"}
              {window === "30d" && "30 Days"}
              {window === "90d" && "90 Days"}
            </Button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <p className="text-gray-400 text-sm mb-1">Total Views</p>
            <p className="text-3xl font-bold text-green-600">
              {analytics?.total_views || 0}
            </p>
          </Card>
          <Card>
            <p className="text-gray-400 text-sm mb-1">Total Clicks</p>
            <p className="text-3xl font-bold text-green-600">
              {analytics?.total_clicks || 0}
            </p>
          </Card>
          <Card>
            <p className="text-gray-400 text-sm mb-1">Click Rate</p>
            <p className="text-3xl font-bold text-green-600">
              {analytics?.total_views > 0
                ? (
                    (analytics?.total_clicks / analytics?.total_views) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Views Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">
              Views Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.daily_views || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Clicks Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">
              Clicks Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.daily_clicks || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#059669"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Top Links */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">
            Top Performing Links
          </h3>
          <div className="space-y-2">
            {linkAnalytics.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={linkAnalytics.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis
                    dataKey="title"
                    stroke="#9ca3af"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                    }}
                  />
                  <Bar dataKey="click_count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
