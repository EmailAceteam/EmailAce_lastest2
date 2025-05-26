"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TemplateForm from "@/components/forms/TemplateForm";

export default function NewTemplatePage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Create New Email Template
        </h1>
        <p className="text-muted-foreground">
          Design a reusable template for your email campaigns.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
          <CardDescription>
            Define the subject and body for your email template. Use
            placeholders like {"{{candidateName}}"} or {"{{jobTitle}}"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateForm />
        </CardContent>
      </Card>
    </div>
  );
}
