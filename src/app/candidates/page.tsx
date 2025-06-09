// src/app/candidates/pagex.tsx

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Users } from "lucide-react";
import { supabase } from '@/lib/supabase';

async function getCandidates() {
  const { data: candidates, error } = await supabase
    .from('candidates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return candidates;
}

export default async function CandidatesPage() {
  const candidates = await getCandidates();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Manage Candidates
          </h1>
          <p className="text-muted-foreground">
            Add, view, and edit candidate profiles.
          </p>
        </div>
        <Link href="/candidates/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Candidate
          </Button>
        </Link>
      </div>

      {candidates.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <CardHeader className="items-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>No Candidates Yet</CardTitle>
            <CardDescription>Start by adding your first candidate profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/candidates/new" passHref>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Candidate
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {candidates.map(candidate => (
            <Card key={candidate.id}>
              <CardHeader>
                <CardTitle>{candidate.name}</CardTitle>
                <CardDescription>
                  Language Level: {candidate.language_level}
                  <br />
                  Added: {new Date(candidate.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/candidates/${candidate.id}/edit`}>Edit</Link>
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