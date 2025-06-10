//src/app/controlcenter/[id]/edit/page.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ControlCenter from "@/components/Management/ControlCenter";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

interface EditCampaignPageProps {
  params: { id: string };
}

async function getCampaign(id: string) {
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*")
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
        <h1 className="text-3xl font-bold tracking-tight">Edit Campaign</h1>
        <p className="text-muted-foreground">
          Update the details for "{campaign.name}"
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Information</CardTitle>
          <CardDescription>
            Modify the form below to update the campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ControlCenter id={params.id} initialData={campaign} mode="edit" />
        </CardContent>
      </Card>
    </div>
  );
}
