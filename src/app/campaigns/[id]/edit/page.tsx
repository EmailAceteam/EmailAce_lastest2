import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CampaignForm from "@/components/forms/CampaignForm";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/Collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

interface EditCampaignPageProps {
  params: { id: string };
}

async function getCampaign(id: string) {
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select(
      `
      *,
      candidate: candidates (*),
      email_list: email_lists (*),
      template: email_templates (*)
    `
    )
    .eq("id", id)
    .single();

  if (error || !campaign) return null;
  return campaign;
}

export default async function EditCampaignPage({
  params,
}: EditCampaignPageProps) {
  const campaign = await getCampaign(params.id);

  if (!campaign) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Edit Campaign: {campaign.name}
        </h1>
        <p className="text-muted-foreground">
          Status: <span className="capitalize">{campaign.status}</span> •
          Created: {new Date(campaign.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Campaign Details */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Configuration</CardTitle>
          <CardDescription>
            Update the campaign settings and content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignForm id={params.id} initialData={campaign} />
        </CardContent>
      </Card>

      {/* Associated Data Preview */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Candidate Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Selected Candidate</CardTitle>
            <CardDescription>
              {campaign.candidate?.name || "No candidate selected"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {campaign.candidate && (
              <div className="space-y-2">
                <p>
                  <strong>Name:</strong> {campaign.candidate.name}
                </p>
                <p>
                  <strong>Language Level:</strong>{" "}
                  {campaign.candidate.language_level}
                </p>
                {campaign.candidate.date_of_birth && (
                  <p>
                    <strong>Age:</strong>{" "}
                    {new Date().getFullYear() -
                      new Date(campaign.candidate.date_of_birth).getFullYear()}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Template Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Email Template</CardTitle>
            <CardDescription>
              {campaign.template?.name || "No template selected"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {campaign.template && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span>View Template Content</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4">
                  <div className="p-4 bg-muted rounded">
                    <h4 className="font-medium mb-2">Subject:</h4>
                    <p>{campaign.template.subject_template}</p>
                  </div>
                  <div className="p-4 bg-muted rounded">
                    <h4 className="font-medium mb-2">Body:</h4>
                    <pre className="whitespace-pre-wrap">
                      {campaign.template.body_template}
                    </pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email List Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Email List</CardTitle>
          <CardDescription>
            {campaign.email_list?.name || "No email list selected"} •{" "}
            {campaign.email_list?.emails?.length || 0} emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaign.email_list && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span>
                    View Email List ({campaign.email_list.emails.length} emails)
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="max-h-60 overflow-y-auto border rounded p-4 bg-muted/50">
                  {campaign.email_list.emails.map((email: string) => (
                    <div key={email} className="py-1 text-sm">
                      {email}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
