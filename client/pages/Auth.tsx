import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SkillSelector from "@/components/ui/SkillSelector";

// Firebase import
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { doc, setDoc, getDoc, getFirestore } from "firebase/firestore";
import { auth } from "../lib/firebase";

const db = getFirestore();

export default function Auth() {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [wantsToLearn, setWantsToLearn] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);

  const { currentUser } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (currentUser) {
      nav("/dashboard");
    }
  }, [currentUser, nav]);

  // Check for redirect result on component mount
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          console.log("Redirect result received:", user.email);
          
          // Handle user profile creation/update same as popup flow
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (!userData.skills?.length && !userData.wantsToLearn?.length) {
              nav("/onboarding");
              return;
            }
          } else {
            await setDoc(userDocRef, {
              name: user.displayName || "Google User",
              email: user.email || "",
              bio: "",
              skills: [],
              wantsToLearn: [],
              createdAt: new Date().toISOString(),
              profileComplete: false,
            });
            nav("/onboarding");
            return;
          }
          
          toast.success("Successfully signed in with Google!");
        }
      } catch (error: any) {
        console.error("Redirect result error:", error);
        if (error.code !== "auth/no-redirect-result") {
          toast.error(`Sign-in error: ${error.message}`);
        }
      } finally {
        setIsCheckingRedirect(false);
      }
    };

    checkRedirectResult();
  }, [nav]);

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      toast.error("Please fill all the required fields.");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Save user profile data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        bio: "",
        skills: skills,
        wantsToLearn: wantsToLearn,
        createdAt: new Date().toISOString(),
      });
      
      toast.success("Account created successfully! Let's get started.");
    } catch(error: any) {
      if (error.code === "auth/email-already-in-use") {
        toast.error("This email is already in use.");
      } else if (error.code === "auth/weak-password") {
        toast.error("Password must be at least 6 characters long.");
      } else {
        toast.error("Failed to create an account.");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome Back!");
    } catch (error: any) {
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        toast.error("Invalid email or password.");
      } else {
        toast.error("Failed to log in.");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Detect if user is on mobile device
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768);
  };

  // Google login handler with mobile-first approach
  const handleGoogleLogin = async () => {
    if (loading || isCheckingRedirect) return;
    
    setLoading(true);
    
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    try {
      
      // Use redirect for mobile devices, popup for desktop
      if (isMobile()) {
        console.log("Using redirect method for mobile device");
        await signInWithRedirect(auth, provider);
        // The redirect will handle the rest, component will remount
        return;
      } else {
        console.log("Using popup method for desktop");
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Handle user profile creation/update
        await handleGoogleUserProfile(user);
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      if (error.code === "auth/popup-closed-by-user") {
        toast.error("Sign-in cancelled.");
      } else if (error.code === "auth/popup-blocked") {
        toast.error("Pop-up blocked. Trying redirect method...");
        // Fallback to redirect if popup is blocked
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError: any) {
          console.error("Redirect fallback failed:", redirectError);
          toast.error("Failed to sign in. Please try again.");
        }
      } else if (error.code === "auth/configuration-not-found") {
        toast.error("Firebase configuration error. Please check your setup.");
      } else if (error.code === "auth/invalid-api-key") {
        toast.error("Invalid Firebase API key.");
      } else if (error.code === "auth/unauthorized-domain") {
        toast.error("This domain is not authorized for Google sign-in.");
      } else {
        toast.error(`Failed to sign in with Google: ${error.code || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle Google user profile creation/update
  const handleGoogleUserProfile = async (user: any) => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // If user has no skills or learning goals, they need onboarding
        if (!userData.skills?.length && !userData.wantsToLearn?.length) {
          nav("/onboarding");
          return;
        }
      } else {
        // New user - create basic profile and redirect to onboarding
        await setDoc(userDocRef, {
          name: user.displayName || "Google User",
          email: user.email || "",
          bio: "",
          skills: [],
          wantsToLearn: [],
          createdAt: new Date().toISOString(),
          profileComplete: false,
        });
        nav("/onboarding");
        return;
      }
      
      toast.success("Successfully signed in with Google!");
      nav("/dashboard");
    } catch (error: any) {
      console.error("Error handling Google user profile:", error);
      toast.error("Error setting up your profile. Please try again.");
    }
  };

  // The missing handleSubmit function
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === "signup") {
      handleSignUp();
    } else {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center px-3 py-4 sm:px-4 sm:py-8">
        <div className="w-full max-w-md glass-card p-4 sm:p-8">
          <div className="text-center mb-4 sm:mb-6">
            <div className="h-10 w-10 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-praxis-purple to-praxis-blue mx-auto mb-3 sm:mb-4" />
            <h1 className="font-heading text-lg sm:text-2xl mb-2">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-white/70 text-sm">Connect, learn, and grow together</p>
          </div>
          <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-3 sm:px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-praxis-purple mobile-tap min-h-[44px]"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-3 sm:px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-praxis-purple mobile-tap min-h-[44px]"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-3 sm:px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-praxis-purple mobile-tap min-h-[44px]"
                      placeholder="Create a password"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <SkillSelector
                      selectedSkills={skills}
                      onSkillsChange={setSkills}
                      label="Skills you can teach"
                      placeholder="Type to search skills..."
                      maxSkills={8}
                    />
                    <SkillSelector
                      selectedSkills={wantsToLearn}
                      onSkillsChange={setWantsToLearn}
                      label="What you want to learn"
                      placeholder="Type to search skills..."
                      maxSkills={8}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 disabled:opacity-50 mobile-tap"
                >
                  {loading ? "Creating account..." : "Sign Up"}
                </button>
              </>
            )}
            {mode === "login" && (
              <>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-3 sm:px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-praxis-purple mobile-tap min-h-[44px]"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-3 sm:px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-praxis-purple mobile-tap min-h-[44px]"
                      placeholder="Your password"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 disabled:opacity-50 mobile-tap"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </>
            )}
          </form>
          
          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-black px-3 text-white/60">Or continue with</span>
            </div>
          </div>
          
          <div className="mt-4 sm:mt-6 text-center">
            <button
              onClick={handleGoogleLogin}
              disabled={loading || isCheckingRedirect}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors disabled:opacity-50 mobile-tap min-h-[44px]"
            >
              <div className="h-4 w-4 sm:h-5 sm:w-5 bg-gradient-to-br from-red-500 to-yellow-500 rounded" />
              <span className="text-sm sm:text-base">
                {isCheckingRedirect ? "Checking sign-in..." : loading ? "Signing in..." : "Continue with Google"}
              </span>
            </button>
          </div>

          <div className="mt-4 sm:mt-6 text-center">
            <button
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              className="text-praxis-blue hover:text-praxis-green transition-colors text-sm sm:text-base mobile-tap py-2"
            >
              {mode === "signup" ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}