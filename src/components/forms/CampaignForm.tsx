"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import type { Candidate, EmailList, EmailTemplate } from "@/types";

interface CampaignFormProps {
  id?: string;
  initialData?: {
    name: string;
    candidate_id: string;
    email_list_id: string;
    template_id: string;
    job_description?: string;
  };
}

export default function CampaignForm({ id, initialData }: CampaignFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [candidateId, setCandidateId] = useState(
    initialData?.candidate_id || ""
  );
  const [emailListId, setEmailListId] = useState(
    initialData?.email_list_id || ""
  );
  const [templateId, setTemplateId] = useState(initialData?.template_id || "");
  const [jobDescription, setJobDescription] = useState(
    initialData?.job_description || ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // State for dropdown options
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [emailLists, setEmailLists] = useState<EmailList[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [
          { data: candidatesData, error: candidatesError },
          { data: emailListsData, error: emailListsError },
          { data: templatesData, error: templatesError },
        ] = await Promise.all([
          supabase.from("candidates").select("*"),
          supabase.from("email_lists").select("*"),
          supabase.from("email_templates").select("*"),
        ]);

        if (candidatesError) throw candidatesError;
        if (emailListsError) throw emailListsError;
        if (templatesError) throw templatesError;

        if (candidatesData) setCandidates(candidatesData);
        if (emailListsData) setEmailLists(emailListsData);
        if (templatesData) setTemplates(templatesData);
      } catch (err) {
        console.error("Error fetching options:", err);
        setError("Failed to load form options");
        toast({
          title: "Error",
          description: "Failed to load form options",
          variant: "destructive",
        });
      }
    };

    fetchOptions();
  }, [toast]);

  const sendEmails = async (
    campaignId: string,
    emailList: EmailList,
    template: EmailTemplate,
    candidate: Candidate
  ) => {
    if (!template?.bodyTemplate || !template?.subjectTemplate) {
      throw new Error("Invalid email template");
    }
    const candidateAge =
      new Date().getFullYear() -
      new Date(candidate.date_of_birth).getFullYear();

    for (const recipientEmail of emailList.emails) {
      const emailContent = template.bodyTemplate
        .replace(/{{candidateName}}/g, candidate.name)
        .replace(/{{candidateAge}}/g, candidateAge.toString())
        .replace(/{{languageLevel}}/g, candidate.language_level)
        .replace(/{{position}}/g, jobDescription || "the position")
        .replace(/{{company}}/g, "your company")
        .replace(/{{recipientName}}/g, "Hiring Manager");

      const emailSubject = template.subjectTemplate
        .replace(/{{candidateName}}/g, candidate.name)
        .replace(/{{candidateAge}}/g, candidateAge.toString())
        .replace(/{{languageLevel}}/g, candidate.language_level);

      try {
        await fetch("/api/campaigns/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            campaignId,
            recipientEmail,
            subject: emailSubject,
            content: emailContent,
          }),
        });
      } catch (error) {
        console.error("Error sending email:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!name.trim()) throw new Error("Please enter a campaign name");
      if (!candidateId) throw new Error("Please select a candidate");
      if (!emailListId) throw new Error("Please select an email list");
      if (!templateId) throw new Error("Please select a template");

      // Get the selected email list, template, and candidate
      const emailList = emailLists.find((list) => list.id === emailListId);
      const template = templates.find((t) => t.id === templateId);
      const candidate = candidates.find((c) => c.id === candidateId);

      if (!emailList || !template || !candidate) {
        throw new Error("Invalid selection");
      }

      // Create campaign
      const { data: campaignData, error: campaignError } = id
        ? await supabase
            .from("campaigns")
            .update({
              name,
              candidate_id: candidateId,
              email_list_id: emailListId,
              template_id: templateId,
              job_description: jobDescription || null,
              status: "sending",
            })
            .eq("id", id)
            .select()
        : await supabase
            .from("campaigns")
            .insert([
              {
                name,
                candidate_id: candidateId,
                email_list_id: emailListId,
                template_id: templateId,
                job_description: jobDescription || null,
                status: "sending",
              },
            ])
            .select();

      if (campaignError) throw campaignError;
      if (!campaignData || campaignData.length === 0)
        throw new Error("Failed to create campaign");

      const campaign = campaignData[0];

      // Create sent_emails records
      const sentEmailsData = emailList.emails.map((email) => ({
        campaign_id: campaign.id,
        recipient_email: email,
        status: "pending",
      }));

      const { error: sentEmailsError } = await supabase
        .from("sent_emails")
        .insert(sentEmailsData);

      if (sentEmailsError) throw sentEmailsError;

      // Send the emails
      await sendEmails(campaign.id, emailList, template, candidate);

      // Update campaign status to sent
      await supabase
        .from("campaigns")
        .update({ status: "sent" })
        .eq("id", campaign.id);

      toast({
        title: id ? "Campaign updated" : "Campaign created",
        description: `Successfully ${
          id ? "updated" : "created"
        } campaign "${name}"`,
      });

      router.push("/campaigns");
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
        .from("campaigns")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      toast({
        title: "Campaign deleted",
        description: `Successfully deleted campaign "${name}"`,
      });

      router.push("/campaigns");
      router.refresh();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Campaign Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Q2 Tech Companies Outreach"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="candidate">Candidate</Label>
        <Select
          value={candidateId}
          onValueChange={setCandidateId}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a candidate" />
          </SelectTrigger>
          <SelectContent>
            {candidates.map((candidate) => (
              <SelectItem key={candidate.id} value={candidate.id}>
                {candidate.name} - {candidate.language_level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="emailList">Email List</Label>
        <Select
          value={emailListId}
          onValueChange={setEmailListId}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an email list" />
          </SelectTrigger>
          <SelectContent>
            {emailLists.map((list) => (
              <SelectItem key={list.id} value={list.id}>
                {list.name} ({list.emails.length} emails)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="template">Email Template</Label>
        <Select
          value={templateId}
          onValueChange={setTemplateId}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobDescription">Job Description (Optional)</Label>
        <Textarea
          id="jobDescription"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Enter the job title or description to personalize the email..."
          rows={5}
          disabled={isLoading}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-4">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading
            ? id
              ? "Updating..."
              : "Creating..."
            : id
            ? "Update Campaign"
            : "Create Campaign"}
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
                  campaign and all associated sent emails.
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
