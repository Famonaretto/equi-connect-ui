import ZaleceniaKoniaClient from '../../zaleceniaLista/[id]/ZaleceniaKoniaClient';

interface PageProps {
  params: Promise<{ id: string | string[] }>;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const parsedId = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id;
  return <ZaleceniaKoniaClient id={parsedId} />;
}
