// src/app/campaign/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlusCircle,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// Type definition for Campaign
type Campaign = {
  id: string;
  name: string;
  candidate_id: string;
  email_list_id: string;
  template_id: string;
  status: "draft" | "scheduled" | "sent" | "failed";
  created_at: string;
  updated_at: string;
  sent_emails: {
    id: string;
    recipient_email: string;
    sent_at: string;
    status: string;
    reply_category: string | null;
    reply_summary: string | null;
  }[];
};

async function getCampaigns() {
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select(
      `
      *,
      sent_emails (*)
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return campaigns as Campaign[];
}

const StatusIcon = ({ status }: { status: Campaign["status"] }) => {
  if (status === "sent")
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (status === "draft")
    return <FileText className="h-4 w-4 text-yellow-500" />;
  if (status === "failed") return <XCircle className="h-4 w-4 text-red-500" />;
  return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
};

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Manage Campaigns
          </h1>
          <p className="text-muted-foreground">
            Launch new email campaigns and track their progress.
          </p>
        </div>
        <Link href="/campaigns/new" passHref>
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
              Start your first email campaign to reach out to employers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/campaigns/new" passHref>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> New Campaign
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
                  Status: <span className="capitalize">{campaign.status}</span>.
                  Created: {new Date(campaign.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {campaign.sent_emails?.length || 0} emails sent.
                  {campaign.status === "sent" &&
                    ` 
                    ${campaign.sent_emails?.filter((e) => e.reply_category === "Yes").length || 0} 
                    positive replies.`}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/campaigns/${campaign.id}`}>View Details</Link>
                  </Button>
                  {campaign.status === "draft" && (
                    <Button variant="default" size="sm" asChild>
                      <Link href={`/campaigns/${campaign.id}/edit`}>Edit</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
