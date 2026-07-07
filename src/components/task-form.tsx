import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useCreateTask,
  useListProjects,
  getListTasksQueryKey,
  getGetTaskStatsQueryKey,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  priority: z.enum(["high", "medium", "low"]).optional(),
  estimatedMinutes: z.coerce.number().optional().or(z.literal("")),
  deadline: z.string().optional(),
  projectId: z.string().optional(),
});

export function TaskForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: projects } = useListProjects();
  const { styleProfile } = useTheme();
  const technical = styleProfile === "technical";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", priority: "medium", estimatedMinutes: "", deadline: "", projectId: "none" },
  });

  const createTask = useCreateTask({
    mutation: {
      onSuccess: () => {
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Error creating task", description: err.message, variant: "destructive" });
      },
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createTask.mutate({
      data: {
        title: values.title,
        priority: values.priority as any,
        estimatedMinutes: values.estimatedMinutes ? Number(values.estimatedMinutes) : undefined,
        deadline: values.deadline || undefined,
        projectId: values.projectId && values.projectId !== "none" ? Number(values.projectId) : undefined,
      },
    });
  }

  const inputBase = cn(
    "border-border focus-visible:ring-primary bg-background",
    technical ? "font-mono text-xs" : "font-sans text-sm",
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-2 border border-border p-2", technical ? "bg-background rounded-md" : "bg-card rounded-2xl shadow-sm")}
      >
        {/* Primary row: title + submit */}
        <div className="flex items-center gap-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="flex-1 min-w-0 space-y-0">
                <FormControl>
                  <Input
                    placeholder={technical ? "NEW_TASK_INPUT_>" : "Add a task…"}
                    {...field}
                    className={cn(
                      "border-0 focus-visible:ring-0 shadow-none h-8 bg-transparent placeholder:text-muted-foreground/50",
                      technical ? "font-mono text-sm" : "font-sans text-sm",
                    )}
                    autoComplete="off"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            type="submit"
            size="sm"
            disabled={createTask.isPending}
            className={cn(
              "h-8 px-3 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90",
              technical ? "font-mono text-xs" : "font-sans text-xs font-medium rounded-full",
            )}
          >
            {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            {technical ? "ADD" : "Add"}
          </Button>
        </div>

        {/* Secondary controls row */}
        <div className="flex flex-wrap items-center gap-2">
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    min={new Date().toISOString().split("T")[0]}
                    className={cn("h-7 w-36 border-border focus-visible:ring-primary", inputBase)}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimatedMinutes"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <Input
                    placeholder={technical ? "MINS" : "mins"}
                    type="number"
                    {...field}
                    value={field.value ?? ""}
                    className={cn("h-7 w-20 border-border focus-visible:ring-primary", technical ? "uppercase" : "", inputBase)}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className={cn("h-7 w-24 border-border focus:ring-primary", technical ? "uppercase" : "", inputBase)}>
                      <SelectValue placeholder={technical ? "PRIORITY" : "Priority"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">{technical ? "LOW" : "Low"}</SelectItem>
                    <SelectItem value="medium">{technical ? "MED" : "Medium"}</SelectItem>
                    <SelectItem value="high">{technical ? "HIGH" : "High"}</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {projects && projects.length > 0 && (
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={cn("h-7 w-32 border-border focus:ring-primary", inputBase)}>
                        <SelectValue placeholder={technical ? "PROJECT" : "Project"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No project</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          )}
        </div>
      </form>
    </Form>
  );
}
