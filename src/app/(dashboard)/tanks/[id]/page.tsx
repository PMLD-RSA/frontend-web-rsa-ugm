import { TankDetailPage } from '@/components/tanks/TankDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TankDetailPage id={id} />;
}
