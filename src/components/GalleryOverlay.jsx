import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';

import thumb1 from '../assets/thumb/thumb_hanbok.jpeg';
import thumb2 from '../assets/thumb/thumb_studio.jpeg';
import thumb3 from '../assets/thumb/thumb_outside.jpeg';

const CATEGORIES = [
  { id: '1', label: '스튜디오', thumb: thumb1 },
  { id: '2', label: '본식', thumb: thumb2 },
  { id: '3', label: '데이트', thumb: thumb3 }
];

export default function GalleryOverlay({ isActive = true, onCategoryViewChange, shouldPreload = true }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [transitionDirection, setTransitionDirection] = useState('');
  const [imageCache, setImageCache] = useState({});
  const expandedTouchStartX = useRef(null);
  const expandedTouchEndX = useRef(null);

  useEffect(() => {
    if (!shouldPreload) return;

    // 컴포넌트 마운트 시 모든 카테고리 이미지를 백그라운드에서 미리 로딩
    const preloadAllCategories = async () => {
      for (const cat of CATEGORIES) {
        try {
          const listRef = ref(storage, `gallery/category${cat.id}`);
          const res = await listAll(listRef);
          const urls = await Promise.all(res.items.map((itemRef) => getDownloadURL(itemRef)));
          
          setImageCache(prev => ({ ...prev, [cat.id]: urls }));
          
          // 브라우저 캐시에 실제 이미지 파일 다운로드
          urls.forEach(url => {
            const img = new Image();
            img.src = url;
          });
        } catch (error) {
          console.error(`Error preloading category ${cat.id}: `, error);
        }
      }
    };
    preloadAllCategories();
  }, [shouldPreload]);

  // 이벤트 전파 방지: 갤러리 내부의 터치 및 마우스 휠 이벤트가 부모(App.jsx)의 스와이프 이벤트를 발동시키지 않도록 방지
  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  const stopAndPrevent = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const fetchImages = async (categoryId) => {
    // 캐시에 이미 로딩된 URL이 있다면 즉시 렌더링하고 종료
    if (imageCache[categoryId] && imageCache[categoryId].length > 0) {
      setImages(imageCache[categoryId]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setImages([]);
    try {
      const listRef = ref(storage, `gallery/category${categoryId}`);
      const res = await listAll(listRef);
      
      const urlPromises = res.items.map((itemRef) => getDownloadURL(itemRef));
      const urls = await Promise.all(urlPromises);
      
      setImages(urls);
      setImageCache(prev => ({ ...prev, [categoryId]: urls }));
    } catch (error) {
      console.error("Error fetching images: ", error);
      // 폴더가 없거나 에러가 날 경우 무시 (빈 배열 유지)
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    if (onCategoryViewChange) onCategoryViewChange(true);
    fetchImages(categoryId);
  };

  const handleBackClick = () => {
    setSelectedCategory(null);
    if (onCategoryViewChange) onCategoryViewChange(false);
    setImages([]);
  };

  const closeExpanded = () => {
    setExpandedIndex(null);
    setTransitionDirection('');
  };

  const openExpanded = (index) => {
    setTransitionDirection('');
    setExpandedIndex(index);
  };

  const moveExpanded = (direction) => {
    if (expandedIndex === null || images.length === 0) return;
    const nextIndex = expandedIndex + direction;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    setTransitionDirection(direction > 0 ? 'next' : 'prev');
    setExpandedIndex(nextIndex);
  };

  const handleExpandedTouchStart = (e) => {
    stopPropagation(e);
    expandedTouchEndX.current = null;
    expandedTouchStartX.current = e.targetTouches[0].clientX;
  };

  const handleExpandedTouchMove = (e) => {
    stopPropagation(e);
    expandedTouchEndX.current = e.targetTouches[0].clientX;
  };

  const handleExpandedTouchEnd = (e) => {
    stopPropagation(e);
    if (expandedTouchStartX.current === null || expandedTouchEndX.current === null) return;

    const distanceX = expandedTouchStartX.current - expandedTouchEndX.current;
    const minSwipeDistance = 40;

    if (distanceX > minSwipeDistance) {
      moveExpanded(1);
    } else if (distanceX < -minSwipeDistance) {
      moveExpanded(-1);
    }
  };

  useEffect(() => {
    if (expandedIndex === null) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeExpanded();
      if (event.key === 'ArrowLeft') moveExpanded(-1);
      if (event.key === 'ArrowRight') moveExpanded(1);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [expandedIndex, images.length]);

  useEffect(() => {
    if (isActive) return;

    setSelectedCategory(null);
    if (onCategoryViewChange) onCategoryViewChange(false);
    setImages([]);
    setLoading(false);
    setExpandedIndex(null);
    setTransitionDirection('');
  }, [isActive, onCategoryViewChange]);

  const detailView = (
    <div className="gallery-detail-layer">
      <div className="image-list-container">
        <div className="gallery-header">
          <button className="back-btn" onClick={handleBackClick}>
            <ArrowLeft size={24} />
          </button>
        </div>
        <div
          className="image-scroll-area"
          onPointerDown={stopPropagation}
          onTouchStart={stopPropagation}
          onTouchMove={stopPropagation}
          onTouchEnd={stopPropagation}
          onWheel={stopPropagation}
        >
          {loading ? (
            <div className="loading-spinner"><Loader2 size={32} className="spin" /></div>
          ) : images.length > 0 ? (
            <div className="gallery-thumbnail-grid">
              {images.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`gallery-${idx}`}
                  className="gallery-thumbnail"
                  loading="lazy"
                  onClick={() => openExpanded(idx)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-message">업로드된 사진이 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {expandedIndex !== null && createPortal(
        <div
          className="expanded-image-modal"
          onClick={closeExpanded}
          onPointerDown={stopPropagation}
          onTouchStart={stopPropagation}
          onTouchMove={stopPropagation}
          onTouchEnd={stopPropagation}
          onWheel={stopAndPrevent}
        >
          <button
            type="button"
            className="expanded-close-btn"
            onClick={(e) => {
              stopPropagation(e);
              closeExpanded();
            }}
            aria-label="확대 이미지 닫기"
          >
            <X size={18} />
          </button>

          <button
            type="button"
            className="expanded-nav-btn left"
            onClick={(e) => {
              stopPropagation(e);
              moveExpanded(-1);
            }}
            disabled={expandedIndex === 0}
            aria-label="이전 이미지"
          >
            <ChevronLeft size={24} />
          </button>

          <div
            className="expanded-image-stage"
            onClick={stopPropagation}
            onTouchStart={handleExpandedTouchStart}
            onTouchMove={handleExpandedTouchMove}
            onTouchEnd={handleExpandedTouchEnd}
            onWheel={stopAndPrevent}
          >
            <img
              key={`${expandedIndex}-${transitionDirection}`}
              src={images[expandedIndex]}
              alt="expanded"
              className={`expanded-image ${transitionDirection ? `is-${transitionDirection}` : ''}`}
            />
          </div>

          <button
            type="button"
            className="expanded-nav-btn right"
            onClick={(e) => {
              stopPropagation(e);
              moveExpanded(1);
            }}
            disabled={expandedIndex === images.length - 1}
            aria-label="다음 이미지"
          >
            <ChevronRight size={24} />
          </button>
        </div>,
        document.body
      )}
      {!selectedCategory ? (
        // 카테고리 뷰
        <div className="overlay-container">
          <div className="category-grid">
            <div className="category-list">
              {CATEGORIES.map(cat => (
                <div 
                  key={cat.id} 
                  className="category-list-item" 
                  onClick={() => handleCategoryClick(cat.id)}
                  style={{ backgroundImage: `url(${cat.thumb})` }}
                >
                  <div className="category-list-overlay">
                    {/* <span>{cat.label}</span> */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        createPortal(detailView, document.body)
      )}
    </>
  );
}
