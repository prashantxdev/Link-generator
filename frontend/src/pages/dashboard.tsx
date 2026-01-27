import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { Alert } from "@/components/Alert";
import { Input } from "@/components/Input";
import { useAuth } from "@/stores/auth";
import { api, LinkHub } from "@/lib/api";
import { Eye, EyeOff, Edit, Trash2, Link as LinkIcon } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, getProfile } = useAuth();
  const [hubs, setHubs] = useState<LinkHub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHub, setEditingHub] = useState<LinkHub | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    is_public: false,
  });

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      loadHubs();
    }
  }, [isAuthenticated, router]);

  const loadHubs = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await api.getHubs();
      setHubs(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load hubs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (hub?: LinkHub) => {
    if (hub) {
      setEditingHub(hub);
      setFormData({
        title: hub.title,
        description: hub.description,
        is_public: hub.is_public,
      });
    } else {
      setEditingHub(null);
      setFormData({ title: "", description: "", is_public: false });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHub(null);
    setFormData({ title: "", description: "", is_public: false });
  };

  const handleSaveHub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      if (editingHub) {
        await api.updateHub(editingHub.id, formData);
        setSuccess("Hub updated successfully");
      } else {
        await api.createHub(formData);
        setSuccess("Hub created successfully");
      }
      handleCloseModal();
      loadHubs();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save hub");
    }
  };

  const handleDeleteHub = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this hub?")) return;
    try {
      setError("");
      await api.deleteHub(id);
      setSuccess("Hub deleted successfully");
      loadHubs();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete hub");
    }
  };

  const handleEditHub = (hub: LinkHub) => {
    router.push(`/hubs/${hub.id}/editor`);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Your Hubs</h1>
            <p className="text-gray-400 mt-2">
              Manage your link hubs and share them with others
            </p>
          </div>
          <Button variant="primary" size="lg" onClick={() => handleOpenModal()}>
            + Create Hub
          </Button>
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

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full" />
            </div>
          </div>
        ) : hubs.length === 0 ? (
          <Card className="text-center py-12">
            <LinkIcon size={48} className="mx-auto text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              No hubs yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create your first hub to get started
            </p>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              Create Hub
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hubs.map((hub) => (
              <Card
                key={hub.id}
                className="hover:border-green-600 transition-colors cursor-pointer group"
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors">
                      {hub.title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {hub.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-4">
                      <span>👁️ {hub.view_count} views</span>
                      <div className="flex items-center gap-1">
                        {hub.is_public ? (
                          <>
                            <Eye size={16} />
                            <span>Public</span>
                          </>
                        ) : (
                          <>
                            <EyeOff size={16} />
                            <span>Private</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 flex items-center justify-center gap-2"
                      onClick={() => handleEditHub(hub)}
                    >
                      <Edit size={16} /> Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteHub(hub.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        title={editingHub ? "Edit Hub" : "Create New Hub"}
        onClose={handleCloseModal}
        size="lg"
      >
        <form onSubmit={handleSaveHub} className="space-y-4">
          <Input
            label="Hub Title"
            placeholder="My Resource Collection"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
          />

          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              placeholder="Brief description of your hub"
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="public"
              checked={formData.is_public}
              onChange={(e) =>
                setFormData({ ...formData, is_public: e.target.checked })
              }
              className="w-4 h-4 bg-slate-800 border-slate-600 rounded"
            />
            <label htmlFor="public" className="text-sm text-gray-300">
              Make this hub public (anyone can view with the link)
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCloseModal}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {editingHub ? "Update Hub" : "Create Hub"}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
