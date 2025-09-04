import LoggedInLayout from "@/components/layout/LoggedInLayout";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, collection, getDocs, getFirestore, addDoc, query, where, onSnapshot, updateDoc, deleteDoc } from "firebase/firestore";

const db = getFirestore();

interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  skills: string[];
  wantsToLearn: string[];
  createdAt: string;
}

interface MatchedUser {
  id: string;
  name: string;
  bio: string;
  skills: string[];
  wantsToLearn: string[];
  matchScore: number;
  commonSkills: string[];
}

interface ConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

interface Connection {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
}

export default function Dashboard() {
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [passedUsers, setPassedUsers] = useState<string[]>([]);
  const { currentUser } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    const fetchUserProfileAndMatches = async () => {
      if (!currentUser) return;
      
      try {
        // Fetch current user profile
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = { id: currentUser.uid, ...userDoc.data() } as UserProfile;
          setUserProfile(userData);
          
          // Fetch all other users for matching
          const usersSnapshot = await getDocs(collection(db, "users"));
          const allUsers: UserProfile[] = [];
          
          usersSnapshot.forEach((doc) => {
            if (doc.id !== currentUser.uid) { // Exclude current user
              allUsers.push({ id: doc.id, ...doc.data() } as UserProfile);
            }
          });
          
          // Calculate matches based on skills
          const matches = calculateMatches(userData, allUsers);
          setMatchedUsers(matches);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfileAndMatches();
    
    // Listen for connections, requests, and passed users
    if (!currentUser) return;

    // Listen for connections
    const connectionsQuery = query(collection(db, "connections"));
    const unsubscribeConnections = onSnapshot(connectionsQuery, (snapshot) => {
      const allConnections: Connection[] = [];
      snapshot.forEach((doc) => {
        allConnections.push({ id: doc.id, ...doc.data() } as Connection);
      });
      
      // Filter connections involving current user
      const userConnections = allConnections.filter(conn => 
        conn.user1Id === currentUser.uid || conn.user2Id === currentUser.uid
      );
      
      setConnections(userConnections);
    });

    // Listen for connection requests
    const requestsQuery = query(
      collection(db, "connectionRequests"),
      where("toUserId", "==", currentUser.uid),
      where("status", "==", "pending")
    );
    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requests: ConnectionRequest[] = [];
      snapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() } as ConnectionRequest);
      });
      setConnectionRequests(requests);
    });

    // Listen for passed users
    const passedQuery = query(
      collection(db, "passedUsers"),
      where("userId", "==", currentUser.uid)
    );
    const unsubscribePassed = onSnapshot(passedQuery, (snapshot) => {
      const passed: string[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        passed.push(data.passedUserId);
      });
      setPassedUsers(passed);
    });

    return () => {
      unsubscribeConnections();
      unsubscribeRequests();
      unsubscribePassed();
    };
  }, [currentUser]);

  // Recalculate matches when connections or requests change
  useEffect(() => {
    if (userProfile && matchedUsers.length > 0) {
      const fetchAndRecalculate = async () => {
        try {
          const usersSnapshot = await getDocs(collection(db, "users"));
          const allUsers: UserProfile[] = [];
          
          usersSnapshot.forEach((doc) => {
            if (doc.id !== currentUser?.uid) {
              allUsers.push({ id: doc.id, ...doc.data() } as UserProfile);
            }
          });
          
          const matches = calculateMatches(userProfile, allUsers);
          setMatchedUsers(matches);
        } catch (error) {
          console.error("Error recalculating matches:", error);
        }
      };
      
      fetchAndRecalculate();
    }
  }, [connections, connectionRequests, userProfile, currentUser]);

  const calculateMatches = (currentUser: UserProfile, allUsers: UserProfile[]): MatchedUser[] => {
    return allUsers
      .map(user => {
        // Find skills that current user wants to learn and this user can teach
        const teachingMatches = currentUser.wantsToLearn?.filter(skill => 
          user.skills?.includes(skill)
        ) || [];
        
        // Find skills that this user wants to learn and current user can teach
        const learningMatches = user.wantsToLearn?.filter(skill => 
          currentUser.skills?.includes(skill)
        ) || [];
        
        const commonSkills = [...new Set([...teachingMatches, ...learningMatches])];
        
        const matchScore = teachingMatches.length + learningMatches.length;
        
        return {
          id: user.id,
          name: user.name,
          bio: user.bio || "No bio available",
          skills: user.skills || [],
          wantsToLearn: user.wantsToLearn || [],
          matchScore,
          commonSkills
        };
      })
      .filter(match => match.matchScore > 0) // Only show users with at least one match
      .sort((a, b) => b.matchScore - a.matchScore) // Sort by match score descending
      .slice(0, 20); // Get more matches since we'll filter in render
  };

  const onPass = async (id: string) => {
    if (!currentUser) return;
    
    try {
      // Add to passed users collection in Firestore
      await addDoc(collection(db, "passedUsers"), {
        userId: currentUser.uid,
        passedUserId: id,
        createdAt: new Date().toISOString()
      });
      
      // Update local state
      setPassedUsers(prev => [...prev, id]);
      setMatchedUsers((prev) => prev.filter((u) => u.id !== id));
      toast("Passed");
    } catch (error) {
      console.error("Error recording passed user:", error);
      toast.error("Failed to pass user");
    }
  };
  
  const onLike = async (id: string) => {
    if (!currentUser) return;
    
    try {
      // Check if there's already a connection request from the other user to us
      const existingRequestQuery = query(
        collection(db, "connectionRequests"),
        where("fromUserId", "==", id),
        where("toUserId", "==", currentUser.uid),
        where("status", "==", "pending")
      );
      
      const existingRequestSnapshot = await getDocs(existingRequestQuery);
      
      if (!existingRequestSnapshot.empty) {
        // They already sent us a request, so this creates a mutual match
        const requestDoc = existingRequestSnapshot.docs[0];
        
        // Create connection
        await addDoc(collection(db, "connections"), {
          user1Id: id,
          user2Id: currentUser.uid,
          createdAt: new Date().toISOString()
        });
        
        // Delete the pending request
        await deleteDoc(doc(db, "connectionRequests", requestDoc.id));
        
        toast.success("It's a match! 🎉");
        nav("/chat", { state: { withUserId: id } });
      } else {
        // Check if we already sent them a request
        const ourRequestQuery = query(
          collection(db, "connectionRequests"),
          where("fromUserId", "==", currentUser.uid),
          where("toUserId", "==", id),
          where("status", "==", "pending")
        );
        
        const ourRequestSnapshot = await getDocs(ourRequestQuery);
        
        if (!ourRequestSnapshot.empty) {
          toast("You've already sent a request to this person!");
          return;
        }
        
        // Create new connection request
        await addDoc(collection(db, "connectionRequests"), {
          fromUserId: currentUser.uid,
          toUserId: id,
          status: "pending",
          createdAt: new Date().toISOString()
        });
        
        toast.success("Request sent! 📤");
        nav("/chat", { state: { withUserId: id, status: "pending" } });
      }
    } catch (error) {
      console.error("Error creating connection request:", error);
      toast.error("Failed to send request");
    }
  };

  const acceptRequest = async (requestId: string, fromUserId: string) => {
    if (!currentUser) return;
    
    try {
      // Create connection
      await addDoc(collection(db, "connections"), {
        user1Id: fromUserId,
        user2Id: currentUser.uid,
        createdAt: new Date().toISOString()
      });
      
      // Delete the request
      await deleteDoc(doc(db, "connectionRequests", requestId));
      
      toast.success("Connection accepted! 🎉");
      
      // Navigate to chat with the newly connected user
      nav(`/chat/${fromUserId}`);
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Failed to accept request");
    }
  };

  const declineRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, "connectionRequests", requestId));
      toast("Request declined");
    } catch (error) {
      console.error("Error declining request:", error);
      toast.error("Failed to decline request");
    }
  };

  return (
    <LoggedInLayout>
      <div className="container py-3 px-3 sm:py-8 sm:px-4">
        {userProfile && (
          <div className="mb-4 sm:mb-8 glass-card p-3 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-praxis-purple to-praxis-blue flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="font-heading text-base sm:text-xl truncate">Welcome back, {userProfile.name}!</h1>
                <p className="text-white/70 text-xs sm:text-sm truncate">{userProfile.email}</p>
              </div>
            </div>
            
            <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
              <div>
                <div className="text-xs sm:text-sm text-white/60 mb-2">Your Skills</div>
                <div className="mobile-scroll">
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 min-w-0">
                    {userProfile.skills.length > 0 ? (
                      userProfile.skills.map((skill, index) => (
                        <span key={`my-skill-${index}`} className="px-2 py-1 rounded-md bg-praxis-green/20 border border-praxis-green/40 text-xs text-praxis-green whitespace-nowrap">{skill}</span>
                      ))
                    ) : (
                      <span className="text-white/40 text-xs">No skills added yet</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-xs sm:text-sm text-white/60 mb-2">Want to Learn</div>
                <div className="mobile-scroll">
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 min-w-0">
                    {userProfile.wantsToLearn.length > 0 ? (
                      userProfile.wantsToLearn.map((skill, index) => (
                        <span key={`my-learn-${index}`} className="px-2 py-1 rounded-md bg-praxis-blue/20 border border-praxis-blue/40 text-xs text-praxis-blue whitespace-nowrap">{skill}</span>
                      ))
                    ) : (
                      <span className="text-white/40 text-xs">No learning goals added yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Connection Requests Section */}
        {connectionRequests.length > 0 && (
          <div className="mb-4 sm:mb-8">
            <h2 className="font-heading text-lg sm:text-2xl mb-3 sm:mb-4">Connection Requests</h2>
            <div className="space-y-3 sm:space-y-4">
              {connectionRequests.map((request) => (
                <div key={request.id} className="glass-card p-3 sm:p-4">
                  <div className="flex items-center gap-3 mb-3 sm:mb-0">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-praxis-purple to-praxis-blue flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                      ?
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-heading text-sm sm:text-lg">Someone wants to connect!</div>
                      <div className="text-xs text-white/60">Tap accept to start chatting</div>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <button 
                      className="btn-secondary px-4 py-2 text-sm flex-1 mobile-tap" 
                      onClick={() => declineRequest(request.id)}
                    >
                      Decline
                    </button>
                    <button 
                      className="btn-primary px-4 py-2 text-sm flex-1 mobile-tap" 
                      onClick={() => acceptRequest(request.id, request.fromUserId)}
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        
        <h2 className="font-heading text-lg sm:text-2xl">Discover</h2>
        <p className="mt-2 text-white/70 text-sm sm:text-base">
          {loading ? "Finding your perfect skill matches..." : 
           matchedUsers.length > 0 ? "Swipe or say hi to users who match your skills" :
           "No skill matches found. Try adding more skills in your profile!"}
        </p>
        
        {loading ? (
          <div className="mt-4 text-center">
            <div className="text-white/50 text-sm">Loading matches...</div>
          </div>
        ) : (
          <div className="mt-3 sm:mt-6">
            {/* Mobile: Single column with better spacing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              <AnimatePresence initial={false}>
                {matchedUsers.filter((u) => {
                  // Filter out users who are already connected
                  const isConnected = connections.some(conn => 
                    (conn.user1Id === currentUser?.uid && conn.user2Id === u.id) ||
                    (conn.user2Id === currentUser?.uid && conn.user1Id === u.id)
                  );
                  
                  // Filter out users with pending requests (both directions)
                  const hasPendingRequest = connectionRequests.some(req => 
                    (req.fromUserId === currentUser?.uid && req.toUserId === u.id) ||
                    (req.fromUserId === u.id && req.toUserId === currentUser?.uid)
                  );
                  
                  // Filter out users who have been passed
                  const isPassed = passedUsers.includes(u.id);
                  
                  return !isConnected && !hasPendingRequest && !isPassed;
                }).map((u) => (
                  <motion.div
                    layout
                    key={u.id}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.x > 100) onLike(u.id);
                      else if (info.offset.x < -100) onPass(u.id);
                    }}
                    whileHover={{ y: -2 }}
                    className="glass-card p-3 sm:p-5 flex flex-col transition-transform mobile-tap"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-praxis-purple to-praxis-blue flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-heading text-sm sm:text-lg truncate">{u.name}</div>
                        <div className="text-xs text-white/60 truncate">{u.bio}</div>
                      </div>
                    </div>
                    
                    <div className="mt-2 sm:mt-3 flex items-center gap-2">
                      <div className="text-xs text-praxis-green">Score: {u.matchScore}</div>
                      <div className="text-xs text-white/40">•</div>
                      <div className="text-xs text-white/60">{u.commonSkills.length} skills</div>
                    </div>
                    
                    <div className="mt-3 sm:mt-4 text-xs text-white/60">Can teach you</div>
                    <div className="mt-1 mobile-scroll">
                      <div className="flex flex-wrap gap-1.5 min-w-0">
                        {u.skills.filter(skill => userProfile?.wantsToLearn.includes(skill)).slice(0, 3).map((skill) => (
                          <span key={`${u.id}-teach-${skill}`} className="px-2 py-1 rounded-md bg-praxis-green/20 border border-praxis-green/40 text-xs text-praxis-green whitespace-nowrap">{skill}</span>
                        ))}
                        {u.skills.filter(skill => userProfile?.wantsToLearn.includes(skill)).length > 3 && (
                          <span className="text-xs text-white/40">+{u.skills.filter(skill => userProfile?.wantsToLearn.includes(skill)).length - 3}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2 sm:mt-3 text-xs text-white/60">Wants to learn from you</div>
                    <div className="mt-1 mobile-scroll">
                      <div className="flex flex-wrap gap-1.5 min-w-0">
                        {u.wantsToLearn.filter(skill => userProfile?.skills.includes(skill)).slice(0, 3).map((skill) => (
                          <span key={`${u.id}-learn-${skill}`} className="px-2 py-1 rounded-md bg-praxis-blue/20 border border-praxis-blue/40 text-xs text-praxis-blue whitespace-nowrap">{skill}</span>
                        ))}
                        {u.wantsToLearn.filter(skill => userProfile?.skills.includes(skill)).length > 3 && (
                          <span className="text-xs text-white/40">+{u.wantsToLearn.filter(skill => userProfile?.skills.includes(skill)).length - 3}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 sm:mt-5 flex gap-2 sm:gap-3">
                      <button className="btn-secondary flex-1 text-sm py-2 mobile-tap" onClick={() => onPass(u.id)}>Pass</button>
                      <button className="btn-primary flex-1 text-sm py-2 mobile-tap" onClick={() => onLike(u.id)}>Say hi</button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </LoggedInLayout>
  );
}
