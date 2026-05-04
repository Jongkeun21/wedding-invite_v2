// 개발용 debug: npm run dev -- --host 0.0.0.0 --port 5173

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Music, VolumeX } from 'lucide-react';

import cloudBg from './assets/bg_cloud.jpeg';
import cursorImg from './assets/sunny_sonny.png';
import mainImg from './assets/main3.png';
import bgmFile from './assets/bgm.mp3'

import page_main from './assets/pages/01_main.png';

import page_opening from './assets/pages/02_opening.png';
import page_dday from './assets/pages/03_dday.png';
import page_s2k from './assets/pages/04_sunny2keunny.png';
import page_k2s from './assets/pages/05_keunny2sunny.png';
import page_gallery from './assets/pages/06_gallery.png';
import page_account from './assets/pages/07_account.png';
import page_map from './assets/pages/08_map.png';
import page_guestbook from './assets/pages/09_guestbook.png';

// Firebase Components
import GalleryOverlay from './components/GalleryOverlay';
import GuestbookOverlay from './components/GuestbookOverlay';

// BGM 플레이어 컴포넌트
const BgmPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // 컴포넌트 마운트 시 자동재생 시도
  // (브라우저 정책상 사용자 인터렉션 전에는 차단될 수 있음)
  useEffect(() => {
    const tryPlay = () => {
      if (!audioRef.current) return;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // 자동재생 차단된 경우 조용히 실패, 아이콘은 꺼진 상태 유지
          setIsPlaying(false);
        });
    };
    // 스플래시 화면이 사라지는 시간(2.2초) 이후 재생 시도
    const timer = setTimeout(tryPlay, 2300);
    return () => clearTimeout(timer);
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("오디오 재생 에러:", e));
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bgm-player" onClick={togglePlay}>
      <audio ref={audioRef} src={bgmFile} loop />
      {isPlaying ? <Music className="music-icon playing" /> : <VolumeX className="music-icon" />}
    </div>
  );
};


// 디데이 계산 함수
const getDdayText = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  const target = new Date('2026-07-19T00:00:00');
  const targetTime = target.getTime();
  const todayTime = today.getTime();
  
  const diff = targetTime - todayTime;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (days > 0) return <>종근 ❤️ 현선<br />결혼식이 {days}일 남았습니다</>;
  if (days === 0) return <>오늘은 종근 ❤️ 현선의<br />결혼식 날입니다</>;
  return <>결혼한 지<br />{Math.abs(days)}일 지났습니다</>;
};

// 계좌번호 탭 컴포넌트
const AccountTabs = () => {
  const [activeTab, setActiveTab] = useState('groom');

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('계좌번호가 복사되었습니다.');
  };

  return (
    <div className="account-tabs-container">
      <div className="tabs-header">
        <button 
          className={`tab-btn ${activeTab === 'groom' ? 'active' : ''}`}
          onClick={() => setActiveTab('groom')}
        >
          신랑측
        </button>
        <button 
          className={`tab-btn ${activeTab === 'bride' ? 'active' : ''}`}
          onClick={() => setActiveTab('bride')}
        >
          신부측
        </button>
      </div>
      <div className="tab-content">
        {activeTab === 'groom' ? (
          <div className="account-info">
            <p className="bank-name">농협은행 302-0628-0239-71</p>
            <p className="account-holder">예금주: 이종근</p>
            <button className="copy-btn" onClick={() => handleCopy('3020628023971')}>계좌번호 복사하기</button>
          </div>
        ) : (
          <div className="account-info">
            <p className="bank-name">하나은행 258-910293-84707</p>
            <p className="account-holder">예금주: 김경희</p>
            <button className="copy-btn" onClick={() => handleCopy('25891029384707')}>계좌번호 복사하기</button>
            <hr className="account-divider" />
            <p className="bank-name">우리은행 1002-367-441214</p>
            <p className="account-holder">예금주: 김현선</p>
            <button className="copy-btn" onClick={() => handleCopy('1002367441214')}>계좌번호 복사하기</button>
          </div>
        )}
      </div>
    </div>
  );
};

const PageLayout = ({ image, alt, children }) => (
  <div className="page-layout">
    <div className="page-artboard">
      <img src={image} alt={alt} className="page-artboard-image" />
      {children}
    </div>
  </div>
);

export default function App() {
  const [showSplash, setShowSplash] = useState(true);  // 스플래시 화면 상태
  const [splashFading, setSplashFading] = useState(false);  // 페이드아웃 시작 여부
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [currentPage, setCurrentPage] = useState(0);
  const [isGalleryCategoryOpen, setIsGalleryCategoryOpen] = useState(false);
  
  // 스플래시: 1.5초 후 페이드아웃 시작, 2초 후 완전히 제거
  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFading(true), 1500);
    const hideTimer = setTimeout(() => setShowSplash(false), 2200);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const ignorePageSwipeRef = useRef(false);
  // 짧은 스와이프로도 잘 넘어가도록 설정
  const minSwipeDistance = 30;
  // 휠 이벤트를 container에만 적용하기 위한 ref
  const postitContainerRef = useRef(null);

  // 전체 뒷배경으로 깔릴 구름 이미지
  const toyStoryCloudBgUrl = cloudBg; 
  const cursorImageUrl = cursorImg; 

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    if (window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // 마우스 휠 스크롤 감지 (트랙패드/마우스 모두 부드럽게 반응)
  const wheelLockRef = useRef(false);
  const wheelDeltaAccumulatorRef = useRef(0);
  const wheelUnlockTimerRef = useRef(null);
  const isInteractiveScrollZone = (target) => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('.image-scroll-area, .guestbook-list, .premium-guestbook-form'));
  };

  const resetTouchState = () => {
    setTouchStart(null);
    setTouchEnd(null);
    setTouchStartX(null);
    setTouchEndX(null);
  };

  useEffect(() => {
    const container = postitContainerRef.current;
    if (!container) return;

    const WHEEL_THRESHOLD = 120;
    const WHEEL_LOCK_MS = 520;

    const handleWheel = (e) => {
      if (isInteractiveScrollZone(e.target)) return;
      e.preventDefault();
      if (wheelLockRef.current) return;

      const deltaUnit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      wheelDeltaAccumulatorRef.current += e.deltaY * deltaUnit;

      if (Math.abs(wheelDeltaAccumulatorRef.current) < WHEEL_THRESHOLD) return;

      const direction = wheelDeltaAccumulatorRef.current > 0 ? 1 : -1;
      wheelDeltaAccumulatorRef.current = 0;

      setCurrentPage((prev) => {
        const nextPage = Math.min(totalPages - 1, Math.max(0, prev + direction));
        if (nextPage === prev) return prev;

        wheelLockRef.current = true;
        if (wheelUnlockTimerRef.current) clearTimeout(wheelUnlockTimerRef.current);
        wheelUnlockTimerRef.current = setTimeout(() => {
          wheelLockRef.current = false;
        }, WHEEL_LOCK_MS);

        return nextPage;
      });
    };
    
    // window 대신 container에 이벤트를 연결 → stopPropagation이 정상 작동알
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (wheelUnlockTimerRef.current) clearTimeout(wheelUnlockTimerRef.current);
    };
  }, []);

  const onTouchStart = (e) => {
    if (isInteractiveScrollZone(e.target)) {
      ignorePageSwipeRef.current = true;
      resetTouchState();
      return;
    }

    ignorePageSwipeRef.current = false;
    const touch = e.targetTouches ? e.targetTouches[0] : e;
    setTouchEnd(null);
    setTouchEndX(null);
    setTouchStart(touch.clientY);
    setTouchStartX(touch.clientX);
  };

  const onTouchMove = (e) => {
    if (ignorePageSwipeRef.current) return;
    const touch = e.targetTouches ? e.targetTouches[0] : e;
    setTouchEnd(touch.clientY);
    setTouchEndX(touch.clientX);
  };

  const onTouchEndHandler = () => {
    if (ignorePageSwipeRef.current) {
      ignorePageSwipeRef.current = false;
      resetTouchState();
      return;
    }

    if (!touchStart || !touchEnd || !touchStartX || !touchEndX) return;
    
    const distanceY = touchStart - touchEnd;
    const distanceX = touchStartX - touchEndX;
    const absDistanceY = Math.abs(distanceY);
    const absDistanceX = Math.abs(distanceX);
    const isMostlyHorizontal = absDistanceX > absDistanceY + 8;
    const isMostlyVertical = absDistanceY > absDistanceX + 8;
    const isGalleryDetailActive = currentPage === 5 && isGalleryCategoryOpen;

    // 갤러리 카테고리 내부에서는 "명확한 좌우" 제스처만 페이지 전환 허용
    if (isGalleryDetailActive) {
      const strictHorizontalSwipe =
        absDistanceX > 70 &&
        absDistanceX > absDistanceY * 2;

      if (!strictHorizontalSwipe) return;

      if (distanceX > 0 && currentPage < totalPages - 1) {
        setCurrentPage((prev) => prev + 1);
      } else if (distanceX < 0 && currentPage > 0) {
        setCurrentPage((prev) => prev - 1);
      }
      return;
    }

    // 위아래 스와이프: 위로 쓸면 다음 장, 아래로 쓸면 이전 장
    const isUpSwipe = !isGalleryDetailActive && isMostlyVertical && distanceY > minSwipeDistance;
    const isDownSwipe = !isGalleryDetailActive && isMostlyVertical && distanceY < -minSwipeDistance;
    // 좌우 스와이프: 왼쪽으로 쓸면 다음 장, 오른쪽으로 쓸면 이전 장
    const isLeftSwipe = isMostlyHorizontal && distanceX > minSwipeDistance;
    const isRightSwipe = isMostlyHorizontal && distanceX < -minSwipeDistance;

    if ((isUpSwipe || isLeftSwipe) && currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
    if ((isDownSwipe || isRightSwipe) && currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
    resetTouchState();
  };

  const pages = [
    {
      id: 0,
      rotation: 0,
      bg: 'transparent',
      content: (
        <PageLayout image={page_main} alt="page_main" />
      )
    },
    {
      id: 1,
      rotation: 0,
      bg: 'transparent',
      content: (
        <PageLayout image={page_opening} alt="page_opening" />
      )
    },
    {
      id: 2,
      rotation: 0,
      bg: 'transparent',
      content: (
        <PageLayout image={page_dday} alt="page_dday">
          {/* 하단 D-Day 텍스트 오버레이 */}
          <div className="dday-text-overlay">
            {getDdayText()}
          </div>
        </PageLayout>
      )
    },
    {
      id: 3,
      rotation: 0,
      bg: 'transparent',
      content: (
        <PageLayout image={page_s2k} alt="page_s2k" />
      )
    },
    {
      id: 4,
      rotation: 0,
      bg: 'transparent',
      content: (
        <PageLayout image={page_k2s} alt="page_k2s" />
      )
    },
    {
      id: 5,
      rotation: 0,
      bg: 'transparent',
      content: (
        <PageLayout image={page_gallery} alt="page_gallery">
          <GalleryOverlay
            isActive={currentPage === 5}
            onCategoryViewChange={setIsGalleryCategoryOpen}
            shouldPreload={!showSplash}
          />
        </PageLayout>
      )
    },
    {
      id: 6,
      rotation: 0,
      bg: 'transparent',
      content: (
        <PageLayout image={page_account} alt="page_account">
          {/* 계좌번호 탭 오버레이 */}
          <div className="account-overlay">
            <AccountTabs />
          </div>
        </PageLayout>
      )
    },
    {
      id: 7,
      rotation: 0,
      bg: 'transparent',
      content: (
        <PageLayout image={page_map} alt="page_map" />
      )
    },
    {
      id: 8,
      rotation: 0,
      bg: 'transparent',
      content: (
        <PageLayout image={page_guestbook} alt="page_guestbook">
          {/* 방명록 오버레이: top% 숫자를 조절하여 위치 변경 */}
          <div className="guestbook-overlay">
            <GuestbookOverlay />
          </div>
        </PageLayout>
      )
    }
  ];
  const totalPages = pages.length;

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages - 1));
  }, [totalPages]);

  return (
    <div 
      className="mobile-app-container" 
      style={{ backgroundImage: toyStoryCloudBgUrl ? `url(${toyStoryCloudBgUrl})` : 'none' }}
    >
      {/* 스플래시 화면: showSplash가 true인 동안 전체화면으로 표시 */}
      {showSplash && (
        <div className={`splash-screen ${splashFading ? 'splash-fading' : ''}`}>
          <img src={mainImg} alt="splash" className="splash-image" />
        </div>
      )}

      <BgmPlayer />
      <div 
        className="cursor-follower" 
        style={{ transform: `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)` }}
      >
        {cursorImageUrl ? (
          <img src={cursorImageUrl} alt="custom cursor" />
        ) : (
          <Sparkles size={24} color="var(--accent-color)" fill="white" />
        )}
      </div>

      {/* 포스트잇 더미 영역 */}
      <div 
        ref={postitContainerRef}
        className="postit-container"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEndHandler}
      >
        {pages.map((page, index) => {
          let pageClass = 'postit-card';
          if (index < currentPage) pageClass += ' torn-off';
          else if (index === currentPage) pageClass += ' active-page';
          else pageClass += ' next-page';

          const zIndex = totalPages - index;

          return (
            <div 
              key={page.id} 
              className={pageClass} 
              style={{ 
                backgroundColor: page.bg,
                zIndex: zIndex,
                '--page-rot': `${page.rotation}deg`,
                boxShadow: page.bg === 'transparent' ? 'none' : undefined,
                backgroundImage: page.bg === 'transparent' ? 'none' : undefined,
                ...(page.bg === 'transparent' ? { width: '100%', height: '100%', maxHeight: '100%' } : {})
              }}
            >
              
              <div className="page-content-wrapper" style={{ padding: page.bg === 'transparent' ? 0 : undefined }}>
                {page.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
