//src/app/controlcenter/new/page.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ControlCenter from "@/components/Management/ControlCenter";

export default function NewCampaignPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Create New Campaign
        </h1>
        <p className="text-muted-foreground">
          Set up a new email campaign to reach potential employers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>
            Fill in the form below to create a new campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ControlCenter mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}