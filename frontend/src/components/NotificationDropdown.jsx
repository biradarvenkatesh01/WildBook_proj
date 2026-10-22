import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_NOTIFICATIONS = {
  admin: [
    {
      id: 'adm-1',
      title: 'Account Approved',
      message: 'Your sanctuary operator credentials were approved by the State Wildlife Authority.',
      time: 'Just now',
      read: false,
      type: 'success',
      link: '/admin',
    },
    {
      id: 'adm-2',
      title: 'New Safari Booking',
      message: 'Traveller reservation confirmed for upcoming morning Kabini safari slot.',
      time: '45m ago',
      read: false,
      type: 'booking',
      link: '/admin/bookings',
    },
    {
      id: 'adm-3',
      title: 'Capacity Regulations',
      message: 'Vehicle quotas and eco-tourism schedules are synced with the Authority portal.',
      time: '2h ago',
      read: true,
      type: 'info',
      link: '/admin/sanctuaries',
    },
  ],
  owner: [
    {
      id: 'own-1',
      title: 'New Operator Application',
      message: 'Ganesh Hegde (Nilgiri) submitted verified legal documents for operator clearance.',
      time: '12m ago',
      read: false,
      type: 'review',
      link: '/owner/admin-requests',
    },
    {
      id: 'own-2',
      title: 'Public Registry Sync',
      message: 'Nagarhole and Bandipur tiger reserves are currently published on the public explorer.',
      time: '1h ago',
      read: false,
      type: 'success',
      link: '/owner/sanctuaries',
    },
    {
      id: 'own-3',
      title: 'Clearance Audit Logging',
      message: 'All operator and sanctuary review decisions are timestamped and logged for compliance.',
      time: '4h ago',
      read: true,
      type: 'info',
      link: '/owner/reports',
    },
  ],
  user: [
    {
      id: 'usr-1',
      title: 'Safari Booking Confirmed',
      message: 'Your e-ticket for Nagarhole National Park is issued and ready for download.',
      time: '15m ago',
      read: false,
      type: 'booking',
      link: '/my-bookings',
    },
    {
      id: 'usr-2',
      title: 'Eco-Tourism Contribution',
      message: '40% of your booking fee was allocated to anti-poaching patrols.',
      time: '2h ago',
      read: true,
      type: 'success',
      link: '/conservation',
    },
  ],
};

function getIcon(type) {
  switch (type) {
    case 'success':
      return (
        <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </span>
      );
    case 'booking':
      return (
        <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
      );
    case 'review':
      return (
        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </span>
      );
    default:
      return (
        <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </span>
      );
  }
}

export default function NotificationDropdown({ portal = 'admin', light = false, align = 'right' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => DEFAULT_NOTIFICATIONS[portal] || DEFAULT_NOTIFICATIONS.admin);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Handle outside click & escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleItemClick = (notification) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
    );
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const buttonClass = light
    ? 'p-2 text-[#F6F1E7]/80 hover:text-white rounded-lg hover:bg-white/10 relative transition-colors cursor-pointer'
    : 'p-2 text-gray-500 hover:text-gray-800 rounded-xl hover:bg-gray-100 relative transition-colors cursor-pointer';

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={buttonClass}
        aria-label="Notifications"
        aria-expanded={isOpen}
        title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread Amber Dot */}
        {unreadCount > 0 && (
          <span className="w-2.5 h-2.5 rounded-full bg-[#D9A441] ring-2 ring-white absolute top-1.5 right-1.5 animate-pulse" />
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'left' ? 'left-0' : 'right-0'
          } mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden text-gray-800 animate-in fade-in zoom-in-95 duration-100`}
          role="dialog"
          aria-label="Notifications window"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-[#FAF8F5]">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base text-[#162B1D]">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#D9A441] text-[#162B1D]">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs text-[#162B1D] hover:text-[#D9A441] font-medium transition cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-gray-400 hover:text-gray-600 transition cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <svg className="w-8 h-8 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p className="text-xs font-medium">All caught up!</p>
                <p className="text-[11px] text-gray-400 mt-0.5">No new notifications at this time.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-gray-50/80 transition cursor-pointer ${
                    !item.read ? 'bg-amber-50/20' : ''
                  }`}
                >
                  {getIcon(item.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-xs font-semibold ${!item.read ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{item.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{item.message}</p>
                  </div>
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-[#D9A441] mt-1.5 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="p-2.5 bg-gray-50/70 border-t border-gray-100 text-center">
            <span className="text-[10px] text-gray-400">
              WildBook Real-time Notifications Gateway
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
