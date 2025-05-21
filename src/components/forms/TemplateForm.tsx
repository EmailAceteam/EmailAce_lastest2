"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface TemplateFormProps {
  id?: string;
  initialData?: {
    name: string;
    subject_template: string;
    body_template: string;
  };
}

export default function TemplateForm({ id, initialData }: TemplateFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [subjectTemplate, setSubjectTemplate] = useState(
    initialData?.subject_template || ""
  );
  const [bodyTemplate, setBodyTemplate] = useState(
    initialData?.body_template || ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Basic validation
      if (!name.trim()) throw new Error("Please enter a template name");
      if (!subjectTemplate.trim())
        throw new Error("Please enter a subject template");
      if (!bodyTemplate.trim()) throw new Error("Please enter a body template");

      // Update or create the template
      const { error: supabaseError } = id
        ? await supabase
            .from("email_templates")
            .update({
              name,
              subject_template: subjectTemplate,
              body_template: bodyTemplate,
            })
            .eq("id", id)
        : await supabase
            .from("email_templates")
            .insert([
              {
                name,
                subject_template: subjectTemplate,
                body_template: bodyTemplate,
              },
            ]);

      if (supabaseError) throw supabaseError;

      toast({
        title: id ? "Template updated" : "Template created",
        description: `Successfully ${
          id ? "updated" : "created"
        } template "${name}"`,
      });

      router.push("/templates");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
        .from("email_templates")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      toast({
        title: "Template deleted",
        description: `Successfully deleted template "${name}"`,
      });

      router.push("/templates");
      router.refresh();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Template Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Initial Application"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subjectTemplate">Email Subject Template</Label>
        <Input
          id="subjectTemplate"
          value={subjectTemplate}
          onChange={(e) => setSubjectTemplate(e.target.value)}
          placeholder="e.g., Application from {{candidateName}} - {{languageLevel}} level"
          required
          disabled={isLoading}
        />
        <p className="text-sm text-muted-foreground">
          Available placeholders:{" "}
          {"{{ candidateName }}, {{ candidateAge }}, {{ languageLevel }}"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bodyTemplate">Email Body Template</Label>
        <Textarea
          id="bodyTemplate"
          value={bodyTemplate}
          onChange={(e) => setBodyTemplate(e.target.value)}
          placeholder="Dear {{recipientName}},

I am {{candidateName}}, a {{languageLevel}} level candidate. I am {{candidateAge}} years old.

I am writing to express my interest in the position..."
          rows={10}
          required
          disabled={isLoading}
        />
        <p className="text-sm text-muted-foreground">
          Available placeholders:
          <br />- {"{{ candidateName }}"} - The candidate's full name
          <br />- {"{{ candidateAge }}"} - The candidate's age (calculated from
          date of birth)
          <br />- {"{{ languageLevel }}"} - The candidate's language proficiency
          level
          <br />- {"{{ recipientName }}"} - The recipient's name
          <br />- {"{{ position }}"} - The position being applied for
          <br />- {"{{ company }}"} - The company name
        </p>
        
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-4">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading
            ? id
              ? "Updating..."
              : "Creating..."
            : id
            ? "Update Template"
            : "Create Template"}
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
                  template and remove it from any campaigns that use it.
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
