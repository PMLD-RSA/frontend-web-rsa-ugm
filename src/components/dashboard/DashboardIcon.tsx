import Image from 'next/image';

export function DashboardIcon({ name, width, height = width }: { name: string; width: number; height?: number }) {
  return <Image src={`/images/dashboard/${name}.svg`} alt="" width={width} height={height} unoptimized draggable={false} />;
}
