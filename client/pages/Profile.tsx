import LoggedInLayout from "@/components/layout/LoggedInLayout";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { doc, getDoc, getFirestore, collection, query, onSnapshot } from "firebase/firestore";

const db = getFirestore();

interface UserProfile {
  name: string;
  email: string;
  bio: string;
  skills: string[];
  wantsToLearn: string[];
  createdAt: string;
}

interface Connection {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
}

export default function Profile() {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [connectionCount, setConnectionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  // Listen for real-time connection updates
  useEffect(() => {
    if (!currentUser) return;

    const connectionsQuery = query(collection(db, "connections"));
    const unsubscribe = onSnapshot(connectionsQuery, (snapshot) => {
      const allConnections: Connection[] = [];
      snapshot.forEach((doc) => {
        allConnections.push({ id: doc.id, ...doc.data() } as Connection);
      });
      
      // Count connections involving current user
      const userConnections = allConnections.filter(conn => 
        conn.user1Id === currentUser.uid || conn.user2Id === currentUser.uid
      );
      
      setConnectionCount(userConnections.length);
    });

    return () => unsubscribe();
  }, [currentUser]);
  if (loading) {
    return (
      <LoggedInLayout>
        <div className="container py-8 max-w-3xl">
          <div className="text-center">Loading profile...</div>
        </div>
      </LoggedInLayout>
    );
  }

  if (!userProfile) {
    return (
      <LoggedInLayout>
        <div className="container py-8 max-w-3xl">
          <div className="text-center">Profile not found</div>
        </div>
      </LoggedInLayout>
    );
  }

  return (
    <LoggedInLayout>
      <div className="container py-4 px-4 sm:py-8 max-w-3xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-praxis-purple to-praxis-blue" />
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-xl sm:text-2xl truncate">{userProfile.name}</h1>
            <p className="text-white/70 text-sm sm:text-base truncate">{userProfile.bio || "No bio yet"}</p>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="glass-card p-4 sm:p-5">
            <div className="text-xs sm:text-sm text-white/60">Teaches</div>
            <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
              {userProfile.skills.length > 0 ? (
                userProfile.skills.map((skill, index) => (
                  <span key={`skill-${index}`} className="px-2 py-1 rounded-md bg-white/10 border border-white/10 text-xs">{skill}</span>
                ))
              ) : (
                <span className="text-white/40 text-xs">No skills added yet</span>
              )}
            </div>
          </div>
          <div className="glass-card p-4 sm:p-5">
            <div className="text-xs sm:text-sm text-white/60">Wants to learn</div>
            <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
              {userProfile.wantsToLearn.length > 0 ? (
                userProfile.wantsToLearn.map((skill, index) => (
                  <span key={`learn-${index}`} className="px-2 py-1 rounded-md bg-white/10 border border-white/10 text-xs">{skill}</span>
                ))
              ) : (
                <span className="text-white/40 text-xs">No learning goals added yet</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4">
          <div className="glass-card p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl font-heading">{connectionCount}</div>
            <div className="text-xs text-white/60">Connections</div>
          </div>
          <div className="glass-card p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl font-heading">{userProfile.skills.length}</div>
            <div className="text-xs text-white/60">Skills I Teach</div>
          </div>
        </div>
      </div>
    </LoggedInLayout>
  );
}
