import React, { useEffect, useRef, useState } from "react";
import { FaBell, FaCheckDouble, FaRegBell } from "react-icons/fa";
import { apiFetch } from "../Api/Client.jsx";
import "../styles/global.css";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const audioRef = useRef(null);
  const previousUnreadCountRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const hasPlayedInitialSoundRef = useRef(false);

  const loadNotifications = async () => {
    try {
      const { res, data } = await apiFetch("/api/notifications");

      if (res.ok) {
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erreur notifications :", error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const { res, data } = await apiFetch("/api/notifications/unread-count");

      if (res.ok) {
        const newCount = data?.total || 0;

        // Premier chargement : jouer un son si des notifs non lues existent déjà
        if (!hasLoadedOnceRef.current) {
          hasLoadedOnceRef.current = true;

          if (
            newCount > 0 &&
            audioRef.current &&
            !hasPlayedInitialSoundRef.current
          ) {
            hasPlayedInitialSoundRef.current = true;
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          }
        }
        // Chargements suivants : jouer le son seulement si le nombre augmente
        else if (
          newCount > previousUnreadCountRef.current &&
          audioRef.current
        ) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }

        previousUnreadCountRef.current = newCount;
        setUnreadCount(newCount);
      }
    } catch (error) {
      console.error("Erreur unread count :", error);
    }
  };

  const markAsRead = async (id) => {
    try {
      const { res } = await apiFetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });

      if (res.ok) {
        await loadNotifications();
        await loadUnreadCount();
      }
    } catch (error) {
      console.error("Erreur markAsRead :", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { res } = await apiFetch("/api/notifications/read-all", {
        method: "PATCH",
      });

      if (res.ok) {
        await loadNotifications();
        await loadUnreadCount();
      }
    } catch (error) {
      console.error("Erreur markAllAsRead :", error);
    }
  };

  const toggleOpen = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      await loadNotifications();
      await loadUnreadCount();
    }
  };

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();

    const interval = setInterval(() => {
      loadNotifications();
      loadUnreadCount();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="notif-container">
      <audio
        ref={audioRef}
        src="/Sounds/notification.wav"
        preload="auto"
      />

      <button
        type="button"
        className={`notif-bell ${open ? "open" : ""}`}
        onClick={toggleOpen}
        aria-label="Ouvrir les notifications"
      >
        <FaRegBell />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <div className="notif-header-left">
              <div className="notif-header-icon">
                <FaBell />
              </div>

              <div>
                <div className="notif-header-title">Notifications</div>
                <div className="notif-header-subtitle">
                  {unreadCount > 0
                    ? `${unreadCount} non lue(s)`
                    : "Tout est à jour"}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="notif-action"
              onClick={markAllAsRead}
            >
              <FaCheckDouble />
              <span>Tout lire</span>
            </button>
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <div className="notif-empty-title">Aucune notification</div>
                <div className="notif-empty-text">
                  Les nouvelles alertes apparaîtront ici.
                </div>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  type="button"
                  key={notif.id_notification}
                  className={`notif-item ${notif.lu ? "read" : "unread"}`}
                  onClick={() => markAsRead(notif.id_notification)}
                >
                  <div className="notif-item-top">
                    <div className="notif-title">{notif.titre}</div>
                    {!notif.lu && <span className="notif-dot" />}
                  </div>

                  <div className="notif-message">{notif.message}</div>

                  <div className="notif-meta">
                    {notif.date_creation
                      ? new Date(notif.date_creation).toLocaleString()
                      : ""}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}