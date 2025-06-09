// src/app/campaigns/[id]/page.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Calendar, Mail, User, List, FileEdit } from "lucide-react";
import { format } from "date-fns";

interface CampaignDetailsPageProps {
  params: { id: string };
}

async function getCampaignDetails(id: string) {
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select(
      `*,
        candidate: candidates(*),
        email_list: email_lists(*),
        template: email_templates(*)`
    )
    .eq("id", id)
    .single();

  if (campaignError || !campaign) return null;
  return campaign;
}

function renderTemplateContent(
  template: string,
  candidate: any,
  jobDescription: string = ""
) {
  if (!template) return "";

  return template
    .replace(/{{candidate\.name}}/g, candidate?.name || "[Nom manquant]")
    .replace(/{{candidate\.email}}/g, candidate?.email || "[Email manquant]")
    .replace(
      /{{job\.description}}/g,
      jobDescription || "[Description manquante]"
    )
    .replace(
      /{{job\.title}}/g,
      jobDescription ? jobDescription.split("\n")[0] : "[Titre manquant]"
    );
}

export default async function CampaignDetailsPage({
  params,
}: CampaignDetailsPageProps) {
  const campaign = await getCampaignDetails(params.id);

  if (!campaign) {
    notFound();
  }

  const templateContent = renderTemplateContent(
    campaign.template?.content || "",
    campaign.candidate,
    campaign.job_description || ""
  );

  const templateSubject = renderTemplateContent(
    campaign.template?.subject || "",
    campaign.candidate,
    campaign.job_description || ""
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                Created: {format(new Date(campaign.created_at), "PPP")}
              </span>
            </div>
            {campaign.updated_at && (
              <div className="flex items-center gap-1">
                <FileEdit className="h-4 w-4" />
                <span>
                  Updated: {format(new Date(campaign.updated_at), "PPP")}
                </span>
              </div>
            )}
          </div>
        </div>

        <Button asChild>
          <Link href={`/campaigns/${params.id}/edit`}>Edit Campaign</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Details */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                <span>Candidate</span>
              </div>
              <p className="text-sm">
                {campaign.candidate?.name || "No candidate selected"}
              </p>
              {campaign.candidate?.email && (
                <p className="text-sm text-muted-foreground">
                  {campaign.candidate.email}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <List className="h-4 w-4" />
                <span>Email List</span>
              </div>
              <p className="text-sm">
                {campaign.email_list?.name || "No list selected"} (
                {campaign.email_list?.emails?.length || 0} emails)
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4" />
                <span>Email Template</span>
              </div>
              <p className="text-sm">
                {campaign.template?.name || "No template selected"}
              </p>
            </div>

            {campaign.job_description && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>Job Description</span>
                </div>
                <p className="text-sm whitespace-pre-line">
                  {campaign.job_description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Email Preview</CardTitle>
            <CardDescription>
              How the email will appear to recipients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg bg-white">
              <div className="border-b p-4">
                <h3 className="font-medium">Subject: {templateSubject}</h3>
              </div>
              <div className="p-4">
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: templateContent }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
