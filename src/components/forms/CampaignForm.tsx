"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/Collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

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
  const [expandedList, setExpandedList] = useState<string | null>(null);

  // State for dropdown options
  const [candidates, setCandidates] = useState<any[]>([]);
  const [emailLists, setEmailLists] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!name.trim()) throw new Error("Please enter a campaign name");
      if (!candidateId) throw new Error("Please select a candidate");
      if (!emailListId) throw new Error("Please select an email list");
      if (!templateId) throw new Error("Please select a template");

      // Create or update campaign
      const { data: campaign, error: supabaseError } = id
        ? await supabase
            .from("campaigns")
            .update({
              name,
              candidate_id: candidateId,
              email_list_id: emailListId,
              template_id: templateId,
              job_description: jobDescription || null,
              status: "draft",
              updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single()
        : await supabase
            .from("campaigns")
            .insert([
              {
                name,
                candidate_id: candidateId,
                email_list_id: emailListId,
                template_id: templateId,
                job_description: jobDescription || null,
                status: "draft",
                user_id: (await supabase.auth.getUser()).data.user?.id,
              },
            ])
            .select()
            .single();

      if (supabaseError) throw supabaseError;
      if (!campaign) throw new Error("Failed to save campaign");

      toast({
        title: id ? "Campaign updated" : "Campaign created",
        description: `Successfully ${id ? "updated" : "created"} campaign "${name}"`,
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

  const toggleListExpansion = (listId: string) => {
    setExpandedList(expandedList === listId ? null : listId);
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
                {candidate.name}
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

        {/* Email list preview */}
        {emailListId && (
          <div className="mt-2 border rounded-lg p-4">
            {emailLists
              .filter((list) => list.id === emailListId)
              .map((list) => (
                <Collapsible
                  key={list.id}
                  open={expandedList === list.id}
                  onOpenChange={() => toggleListExpansion(list.id)}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                    {expandedList === list.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="font-medium">
                      {list.name} ({list.emails.length} emails)
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 pl-6">
                    <div className="max-h-60 overflow-y-auto border rounded p-2 bg-muted/50">
                      {list.emails.map((email: string) => (
                        <div key={email} className="py-1 text-sm">
                          {email}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
          </div>
        )}
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
                  campaign and all associated data.
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
