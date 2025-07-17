"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import TemplateCreateForm from "@/components/TemplateCreateForm";
import TemplateUploadForm from "@/components/TemplateUploadForm";
import TemplateListManager from "@/components/TemplateListManager";
import TemplateFileManager from "@/components/TemplateFileManager";

const tabs = [
  {
    id: "add",
    name: "Add Template",
    icon: "➕",
    description: "Create new template",
  },
  {
    id: "upload",
    name: "Upload Files",
    icon: "📁",
    description: "Upload template files",
  },
  {
    id: "list",
    name: "Template List",
    icon: "📋",
    description: "Manage templates",
  },
  {
    id: "files",
    name: "File Manager",
    icon: "🗂️",
    description: "Manage template files",
  },
];

export default function WebDevPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("add");

  // Check authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Only admin and devops can access
  const userRole = session.user.role || "user";
  if (userRole !== "admin" && userRole !== "devops") {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="pl-64 p-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700">
            You do not have permission to access this section. Only admin and devops users can access Web Dev.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="pl-64">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Web Dev: Template Management</h1>
              <p className="text-gray-600 mt-2">
                Create, upload, and manage website templates for users
              </p>
            </div>
          </div>

          {/* Tabbed Interface */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Tab Navigation */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
              <div className="flex space-x-1 p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center space-x-3 px-6 py-4 rounded-lg font-medium text-sm transition-all duration-200 min-w-0 flex-1
                      ${activeTab === tab.id
                        ? "bg-white text-purple-700 shadow-sm border border-purple-200"
                        : "text-gray-600 hover:text-purple-600 hover:bg-white/50"
                      }
                    `}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold">{tab.name}</div>
                      <div className="text-xs text-gray-500">{tab.description}</div>
                    </div>
                    {activeTab === tab.id && (
                      <div className="w-2 h-2 bg-purple-600 rounded-full ml-auto"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "add" && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                      <span className="text-2xl">➕</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Add New Template</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      Create a new template by providing basic information. After creation, you can upload files in the Upload Files tab.
                    </p>
                  </div>
                  <TemplateCreateForm onSuccess={() => setActiveTab("upload")} />
                </div>
              )}

              {activeTab === "upload" && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                      <span className="text-2xl">📁</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Template Files</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      Upload ZIP files containing your website template. Make sure your ZIP includes an index.html file and all necessary assets.
                    </p>
                  </div>
                  <TemplateUploadForm />
                </div>
              )}

              {activeTab === "list" && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <span className="text-2xl">📋</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Templates</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      View, edit, and manage all your website templates. Control visibility, update metadata, and delete templates.
                    </p>
                  </div>
                  <TemplateListManager />
                </div>
              )}

              {activeTab === "files" && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                      <span className="text-2xl">🗂️</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Template File Manager</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      Select a template and manage its files directly. Upload, edit, and organize template files with full S3 integration.
                    </p>
                  </div>
                  <TemplateFileManager />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 