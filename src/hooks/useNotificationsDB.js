import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

/**
 * useNotificationsDB
 *
 * Supabase-backed notification hook. Reads the `notifications` table for the
 * current user, subscribes to realtime INSERT events, and exposes helpers to
 * mark notifications as read.
 *
 * Usage:
 *   const { notifications, unreadCount, markAsRead, markAllRead } = useNotificationsDB();
 */
export const useNotificationsDB = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('useNotificationsDB fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initial fetch + realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();

    // Subscribe to new notifications for this user
    channelRef.current = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, fetchNotifications]);

  // Mark a single notification as read
  const markAsRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
  }, []);

  // Mark all unread as read
  const markAllRead = useCallback(async () => {
    if (!user?.id) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false);
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllRead,
    refresh: fetchNotifications,
  };
};

// ─── Notification helper — insert a notification via Supabase RPC ─────────────
// Uses the `create_notification` SECURITY DEFINER function so any authenticated
// user can notify any other user without RLS conflicts.
export const sendNotification = async ({ orgId, recipientId, type, title, message, referenceId, referenceType }) => {
  try {
    const { error } = await supabase.rpc('create_notification', {
      p_org_id:         orgId,
      p_recipient_id:   recipientId,
      p_type:           type,
      p_title:          title,
      p_message:        message || null,
      p_reference_id:   referenceId || null,
      p_reference_type: referenceType || null,
    });
    if (error) throw error;
  } catch (err) {
    // Non-fatal — notification failure shouldn't break the main action
    console.warn('sendNotification error:', err.message);
  }
};
