import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { Alert } from "@/components/Alert";
import { Input } from "@/components/Input";
import { api, LinkHub, Link as LinkItem, Rule } from "@/lib/api";
import { ChevronLeft, Plus, Trash2, Edit, Settings } from "lucide-react";

export default function HubEditorPage() {
  const router = useRouter();
  const { hubId } = router.query;

  const [hub, setHub] = useState<LinkHub | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Link modal
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [linkForm, setLinkForm] = useState({ title: "", url: "" });

  // Rule modal
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleType, setRuleType] = useState<
    "time" | "device" | "location" | "performance"
  >("time");

  useEffect(() => {
    if (hubId) {
      loadHub();
    }
  }, [hubId]);

  const loadHub = async () => {
    try {
      setIsLoading(true);
      setError("");
      const hubData = await api.getHub(hubId as string);
      setHub(hubData);
      const linksData = await api.getLinks(hubId as string);
      setLinks(linksData);
      const rulesData = await api.getRules(hubId as string);
      setRules(rulesData);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load hub");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      if (editingLink) {
        await api.updateLink(hubId as string, editingLink.id, linkForm);
        setSuccess("Link updated");
      } else {
        await api.createLink(hubId as string, linkForm);
        setSuccess("Link added");
      }
      setIsLinkModalOpen(false);
      setEditingLink(null);
      setLinkForm({ title: "", url: "" });
      loadHub();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save link");
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!window.confirm("Delete this link?")) return;
    try {
      setError("");
      await api.deleteLink(hubId as string, linkId);
      setSuccess("Link deleted");
      loadHub();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete link");
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm("Delete this rule?")) return;
    try {
      setError("");
      await api.deleteRule(hubId as string, ruleId);
      setSuccess("Rule deleted");
      loadHub();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete rule");
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

  if (!hub) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-500">Hub not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-300" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">{hub.title}</h1>
            <p className="text-gray-400 mt-1">Manage links and rules</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError("")} />
          </div>
        )}
        {success && (
          <div className="mb-6">
            <Alert
              type="success"
              message={success}
              onClose={() => setSuccess("")}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Links Section */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Links</h2>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditingLink(null);
                    setLinkForm({ title: "", url: "" });
                    setIsLinkModalOpen(true);
                  }}
                >
                  <Plus size={16} /> Add Link
                </Button>
              </div>

              <div className="space-y-2">
                {links.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No links yet</p>
                ) : (
                  links.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">
                          {link.title}
                        </h3>
                        <p className="text-xs text-gray-400 truncate">
                          {link.url}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          🔗 {link.click_count} clicks
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingLink(link);
                            setLinkForm({ title: link.title, url: link.url });
                            setIsLinkModalOpen(true);
                          }}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteLink(link.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Rules Section */}
          <div>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Rules</h2>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsRuleModalOpen(true)}
                >
                  <Plus size={16} />
                </Button>
              </div>

              <div className="space-y-2">
                {rules.length === 0 ? (
                  <p className="text-gray-400 text-center py-8 text-sm">
                    No rules configured
                  </p>
                ) : (
                  rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-3 bg-slate-700 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white capitalize">
                          {rule.rule_type}
                        </p>
                        <p className="text-xs text-gray-400">
                          Priority: {rule.priority}
                        </p>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <p className="text-xs text-gray-500 mt-4">
                💡 Rules automatically prioritize links based on time, device,
                location, or performance
              </p>
            </Card>
          </div>
        </div>

        {/* Hub Stats */}
        <Card className="mt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-gray-400 text-sm">Total Links</p>
              <p className="text-2xl font-bold text-green-600">
                {links.length}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Hub Views</p>
              <p className="text-2xl font-bold text-green-600">
                {hub.view_count}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Clicks</p>
              <p className="text-2xl font-bold text-green-600">
                {links.reduce((sum, link) => sum + link.click_count, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Link Modal */}
      <Modal
        isOpen={isLinkModalOpen}
        title={editingLink ? "Edit Link" : "Add New Link"}
        onClose={() => setIsLinkModalOpen(false)}
      >
        <form onSubmit={handleAddLink} className="space-y-4">
          <Input
            label="Link Title"
            placeholder="My Awesome Link"
            value={linkForm.title}
            onChange={(e) =>
              setLinkForm({ ...linkForm, title: e.target.value })
            }
            required
          />
          <Input
            label="URL"
            type="url"
            placeholder="https://example.com"
            value={linkForm.url}
            onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
            required
          />
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsLinkModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {editingLink ? "Update Link" : "Add Link"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Rule Configuration Modal */}
      <Modal
        isOpen={isRuleModalOpen}
        title="Configure Rule"
        onClose={() => setIsRuleModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">
              Rule Type
            </label>
            <select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
            >
              <option value="time">⏰ Time-based</option>
              <option value="device">📱 Device-based</option>
              <option value="location">🌍 Location-based</option>
              <option value="performance">📊 Performance-based</option>
            </select>
          </div>

          <div className="bg-slate-700 p-3 rounded-lg text-sm text-gray-300">
            {ruleType === "time" && (
              <p>
                Show specific links during certain hours or days of the week
              </p>
            )}
            {ruleType === "device" && (
              <p>Show different links for mobile, tablet, or desktop users</p>
            )}
            {ruleType === "location" && (
              <p>Show different links based on visitor's country or region</p>
            )}
            {ruleType === "performance" && (
              <p>Automatically promote your most clicked links</p>
            )}
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              // This would open a detailed rule editor
              alert(
                `Rule configuration for ${ruleType} coming soon in the advanced editor!`,
              );
            }}
          >
            <Settings size={16} className="mr-2" /> Configure {ruleType} Rule
          </Button>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsRuleModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
