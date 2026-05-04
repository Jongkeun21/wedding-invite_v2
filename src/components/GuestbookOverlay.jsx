import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2 } from 'lucide-react';

// 방명록 아이콘 이미지 불러오기
import iconAlien from '../assets/icons/icon_alien.png';
import iconHamm from '../assets/icons/icon_hamm.png';
import iconLotso from '../assets/icons/icon_lotso.png';
import iconPotato from '../assets/icons/icon_potato.png';
import iconRex from '../assets/icons/icon_rex.png';
import iconSlinky from '../assets/icons/icon_slinky.png';

const ICONS = [iconAlien, iconHamm, iconLotso, iconPotato, iconRex, iconSlinky];

// 메시지 ID 기반으로 일관된 아이콘 배정 (매번 달라지지 않도록)
const getIconForId = (id) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return ICONS[Math.abs(hash) % ICONS.length];
};

export default function GuestbookOverlay() {
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // 이벤트 전파 방지: 부모(App.jsx)의 스와이프 차단
  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  const openMessageModal = (message) => {
    setSelectedMessage(message);
  };

  const closeMessageModal = () => {
    setSelectedMessage(null);
  };

  useEffect(() => {
    if (!selectedMessage) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedMessage(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedMessage]);

  useEffect(() => {
    // Firestore 실시간 리스너 설정
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgData = [];
      snapshot.forEach((doc) => {
        msgData.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'messages'), {
        name: name.trim(),
        text: text.trim(),
        createdAt: serverTimestamp()
      });
      setName('');
      setText('');
    } catch (error) {
      console.error("Error writing message: ", error);
      alert('방명록 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="guestbook-wrapper">
      {/* 방명록 입력 폼 */}
      <form 
        onSubmit={handleSubmit} 
        className="premium-guestbook-form"
        onPointerDown={stopPropagation}
        onTouchStart={stopPropagation}
        onTouchMove={stopPropagation}
        onTouchEnd={stopPropagation}
        onWheel={stopPropagation}
      >
        <div className="pg-input-group">
          <input 
            type="text" 
            placeholder="성함" 
            value={name}
            maxLength={10}
            onChange={(e) => setName(e.target.value)}
            required 
            className="pg-input-name"
          />
          <textarea 
            placeholder="축하의 메시지를 남겨주세요." 
            value={text}
            onChange={(e) => setText(e.target.value)}
            required 
            maxLength={150}
            rows="2"
            className="pg-input-text"
          />
        </div>
        <button type="submit" disabled={submitting} className="pg-submit-btn">
          {submitting ? <Loader2 size={16} className="spin" /> : '작성하기'}
        </button>
      </form>

      {/* 방명록 리스트 */}
      <div 
        className="guestbook-list"
        onPointerDown={stopPropagation}
        onTouchStart={stopPropagation}
        onTouchMove={stopPropagation}
        onTouchEnd={stopPropagation}
        onWheel={stopPropagation}
      >
        {loading ? (
          <div className="loading-spinner"><Loader2 size={32} className="spin" /></div>
        ) : messages.length > 0 ? (
          messages.map((msg) => (
            <button
              key={msg.id}
              type="button"
              className="premium-guestbook-item"
              onClick={() => openMessageModal(msg)}
            >
              <img
                src={getIconForId(msg.id)}
                alt="icon"
                className="pg-item-icon"
              />
              <div className="pg-item-body">
                <div className="pg-item-header">
                  <span className="pg-item-name">{msg.name}</span>
                </div>
                <p className="pg-item-text">{msg.text}</p>
              </div>
            </button>
          ))
        ) : (
          <div className="empty-message"></div>
        )}
      </div>

      {selectedMessage ? createPortal(
        <div
          className="guestbook-modal-backdrop"
          onClick={closeMessageModal}
          onPointerDown={stopPropagation}
          onTouchStart={stopPropagation}
          onTouchMove={stopPropagation}
          onTouchEnd={stopPropagation}
          onWheel={stopPropagation}
        >
          <div
            className="guestbook-modal"
            onClick={stopPropagation}
            onPointerDown={stopPropagation}
            onTouchStart={stopPropagation}
            onTouchMove={stopPropagation}
            onTouchEnd={stopPropagation}
            onWheel={stopPropagation}
          >
            <button
              type="button"
              className="guestbook-modal-close"
              onClick={closeMessageModal}
              aria-label="방명록 닫기"
            >
              ×
            </button>
            <div className="guestbook-modal-content">
              <div className="guestbook-modal-visual">
                <img
                  src={getIconForId(selectedMessage.id)}
                  alt="icon"
                  className="guestbook-modal-icon"
                />
              </div>
              <div className="guestbook-modal-main">
                <span className="guestbook-modal-name">{selectedMessage.name}</span>
                <p className="guestbook-modal-text">{selectedMessage.text}</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
}
