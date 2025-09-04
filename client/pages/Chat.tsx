import LoggedInLayout from "@/components/layout/LoggedInLayout";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, collection, query, where, onSnapshot, getFirestore, getDocs, addDoc, orderBy, serverTimestamp, updateDoc, writeBatch } from "firebase/firestore";
import { ArrowLeft, MessageCircle } from "lucide-react";

const db = getFirestore();

interface Connection {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  skills: string[];
  wantsToLearn: string[];
}

interface Message {
  id: string;
  threadId: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  sentAt: any; // Firestore timestamp
  read?: boolean;
}

interface ChatSummary {
  userId: string;
  user: UserProfile;
  lastMessage?: Message;
  unreadCount: number;
  lastMessageTime?: Date;
}

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<UserProfile[]>([]);
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'pending' | 'waiting'>('connected');
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch connections and connected users
  useEffect(() => {
    if (!currentUser) return;

    const fetchConnections = async () => {
      try {
        // Get all connections for current user
        const allConnectionsQuery = query(collection(db, "connections"));
        const connectionsSnapshot = await getDocs(allConnectionsQuery);
        
        const userConnections: Connection[] = [];
        connectionsSnapshot.forEach((doc) => {
          const conn = { id: doc.id, ...doc.data() } as Connection;
          if (conn.user1Id === currentUser.uid || conn.user2Id === currentUser.uid) {
            userConnections.push(conn);
          }
        });
        
        setConnections(userConnections);
        
        // Fetch user profiles for connected users
        const connectedUserIds = userConnections.map(conn => 
          conn.user1Id === currentUser.uid ? conn.user2Id : conn.user1Id
        );
        
        const users: UserProfile[] = [];
        for (const userId of connectedUserIds) {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            users.push({ id: userId, ...userDoc.data() } as UserProfile);
          }
        }
        
        setConnectedUsers(users);
        
        // Listen to all messages for unread counts
        const allMessagesQuery = query(collection(db, "messages"));
        const unsubscribeAllMessages = onSnapshot(allMessagesQuery, (snapshot) => {
          const msgs: Message[] = [];
          snapshot.forEach((doc) => {
            msgs.push({ id: doc.id, ...doc.data() } as Message);
          });
          setAllMessages(msgs);
          
          // Calculate chat summaries with unread counts
          const summaries: ChatSummary[] = users.map(user => {
            const userMessages = msgs.filter(msg => 
              (msg.fromUserId === currentUser.uid && msg.toUserId === user.id) ||
              (msg.fromUserId === user.id && msg.toUserId === currentUser.uid)
            );
            
            const sortedMessages = userMessages.sort((a, b) => {
              const timeA = a.sentAt?.toDate ? a.sentAt.toDate() : new Date(a.sentAt);
              const timeB = b.sentAt?.toDate ? b.sentAt.toDate() : new Date(b.sentAt);
              return timeB.getTime() - timeA.getTime();
            });
            
            const unreadCount = userMessages.filter(msg => 
              msg.fromUserId === user.id && !msg.read
            ).length;
            
            return {
              userId: user.id,
              user,
              lastMessage: sortedMessages[0],
              unreadCount,
              lastMessageTime: sortedMessages[0]?.sentAt?.toDate ? sortedMessages[0].sentAt.toDate() : undefined
            };
          });
          
          // Sort by last message time
          summaries.sort((a, b) => {
            if (!a.lastMessageTime && !b.lastMessageTime) return 0;
            if (!a.lastMessageTime) return 1;
            if (!b.lastMessageTime) return -1;
            return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
          });
          
          setChatSummaries(summaries);
        });
        
        return () => {
          unsubscribeAllMessages();
        };
      } catch (error) {
        console.error("Error fetching connections:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [currentUser]);

  // Individual chat logic when userId is provided
  useEffect(() => {
    if (!currentUser || !userId) return;

    const fetchOtherUser = async () => {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        setOtherUser({ id: userId, ...userDoc.data() } as UserProfile);
      }
    };

    fetchOtherUser();
    setConnectionStatus('connected'); // Assume connected since they're in chat list

    // Create thread ID (consistent ordering)
    const threadId = [currentUser.uid, userId].sort().join('_');

    // Listen for messages in real-time (without orderBy to avoid index requirement)
    const messagesQuery = query(
      collection(db, "messages"),
      where("threadId", "==", threadId)
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, async (snapshot) => {
      const msgs: Message[] = [];
      const batch = writeBatch(db);
      let hasUnreadMessages = false;
      
      snapshot.forEach((docSnap) => {
        const msg = { id: docSnap.id, ...docSnap.data() } as Message;
        msgs.push(msg);
        
        // Mark messages from other user as read
        if (msg.fromUserId === userId && !msg.read) {
          batch.update(doc(db, "messages", docSnap.id), { read: true });
          hasUnreadMessages = true;
        }
      });
      
      // Commit batch update for read status
      if (hasUnreadMessages) {
        try {
          await batch.commit();
        } catch (error) {
          console.error("Error marking messages as read:", error);
        }
      }
      
      // Sort messages by timestamp on the client side
      msgs.sort((a, b) => {
        const timeA = a.sentAt?.toDate ? a.sentAt.toDate() : new Date(a.sentAt);
        const timeB = b.sentAt?.toDate ? b.sentAt.toDate() : new Date(b.sentAt);
        return timeA.getTime() - timeB.getTime();
      });
      setMessages(msgs);
    });

    return () => {
      unsubscribeMessages();
    };
  }, [currentUser, userId]);

  const other = useMemo(() => {
    return otherUser || { name: "User", id: userId };
  }, [userId, otherUser]);

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const [input, setInput] = useState("");

  // Chat list view
  if (!userId) {
    return (
      <LoggedInLayout>
        <div className="container py-8 max-w-2xl">
          <div className="mb-6">
            <h1 className="font-heading text-2xl mb-2">Messages</h1>
            <p className="text-white/70 text-sm">Chat with your connected skill partners</p>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-white/50">Loading your chats...</div>
            </div>
          ) : chatSummaries.length > 0 ? (
            <div className="grid gap-3 sm:gap-4">
              {connectedUsers.map((user) => {
                const lastMessage = chatSummaries.find((chat) => chat.userId === user.id)?.lastMessage;
                const unreadCount = chatSummaries.find((chat) => chat.userId === user.id)?.unreadCount;
                
                return (
                  <div
                    key={user.id}
                    onClick={() => navigate(`/chat/${user.id}`)}
                    className="glass-card p-3 sm:p-4 flex items-center gap-3 sm:gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-praxis-purple to-praxis-blue flex items-center justify-center text-white font-bold text-sm sm:text-base">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-heading text-base sm:text-lg truncate">{user.name}</div>
                        <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-praxis-green flex-shrink-0"></div>
                        <div className="text-xs text-praxis-green hidden sm:block">Online</div>
                      </div>
                      <div className="text-sm text-white/60 truncate">
                        {lastMessage ? lastMessage.text : "Start a conversation"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="text-xs text-white/40">
                        {lastMessage ? new Date(lastMessage.sentAt.toDate ? lastMessage.sentAt.toDate() : lastMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </div>
                      {unreadCount > 0 && (
                        <div className="bg-praxis-green text-black text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full font-bold min-w-[18px] sm:min-w-[20px] text-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-praxis-purple to-praxis-blue flex items-center justify-center text-white font-bold text-sm sm:text-base">
                  💬
                </div>
                <div>
                  <h1 className="font-heading text-xl sm:text-2xl">Chat</h1>
                  <p className="text-white/70 text-xs sm:text-sm">Connect with your skill matches</p>
                </div>
              </div>
              <p className="text-white/70 text-sm">Connect with other users on the Discover page to start chatting!</p>
            </div>
          )}
        </div>
      </LoggedInLayout>
    );
  }

  // Individual chat view
  return (
    <LoggedInLayout>
      <div className="container py-4 px-4 sm:py-8 max-w-2xl">
        <div className="glass-card p-4 sticky top-0 mb-4 backdrop-blur-xl bg-black/60">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <button 
              onClick={() => navigate('/chat')}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-praxis-purple to-praxis-blue flex items-center justify-center text-white font-bold text-sm sm:text-base">
              {otherUser?.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-heading text-base sm:text-lg truncate">{otherUser?.name}</div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-praxis-green"></div>
                <div className="text-xs text-praxis-green">Online</div>
              </div>
            </div>
          </div>
        </div>
        <div ref={listRef} className="space-y-2 sm:space-y-3 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pr-1">
          {connectionStatus === 'connected' ? (
            messages.length > 0 ? messages.map((m, index) => {
              const mine = m.fromUserId === currentUser?.uid;
              const timestamp = m.sentAt?.toDate ? m.sentAt.toDate() : new Date(m.sentAt);
              const showAvatar = index === 0 || messages[index - 1]?.fromUserId !== m.fromUserId;
              
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"} group`}>
                  <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[80%] ${mine ? "flex-row-reverse" : "flex-row"}`}>
                    {!mine && showAvatar && (
                      <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-xl bg-gradient-to-br from-praxis-purple to-praxis-blue flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {otherUser?.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {!mine && !showAvatar && <div className="w-6 sm:w-8" />}
                    
                    <div className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl border transition-all duration-200 hover:scale-[1.02] ${
                      mine 
                        ? "bg-gradient-to-br from-praxis-blue/40 to-praxis-green/40 border-praxis-green/20 shadow-lg" 
                        : "bg-white/10 border-white/10 backdrop-blur-sm"
                    }`}>
                      <div className="text-sm leading-relaxed break-words">{m.text}</div>
                      <div className={`text-[10px] sm:text-xs mt-1 flex items-center gap-1 ${
                        mine ? "text-white/70 justify-end" : "text-white/60"
                      }`}>
                        <span>{timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8">
                <div className="glass-card p-6 max-w-md mx-auto">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-praxis-green to-praxis-blue mx-auto mb-4 flex items-center justify-center text-2xl">
                    🎉
                  </div>
                  <h3 className="font-heading text-lg mb-2">You're Connected!</h3>
                  <p className="text-white/70 text-sm mb-4">
                    You and {other.name} can now start chatting and exchanging skills!
                  </p>
                  <div className="text-white/50 text-xs">Start your conversation below</div>
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <div className="glass-card p-6 max-w-md mx-auto">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-praxis-purple to-praxis-blue mx-auto mb-4 flex items-center justify-center">
                  {connectionStatus === 'pending' ? "⏳" : "👋"}
                </div>
                <h3 className="font-heading text-lg mb-2">
                  {connectionStatus === 'pending' ? "Request Sent!" : "Connection Pending"}
                </h3>
                <p className="text-white/70 text-sm">
                  {connectionStatus === 'pending' 
                    ? `Your connection request has been sent to ${other.name}. They'll need to accept it before you can start chatting.`
                    : `Waiting for ${other.name} to respond to your connection request.`
                  }
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="h-24" />
        {connectionStatus === 'connected' && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const text = input.trim();
              if (!text || !currentUser || !userId) return;

              try {
                // Create thread ID (consistent ordering)
                const threadId = [currentUser.uid, userId].sort().join('_');

                // Send message to Firestore
                await addDoc(collection(db, "messages"), {
                  threadId,
                  fromUserId: currentUser.uid,
                  toUserId: userId,
                  text,
                  sentAt: serverTimestamp()
                });

                setInput("");
              } catch (error) {
                console.error("Error sending message:", error);
              }
            }}
            className="fixed z-50 bottom-[76px] left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:w-[640px] px-4"
          >
            <div className="glass-card flex items-center gap-3 p-3 focus-within:ring-2 focus-within:ring-praxis-blue/50 transition-all duration-200">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-transparent outline-none px-3 py-2 text-sm placeholder:text-white/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const form = e.currentTarget.closest('form');
                    if (form) {
                      const event = new Event('submit', { bubbles: true, cancelable: true });
                      form.dispatchEvent(event);
                    }
                  }
                }}
              />
              <button 
                type="submit" 
                disabled={!input.trim()}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  input.trim() 
                    ? 'bg-gradient-to-r from-praxis-blue to-praxis-green text-white hover:scale-105 active:scale-95 shadow-lg' 
                    : 'bg-white/10 text-white/50 cursor-not-allowed'
                }`}
              >
                Send
              </button>
            </div>
          </form>
        )}
      </div>
    </LoggedInLayout>
  );
}
