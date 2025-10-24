import ZaleceniaKoniaClient from '@/app/zaleceniaLista/[id]/ZaleceniaKoniaClient';

interface PageProps {
  params: Promise<{ id: string | string[] }>;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const id = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id;

  return <ZaleceniaKoniaClient id={id} />;
}
