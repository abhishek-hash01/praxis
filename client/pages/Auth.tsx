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
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { auth } from "../lib/firebase";

const db = getFirestore();

export default function Auth() {
  const [mode, setMode] = useState<"signup" | "login" | "reset">("signup");
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [wantsToLearn, setWantsToLearn] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { currentUser } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (currentUser) {
      nav("/dashboard");
    }
  }, [currentUser, nav]);

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
      console.error("Signup error:", error);
      
      switch (error.code) {
        case "auth/email-already-in-use":
          toast.error("An account with this email already exists. Please try logging in instead.");
          break;
        case "auth/weak-password":
          toast.error("Password is too weak. Please use at least 6 characters with a mix of letters and numbers.");
          break;
        case "auth/invalid-email":
          toast.error("Please enter a valid email address.");
          break;
        case "auth/operation-not-allowed":
          toast.error("Email/password accounts are not enabled. Please contact support.");
          break;
        case "auth/too-many-requests":
          toast.error("Too many failed attempts. Please try again later.");
          break;
        case "auth/network-request-failed":
          toast.error("Network error. Please check your internet connection and try again.");
          break;
        default:
          toast.error(`Failed to create account: ${error.message || 'Unknown error occurred'}`);
      }
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
      toast.success("Welcome back! 🎉");
    } catch (error: any) {
      console.error("Login error:", error);
      
      switch (error.code) {
        case "auth/user-not-found":
          toast.error("No account found with this email. Please check your email or sign up.");
          break;
        case "auth/wrong-password":
        case "auth/invalid-credential":
          toast.error("Incorrect password. Please try again or reset your password.");
          break;
        case "auth/invalid-email":
          toast.error("Please enter a valid email address.");
          break;
        case "auth/user-disabled":
          toast.error("This account has been disabled. Please contact support.");
          break;
        case "auth/too-many-requests":
          toast.error("Too many failed login attempts. Please try again later or reset your password.");
          break;
        case "auth/network-request-failed":
          toast.error("Network error. Please check your internet connection and try again.");
          break;
        case "auth/internal-error":
          toast.error("An internal error occurred. Please try again.");
          break;
        default:
          toast.error(`Login failed: ${error.message || 'Please check your credentials and try again'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast.error("Please enter your email address to reset your password.");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin + '/auth',
        handleCodeInApp: false,
      });
      toast.success("Password reset email sent! Check your inbox and spam folder. The email may take a few minutes to arrive.");
      console.log("Password reset email sent successfully to:", email);
      setMode("login"); // Switch back to login mode
    } catch (error: any) {
      console.error("Password reset error:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        email: email,
        authDomain: auth.config.authDomain
      });
      
      switch (error.code) {
        case "auth/user-not-found":
          toast.error("No account found with this email address. Please check your email or sign up.");
          break;
        case "auth/invalid-email":
          toast.error("Please enter a valid email address.");
          break;
        case "auth/too-many-requests":
          toast.error("Too many password reset requests. Please wait before trying again.");
          break;
        case "auth/network-request-failed":
          toast.error("Network error. Please check your internet connection and try again.");
          break;
        case "auth/configuration-not-found":
          toast.error("Email configuration not found. Please contact support.");
          break;
        default:
          toast.error(`Failed to send reset email: ${error.message || 'Please try again'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!name.trim()) {
        toast.error("Please enter your full name to continue.");
        return;
      }
      if (name.trim().length < 2) {
        toast.error("Please enter a valid name (at least 2 characters).");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!email.trim()) {
        toast.error("Please enter your email address.");
        return;
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        toast.error("Please enter a valid email address.");
        return;
      }
      
      if (!password.trim()) {
        toast.error("Please create a password.");
        return;
      }
      
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters long.");
        return;
      }
      
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === "signup") {
      if (currentStep < 3) {
        handleNextStep();
      } else {
        handleSignUp();
      }
    } else if (mode === "login") {
      handleLogin();
    } else if (mode === "reset") {
      handlePasswordReset();
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setName("");
    setEmail("");
    setPassword("");
    setSkills([]);
    setWantsToLearn([]);
  };

  const handleModeChange = () => {
    resetForm();
    setMode(mode === "signup" ? "login" : mode === "login" ? "reset" : "signup");
  };

  const renderSignupStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="flex justify-center space-x-2 mb-4">
                <div className="w-8 h-2 bg-praxis-purple rounded-full"></div>
                <div className="w-8 h-2 bg-white/20 rounded-full"></div>
                <div className="w-8 h-2 bg-white/20 rounded-full"></div>
              </div>
              <h2 className="text-xl font-semibold mb-2">Let's start with your name</h2>
              <p className="text-white/70 text-sm">What should we call you?</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-3 sm:px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-praxis-purple mobile-tap min-h-[44px]"
                placeholder="Enter your full name"
                required
                autoFocus
              />
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="flex justify-center space-x-2 mb-4">
                <div className="w-8 h-2 bg-praxis-purple rounded-full"></div>
                <div className="w-8 h-2 bg-praxis-purple rounded-full"></div>
                <div className="w-8 h-2 bg-white/20 rounded-full"></div>
              </div>
              <h2 className="text-xl font-semibold mb-2">Account credentials</h2>
              <p className="text-white/70 text-sm">Set up your email and password</p>
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
                placeholder="Create a secure password"
                required
              />
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="flex justify-center space-x-2 mb-4">
                <div className="w-8 h-2 bg-praxis-purple rounded-full"></div>
                <div className="w-8 h-2 bg-praxis-purple rounded-full"></div>
                <div className="w-8 h-2 bg-praxis-purple rounded-full"></div>
              </div>
              <h2 className="text-xl font-semibold mb-2">Skills & Learning</h2>
              <p className="text-white/70 text-sm">Tell us about your expertise and interests</p>
            </div>
            <div className="space-y-4">
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
        );
      
      default:
        return null;
    }
  };

  const renderResetStep = () => {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">Reset Password</h2>
          <p className="text-white/70 text-sm">Enter your email to reset your password</p>
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
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center px-3 py-4 sm:px-4 sm:py-8">
        <div className="w-full max-w-md glass-card p-4 sm:p-8">
          <div className="text-center mb-4 sm:mb-6">
            <img 
              src="/logo.png" 
              alt="Praxis Logo" 
              className="h-10 w-auto sm:h-16 mx-auto mb-3 sm:mb-4"
            />
            <h1 className="font-heading text-lg sm:text-2xl mb-2">
              {mode === "signup" ? "Create your account" : mode === "login" ? "Welcome back" : "Reset Password"}
            </h1>
            <p className="text-white/70 text-sm">Connect, learn, and grow together</p>
          </div>
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" ? (
              <>
                {renderSignupStep()}
                <div className="flex gap-3 pt-4">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-colors mobile-tap"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-primary py-3 disabled:opacity-50 mobile-tap"
                  >
                    {loading ? "Creating account..." : currentStep === 3 ? "Create Account" : "Continue"}
                  </button>
                </div>
              </>
            ) : mode === "login" ? (
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
                <div className="text-center mt-3">
                  <button
                    type="button"
                    onClick={() => setMode("reset")}
                    className="text-praxis-blue hover:text-praxis-green transition-colors text-sm mobile-tap py-1"
                  >
                    Forgot your password?
                  </button>
                </div>
              </>
            ) : (
              <>
                {renderResetStep()}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 disabled:opacity-50 mobile-tap"
                >
                  {loading ? "Sending reset email..." : "Reset Password"}
                </button>
              </>
            )}
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <button
              onClick={handleModeChange}
              className="text-praxis-blue hover:text-praxis-green transition-colors text-sm sm:text-base mobile-tap py-2"
            >
              {mode === "signup" ? "Already have an account? Sign in" : mode === "login" ? "Don't have an account? Sign up" : "Back to login"}
            </button>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}