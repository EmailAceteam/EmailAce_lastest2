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
import { Checkbox } from "@/components/ui/checkbox";
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

interface SelectedList {
  id: string;
  selectAll: boolean;
  selectedEmails: string[];
}

export default function CampaignForm({ id, initialData }: CampaignFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [candidateId, setCandidateId] = useState(
    initialData?.candidate_id || ""
  );
  const [templateId, setTemplateId] = useState(initialData?.template_id || "");
  const [jobDescription, setJobDescription] = useState(
    initialData?.job_description || ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLists, setSelectedLists] = useState<SelectedList[]>([]);

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
          { data: candidatesData },
          { data: emailListsData },
          { data: templatesData },
        ] = await Promise.all([
          supabase.from("candidates").select("*"),
          supabase.from("email_lists").select("*"),
          supabase.from("email_templates").select("*"),
        ]);

        if (candidatesData) setCandidates(candidatesData);
        if (emailListsData) setEmailLists(emailListsData);
        if (templatesData) setTemplates(templatesData);

        // Initialize selected lists
        if (emailListsData) {
          setSelectedLists(
            emailListsData.map((list) => ({
              id: list.id,
              selectAll: false,
              selectedEmails: [],
            }))
          );
        }
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

  const handleListSelection = (listId: string, selectAll: boolean) => {
    setSelectedLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, selectAll, selectedEmails: selectAll ? [] : [] }
          : list
      )
    );
  };

  const handleEmailSelection = (
    listId: string,
    email: string,
    isChecked: boolean
  ) => {
    setSelectedLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) return list;

        const updatedEmails = isChecked
          ? [...list.selectedEmails, email]
          : list.selectedEmails.filter((e) => e !== email);

        return {
          ...list,
          selectedEmails: updatedEmails,
          selectAll: false,
        };
      })
    );
  };

  const sendEmails = async (
    campaignId: string,
    template: EmailTemplate,
    candidate: Candidate
  ) => {
    if (!template?.bodyTemplate || !template?.subjectTemplate) {
      throw new Error("Invalid email template");
    }

    const candidateAge = candidate.date_of_birth
      ? new Date().getFullYear() -
        new Date(candidate.date_of_birth).getFullYear()
      : 0;

    // Get all selected emails from all lists
    const allSelectedEmails = selectedLists.flatMap((list) => {
      const listData = emailLists.find((l) => l.id === list.id);
      if (!listData) return [];

      return list.selectAll ? listData.emails : list.selectedEmails;
    });

    // Create sent_emails records with tracking token
    const sentEmailsData = allSelectedEmails.map((email) => {
      const trackingToken = `${campaignId}-${email}-${Date.now()}`;

      return {
        campaign_id: campaignId,
        recipient_email: email,
        status: "pending",
        tracking_token: trackingToken,
        reply_url: `${window.location.origin}/api/reply?token=${trackingToken}`,
      };
    });

    const { error: sentEmailsError } = await supabase
      .from("sent_emails")
      .insert(sentEmailsData);

    if (sentEmailsError) throw sentEmailsError;

    // Send emails (in real app, this would be a server-side operation)
    for (const emailData of sentEmailsData) {
      const emailContent = template.bodyTemplate
        .replace(/{{candidateName}}/g, candidate.name)
        .replace(/{{candidateAge}}/g, candidateAge.toString())
        .replace(/{{languageLevel}}/g, candidate.language_level || "")
        .replace(/{{position}}/g, jobDescription || "the position")
        .replace(/{{company}}/g, "your company")
        .replace(/{{recipientName}}/g, "Hiring Manager");

      const emailSubject = template.subjectTemplate
        .replace(/{{candidateName}}/g, candidate.name)
        .replace(/{{candidateAge}}/g, candidateAge.toString())
        .replace(/{{languageLevel}}/g, candidate.language_level || "");

      try {
        // In a real implementation, you would send the email here
        // and include the reply_url in the email body as a button

        // Update status to sent
        await supabase
          .from("sent_emails")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("tracking_token", emailData.tracking_token);
      } catch (error) {
        console.error("Error sending email:", error);
        await supabase
          .from("sent_emails")
          .update({ status: "failed" })
          .eq("tracking_token", emailData.tracking_token);
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
      if (selectedLists.length === 0)
        throw new Error("Please select at least one email list");
      if (!templateId) throw new Error("Please select a template");

      // Verify at least one email is selected
      const hasSelectedEmails = selectedLists.some(
        (list) => list.selectAll || list.selectedEmails.length > 0
      );

      if (!hasSelectedEmails) {
        throw new Error("Please select at least one email address");
      }

      const template = templates.find((t) => t.id === templateId);
      const candidate = candidates.find((c) => c.id === candidateId);

      if (!template || !candidate) {
        throw new Error("Invalid selection");
      }

      // Create campaign
      const { data: campaignData, error: campaignError } = id
        ? await supabase
            .from("campaigns")
            .update({
              name,
              candidate_id: candidateId,
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

      // Send the emails
      await sendEmails(campaign.id, template, candidate);

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

  // Function to handle email reply (would be called via API route)
  const handleEmailReply = async (trackingToken: string) => {
    try {
      await supabase
        .from("sent_emails")
        .update({ status: "received", received_at: new Date().toISOString() })
        .eq("tracking_token", trackingToken);
    } catch (error) {
      console.error("Error updating email status:", error);
    }
  };

  return (
    <div className="space-y-8">
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
          <Label>Email Lists</Label>
          <div className="space-y-4">
            {emailLists.map((list) => {
              const selectedList = selectedLists.find(
                (sl) => sl.id === list.id
              );
              return (
                <div key={list.id} className="border p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`list-${list.id}`}
                      checked={selectedList?.selectAll || false}
                      onCheckedChange={(checked) =>
                        handleListSelection(list.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={`list-${list.id}`} className="font-medium">
                      {list.name} ({list.emails.length} emails)
                    </Label>
                  </div>

                  {!selectedList?.selectAll && (
                    <div className="mt-2 ml-6 space-y-2 max-h-60 overflow-y-auto">
                      {list.emails.map((email) => (
                        <div
                          key={email}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`email-${list.id}-${email}`}
                            checked={
                              selectedList?.selectedEmails.includes(email) ||
                              false
                            }
                            onCheckedChange={(checked) =>
                              handleEmailSelection(
                                list.id,
                                email,
                                checked as boolean
                              )
                            }
                          />
                          <Label htmlFor={`email-${list.id}-${email}`}>
                            {email}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
                    This action cannot be undone. This will permanently delete
                    the campaign and all associated sent emails.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  {/* <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction> */}
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </form>
    </div>
  );
}
