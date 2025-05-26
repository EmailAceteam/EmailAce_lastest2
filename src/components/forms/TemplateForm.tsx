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

const REQUIRED_PLACEHOLDERS = [
  { key: "candidateName", label: "Candidate Name" },
  { key: "company", label: "Company Name" },
  { key: "recipientName", label: "Recipient Name" },
];

const OPTIONAL_PLACEHOLDERS = [
  { key: "position", label: "Position" },
  { key: "candidateAge", label: "Candidate Age" },
  { key: "languageLevel", label: "Language Level" },
];

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
  const [showOptionalWarning, setShowOptionalWarning] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const validateTemplate = (template: string) => {
    const missingRequired = REQUIRED_PLACEHOLDERS.filter(
      ({ key }) => !template.includes(`{{${key}}}`)
    );
    const missingOptional = OPTIONAL_PLACEHOLDERS.filter(
      ({ key }) => !template.includes(`{{${key}}}`)
    );

    return { missingRequired, missingOptional };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!name.trim()) throw new Error("Please enter a template name");
      if (!subjectTemplate.trim())
        throw new Error("Please enter a subject template");
      if (!bodyTemplate.trim()) throw new Error("Please enter a body template");

      // Validate required placeholders
      const { missingRequired, missingOptional } =
        validateTemplate(bodyTemplate);

      if (missingRequired.length > 0) {
        throw new Error(
          `Missing required placeholders: ${missingRequired
            .map((p) => p.label)
            .join(", ")}`
        );
      }

      if (missingOptional.length > 0 && !showOptionalWarning) {
        setShowOptionalWarning(true);
        setIsLoading(false);
        return;
      }

      // Create or update template
      const { error: supabaseError } = id
        ? await supabase
            .from("email_templates")
            .update({
              name,
              subject_template: subjectTemplate,
              body_template: bodyTemplate,
            })
            .eq("id", id)
        : await supabase.from("email_templates").insert([
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Template Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Standard Job Application"
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
          placeholder="e.g., Application from {{candidateName}} for {{position}}"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bodyTemplate">Email Body Template</Label>
        <Textarea
          id="bodyTemplate"
          value={bodyTemplate}
          onChange={(e) => setBodyTemplate(e.target.value)}
          placeholder={`Dear {{recipientName}},

I am {{candidateName}}, and I am writing to express my interest in the {{position}} position at {{company}}.

[Your template content here]

Best regards,
{{candidateName}}`}
          rows={10}
          required
          disabled={isLoading}
        />
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">Required placeholders:</p>
          <ul className="list-disc list-inside">
            {REQUIRED_PLACEHOLDERS.map(({ key, label }) => (
              <li key={key}>
                <code>{`{{${key}}}`}</code> - {label}
              </li>
            ))}
          </ul>
          <p className="font-medium mt-4">
            Optional placeholders (recommended):
          </p>
          <ul className="list-disc list-inside">
            {OPTIONAL_PLACEHOLDERS.map(({ key, label }) => (
              <li key={key}>
                <code>{`{{${key}}}`}</code> - {label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <AlertDialog
        open={showOptionalWarning}
        onOpenChange={setShowOptionalWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Missing Optional Placeholders</AlertDialogTitle>
            <AlertDialogDescription>
              Your template is missing some optional placeholders that could
              make your email more personalized:
              <ul className="list-disc list-inside mt-2">
                {validateTemplate(bodyTemplate).missingOptional.map(
                  ({ key, label }) => (
                    <li key={key}>{label}</li>
                  )
                )}
              </ul>
              Would you like to continue anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, I'll add them</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowOptionalWarning(false);
                handleSubmit(new Event("submit") as any);
              }}
            >
              Yes, continue anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading
          ? id
            ? "Updating..."
            : "Creating..."
          : id
          ? "Update Template"
          : "Create Template"}
      </Button>
    </form>
  );
}
