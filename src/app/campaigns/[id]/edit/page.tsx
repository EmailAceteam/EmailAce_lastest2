// src/app/campaigns/[id]/edipage.tsx
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

interface EditCampaignPageProps {
  params: { id: string };
}

async function getCampaignWithDetails(id: string) {
  // Récupère la campagne de base
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (campaignError || !campaign) return null;

  // Récupère les données liées en parallèle
  const [{ data: candidate }, { data: emailList }, { data: template }] =
    await Promise.all([
      supabase
        .from("candidates")
        .select("*")
        .eq("id", campaign.candidate_id)
        .single(),
      supabase
        .from("email_lists")
        .select("*")
        .eq("id", campaign.email_list_id)
        .single(),
      supabase
        .from("email_templates")
        .select("*")
        .eq("id", campaign.template_id)
        .single(),
    ]);

  return {
    ...campaign,
    candidate,
    emailList,
    template,
  };
}

export default async function EditCampaignPage({
  params,
}: EditCampaignPageProps) {
  const campaignWithDetails = await getCampaignWithDetails(params.id);

  if (!campaignWithDetails) {
    notFound();
  }

  // Format the initial data for the form
  const initialData = {
    name: campaignWithDetails.name,
    candidate_id: campaignWithDetails.candidate_id,
    email_list_id: campaignWithDetails.email_list_id,
    template_id: campaignWithDetails.template_id,
    job_description: campaignWithDetails.job_description || "",
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Edit Campaign
        </h1>
        <p className="text-muted-foreground">
          Modify campaign details for "{campaignWithDetails.name}"
        </p>

        {/* Affichage des informations liées */}
        <div className="mt-4 space-y-2 text-sm">
          <p>
            <span className="font-medium">Candidate:</span>{" "}
            {campaignWithDetails.candidate?.name}
          </p>
          <p>
            <span className="font-medium">Email List:</span>{" "}
            {campaignWithDetails.emailList?.name} (
            {campaignWithDetails.emailList?.emails?.length} emails)
          </p>
          <p>
            <span className="font-medium">Template:</span>{" "}
            {campaignWithDetails.template?.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Configuration</CardTitle>
          <CardDescription>Update the campaign settings below.</CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignForm id={params.id} initialData={initialData} />
        </CardContent>
      </Card>
    </div>
  );
}
