"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle, Send, RefreshCw, Loader2 } from "lucide-react";

interface ControlCenterProps {
  campaignId: string;
  initialData?: {
    name: string;
    generated_content: string;
    emails: {
      id: string;
      recipient_email: string;
      recipient_name: string;
      specific_content: string;
      status: string;
    }[];
  };
}


export default function ControlCenter({
  campaignId,
  initialData,
}: ControlCenterProps) {
  const [emails, setEmails] = useState(initialData?.emails || []);
  const [campaignName, setCampaignName] = useState(initialData?.name || "");
  const [baseContent, setBaseContent] = useState(
    initialData?.generated_content || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [sendingStatus, setSendingStatus] = useState<
    "idle" | "sending" | "sent" | "failed"
  >("idle");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCampaignData = async () => {
      if (!initialData) {
        setIsLoading(true);
        try {
          // Récupérer les données de la campagne
          const { data: campaign, error: campaignError } = await supabase
            .from("campaigns")
            .select(
              `
              name,
              generated_email_content,
              email_list:email_lists(emails)
            `
            )
            .eq("id", campaignId)
            .single();

          if (campaignError) throw campaignError;

          setCampaignName(campaign.name);
          setBaseContent(campaign.generated_email_content);

          // Récupérer ou créer les emails managés
          const { data: existingEmails, error: emailsError } = await supabase
            .from("managed_emails")
            .select("*")
            .eq("campaign_id", campaignId);

          if (emailsError) throw emailsError;

          if (existingEmails && existingEmails.length > 0) {
            setEmails(existingEmails);
          } else {
            // Créer les entrées pour chaque email
            const newEmails = campaign.email_list.emails.map(
              (email: string) => ({
                recipient_email: email,
                recipient_name: "",
                specific_content: campaign.generated_email_content,
                status: "pending",
              })
            );

            const { data: insertedEmails, error: insertError } = await supabase
              .from("managed_emails")
              .insert(
                newEmails.map((email: any) => ({
                  campaign_id: campaignId,
                  recipient_email: email.recipient_email,
                  specific_content: email.specific_content,
                  status: "pending",
                }))
              )
              .select();

            if (insertError) throw insertError;
            setEmails(insertedEmails || []);
          }
        } catch (err) {
          toast({
            title: "Error",
            description:
              err instanceof Error
                ? err.message
                : "Failed to load campaign data",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCampaignData();
  }, [campaignId, initialData, toast]);

  const handleContentChange = (id: string, value: string) => {
    setEmails(
      emails.map((email) =>
        email.id === id ? { ...email, specific_content: value } : email
      )
    );
  };

  const handleNameChange = (id: string, value: string) => {
    setEmails(
      emails.map((email) =>
        email.id === id ? { ...email, recipient_name: value } : email
      )
    );
  };

  const saveChanges = async (emailId: string) => {
    try {
      const emailToUpdate = emails.find((e) => e.id === emailId);
      if (!emailToUpdate) return;

      const { error } = await supabase
        .from("managed_emails")
        .update({
          recipient_name: emailToUpdate.recipient_name,
          specific_content: emailToUpdate.specific_content,
        })
        .eq("id", emailId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Changes saved successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
  };

  const sendTestEmail = async (emailId: string) => {
    try {
      const emailToSend = emails.find((e) => e.id === emailId);
      if (!emailToSend) return;

      setIsLoading(true);

      // Ici vous devrez implémenter la logique d'envoi réel
      // Ceci est un exemple avec Supabase Functions
      const { error } = await supabase
        .from("managed_emails")
        .update({
          status: "sending",
        })
        .eq("id", emailId);

      if (error) throw error;

      // Simuler l'envoi (remplacer par un vrai appel à votre service d'email)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await supabase
        .from("managed_emails")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", emailId);

      setEmails(
        emails.map((email) =>
          email.id === emailId ? { ...email, status: "sent" } : email
        )
      );

      toast({
        title: "Test email sent",
        description: `Test email sent to ${emailToSend.recipient_email}`,
      });
    } catch (err) {
      await supabase
        .from("managed_emails")
        .update({
          status: "failed",
        })
        .eq("id", emailId);

      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendAllEmails = async () => {
    try {
      setSendingStatus("sending");

      // Mettre à jour le statut de la campagne
      await supabase
        .from("campaigns")
        .update({
          status: "sending",
        })
        .eq("id", campaignId);

      // Envoyer chaque email (simulé)
      for (const email of emails) {
        if (email.status !== "pending") continue;

        try {
          await supabase
            .from("managed_emails")
            .update({
              status: "sending",
            })
            .eq("id", email.id);

          // Simuler l'envoi (remplacer par un vrai appel)
          await new Promise((resolve) => setTimeout(resolve, 1000));

          await supabase
            .from("managed_emails")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", email.id);

          setEmails((prev) =>
            prev.map((e) => (e.id === email.id ? { ...e, status: "sent" } : e))
          );
        } catch (err) {
          await supabase
            .from("managed_emails")
            .update({
              status: "failed",
            })
            .eq("id", email.id);

          setEmails((prev) =>
            prev.map((e) =>
              e.id === email.id ? { ...e, status: "failed" } : e
            )
          );
        }
      }

      // Mettre à jour le statut de la campagne
      await supabase
        .from("campaigns")
        .update({
          status: "sent",
        })
        .eq("id", campaignId);

      setSendingStatus("sent");
      toast({
        title: "Campaign sent",
        description: "All emails have been sent successfully",
      });
    } catch (err) {
      setSendingStatus("failed");
      toast({
        title: "Error",
        description: "Failed to send campaign",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "sending":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const setSpecificContent = (id: string, baseContent: string) => {
    setEmails(
      emails.map((email) =>
        email.id === id ? { ...email, specific_content: baseContent } : email
      )
    );

    // Optionnel: Sauvegarde automatique en base de données
    const updateDb = async () => {
      try {
        const { error } = await supabase
          .from("managed_emails")
          .update({ specific_content: baseContent })
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Content reset",
          description: "Email content has been reset to campaign default",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to save reset content",
          variant: "destructive",
        });
      }
    };

    updateDb();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{campaignName}</h2>
        <Button
          onClick={sendAllEmails}
          disabled={
            sendingStatus === "sending" ||
            emails.every((e) => e.status === "sent")
          }
        >
          {sendingStatus === "sending" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {sendingStatus === "sending" ? "Sending..." : "Send All Emails"}
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emails.map((email) => (
              <TableRow key={email.id}>
                <TableCell>
                  <div className="space-y-1">
                    <p>{email.recipient_email}</p>
                    <Input
                      value={email.recipient_name || ""}
                      onChange={(e) =>
                        handleNameChange(email.id, e.target.value)
                      }
                      placeholder="Recipient name"
                      className="w-full"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(email.status)}
                    <span className="capitalize">{email.status}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Label>Email Content</Label>
                    <Textarea
                      value={email.specific_content}
                      onChange={(e) =>
                        handleContentChange(email.id, e.target.value)
                      }
                      className="min-h-[200px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveChanges(email.id)}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setSpecificContent(email.id, baseContent)
                        }
                      >
                        Reset to Default
                      </Button>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendTestEmail(email.id)}
                    disabled={isLoading}
                  >
                    Send Test
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
