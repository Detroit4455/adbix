"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-4">
            You do not have permission to access this section. Only admin and devops users can access Web Dev.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleGoBack = () => {
    if (userRole === "admin") {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom Header for Web Dev */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to {userRole === "admin" ? "Admin" : "Dashboard"}
              </button>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Web Dev: Template Management</h1>
                  <p className="text-sm text-gray-500">Create, upload, and manage website templates</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Logged in as: {session.user.email}</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {userRole}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
  );
} 