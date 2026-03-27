import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
  );
}
