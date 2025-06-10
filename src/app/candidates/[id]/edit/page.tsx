// src/app/candidates/[id]/edit/pagex.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CandidateForm from "@/components/forms/CandidateForm";
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

interface EditCandidatePageProps {
  params: { id: string };
}

async function getCandidate(id: string) {
  const { data: candidate, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !candidate) return null;
  return candidate;
}

export default async function EditCandidatePage({ params }: EditCandidatePageProps) {
  const candidate = await getCandidate(params.id);
  
  if (!candidate) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Edit Candidate
        </h1>
        <p className="text-muted-foreground">
          Update the details for {candidate.name}.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Candidate Information</CardTitle>
          <CardDescription>Modify the form below to update the candidate.</CardDescription>
        </CardHeader>
        <CardContent>
          <CandidateForm id={params.id} initialData={candidate} />
        </CardContent>
      </Card>
    </div>
  );
}