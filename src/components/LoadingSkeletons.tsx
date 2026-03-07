import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
    return (
        <div className="flex min-h-screen flex-col items-center bg-background px-6 pb-32 pt-12">
            <div className="mb-8 flex w-full max-w-sm flex-col gap-2">
                <Skeleton className="h-8 w-40 rounded-lg" />
                <Skeleton className="h-3 w-24 rounded-full" />
            </div>

            <div className="grid w-full max-w-sm grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                    <div key={i} className="rounded-[28px] bg-card/40 p-5 border border-border/30 space-y-4 shadow-sm">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-3 w-16 rounded-full opacity-60" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 w-full max-w-sm rounded-[32px] bg-secondary/30 p-6 border border-border/20 shadow-xl">
                <div className="flex items-end justify-between mb-5">
                    <div className="space-y-2">
                        <Skeleton className="h-2 w-24 rounded-full" />
                        <Skeleton className="h-4 w-40 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-12 rounded-lg" />
                </div>
                <Skeleton className="h-4 w-full rounded-full" />
            </div>

            <div className="mt-16 flex flex-col items-center">
                <Skeleton className="h-60 w-60 rounded-full shadow-2xl" />
                <div className="mt-8 space-y-2 flex flex-col items-center">
                    <Skeleton className="h-3 w-32 rounded-full" />
                    <Skeleton className="h-6 w-40 rounded-xl opacity-40" />
                </div>
            </div>
        </div>
    );
}

export function VaultSkeleton() {
    return (
        <div className="min-h-screen px-6 pb-32 pt-16 relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[20%] right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
            </div>
            <div className="mx-auto max-w-sm px-6 relative z-10 space-y-8">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-[22px]" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-40 rounded-xl" />
                        <Skeleton className="h-3 w-20 rounded-full opacity-60" />
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-[32px] bg-card/40 p-5 space-y-4 border border-border/20 shadow-xl overflow-hidden">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-14 w-14 rounded-2xl" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-6 w-3/4 rounded-xl" />
                                    <Skeleton className="h-3 w-1/2 rounded-full opacity-60" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function ContactSkeleton() {
    return (
        <div className="min-h-screen px-6 pb-32 pt-16">
            <div className="mx-auto max-w-sm space-y-8">
                <div className="space-y-3">
                    <Skeleton className="h-10 w-40 rounded-2xl" />
                    <Skeleton className="h-4 w-56 rounded-full opacity-60" />
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-4 rounded-[28px] bg-card/40 p-4 border border-border/20 shadow-lg">
                            <Skeleton className="h-14 w-14 rounded-full shadow-md" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-32 rounded-full font-bold" />
                                <Skeleton className="h-3 w-40 rounded-full opacity-60" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function LibrarySkeleton() {
    return (
        <div className="min-h-screen px-6 pb-32 pt-16">
            <div className="mx-auto max-w-sm space-y-10">
                <div className="flex items-center gap-5">
                    <Skeleton className="h-16 w-16 rounded-[22px] shadow-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-32 rounded-xl" />
                        <Skeleton className="h-3 w-48 rounded-full opacity-60" />
                    </div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex w-full items-center gap-5 rounded-[32px] bg-card/40 p-5 border border-border/20 shadow-xl">
                            <Skeleton className="h-16 w-16 rounded-[24px]" />
                            <div className="flex-1 space-y-3">
                                <Skeleton className="h-5 w-24 rounded-full" />
                                <Skeleton className="h-3 w-20 rounded-full opacity-60" />
                            </div>
                            <Skeleton className="h-10 w-10 rounded-full opacity-30" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function SettingsSkeleton() {
    return (
        <div className="min-h-screen px-6 pb-32 pt-16 bg-background">
            <div className="mx-auto max-w-sm space-y-10">
                <Skeleton className="h-10 w-40 rounded-2xl" />

                <div className="flex items-center gap-5 rounded-[32px] bg-secondary/30 p-6 border border-white/5">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <div className="flex-1 space-y-3">
                        <Skeleton className="h-6 w-32 rounded-full" />
                        <Skeleton className="h-3 w-40 rounded-full opacity-40" />
                    </div>
                </div>

                {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="h-3 w-24 rounded-full opacity-40 ml-1" />
                        <div className="rounded-[28px] bg-card/40 border border-border/20 overflow-hidden divide-y divide-border/20">
                            {[1, 2, 3].map((j) => (
                                <div key={j} className="flex items-center justify-between p-5">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-10 w-10 rounded-xl" />
                                        <Skeleton className="h-4 w-28 rounded-full" />
                                    </div>
                                    <Skeleton className="h-4 w-4 rounded-full opacity-20" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
