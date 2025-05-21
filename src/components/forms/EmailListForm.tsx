"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface EmailListFormProps {
  id?: string;
  initialData?: {
    name: string;
    emails: string[];
  };
}

export default function EmailListForm({ id, initialData }: EmailListFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [emailsText, setEmailsText] = useState(
    initialData?.emails.join("\n") || ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Basic validation
      if (!name.trim()) {
        throw new Error("Please enter a list name");
      }

      // Parse and validate emails
      const emails = emailsText
        .split("\n")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emails.filter((email) => !emailRegex.test(email));

      if (invalidEmails.length > 0) {
        throw new Error(`Invalid email(s): ${invalidEmails.join(", ")}`);
      }

      if (emails.length === 0) {
        throw new Error("Please enter at least one email address");
      }

      // Update or create the email list
      const { error: supabaseError } = id
        ? await supabase
            .from("email_lists")
            .update({ name, emails })
            .eq("id", id)
        : await supabase.from("email_lists").insert([{ name, emails }]);

      if (supabaseError) throw supabaseError;

      toast({
        title: id ? "Email list updated" : "Email list created",
        description: `Successfully ${
          id ? "updated" : "created"
        } email list "${name}"`,
      });

      router.push("/email-lists");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from("email_lists")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      toast({
        title: "Email list deleted",
        description: `Successfully deleted email list "${name}"`,
      });

      router.push("/email-lists");
      router.refresh();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete email list",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">List Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Tech Companies SF"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="emails">Email Addresses</Label>
        <Textarea
          id="emails"
          value={emailsText}
          onChange={(e) => setEmailsText(e.target.value)}
          placeholder="Enter one email address per line"
          rows={10}
          required
          disabled={isLoading}
        />
        <p className="text-sm text-muted-foreground">
          Enter one email address per line
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-4">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading
            ? id
              ? "Updating..."
              : "Creating..."
            : id
            ? "Update Email List"
            : "Create Email List"}
        </Button>

        {id && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isLoading}>
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  email list and remove it from any campaigns that use it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </form>
  );
}
