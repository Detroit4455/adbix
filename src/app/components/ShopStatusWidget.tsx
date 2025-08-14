'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface ShopStatusWidgetProps {
  userId?: string;
  showControls?: boolean;
  width?: string;
  height?: string;
}

export default function ShopStatusWidget({ 
  userId, 
  showControls = false,
  width = '200px',
  height = '100px'
}: ShopStatusWidgetProps) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<'OPEN' | 'CLOSED'>('CLOSED');
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/shop-status?userId=${userId}`);
      const data = await response.json();
      setStatus(data.status);
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const toggleStatus = async () => {
    if (!showControls || !session?.user) return;
    
    const newStatus = status === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      const response = await fetch('/api/shop-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          userId: userId 
        }),
      });
      
      if (response.ok) {
        setStatus(newStatus);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const containerStyle: React.CSSProperties = {
    width,
    height,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    cursor: showControls ? 'pointer' : 'default',
    transition: 'background-color 0.3s ease',
    backgroundColor: status === 'OPEN' ? '#dcfce7' : '#fecaca',
    margin: 0,
    padding: 0,
    boxSizing: 'border-box'
  };

  const statusStyle: React.CSSProperties = {
    fontSize: height === '100vh' ? '4rem' : '2rem',
    fontWeight: 'bold',
    color: status === 'OPEN' ? '#16a34a' : '#dc2626',
    margin: 0
  };

  const controlsStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginTop: '8px',
    textAlign: 'center'
  };

  const loadingStyle: React.CSSProperties = {
    ...containerStyle,
    backgroundColor: '#f3f4f6'
  };

  const spinnerStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    border: '2px solid #e5e7eb',
    borderTop: '2px solid #374151',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div style={spinnerStyle}></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={containerStyle} onClick={toggleStatus}>
      <div style={statusStyle}>
        {status}
      </div>
      {showControls && (
        <div style={controlsStyle}>
          Click to toggle
        </div>
      )}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 