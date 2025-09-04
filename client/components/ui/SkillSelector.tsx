import { useState, useRef, useEffect } from "react";
import { searchSkills } from "@shared/skills";

interface SkillSelectorProps {
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  placeholder?: string;
  label?: string;
  maxSkills?: number;
}

export default function SkillSelector({ 
  selectedSkills, 
  onSkillsChange, 
  placeholder = "Type to search skills...",
  label,
  maxSkills = 10
}: SkillSelectorProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputValue.trim()) {
      const results = searchSkills(inputValue);
      setSuggestions(results.filter(skill => !selectedSkills.includes(skill)));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, selectedSkills]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addSkill = (skill: string) => {
    if (!selectedSkills.includes(skill) && selectedSkills.length < maxSkills) {
      onSkillsChange([...selectedSkills, skill]);
      setInputValue("");
      setShowSuggestions(false);
      inputRef.current?.focus();
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onSkillsChange(selectedSkills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      e.preventDefault();
      addSkill(suggestions[0]);
    } else if (e.key === "Backspace" && !inputValue && selectedSkills.length > 0) {
      removeSkill(selectedSkills[selectedSkills.length - 1]);
    }
  };

  return (
    <div className="grid gap-2">
      {label && <label className="text-sm font-medium text-white/80">{label}</label>}
      
      <div className="relative">
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-[48px] flex flex-wrap gap-2 items-center">
          {selectedSkills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 px-2 py-1 bg-praxis-blue/20 border border-praxis-blue/40 rounded-md text-xs text-praxis-blue"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-1 text-praxis-blue/70 hover:text-praxis-blue"
              >
                ×
              </button>
            </span>
          ))}
          
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue && setShowSuggestions(true)}
            placeholder={selectedSkills.length === 0 ? placeholder : ""}
            className="flex-1 bg-transparent outline-none text-white placeholder-white/50 min-w-[120px]"
            disabled={selectedSkills.length >= maxSkills}
          />
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-black/90 border border-white/10 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto"
          >
            {suggestions.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => addSkill(skill)}
                className="w-full px-4 py-2 text-left text-white hover:bg-white/10 first:rounded-t-xl last:rounded-b-xl"
              >
                {skill}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between text-xs text-white/50">
        <span>Selected: {selectedSkills.length}/{maxSkills}</span>
        {selectedSkills.length >= maxSkills && (
          <span className="text-yellow-400">Maximum skills reached</span>
        )}
      </div>
    </div>
  );
}
