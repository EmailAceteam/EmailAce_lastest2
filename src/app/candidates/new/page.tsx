
// import CandidateForm from "@/components/forms/CandidateForm"; // Will be created later

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CandidateForm from "@/components/forms/CandidateForm";
 

export default function NewCandidatePage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Add New Candidate
        </h1>
        <p className="text-muted-foreground">
          Enter the details for the new candidate profile.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Candidate Information</CardTitle>
          <CardDescription>Fill in the form below to add a new candidate.</CardDescription>
        </CardHeader>
        <CardContent>
          <CandidateForm/>
          <p className="text-center text-muted-foreground py-8">Candidate form will be here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
