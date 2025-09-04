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
      <div className="container py-8 max-w-2xl">
        <h1 className="font-heading text-2xl">Profile Settings</h1>
        <p className="mt-2 text-white/70">Update your profile information</p>
        
        <form onSubmit={handleSubmit} className="mt-6 glass-card p-6 grid gap-6">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-white/80">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-praxis-blue"
              placeholder="Your display name"
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-white/80">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-praxis-blue resize-none"
              placeholder="Tell others about yourself..."
              rows={3}
            />
          </div>

          <SkillSelector
            selectedSkills={skills}
            onSkillsChange={setSkills}
            label="Skills you can teach"
            placeholder="Type to search skills..."
            maxSkills={10}
          />
          <p className="text-xs text-white/50 -mt-4">What skills can you share with others?</p>

          <SkillSelector
            selectedSkills={wantsToLearn}
            onSkillsChange={setWantsToLearn}
            label="What you want to learn"
            placeholder="Type to search skills..."
            maxSkills={10}
          />
          <p className="text-xs text-white/50 -mt-4">What would you like to learn from others?</p>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        <div className="mt-6 glass-card p-6">
          <h2 className="font-heading text-lg mb-4">Account Information</h2>
          <div className="grid gap-3">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Email</span>
              <span className="text-sm">{currentUser?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Account Created</span>
              <span className="text-sm">
                {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : "Unknown"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </LoggedInLayout>
  );
}
