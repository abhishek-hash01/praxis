import LoggedInLayout from "@/components/layout/LoggedInLayout";
import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc, getFirestore } from "firebase/firestore";
import { toast } from "sonner";
import SkillSelector from "@/components/ui/SkillSelector";

const db = getFirestore();

interface UserProfile {
  name: string;
  email: string;
  bio: string;
  skills: string[];
  wantsToLearn: string[];
  createdAt: string;
}

export default function Settings() {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [wantsToLearn, setWantsToLearn] = useState<string[]>([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          setUserProfile(userData);
          setName(userData.name);
          setBio(userData.bio || "");
          setSkills(userData.skills || []);
          setWantsToLearn(userData.wantsToLearn || []);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        name: name.trim(),
        bio: bio.trim(),
        skills: skills,
        wantsToLearn: wantsToLearn,
      });
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LoggedInLayout>
        <div className="container py-8 max-w-2xl">
          <div className="text-center">Loading settings...</div>
        </div>
      </LoggedInLayout>
    );
  }

  return (
    <LoggedInLayout>
      <div className="container py-3 px-3 sm:py-8 sm:px-4 max-w-2xl mx-auto">
        <h1 className="font-heading text-lg sm:text-2xl">Profile Settings</h1>
        <p className="mt-2 text-white/70 text-sm sm:text-base">Update your profile information</p>
        
        <form onSubmit={handleSubmit} className="mt-4 sm:mt-6 glass-card p-3 sm:p-6 space-y-4 sm:space-y-6 w-full min-w-0">
          <div className="space-y-2 w-full">
            <label className="text-sm font-medium text-white/80">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 sm:px-4 outline-none focus:ring-2 focus:ring-praxis-blue mobile-tap min-h-[44px] text-sm sm:text-base"
              placeholder="Your display name"
              required
            />
          </div>

          <div className="space-y-2 w-full">
            <label className="text-sm font-medium text-white/80">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 sm:px-4 outline-none focus:ring-2 focus:ring-praxis-blue resize-none mobile-tap text-sm sm:text-base"
              placeholder="Tell others about yourself..."
              rows={3}
            />
          </div>

          <div className="w-full">
            <SkillSelector
              selectedSkills={skills}
              onSkillsChange={setSkills}
              label="Skills you can teach"
              placeholder="Type to search skills..."
              maxSkills={10}
            />
            <p className="text-xs text-white/50 mt-1">What skills can you share with others?</p>
          </div>

          <div className="w-full">
            <SkillSelector
              selectedSkills={wantsToLearn}
              onSkillsChange={setWantsToLearn}
              label="What you want to learn"
              placeholder="Type to search skills..."
              maxSkills={10}
            />
            <p className="text-xs text-white/50 mt-1">What would you like to learn from others?</p>
          </div>

          <div className="pt-2 sm:pt-4 w-full">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full mobile-tap"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        <div className="mt-4 sm:mt-6 glass-card p-3 sm:p-6 w-full min-w-0">
          <h2 className="font-heading text-base sm:text-lg mb-3 sm:mb-4">Account Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center gap-2">
              <span className="text-white/70 text-sm">Email</span>
              <span className="text-xs sm:text-sm truncate max-w-[60%]">{currentUser?.email}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-white/70 text-sm">Account Created</span>
              <span className="text-xs sm:text-sm">
                {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : "Unknown"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </LoggedInLayout>
  );
}
