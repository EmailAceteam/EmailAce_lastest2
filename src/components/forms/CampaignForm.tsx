"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/Collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CampaignFormProps {
  id?: string;
  initialData?: {
    name: string;
    candidate_id: string;
    email_list_id: string;
    template_id: string;
    job_description?: string;
    email_subject?: string;
    generated_email_content?: string;
  };
}

export default function CampaignForm({ id, initialData }: CampaignFormProps) {
  // États du formulaire
  const [name, setName] = useState(initialData?.name || "");
  const [candidateId, setCandidateId] = useState(
    initialData?.candidate_id || ""
  );
  const [emailListId, setEmailListId] = useState(
    initialData?.email_list_id || ""
  );
  const [templateId, setTemplateId] = useState(initialData?.template_id || "");
  const [jobDescription, setJobDescription] = useState(
    initialData?.job_description || ""
  );
  const [emailSubject, setEmailSubject] = useState(
    initialData?.email_subject || ""
  );
  const [generatedContent, setGeneratedContent] = useState(
    initialData?.generated_email_content ||
      "<p>Sélectionnez un modèle pour voir l'aperçu</p>"
  );

  // États pour les données
  const [rawTemplate, setRawTemplate] = useState({
    content: "",
    subject: "",
  });
  const [candidates, setCandidates] = useState<any[]>([]);
  const [emailLists, setEmailLists] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  // États UI
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedList, setExpandedList] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  // Charger les options du formulaire
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [
          { data: candidatesData },
          { data: emailListsData },
          { data: templatesData },
        ] = await Promise.all([
          supabase.from("candidates").select("*"),
          supabase.from("email_lists").select("*"),
          supabase.from("email_templates").select("*"),
        ]);

        if (candidatesData) setCandidates(candidatesData);
        if (emailListsData) setEmailLists(emailListsData);
        if (templatesData) setTemplates(templatesData);
      } catch (err) {
        console.error("Error fetching options:", err);
        setError("Failed to load form options");
        toast({
          title: "Error",
          description: "Failed to load form options",
          variant: "destructive",
        });
      }
    };

    fetchOptions();
  }, [toast]);

  // Charger le template sélectionné
  useEffect(() => {
    const loadTemplate = async () => {
      if (!templateId) return;

      const { data: template } = await supabase
        .from("email_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (template) {
        setRawTemplate({
          content: template.content,
          subject: template.subject,
        });
        setGeneratedContent(template.content);
        setEmailSubject(template.subject);
      }
    };

    loadTemplate();
  }, [templateId]);

  // Mettre à jour l'aperçu quand les données changent
  useEffect(() => {
    updatePreview();
  }, [candidateId, rawTemplate, jobDescription]);

  const updatePreview = () => {
    if (!rawTemplate.content) return;

    let content = rawTemplate.content;
    let subject = emailSubject;

    // Remplacer les placeholders si un candidat est sélectionné
    if (candidateId) {
      const candidate = candidates.find((c) => c.id === candidateId);
      if (candidate) {
        // Remplacer les placeholders spécifiques
        content = content
          .replace(/{{candidateName}}/g, candidate.name || "")
          .replace(
            /{{candidateAge}}/g,
            candidate.birth_date
              ? (
                  new Date().getFullYear() -
                  new Date(candidate.birth_date).getFullYear()
                ).toString()
              : ""
          )
          .replace(/{{languageLevel}}/g, candidate.language_level || "");

        subject = subject.replace(/{{candidateName}}/g, candidate.name || "");
      }
    }

    // Remplacer les infos sur le poste si description fournie
    if (jobDescription) {
      const jobTitle = jobDescription.split("\n")[0] || "";
      content = content
        .replace(/{{jobTitle}}/g, jobTitle)
        .replace(/{{jobDescription}}/g, jobDescription);
    }

    setGeneratedContent(content);
    setEmailSubject(subject);
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validation des champs obligatoires
      if (!name.trim()) throw new Error("Veuillez entrer un nom de campagne");
      if (!candidateId) throw new Error("Veuillez sélectionner un candidat");
      if (!emailListId)
        throw new Error("Veuillez sélectionner une liste d'emails");
      if (!templateId) throw new Error("Veuillez sélectionner un modèle");
      if (!emailSubject.trim())
        throw new Error("Veuillez entrer un sujet d'email");

      // Sauvegarde en base de données
      const { data: campaign, error: supabaseError } = id
        ? await supabase
            .from("campaigns")
            .update({
              name,
              candidate_id: candidateId,
              email_list_id: emailListId,
              template_id: templateId,
              job_description: jobDescription || null,
              email_subject: emailSubject,
              generated_email_content: generatedContent,
              status: "draft",
              updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single()
        : await supabase
            .from("campaigns")
            .insert([
              {
                name,
                candidate_id: candidateId,
                email_list_id: emailListId,
                template_id: templateId,
                job_description: jobDescription || null,
                email_subject: emailSubject,
                generated_email_content: generatedContent,
                status: "draft",
                user_id: (await supabase.auth.getUser()).data.user?.id,
              },
            ])
            .select()
            .single();

      if (supabaseError) throw supabaseError;
      if (!campaign) throw new Error("Échec de l'enregistrement");

      // Notification de succès
      toast({
        title: id ? "Campagne mise à jour" : "Campagne créée",
        description: `Campagne "${name}" ${
          id ? "mise à jour" : "créée"
        } avec succès`,
      });

      // Redirection
      router.push("/campaigns");
      router.refresh();
    } catch (err) {
      // Gestion des erreurs
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      toast({
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Suppression d'une campagne
  const handleDelete = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Campagne supprimée",
        description: "La campagne a été supprimée avec succès",
      });

      router.push("/campaigns");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
      toast({
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Erreur lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle l'expansion de la liste d'emails
  const toggleListExpansion = (listId: string) => {
    setExpandedList(expandedList === listId ? null : listId);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Colonne de gauche - Formulaire */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la campagne *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Campagne Q2 Entreprises Tech"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="candidate">Candidat *</Label>
              <Select
                value={candidateId}
                onValueChange={setCandidateId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un candidat" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailList">Liste d'emails *</Label>
              <Select
                value={emailListId}
                onValueChange={setEmailListId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une liste d'emails" />
                </SelectTrigger>
                <SelectContent>
                  {emailLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name} ({list.emails.length} emails)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {emailListId && (
                <div className="mt-2 border rounded-lg p-4">
                  {emailLists
                    .filter((list) => list.id === emailListId)
                    .map((list) => (
                      <Collapsible
                        key={list.id}
                        open={expandedList === list.id}
                        onOpenChange={() => toggleListExpansion(list.id)}
                      >
                        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                          {expandedList === list.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="font-medium">
                            {list.name} ({list.emails.length} emails)
                          </span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 pl-6">
                          <div className="max-h-60 overflow-y-auto border rounded p-2 bg-muted/50">
                            {list.emails.map((email: string) => (
                              <div key={email} className="py-1 text-sm">
                                {email}
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Modèle d'email *</Label>
              <Select
                value={templateId}
                onValueChange={setTemplateId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un modèle" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailSubject">Sujet de l'email *</Label>
              <Input
                id="emailSubject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Sujet de l'email"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobDescription">
                Description du poste (Optionnel)
              </Label>
              <Textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Entrez le titre ou la description du poste..."
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Colonne de droite - Aperçu */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Aperçu du message</Label>
              <div className="border rounded-lg p-4 h-full min-h-[400px]">
                <div className="font-medium mb-2">
                  Sujet: {emailSubject || "[Aucun sujet]"}
                </div>
                <div className="border-t pt-2">
                  <iframe
                    srcDoc={generatedContent}
                    className="w-full h-[350px] border rounded bg-white"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-4">
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading
              ? id
                ? "Mise à jour..."
                : "Création..."
              : id
              ? "Mettre à jour la campagne"
              : "Créer la campagne"}
          </Button>

          {id && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isLoading}>
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. La campagne et toutes ses
                    données associées seront définitivement supprimées.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Confirmer la suppression
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </form>
    </div>
  );
}
