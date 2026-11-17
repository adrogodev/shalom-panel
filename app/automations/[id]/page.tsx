import { FlowBuilderPage } from '@/pages/automations';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ template?: string | string[] }>;
}) {
  const { id } = await params;
  const { template } = await searchParams;
  return (
    <FlowBuilderPage
      automationId={id}
      templateKey={typeof template === 'string' ? template : undefined}
    />
  );
}
