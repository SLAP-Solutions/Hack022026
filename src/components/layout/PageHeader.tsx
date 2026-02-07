import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
    icon?: LucideIcon;
    title: string;
    subtitle?: string;
    children?: ReactNode;
}

export function PageHeader({ icon: Icon, title, subtitle, children }: PageHeaderProps) {
    return (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky z-10">
            <div className="px-6 py-2 flex items-center gap-3">
                {Icon && (
                    <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <h1 className="text-lg font-semibold font-serif">{title}</h1>
                    </div>
                )}
                {!Icon && (
                    <h1 className="text-lg font-semibold font-serif">{title}</h1>
                )}
                {subtitle && (
                    <>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{subtitle}</span>
                    </>
                )}
                {children && (
                    <div className="ml-auto flex items-center gap-3">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
