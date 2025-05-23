"use client";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type CandidateFormProps = {
  onSubmit?: (data: FormData) => void;
};

const languageLevels = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Native",
];

export default function CandidateForm({ onSubmit }: CandidateFormProps) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [languageLevel, setLanguageLevel] = useState(languageLevels[0]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!name || !dob) {
        throw new Error("Please fill in all required fields.");
      }

      // Insert candidate record
      const { error: insertError } = await supabase
        .from('candidates')
        .insert([{
          name,
          date_of_birth: dob,
          language_level: languageLevel,
        }]);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Candidate has been created successfully",
      });

      router.push('/candidates');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create candidate',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="font-medium">
        Full Name
        <input
          type="text"
          className="input mt-1 w-full"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          disabled={isLoading}
        />
      </label>

      <label className="font-medium">
        Date of Birth
        <input
          type="date"
          className="input mt-1 w-full"
          value={dob}
          onChange={e => setDob(e.target.value)}
          required
          disabled={isLoading}
        />
      </label>

      <label className="font-medium">
        Language Level
        <select
          className="input mt-1 w-full"
          value={languageLevel}
          onChange={e => setLanguageLevel(e.target.value)}
          disabled={isLoading}
        >
          {languageLevels.map(level => (
            <option value={level} key={level}>{level}</option>
          ))}
        </select>
      </label>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button 
        type="submit" 
        className="btn btn-primary mt-2"
        disabled={isLoading}
      >
        {isLoading ? "Creating..." : "Add Candidate"}
      </button>
    </form>
  );
}