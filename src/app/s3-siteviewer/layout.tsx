export default function S3SiteViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}

export const metadata = {
  title: 'S3 Site Viewer',
  description: 'View and manage files on Amazon S3',
}; 