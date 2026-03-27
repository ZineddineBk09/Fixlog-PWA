"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { db, type MachineRecord } from "@/lib/db";
import { useLocale } from "@/providers/locale-provider";
import { Plus, Search } from "lucide-react";
import type { CreateMachineResult } from "@/hooks/use-logs";

interface MachineSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  onCreateMachine?: (
    name: string,
    department?: string,
  ) => Promise<CreateMachineResult>;
}

export function MachineSelect({
  value,
  onValueChange,
  onCreateMachine,
}: MachineSelectProps) {
  const { t, isRTL } = useLocale();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newMachineName, setNewMachineName] = useState("");
  const [newMachineDepartment, setNewMachineDepartment] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [isSavingMachine, setIsSavingMachine] = useState(false);
  const machines = useLiveQuery(
    async () => db.machines.orderBy("name").toArray(),
    [],
  );

  const filtered = useMemo(() => {
    const source = machines ?? [];
    return search
      ? source.filter((m) =>
          m.name.toLowerCase().includes(search.toLowerCase()),
        )
      : source;
  }, [machines, search]);

  async function handleCreateMachine() {
    if (!onCreateMachine) {
      onValueChange(newMachineName.trim());
      setIsDialogOpen(false);
      return;
    }

    setIsSavingMachine(true);
    setDialogError("");
    const result = await onCreateMachine(
      newMachineName,
      newMachineDepartment || undefined,
    );
    setIsSavingMachine(false);

    if (!result.success) {
      setDialogError(t(result.errorKey ?? "machineSaveFailed"));
      return;
    }

    if (result.machine) {
      onValueChange(result.machine.name);
    }
    setIsDialogOpen(false);
    setNewMachineName("");
    setNewMachineDepartment("");
  }

  function handleUseTemporaryMachine() {
    const normalizedName = newMachineName.trim();
    if (!normalizedName) {
      setDialogError(t("machineNameRequired"));
      return;
    }

    onValueChange(normalizedName);
    setIsDialogOpen(false);
    setDialogError("");
    setNewMachineDepartment("");
    setNewMachineName("");
  }

  return (
    <>
      <div className="space-y-3">
        <Select value={value} onValueChange={(v) => onValueChange(v ?? "")}>
          <SelectTrigger className="h-14 rounded-2xl border-white/70 bg-white/90 text-base shadow-sm">
            <SelectValue placeholder={t("selectMachine")} />
          </SelectTrigger>
          <SelectContent>
            <div className="px-2 pb-2">
              <div className="relative">
                <Search
                  className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${
                    isRTL ? "right-2.5" : "left-2.5"
                  }`}
                />
                <Input
                  placeholder={t("searchMachines")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`h-10 rounded-xl ${isRTL ? "pr-8" : "pl-8"}`}
                />
              </div>
            </div>
            {filtered.map((m) => (
              <SelectItem key={m.id} value={m.name} className="text-base py-3">
                {m.name}
              </SelectItem>
            ))}
            {filtered.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("noMachinesFound")}
              </p>
            )}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsDialogOpen(true)}
          className="h-12 w-full justify-center gap-2 rounded-2xl border-dashed"
        >
          <Plus className="h-4 w-4" />
          {t("cantFindMachine")}
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>{t("addMachine")}</DialogTitle>
            <DialogDescription>{t("cantFindMachine")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Input
                value={newMachineName}
                onChange={(e) => setNewMachineName(e.target.value)}
                placeholder={t("machineName")}
                className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Input
                value={newMachineDepartment}
                onChange={(e) => setNewMachineDepartment(e.target.value)}
                placeholder={t("departmentOptional")}
                className="h-12 rounded-2xl"
              />
            </div>
            {dialogError && (
              <p className="text-sm font-medium text-destructive">
                {dialogError}
              </p>
            )}
          </div>

          <DialogFooter className="sm:flex-col">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl"
              onClick={handleUseTemporaryMachine}
            >
              {t("useTemporaryMachine")}
            </Button>
            <Button
              type="button"
              className="h-12 rounded-2xl"
              onClick={handleCreateMachine}
              disabled={isSavingMachine}
            >
              {isSavingMachine ? t("saving") : t("saveMachine")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
