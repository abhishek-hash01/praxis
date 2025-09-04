import { Link, useLocation } from "react-router-dom";
import { Home, MessageCircle, User, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { collection, query, onSnapshot, getFirestore } from "firebase/firestore";

const db = getFirestore();

const items = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Listen for unread messages
  useEffect(() => {
    if (!currentUser) return;

    const messagesQuery = query(collection(db, "messages"));
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages: any[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });

      // Count unread messages sent to current user
      const unread = messages.filter(msg => 
        msg.toUserId === currentUser.uid && !msg.read
      ).length;

      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 z-50 pb-safe">
      <div className="mx-auto max-w-md grid grid-cols-4">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(to + '/');
          const isChat = to === '/chat';
          return (
            <Link key={`${to}-${label}`} to={to} className="relative group flex flex-col items-center justify-center py-2 sm:py-3 text-xs">
              {active && <span className="absolute top-0 h-0.5 sm:h-1 w-6 sm:w-8 rounded-full bg-praxis-green/70" />}
              <div className="relative">
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 transition ${active ? "text-praxis-green" : "text-white/70 group-hover:text-white"}`} />
                {isChat && unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-praxis-green flex items-center justify-center">
                    <span className="text-[9px] sm:text-[10px] font-bold text-black">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  </div>
                )}
              </div>
              <span className={`transition ${active ? "text-praxis-green" : "text-white/60 group-hover:text-white"}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
