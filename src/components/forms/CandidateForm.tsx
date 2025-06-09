"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface CandidateFormProps {
  id?: string;
  initialData?: {
    name: string;
    email: string;
    date_of_birth: string;
    language_level: string;
    location?: string;
    current_age?: number;
    education_level?: string;
  };
}

const LANGUAGE_LEVELS = ["Beginner", "Intermediate", "Advanced", "Native"];
const EDUCATION_LEVELS = [
  "High School",
  "College",
  "Undergraduate (Bachelor's)",
  "Graduate (Master's)",
  "PhD",
  "Other",
];

const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function CandidateForm({ id, initialData }: CandidateFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    dateOfBirth: initialData?.date_of_birth
      ? formatDateForInput(initialData.date_of_birth)
      : "",
    languageLevel: initialData?.language_level || LANGUAGE_LEVELS[0],
    location: initialData?.location || "",
    educationLevel: initialData?.education_level || EDUCATION_LEVELS[0],
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    languageLevel: "",
    location: "",
    educationLevel: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  function formatDateForInput(dateString: string) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  }

  function calculateAge(dateOfBirth: string): number {
    if (!dateOfBirth) return 0;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      // Calculate age automatically when date of birth changes
      ...(field === "dateOfBirth" ? { currentAge: calculateAge(value) } : {}),
    }));

    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: !formData.name.trim() ? "Name is required" : "",
      email: !formData.email.trim()
        ? "Email is required"
        : !validateEmail(formData.email)
        ? "Please enter a valid email"
        : "",
      dateOfBirth: !formData.dateOfBirth ? "Date of birth is required" : "",
      languageLevel: !formData.languageLevel
        ? "Language level is required"
        : "",
      location: "",
      educationLevel: "",
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const candidateData = {
        name: formData.name,
        email: formData.email,
        date_of_birth: formData.dateOfBirth,
        language_level: formData.languageLevel,
        location: formData.location,
        current_age: calculateAge(formData.dateOfBirth),
        education_level: formData.educationLevel,
        updated_at: new Date().toISOString(),
      };

      const { error: supabaseError } = id
        ? await supabase.from("candidates").update(candidateData).eq("id", id)
        : await supabase.from("candidates").insert([candidateData]);

      if (supabaseError) throw supabaseError;

      toast({
        title: id ? "Candidate updated" : "Candidate created",
        description: `Successfully ${id ? "updated" : "created"} candidate "${
          formData.name
        }"`,
      });

      router.push("/candidates");
      router.refresh();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from("candidates")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      toast({
        title: "Candidate deleted",
        description: `Successfully deleted candidate "${formData.name}"`,
      });

      router.push("/candidates");
      router.refresh();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete candidate",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="John Doe"
          required
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="john.doe@example.com"
          required
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-destructive mt-1">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => handleChange("dateOfBirth", e.target.value)}
          required
          disabled={isLoading}
          max={new Date().toISOString().split("T")[0]}
        />
        {errors.dateOfBirth && (
          <p className="text-sm text-destructive mt-1">{errors.dateOfBirth}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Current Age</Label>
        <Input
          value={formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : ""}
          disabled
          className="bg-muted"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => handleChange("location", e.target.value)}
          placeholder="City, Country"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="educationLevel">Education Level</Label>
        <Select
          value={formData.educationLevel}
          onValueChange={(value) => handleChange("educationLevel", value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select education level" />
          </SelectTrigger>
          <SelectContent>
            {EDUCATION_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="languageLevel">Language Level *</Label>
        <Select
          value={formData.languageLevel}
          onValueChange={(value) => handleChange("languageLevel", value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select language level" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.languageLevel && (
          <p className="text-sm text-destructive mt-1">
            {errors.languageLevel}
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading
            ? id
              ? "Updating..."
              : "Creating..."
            : id
            ? "Update Candidate"
            : "Create Candidate"}
        </Button>

        {id && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isLoading}>
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  candidate and remove them from any campaigns.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </form>
  );
}
