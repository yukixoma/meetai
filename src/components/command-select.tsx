"use client";

import { ReactNode, useState } from "react";

import { Button } from "./ui/button";
import {
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
    CommandResponsiveDialog,
} from "./ui/command";

import { cn } from "@/lib/utils";

import { ChevronsUpDownIcon, EraserIcon } from "lucide-react";

interface CommandSelectProps {
    options: Array<{ id: string; value: string; children: ReactNode }>;
    onSelect: (value: string) => void;
    onSearch?: (value: string) => void;
    onClear?: () => void;
    value: string;
    placeholder?: string;
    isSearchable?: boolean;
    className?: string;
}

export const CommandSelect = ({
    options,
    onClear,
    onSelect,
    onSearch,
    value,
    placeholder,
    isSearchable,
    className,
}: CommandSelectProps) => {
    const [open, setOpen] = useState(false);
    const seletectedOption = options.find((option) => option.value === value);

    const handleOpenChange = (open: boolean) => {
        onSearch?.("");
        setOpen(open);
    };

    return (
        <>
            <Button
                type="button"
                variant="outline"
                className={cn(
                    "h-9 justify-between font-normal px-2",
                    !seletectedOption && "text-muted-foreground",
                    className
                )}
                onClick={() => setOpen(true)}
            >
                <div>{seletectedOption?.children ?? placeholder}</div>
                <ChevronsUpDownIcon />
            </Button>

            <CommandResponsiveDialog
                shouldFilter={!onSearch}
                open={open}
                onOpenChange={handleOpenChange}
            >
                <CommandInput
                    placeholder="Search..."
                    onValueChange={onSearch}
                />
                <CommandList>
                    <CommandEmpty>
                        <span className="text-muted-foreground text-sm">
                            No options found
                        </span>
                    </CommandEmpty>
                    {options.map((option) => (
                        <CommandItem
                            key={option.id}
                            onSelect={() => {
                                onSelect(option.value);
                                setOpen(false);
                            }}
                            className={cn(
                                option.value === value
                                    ? " !bg-green-100"
                                    : undefined,
                                "hover:cursor-pointer"
                            )}
                        >
                            {option.children}
                        </CommandItem>
                    ))}
                </CommandList>
                {seletectedOption && !!onClear && (
                    <Button
                        variant="destructive"
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            onClear();
                        }}
                    >
                        <EraserIcon /> Clear
                    </Button>
                )}
            </CommandResponsiveDialog>
        </>
    );
};
