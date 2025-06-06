/*

// app/api/campaigns/send/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { supabase } from "@/lib/supabase";

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Type for request body
interface EmailRequest {
  campaignId: string;
  recipientEmail: string;
  subject: string;
  content: string;
}

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export async function POST(request: Request) {
  let campaignId: string = "";
  let recipientEmail: string = "";

  
  try {
    const body: EmailRequest = await request.json();
    campaignId = body.campaignId;
    recipientEmail = body.recipientEmail;
    const { subject, content } = body;

    // Validate required fields
    if (!campaignId) {
      throw new Error("Campaign ID is required");
    }
    if (!recipientEmail || !emailRegex.test(recipientEmail)) {
      throw new Error("Valid recipient email is required");
    }
    if (!subject) {
      throw new Error("Email subject is required");
    }
    if (!content) {
      throw new Error("Email content is required");
    }

    // Validate email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      throw new Error("Email configuration is missing");
    }

    // Validate sender email
    if (!emailRegex.test(process.env.EMAIL_USER)) {
      throw new Error("Invalid sender email configuration");
    }

    console.log(
      `Sending email for campaign ${campaignId} to ${recipientEmail}`
    );

    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: subject,
      text: content,
      html: content, // Ajout du HTML au cas où
    });

    console.log("Email sent successfully:", info.messageId);

    // Update sent_emails status
    const { error: updateError } = await supabase
      .from("sent_emails")
      .update({
        status: "delivered",
        sent_at: new Date().toISOString(),
        message_id: info.messageId,
      })
      .eq("campaign_id", campaignId)
      .eq("recipient_email", recipientEmail);

    if (updateError) {
      console.error("Error updating sent_emails status:", updateError);
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error: unknown) {
    console.error("Error sending email:", error);

    // Update sent_emails status to failed
    if (campaignId && recipientEmail) {
      try {
        await supabase
          .from("sent_emails")
          .update({
            status: "failed",
            error_message:
              error instanceof Error ? error.message : "Unknown error",
          })
          .eq("campaign_id", campaignId)
          .eq("recipient_email", recipientEmail);
      } catch (updateError) {
        console.error("Error updating failure status:", updateError);
      }
    }

    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


*/