import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { useState, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { doc, updateDoc, getFirestore } from "firebase/firestore";
import SkillSelector from "@/components/ui/SkillSelector";

const db = getFirestore();

export default function Onboarding() {
  const [skills, setSkills] = useState<string[]>([]);
  const [wantsToLearn, setWantsToLearn] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { currentUser } = useAuth();
  const nav = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error("Please sign in first");
      return;
    }

    setLoading(true);
    
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        skills: skills,
        wantsToLearn: wantsToLearn,
        profileComplete: true,
      });
      
      toast.success("Profile completed! Welcome to Praxis!");
      nav("/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipForNow = () => {
    toast.info("You can add skills later in your profile");
    nav("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container py-12 md:py-20">
        <div className="max-w-xl mx-auto glass-card p-6 md:p-8">
          <div className="text-center mb-6">
            <h1 className="font-heading text-2xl">Complete Your Profile</h1>
            <p className="mt-2 text-white/70">Tell us about your skills and what you'd like to learn</p>
          </div>
          
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <SkillSelector
              selectedSkills={skills}
              onSkillsChange={setSkills}
              label="Skills you can teach"
              placeholder="Type to search skills..."
              maxSkills={8}
            />
            <p className="text-xs text-white/50 -mt-2">What skills can you share with others?</p>
            
            <SkillSelector
              selectedSkills={wantsToLearn}
              onSkillsChange={setWantsToLearn}
              label="What you want to learn"
              placeholder="Type to search skills..."
              maxSkills={8}
            />
            <p className="text-xs text-white/50 -mt-2">What would you like to learn from others?</p>
            
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={handleSkipForNow}
                className="btn-secondary w-full"
                disabled={loading}
              >
                Skip for now
              </button>
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                {loading ? "Saving..." : "Complete Profile"}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-white/50">
              You can always update your skills later in your profile settings
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
