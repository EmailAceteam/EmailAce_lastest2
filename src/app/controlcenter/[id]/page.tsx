import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ControlCenter from "@/components/Management/ControlCenter";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

interface CampaignControlPageProps {
  params: { id: string };
}

async function getCampaignData(id: string) {
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select(
      `
      name,
      generated_email_content,
      email_list:email_lists(emails)
    `
    )
    .eq("id", id)
    .single();

  if (campaignError || !campaign) return null;

  const { data: managedEmails, error: emailsError } = await supabase
    .from("managed_emails")
    .select("*")
    .eq("campaign_id", id);

  if (emailsError) return null;

  return {
    name: campaign.name,
    generated_content: campaign.generated_email_content,
    emails: managedEmails || [],
  };
}

export default async function CampaignControlPage({
  params,
}: CampaignControlPageProps) {
  const campaignData = await getCampaignData(params.id);

  if (!campaignData) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Campaign Control Center</CardTitle>
        </CardHeader>
        <CardContent>
          <ControlCenter campaignId={params.id} initialData={campaignData} />
        </CardContent>
      </Card>
    </div>
  );
}
