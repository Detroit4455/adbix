import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import AdminSidebar from '@/components/AdminSidebar';

export default async function WebsiteDetailsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role || session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="pl-64">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Website Details</h1>

          {/* Overview Section */}
          <section className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Project Information</h3>
                <ul className="space-y-2 text-gray-600">
                  <li><span className="font-medium">Name:</span> adbix</li>
                  <li><span className="font-medium">Version:</span> 0.1.0</li>
                  <li><span className="font-medium">Description:</span> A comprehensive web hosting and management platform</li>
                  <li><span className="font-medium">Last Updated:</span> {new Date().toLocaleDateString()}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Core Features</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• S3 Website Hosting & Management</li>
                  <li>• Global Image Repository with Advanced Features</li>
                  <li>• Image Gallery Widget System</li>
                  <li>• User Authentication & Authorization</li>
                  <li>• Role-Based Access Control (RBAC)</li>
                  <li>• File Management System</li>
                  <li>• Dynamic Image Resizing & URL Generation</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Technical Stack Section */}
          <section className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Technical Stack</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Frontend</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Next.js 15.3.2</li>
                  <li>• React 19.0.0</li>
                  <li>• TypeScript</li>
                  <li>• Tailwind CSS 4</li>
                  <li>• NextAuth.js 4.24.11</li>
                  <li>• Monaco Editor</li>
                  <li>• React Dropzone</li>
                  <li>• React Colorful</li>
                  <li>• Image-size (Dimensions)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Backend</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Node.js</li>
                  <li>• MongoDB 6.16.0</li>
                  <li>• Mongoose 8.14.3</li>
                  <li>• AWS SDK S3 Client</li>
                  <li>• JWT Authentication</li>
                  <li>• Bcrypt.js</li>
                  <li>• Archiver</li>
                  <li>• Adm-zip</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Infrastructure</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• AWS S3 Storage</li>
                  <li>• MongoDB Database</li>
                  <li>• Next.js API Routes</li>
                  <li>• Vercel Deployment</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Features & Functionality Section */}
          <section className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Features & Functionality</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">S3 Website Hosting</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Direct file upload to S3 buckets</li>
                  <li>ZIP file upload and extraction</li>
                  <li>File content editing and management</li>
                  <li>File renaming and replacement</li>
                  <li>Website configuration management</li>
                  <li>Dynamic content updates</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Global Image Repository</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Shared image repository for all authenticated users</li>
                  <li>Advanced image metadata extraction (dimensions, aspect ratios)</li>
                  <li>Dynamic URL generation with resize parameters</li>
                  <li>Real-time image search and filtering by type</li>
                  <li>Global statistics and analytics dashboard</li>
                  <li>CDN-ready parameterized URLs</li>
                  <li>Modern glass-morphism UI with animations</li>
                  <li>Bulk operations and management tools</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Image Gallery Widget</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Multiple view layouts</li>
                  <li>Image upload and management</li>
                  <li>Position-based widget placement</li>
                  <li>Customizable gallery settings</li>
                  <li>Preview functionality</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">User Management</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Mobile number-based authentication</li>
                  <li>Role-based access control (Admin, User)</li>
                  <li>User profile management</li>
                  <li>Session management with NextAuth.js</li>
                </ul>
              </div>
            </div>
          </section>

          {/* API Documentation Section */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">API Endpoints</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Authentication & Users</h3>
                <ul className="space-y-2 text-gray-600">
                  <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/auth/login</code> - User login</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/auth/register</code> - User registration</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/users</code> - User management</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">S3 File Management</h3>
                <ul className="space-y-2 text-gray-600">
                  <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/s3-upload-file</code> - Upload file</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/s3-upload-zip</code> - Upload ZIP</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/s3-files</code> - List files</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">PUT /api/s3-update-file</code> - Update file</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">DELETE /api/s3-files</code> - Delete file</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Website Configuration</h3>
                <ul className="space-y-2 text-gray-600">
                  <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/website-config</code> - Get config</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">PUT /api/update-website-config</code> - Update config</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/update-dynamic-content</code> - Update content</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Global Image Repository</h3>
                <ul className="space-y-2 text-gray-600">
                  <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/image-repo/upload</code> - Upload images with metadata</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/image-repo/images</code> - List all images with search/filter</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">DELETE /api/image-repo/images</code> - Bulk delete images</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/image-repo/stats</code> - Global repository statistics</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Image Gallery Widget</h3>
                <ul className="space-y-2 text-gray-600">
                  <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/image-gallery/upload</code> - Upload image</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/image-gallery/list</code> - List images</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">PUT /api/image-gallery/update</code> - Update gallery</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
} 