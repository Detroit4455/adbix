'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface ImageGalleryWidgetProps {
  userId?: string;
  showControls?: boolean;
  width?: string;
  height?: string;
  refreshTrigger?: number;
}

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  position: number;
}

interface GallerySettings {
  view: string;
  items: GalleryItem[];
  backgroundColor?: string; // RGBA color string with opacity
}

// Available view types
const VIEW_TYPES = {
  SLIDESHOW: 'slideshow',
  GRID: 'grid', 
  MASONRY: 'masonry',
  CAROUSEL: 'carousel',
  FULLSCREEN: 'fullscreen'
};

const VIEW_NAMES = {
  slideshow: 'Slideshow',
  grid: 'Grid Layout',
  masonry: 'Masonry',
  carousel: 'Carousel',
  fullscreen: 'Fullscreen'
};

export default function ImageGalleryWidget({ 
  userId, 
  showControls = false,
  width = '600px',
  height = '400px',
  refreshTrigger = 0
}: ImageGalleryWidgetProps) {
  const { data: session } = useSession();
  const [gallerySettings, setGallerySettings] = useState<GallerySettings>({
    view: VIEW_TYPES.SLIDESHOW,
    items: [],
    backgroundColor: 'rgba(245, 247, 250, 1)' // Default background
  });
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Default gallery items with positions
  const defaultGalleryItems: GalleryItem[] = [
    {
      id: '1',
      title: 'Party Ready',
      description: 'Vibrant and festive party style.',
      imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=300&h=200&fit=crop',
      category: 'Party',
      position: 1
    },
    {
      id: '2',
      title: 'Bridal Magic',
      description: 'Graceful look for your big day.',
      imageUrl: 'https://images.unsplash.com/photo-1594736797933-d0d80986bcc6?w=300&h=200&fit=crop',
      category: 'Bridal',
      position: 2
    },
    {
      id: '3',
      title: 'Urban Chic',
      description: 'Trendy urban makeover.',
      imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=200&fit=crop',
      category: 'Urban',
      position: 3
    },
    {
      id: '4',
      title: 'Elegant Waves',
      description: 'Soft and elegant hairstyle.',
      imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop',
      category: 'Elegant',
      position: 4
    },
    {
      id: '5',
      title: 'Radiant Glow',
      description: 'Natural radiant makeup look.',
      imageUrl: 'https://images.unsplash.com/photo-1596462502378-119101fe5440?w=300&h=200&fit=crop',
      category: 'Natural',
      position: 5
    }
  ];

  // Sort items by position
  const sortItemsByPosition = (items: GalleryItem[]) => {
    return [...items].sort((a, b) => a.position - b.position);
  };

  const fetchGallerySettings = useCallback(async () => {
    try {
      setLoading(true);
      if (!userId) {
        setGallerySettings({
          view: VIEW_TYPES.SLIDESHOW,
          items: sortItemsByPosition(defaultGalleryItems),
          backgroundColor: 'rgba(245, 247, 250, 1)'
        });
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/image-gallery?userId=${userId}&t=${Date.now()}`);
      const data = await response.json();
      
      if (data.settings) {
        // Use saved settings
        const itemsWithPositions = (data.settings.items || []).map((item: any, index: number) => ({
          ...item,
          position: item.position || index + 1
        }));
        
        setGallerySettings({
          view: data.settings.view || VIEW_TYPES.SLIDESHOW,
          items: itemsWithPositions.length > 0 ? sortItemsByPosition(itemsWithPositions) : sortItemsByPosition(defaultGalleryItems),
          backgroundColor: data.settings.backgroundColor || 'rgba(245, 247, 250, 1)'
        });
      } else if (data.items && data.items.length > 0) {
        // Legacy support for old format
        const itemsWithPositions = data.items.map((item: any, index: number) => ({
          ...item,
          position: item.position || index + 1
        }));
        setGallerySettings({
          view: VIEW_TYPES.SLIDESHOW,
          items: sortItemsByPosition(itemsWithPositions),
          backgroundColor: 'rgba(245, 247, 250, 1)'
        });
      } else {
        setGallerySettings({
          view: VIEW_TYPES.SLIDESHOW,
          items: sortItemsByPosition(defaultGalleryItems),
          backgroundColor: 'rgba(245, 247, 250, 1)'
        });
      }
    } catch (error) {
      console.error('Error fetching gallery settings:', error);
      setGallerySettings({
        view: VIEW_TYPES.SLIDESHOW,
        items: sortItemsByPosition(defaultGalleryItems),
        backgroundColor: 'rgba(245, 247, 250, 1)'
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchGallerySettings();
  }, [fetchGallerySettings, refreshTrigger]);

  // Reset to first slide when gallery items change
  useEffect(() => {
    setCurrentIndex(0);
  }, [gallerySettings.items]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex >= gallerySettings.items.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex <= 0 ? gallerySettings.items.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Base container style
  const containerStyle: React.CSSProperties = {
    width,
    height,
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    background: gallerySettings.backgroundColor || 'rgba(245, 247, 250, 1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  // Slideshow View Component
  const SlideshowView = () => {
    const galleryStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden'
    };

    const slidesContainerStyle: React.CSSProperties = {
      display: 'flex',
      transform: `translateX(-${currentIndex * 100}%)`,
      transition: 'transform 0.5s ease-in-out',
      height: '100%'
    };

    const slideStyle: React.CSSProperties = {
      minWidth: '100%',
      height: '100%',
      position: 'relative',
      background: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      color: 'white',
      textAlign: 'center',
      padding: '2rem'
    };

    const slideImageStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      zIndex: -1
    };

    const titleStyle: React.CSSProperties = {
      fontSize: height === '100vh' ? '3rem' : '1.8rem',
      fontWeight: 'bold',
      margin: '0 0 0.5rem 0',
      textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
    };

    const descriptionStyle: React.CSSProperties = {
      fontSize: height === '100vh' ? '1.2rem' : '0.9rem',
      margin: 0,
      opacity: 0.9,
      textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
      maxWidth: '80%'
    };

    const navigationStyle: React.CSSProperties = {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      border: 'none',
      borderRadius: '50%',
      width: '50px',
      height: '50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      color: 'white',
      fontSize: '1.5rem',
      zIndex: 10
    };

    const dotsContainerStyle: React.CSSProperties = {
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '8px',
      zIndex: 10
    };

    const dotStyle: React.CSSProperties = {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.5)',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    };

    const activeDotStyle: React.CSSProperties = {
      ...dotStyle,
      background: 'white',
      transform: 'scale(1.2)'
    };

    return (
      <div style={galleryStyle}>
        <div style={slidesContainerStyle}>
          {sortItemsByPosition(gallerySettings.items).map((item, index) => (
            <div key={item.id} style={slideStyle}>
              <img 
                src={item.imageUrl} 
                alt={item.title}
                style={slideImageStyle}
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=300&h=200&fit=crop';
                }}
              />
              <h2 style={titleStyle}>{item.title}</h2>
              <p style={descriptionStyle}>{item.description}</p>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {gallerySettings.items.length > 1 && (
          <>
            <button 
              style={{...navigationStyle, left: '15px'}}
              onClick={prevSlide}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              ‹
            </button>
            
            <button 
              style={{...navigationStyle, right: '15px'}}
              onClick={nextSlide}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              ›
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {gallerySettings.items.length > 1 && (
          <div style={dotsContainerStyle}>
            {gallerySettings.items.map((_, index) => (
              <button
                key={index}
                style={currentIndex === index ? activeDotStyle : dotStyle}
                onClick={() => goToSlide(index)}
                onMouseEnter={(e) => {
                  if (currentIndex !== index) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentIndex !== index) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Grid View Component
  const GridView = () => {
    const [currentImageIndex, setCurrentImageIndex] = useState(2);
    const sortedItems = sortItemsByPosition(gallerySettings.items);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const nextImage = () => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex >= sortedItems.length - 1 ? 0 : prevIndex + 1
      );
    };

    const prevImage = () => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex <= 0 ? sortedItems.length - 1 : prevIndex - 1
      );
    };

    const goToImage = (index: number) => {
      setCurrentImageIndex(index);
    };

    const gridContainerStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: gallerySettings.backgroundColor || 'rgba(245, 247, 250, 1)'
    };

    const carouselContainerStyle: React.CSSProperties = {
      width: '100%',
      height: isMobile ? '80%' : '85%',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    };

    const imagesRowStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '8px' : '12px',
      transform: isMobile 
        ? `translateX(calc(-${currentImageIndex * 100}% - ${currentImageIndex * 8}px))`
        : `translateX(calc(-${currentImageIndex * 280}px - ${currentImageIndex * 12}px + 50% - 140px))`,
      transition: 'transform 0.4s ease-in-out',
      height: '100%'
    };

    const imageItemStyle = (index: number): React.CSSProperties => {
      const isCenter = index === currentImageIndex;
      const isAdjacent = Math.abs(index - currentImageIndex) === 1;
      
      if (isMobile) {
        return {
          minWidth: '100%',
          height: '100%',
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          background: '#fff',
          boxShadow: isCenter ? '0 8px 30px rgba(0,0,0,0.2)' : '0 4px 15px rgba(0,0,0,0.1)',
          transform: isCenter ? 'scale(1)' : 'scale(0.95)',
          opacity: isCenter ? 1 : 0.7
        };
      }

      return {
        minWidth: '280px',
        height: '100%',
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        background: '#fff',
        boxShadow: isCenter 
          ? '0 12px 40px rgba(0,0,0,0.25)' 
          : isAdjacent 
            ? '0 6px 20px rgba(0,0,0,0.15)' 
            : '0 4px 15px rgba(0,0,0,0.1)',
        transform: isCenter 
          ? 'scale(1.05)' 
          : isAdjacent 
            ? 'scale(0.95)' 
            : 'scale(0.85)',
        opacity: isCenter ? 1 : isAdjacent ? 0.8 : 0.4,
        zIndex: isCenter ? 10 : isAdjacent ? 5 : 1
      };
    };

    const imageStyle: React.CSSProperties = {
      width: '100%',
      height: '75%',
      objectFit: 'cover'
    };

    const imageInfoStyle: React.CSSProperties = {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '25%',
      background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
      color: 'white',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end'
    };

    const navigationStyle: React.CSSProperties = {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      border: 'none',
      borderRadius: '50%',
      width: '50px',
      height: '50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      color: '#333',
      fontSize: '1.5rem',
      zIndex: 20,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
    };

    const dotsContainerStyle: React.CSSProperties = {
      position: 'absolute',
      bottom: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '8px',
      zIndex: 15,
      background: 'rgba(0,0,0,0.3)',
      padding: '8px 16px',
      borderRadius: '20px',
      backdropFilter: 'blur(10px)'
    };

    const dotStyle: React.CSSProperties = {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.6)',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    };

    const activeDotStyle: React.CSSProperties = {
      ...dotStyle,
      background: 'white',
      transform: 'scale(1.4)',
      boxShadow: '0 2px 8px rgba(255,255,255,0.3)'
    };

    return (
      <div style={gridContainerStyle}>
        <div style={carouselContainerStyle}>
          <div style={imagesRowStyle}>
            {sortedItems.map((item, index) => (
              <div 
                key={item.id} 
                style={imageItemStyle(index)}
                onClick={() => goToImage(index)}
              >
                <img 
                  src={item.imageUrl} 
                  alt={item.title}
                  style={imageStyle}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=300&h=200&fit=crop';
                  }}
                />
                <div style={imageInfoStyle}>
                  <div style={{
                    fontWeight: 'bold', 
                    fontSize: isMobile ? '1rem' : '0.9rem', 
                    marginBottom: '4px',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                  }}>
                    {item.title}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.8rem' : '0.75rem', 
                    opacity: 0.9, 
                    lineHeight: '1.2',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                  }}>
                    {item.description}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {sortedItems.length > 1 && (
            <>
              <button 
                style={{...navigationStyle, left: '15px'}}
                onClick={prevImage}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                ‹
              </button>
              
              <button 
                style={{...navigationStyle, right: '15px'}}
                onClick={nextImage}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Dots Indicator */}
        {sortedItems.length > 1 && (
          <div style={dotsContainerStyle}>
            {sortedItems.map((_, index) => (
              <button
                key={index}
                style={currentImageIndex === index ? activeDotStyle : dotStyle}
                onClick={() => goToImage(index)}
                onMouseEnter={(e) => {
                  if (currentImageIndex !== index) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentImageIndex !== index) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Masonry View Component
  const MasonryView = () => {
    const masonryContainerStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      flexWrap: 'wrap',
      gap: '8px',
      padding: '8px',
      overflow: 'auto'
    };

    const masonryItemStyle: React.CSSProperties = {
      position: 'relative',
      borderRadius: '8px',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'transform 0.3s ease',
      background: '#f5f5f5',
      flexBasis: 'auto',
      width: 'calc(50% - 4px)'
    };

    const getMasonryHeight = (index: number) => {
      const heights = ['140px', '100px', '180px', '120px', '160px'];
      return heights[index % heights.length];
    };

    return (
      <div style={masonryContainerStyle}>
        {sortItemsByPosition(gallerySettings.items).map((item, index) => (
          <div 
            key={item.id} 
            style={{
              ...masonryItemStyle,
              height: getMasonryHeight(index)
            }}
            onClick={() => goToSlide(index)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <img 
              src={item.imageUrl} 
              alt={item.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=300&h=200&fit=crop';
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
              color: 'white',
              padding: '8px',
              fontSize: '0.8rem'
            }}>
              <div style={{fontWeight: 'bold'}}>{item.title}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Carousel View Component
  const CarouselView = () => {
    const carouselStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    };

    const mainImageStyle: React.CSSProperties = {
      flex: 1,
      position: 'relative',
      background: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      color: 'white',
      textAlign: 'center'
    };

    const mainImageBackgroundStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      zIndex: -1
    };

    const thumbnailsStyle: React.CSSProperties = {
      height: '80px',
      display: 'flex',
      gap: '4px',
      padding: '8px',
      background: 'rgba(0,0,0,0.1)',
      overflowX: 'auto'
    };

    const thumbnailStyle: React.CSSProperties = {
      minWidth: '80px',
      height: '64px',
      borderRadius: '4px',
      overflow: 'hidden',
      cursor: 'pointer',
      border: '2px solid transparent',
      transition: 'all 0.3s ease'
    };

    const activeThumbnailStyle: React.CSSProperties = {
      ...thumbnailStyle,
      border: '2px solid #3b82f6',
      transform: 'scale(1.1)'
    };

    const currentItem = gallerySettings.items[currentIndex];

    return (
      <div style={carouselStyle}>
        <div style={mainImageStyle}>
          {currentItem && (
            <>
              <img 
                src={currentItem.imageUrl} 
                alt={currentItem.title}
                style={mainImageBackgroundStyle}
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=300&h=200&fit=crop';
                }}
              />
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                margin: '0 0 0.5rem 0',
                textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
              }}>{currentItem.title}</h2>
              <p style={{
                fontSize: '0.9rem',
                margin: 0,
                opacity: 0.9,
                textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
              }}>{currentItem.description}</p>
            </>
          )}
        </div>
        
        <div style={thumbnailsStyle}>
          {sortItemsByPosition(gallerySettings.items).map((item, index) => (
            <div 
              key={item.id} 
              style={currentIndex === index ? activeThumbnailStyle : thumbnailStyle}
              onClick={() => goToSlide(index)}
            >
              <img 
                src={item.imageUrl} 
                alt={item.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=300&h=200&fit=crop';
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Fullscreen View Component
  const FullscreenView = () => {
    const fullscreenStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      position: 'relative',
      background: '#000'
    };

    const fullscreenImageStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      objectFit: 'contain'
    };

    const fullscreenOverlayStyle: React.CSSProperties = {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
      color: 'white',
      padding: '2rem',
      textAlign: 'center'
    };

    const navigationStyle: React.CSSProperties = {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'rgba(0, 0, 0, 0.5)',
      border: 'none',
      borderRadius: '50%',
      width: '60px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      color: 'white',
      fontSize: '2rem',
      zIndex: 10
    };

    const currentItem = gallerySettings.items[currentIndex];

    return (
      <div style={fullscreenStyle}>
        {currentItem && (
          <>
            <img 
              src={currentItem.imageUrl} 
              alt={currentItem.title}
              style={fullscreenImageStyle}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=300&h=200&fit=crop';
              }}
            />
            <div style={fullscreenOverlayStyle}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                margin: '0 0 0.5rem 0'
              }}>{currentItem.title}</h2>
              <p style={{
                fontSize: '1.1rem',
                margin: 0,
                opacity: 0.9
              }}>{currentItem.description}</p>
            </div>
          </>
        )}

        {/* Navigation */}
        {gallerySettings.items.length > 1 && (
          <>
            <button 
              style={{...navigationStyle, left: '20px'}}
              onClick={prevSlide}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
              }}
            >
              ‹
            </button>
            
            <button 
              style={{...navigationStyle, right: '20px'}}
              onClick={nextSlide}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
              }}
            >
              ›
            </button>
          </>
        )}
      </div>
    );
  };

  // Render appropriate view based on current setting
  const renderView = () => {
    switch (gallerySettings.view) {
      case VIEW_TYPES.GRID:
        return <GridView />;
      case VIEW_TYPES.MASONRY:
        return <MasonryView />;
      case VIEW_TYPES.CAROUSEL:
        return <CarouselView />;
      case VIEW_TYPES.FULLSCREEN:
        return <FullscreenView />;
      default:
        return <SlideshowView />;
    }
  };

  const loadingStyle: React.CSSProperties = {
    ...containerStyle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f3f4f6'
  };

  const refreshButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '10px',
    left: '10px',
    background: 'rgba(59, 130, 246, 0.8)',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    zIndex: 10,
    transition: 'all 0.3s ease'
  };

  const controlsStyle: React.CSSProperties = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    zIndex: 10
  };

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
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
    <div style={containerStyle}>
      {renderView()}

      {/* Refresh button for management mode */}
      {showControls && (
        <button
          style={refreshButtonStyle}
          onClick={fetchGallerySettings}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(37, 99, 235, 1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.8)';
          }}
          title="Refresh Gallery"
        >
          ↻ Refresh
        </button>
      )}

      {/* Controls info for management mode */}
      {showControls && (
        <div style={controlsStyle}>
          {gallerySettings.items.length} items • {VIEW_NAMES[gallerySettings.view as keyof typeof VIEW_NAMES] || 'Slideshow'}
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