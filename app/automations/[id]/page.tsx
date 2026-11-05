import { FlowBuilderPage } from '@/pages/automations';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FlowBuilderPage automationId={id} />;
}
