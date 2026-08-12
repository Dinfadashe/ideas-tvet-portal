// src/components/admin/NotificationBell.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchNotifications()

    // Real-time subscription
    const channel = supabase
      .channel('admin_notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_notifications',
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchNotifications() {
    const { data } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications(data || [])
  }

  async function markRead(id) {
    await supabase.from('admin_notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    await supabase.from('admin_notifications').update({ read: true }).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  function handleClick(notif) {
    markRead(notif.id)
    setOpen(false)
    if (notif.action_url) navigate(notif.action_url)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  function timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    const hrs = Math.floor(mins / 60)
    const days = Math.floor(hrs / 24)
    if (days > 0) return `${days}d ago`
    if (hrs > 0) return `${hrs}h ago`
    if (mins > 0) return `${mins}m ago`
    return 'Just now'
  }

  function notifIcon(type) {
    if (type === 'acceptance_letter_uploaded') return '📄'
    if (type === 'profile_complete') return '✅'
    return '🔔'
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ position: 'relative', background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 18, height: 18, borderRadius: '50%',
            background: '#dc2626', color: '#fff',
            fontSize: 10, fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 8,
            width: 360, background: '#fff', borderRadius: 14,
            boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8f0', zIndex: 100, overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0a2e14' }}>
                Notifications {unreadCount > 0 && <span style={{ background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 900, padding: '1px 6px', borderRadius: 20, marginLeft: 6 }}>{unreadCount}</span>}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ fontSize: 12, color: '#1a7a3c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                  <div style={{ fontSize: 13 }}>No notifications yet</div>
                </div>
              ) : notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #f8fafc',
                    cursor: 'pointer',
                    background: notif.read ? '#fff' : '#f0fdf4',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{notifIcon(notif.type)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: notif.read ? 500 : 700, color: '#0a1628', marginBottom: 3, lineHeight: 1.4 }}>{notif.title}</div>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{notif.message}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{timeAgo(notif.created_at)}</div>
                  </div>
                  {!notif.read && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a7a3c', flexShrink: 0, marginTop: 4 }} />
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
              <button
                onClick={() => { setOpen(false); navigate('/admin/acceptance-letters') }}
                style={{ fontSize: 13, color: '#1a7a3c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                View All Acceptance Letters →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
