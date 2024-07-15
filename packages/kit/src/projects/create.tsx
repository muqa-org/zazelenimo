'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ProjectCreated } from '../api/types';
import { useCreateProject } from '../hooks/useProjects';
import { Button } from '../ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

const baseProjectSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  description: z.string().optional(),
});

export function CreateProject({
  onCreated,
}: {
  onCreated: (project: ProjectCreated) => void;
}) {
  const schema = baseProjectSchema;
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const create = useCreateProject();
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          console.log('create Project', values);
          create.mutate(values, { onSuccess: onCreated });
        })}
        className="mx-auto max-w-screen-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold">Create project</h3>
          <Button type="submit" isLoading={create.isPending}>
            Create Project
          </Button>
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project name</FormLabel>
              <FormControl>
                <Input placeholder="Project name..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project description</FormLabel>
              <FormControl>
                <Textarea
                  rows={8}
                  placeholder="Project description..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <FormDescription>Markdown is supported</FormDescription>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
