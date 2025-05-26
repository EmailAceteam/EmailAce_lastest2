"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CampaignForm from "@/components/forms/CampaignForm";

export default function NewCampaignPage() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Start New Campaign
        </h1>
        <p className="text-muted-foreground">
          Configure and launch your email outreach campaign.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>
            Select the candidate, email list, and template for your campaign.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignForm />
        </CardContent>
      </Card>
    </div>
  );
}
