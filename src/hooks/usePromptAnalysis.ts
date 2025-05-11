
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Question, Variable, UploadedImage } from "@/components/dashboard/types";
import { useToast } from "@/hooks/use-toast";
import { GPT41_ID } from "@/services/model/ModelFetchService";
import { cleanTemplate } from "@/utils/cleanTemplate";

type LoadingState = {
  isLoading: boolean;
  message:  string;
};

export const usePromptAnalysis = (
  promptText:         string,
  setQuestions:       (q: Question[]) => void,
  setVariables:       (v: Variable[]) => void,
  setMasterCommand:   (c: string)      => void,
  setFinalPrompt:     (p: string)      => void,
  jumpToStep:         (n: number)      => void,
  user:               any,
  currentPromptId:    string | null
) => {
  const [loading, setLoading] = useState<LoadingState>({ isLoading:false, message:"" });
  const { toast }  = useToast();

  /* ---------- helpers ---------- */
  const setLoad = (msg = "", flag = true) => setLoading({ isLoading: flag, message: msg });

  const handleAnalyze = async (
    images: UploadedImage[] | null,
    websiteCtx: {url:string; instructions:string} | null,
    smartCtx  : {context:string; usageInstructions:string} | null
  ) => {
    if (!promptText.trim()) {
      toast({ title:"Empty prompt", description:"Type something first.", variant:"destructive" });
      return;
    }

    try {
      setLoad("Analyzing your prompt…");

      const payload: any = {
        promptText,
        userId   : user?.id ?? null,
        promptId : currentPromptId,
        model    : GPT41_ID,
        template : cleanTemplate(null),    // you may pass a template later
        imageData: images ?? undefined,
        websiteData: websiteCtx ?? undefined,
        smartContextData: smartCtx ?? undefined,
      };

      const { data, error } = await supabase.functions.invoke("analyze-prompt", { body: payload });
      if (error || !data) throw new Error(error?.message || "No data returned");

      setQuestions(  data.questions  ?? [] );
      setVariables(  data.variables  ?? [] );
      setMasterCommand(data.masterCommand ?? "");
      setFinalPrompt( data.enhancedPrompt ?? "" );

      jumpToStep(2);                       // 👈 move on
    } catch (err: any) {
      console.error(err);
      toast({ title:"Analysis failed", description: err.message ?? String(err), variant:"destructive" });
    } finally {
      setLoad("", false);
    }
  };

  const enhancePromptWithGPT = async (
    prompt:            string,
    primary:           string | null,
    secondary:         string | null,
    setFinal:          (p:string)=>void,
    answered:          Question[],
    vars:              Variable[],
    template:          any
  ) => {
    setLoad("Enhancing prompt with GPT-4.1…");
    try {
      const { data, error } = await supabase.functions.invoke("enhance-prompt", {
        body: { originalPrompt:prompt, answeredQuestions:answered, relevantVariables:vars,
                primaryToggle:primary, secondaryToggle:secondary, template }
      });
      if (error || !data?.enhancedPrompt) throw new Error(error?.message || "No enhanced prompt returned");
      setFinal(data.enhancedPrompt);
    } catch (e:any) {
      toast({ title:"Enhancement failed", description:e.message ?? String(e), variant:"destructive" });
    } finally {
      setLoad("",false);
    }
  };

  return {
    isLoading:          loading.isLoading,
    currentLoadingMessage: loading.message,
    loadingState:       loading,
    handleAnalyze,
    enhancePromptWithGPT
  };
};
