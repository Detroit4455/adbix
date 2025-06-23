import React from 'react';

export default function WidgetPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ margin: 0, padding: 0, width: '100%', height: '100vh' }}>
      {children}
    </div>
  );
} 