import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { api } from "@/lib/api";
import { ArrowUpRight, Share2, Eye } from "lucide-react";

export default function PublicHubPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [hub, setHub] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (slug) {
      loadPublicHub();
    }
  }, [slug]);

  const loadPublicHub = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await api.getPublicHub(slug as string);
      setHub(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Hub not found");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !hub) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Hub not found</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-lg mb-4">
            <span className="text-xl">🔗</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">{hub.title}</h1>
          <p className="text-gray-400 mb-4">{hub.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Eye size={16} />
              <span>{hub.view_count} views</span>
            </div>
            <button className="flex items-center gap-1 text-green-600 hover:text-green-500 transition-colors">
              <Share2 size={16} />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-2xl mx-auto py-12 px-4">
        {hub.links && hub.links.length > 0 ? (
          <div className="space-y-3">
            {hub.links.map((link: any, index: number) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-green-600 rounded-lg p-6 transition-all duration-200 transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-green-600 w-6 text-center">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors truncate">
                            {link.title}
                          </h3>
                          <p className="text-sm text-gray-400 mt-1 truncate">
                            {link.url}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <ArrowUpRight
                        size={24}
                        className="text-gray-500 group-hover:text-green-600 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">No links in this hub yet</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 py-6 px-4 text-center text-gray-500 text-sm">
        <p>
          Made with <span className="text-green-600">♥</span> by LinkHub
        </p>
      </div>
    </div>
  );
}
