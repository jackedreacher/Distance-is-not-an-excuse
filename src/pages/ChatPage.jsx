import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSocket } from '../hooks/useSocket';

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
const { socket, connected, chatJoin, chatSend, chatTyping, chatStopTyping, chatDelete } = useSocket();

  // Allow joining a shared room via query param; default to "global"
  const roomId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('room') || 'global';
  }, [location.search]);

  const [name, setName] = useState(() => {
    return localStorage.getItem('chatUsername') || 'Guest';
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTypingInfo, setIsTypingInfo] = useState(null);
  const listRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hiddenIdsRef = useRef(new Set());

  useEffect(() => {
    // Load hidden list for this room from localStorage so cleared messages stay hidden after refresh
    try {
      const saved = localStorage.getItem(`chatHidden:${roomId}`);
      hiddenIdsRef.current = new Set(saved ? JSON.parse(saved) : []);
    } catch {
      hiddenIdsRef.current = new Set();
    }
  }, [roomId]);
 
  useEffect(() => {
    if (!socket || !connected) return;
    chatJoin(roomId, name);

    const onHistory = (history) => setMessages(history);
    const onMessage = (msg) => setMessages((prev) => [...prev, msg]);
    const onSystem = (evt) => setMessages((prev) => [...prev, { id: `sys-${Date.now()}`, system: true, ...evt }]);
    const onTyping = (data) => setIsTypingInfo({ name: data.name, at: data.at });
    const onStopTyping = () => setIsTypingInfo(null);
  const onDeleted = ({ id }) => setMessages((prev) => prev.map(m => (m.id === id ? { ...m, deleted: true, text: '' } : m)));

    socket.on('chat:history', onHistory);
    socket.on('chat:message', onMessage);
    socket.on('chat:system', onSystem);
    socket.on('chat:typing', onTyping);
    socket.on('chat:stopTyping', onStopTyping);
  socket.on('chat:deleted', onDeleted);

    return () => {
      socket.off('chat:history', onHistory);
      socket.off('chat:message', onMessage);
      socket.off('chat:system', onSystem);
      socket.off('chat:typing', onTyping);
      socket.off('chat:stopTyping', onStopTyping);
      socket.off('chat:deleted', onDeleted);
    };
  }, [socket, connected, roomId, name, chatJoin]);

  useEffect(() => {
    // Auto scroll on new messages
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    chatSend(roomId, text, name);
    setInput('');
    chatStopTyping(roomId);
  };

  const handleTyping = (val) => {
    setInput(val);
    if (!socket) return;
    chatTyping(roomId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => chatStopTyping(roomId), 900);
  };

  const canDelete = (m) => !m.system && !m.deleted && m.senderId && socket?.id && m.senderId === socket.id;
  const deleteMessage = (id) => chatDelete(roomId, id);
  const clearMessages = () => {
    if (messages.length) {
      for (const m of messages) {
        if (m?.id) hiddenIdsRef.current.add(m.id);
      }
      try {
        localStorage.setItem(`chatHidden:${roomId}`, JSON.stringify([...hiddenIdsRef.current]));
      } catch (err) {
        if (import.meta?.env?.DEV) {
          // eslint-disable-next-line no-console
          console.debug('chatHidden save failed', err);
        }
      }
    }
    setMessages([]);
  };

  return (
    <div className="container" style={{ maxWidth: 720, margin: '0 auto', padding: 12 }}>
      <Button variant="ghost" onClick={() => navigate(-1)} style={{ marginBottom: 8 }}>
        ← Geri
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>💬 Sohbet Odası — {roomId}</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <Input 
              value={name} 
              onChange={(e) => {
                const newName = e.target.value;
                setName(newName);
                localStorage.setItem('chatUsername', newName);
              }} 
              placeholder="Takma ad" 
              style={{ maxWidth: 200 }} 
            />
            <Input value={roomId} readOnly style={{ maxWidth: 200, opacity: 0.7 }} />
            <Button variant="outline" onClick={clearMessages} size="sm">
              🗑️ Temizle
            </Button>
          </div>

          <div ref={listRef} style={{ height: 360, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8, background: 'var(--card)' }}>
            {messages.length === 0 ? (
              <div style={{ opacity: 0.7, textAlign: 'center', marginTop: 24 }}>Henüz mesaj yok. İlk mesajı sen gönder! ✨</div>
            ) : (
              messages.filter(m => !m.system && !m.deleted && !hiddenIdsRef.current.has(m.id)).map((m) => (
                <div key={m.id} style={{
                  margin: '6px 0',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <strong>{m.name || 'Anonim'}:</strong>{' '}
                  <span style={{ whiteSpace: 'pre-wrap' }}>{m.text}</span>
                  {canDelete(m) && (
                    <Button size="sm" variant="ghost" onClick={() => deleteMessage(m.id)} title="Sil" style={{ marginLeft: 6 }}>
                      🗑️
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>

          {isTypingInfo && (
            <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }}>{isTypingInfo.name} yazıyor…</div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Input
              placeholder="Mesaj yaz…"
              value={input}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
            />
            <Button onClick={handleSend} disabled={!connected}>Gönder</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}