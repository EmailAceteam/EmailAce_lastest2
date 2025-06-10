//src/app/controlcenter/page.tsx

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, Send, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

async function getCampaigns() {
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return campaigns;
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "sent":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "scheduled":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "sending":
      return <Send className="h-4 w-4 text-yellow-500 animate-pulse" />;
    default:
      return <Send className="h-4 w-4 text-gray-500" />;
  }
};

export default async function ControlCenterPage() {
  const campaigns = await getCampaigns();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Control Center</h1>
          <p className="text-muted-foreground">
            Manage and monitor your email campaigns
          </p>
        </div>
        <Link href="/controlcenter/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> New Campaign
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <CardHeader className="items-center">
            <Send className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>No Campaigns Yet</CardTitle>
            <CardDescription>
              Create your first campaign to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/controlcenter/new" passHref>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{campaign.name}</CardTitle>
                  <StatusIcon status={campaign.status} />
                </div>
                <CardDescription>
                  Status: <span className="capitalize">{campaign.status}</span>
                  <br />
                  Created: {new Date(campaign.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/controlcenter/${campaign.id}`}>View</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/controlcenter/${campaign.id}/edit`}>
                      Edit
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
