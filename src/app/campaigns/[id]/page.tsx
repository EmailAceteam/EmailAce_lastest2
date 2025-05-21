"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  HelpCircle,
  MessageSquare,
  Paperclip,
  Send,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import type { Campaign, SentEmailLog, ReplyCategory } from "@/types"; // Assuming types are defined
import * as React from "react"; // For useState

// Mock data - in a real app, fetch this based on params.id
const mockCampaign: Campaign = {
  id: "1",
  name: "Frontend Developer Q3 Outreach",
  candidateId: "cand1",
  candidate: {
    id: "cand1",
    name: "Alice Smith",
    information: "Frontend dev",
    createdAt: new Date(),
    updatedAt: new Date(),
    date_of_birth: "",
    language_level: "",
  },
  emailListId: "list1",
  emailList: {
    id: "list1",
    name: "Tech Companies",
    emails: ["hr@companya.com", "jobs@companyb.com"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  templateId: "temp1",
  template: {
    id: "temp1",
    name: "Initial Application",
    subjectTemplate: "Application for Frontend Role",
    bodyTemplate: "Dear {{contactPerson}}, ...",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  status: "sent",
  jobDescription: "Looking for a skilled frontend developer...",
  createdAt: new Date(2023, 8, 1),
  updatedAt: new Date(2023, 8, 2),
  sentEmails: [
    {
      id: "se1",
      recipientEmail: "hr@companya.com",
      sentAt: new Date(2023, 8, 1, 10, 0),
      status: "delivered",
      replyCategory: "Yes",
      replySummary: "Very interested, please schedule an interview.",
    },
    {
      id: "se2",
      recipientEmail: "jobs@companyb.com",
      sentAt: new Date(2023, 8, 1, 10, 5),
      status: "delivered",
      replyCategory: "No",
      replySummary: "Thank you, but the position has been filled.",
    },
    {
      id: "se3",
      recipientEmail: "careers@companyc.com",
      sentAt: new Date(2023, 8, 1, 10, 10),
      status: "bounced",
      errorMessage: "User unknown",
    },
    {
      id: "se4",
      recipientEmail: "info@companyd.com",
      sentAt: new Date(2023, 8, 1, 10, 15),
      status: "delivered",
      replyCategory: "Other",
      replySummary: "Automated reply: We have received your application.",
    },
    {
      id: "se5",
      recipientEmail: "recruit@companye.com",
      sentAt: new Date(2023, 8, 1, 10, 20),
      status: "delivered",
    },
  ],
};

const ReplyCategoryIcon = ({ category }: { category?: ReplyCategory }) => {
  if (category === "Yes")
    return <ThumbsUp className="h-5 w-5 text-green-500" />;
  if (category === "No") return <ThumbsDown className="h-5 w-5 text-red-500" />;
  if (category === "Other")
    return <HelpCircle className="h-5 w-5 text-yellow-500" />;
  return <MessageSquare className="h-5 w-5 text-muted-foreground" />;
};

interface CampaignDetailsPageProps {
  params: { id: string };
}

export default function CampaignDetailsPage({
  params,
}: CampaignDetailsPageProps) {
  const campaignId = params.id;
  const campaign = mockCampaign; // Use mockCampaign, replace with fetch in real app

  const [emailReplyText, setEmailReplyText] = React.useState("");
  const [categorizationResult, setCategorizationResult] = React.useState<{
    summary: string;
    category: ReplyCategory;
  } | null>(null);
  const [isCategorizing, setIsCategorizing] = React.useState(false);
  const [selectedEmailForReply, setSelectedEmailForReply] =
    React.useState<SentEmailLog | null>(null);

  const handleCategorizeReply = async () => {
    if (!emailReplyText || !selectedEmailForReply) return;
    setIsCategorizing(true);
    // In a real app, call the AI flow:
    // const result = await summarizeEmailReply({ emailReply: emailReplyText });
    // setCategorizationResult(result);
    // Then, update the specific sentEmailLog in your backend.

    // Mock AI call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const categories: ReplyCategory[] = ["Yes", "No", "Other"];
    const randomCategory =
      categories[Math.floor(Math.random() * categories.length)];
    setCategorizationResult({
      summary: `This is a mock summary for the reply to ${selectedEmailForReply.recipientEmail}. The content suggests the category.`,
      category: randomCategory,
    });
    // Update mock data (client-side for demo)
    const updatedSentEmails = campaign.sentEmails.map((email) =>
      email.id === selectedEmailForReply.id
        ? {
            ...email,
            replyCategory: randomCategory,
            replySummary: `Mock summary: ${emailReplyText.substring(0, 50)}...`,
          }
        : email
    );
    // This would typically be a state update if campaign data was in state
    // For now, it just affects categorizationResult display
    setIsCategorizing(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Campaign: {campaign.name}
        </h1>
        <p className="text-muted-foreground">
          Details and tracking for campaign ID: {campaignId}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Candidate:</Label>{" "}
            <span className="text-foreground">{campaign.candidate?.name}</span>
          </div>
          <div>
            <Label>Email List:</Label>{" "}
            <span className="text-foreground">{campaign.emailList?.name}</span>
          </div>
          <div>
            <Label>Template:</Label>{" "}
            <span className="text-foreground">{campaign.template?.name}</span>
          </div>
          <div>
            <Label>Status:</Label>{" "}
            <Badge
              variant={campaign.status === "sent" ? "default" : "secondary"}
              className={
                campaign.status === "sent" ? "bg-green-500 text-white" : ""
              }
            >
              {campaign.status}
            </Badge>
          </div>
          <div>
            <Label>Created At:</Label>{" "}
            <span className="text-foreground">
              {campaign.createdAt.toLocaleDateString()}
            </span>
          </div>
          {campaign.jobDescription && (
            <div>
              <Label>Job Description:</Label>{" "}
              <p className="text-sm text-muted-foreground truncate">
                {campaign.jobDescription}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sent Emails & Replies</CardTitle>
          <CardDescription>
            {campaign.sentEmails.length} emails in this campaign.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaign.sentEmails.length === 0 ? (
            <p className="text-muted-foreground">
              No emails sent for this campaign yet.
            </p>
          ) : (
            <div className="space-y-4">
              {campaign.sentEmails.map((email) => (
                <Card key={email.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-foreground">
                        {email.recipientEmail}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Sent: {email.sentAt.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          email.status === "delivered"
                            ? "default"
                            : email.status === "bounced"
                            ? "destructive"
                            : "secondary"
                        }
                        className={
                          email.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : email.status === "bounced"
                            ? "bg-red-100 text-red-800"
                            : ""
                        }
                      >
                        {email.status}
                      </Badge>
                      {email.status === "delivered" && (
                        <ReplyCategoryIcon category={email.replyCategory} />
                      )}
                    </div>
                  </div>
                  {email.replySummary && (
                    <p className="text-sm text-muted-foreground mt-1 italic">
                      Summary: {email.replySummary}
                    </p>
                  )}
                  {email.status === "delivered" && !email.replyCategory && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => {
                        setSelectedEmailForReply(email);
                        setCategorizationResult(null);
                        setEmailReplyText("");
                      }}
                    >
                      Categorize Reply
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEmailForReply && (
        <Card>
          <CardHeader>
            <CardTitle>
              Categorize Reply for {selectedEmailForReply.recipientEmail}
            </CardTitle>
            <CardDescription>
              Paste the email reply below to categorize it using AI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="emailReply">Email Reply Content</Label>
              <Textarea
                id="emailReply"
                value={emailReplyText}
                onChange={(e) => setEmailReplyText(e.target.value)}
                placeholder="Paste the full email reply here..."
                rows={8}
              />
            </div>
            <Button
              onClick={handleCategorizeReply}
              disabled={isCategorizing || !emailReplyText}
              className="w-full"
            >
              {isCategorizing ? "Categorizing..." : "Categorize with AI"}
            </Button>
            {categorizationResult && (
              <div className="p-4 border rounded-md bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <ReplyCategoryIcon category={categorizationResult.category} />
                  <h4 className="font-semibold text-foreground">
                    AI Categorization: {categorizationResult.category}
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  {categorizationResult.summary}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
