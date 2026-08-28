"use client";

import { useState, useTransition } from "react";
import { toggleStaffActive, updateStaff } from "@/lib/actions/staff";
import { StaffForm } from "@/components/dashboard/StaffForm";
import { StaffAvatar } from "@/components/dashboard/StaffAvatar";
import { StaffPhotoUploader } from "@/components/dashboard/StaffPhotoUploader";

type Service = { id: string; name: string };
type StaffItem = {
  id: string;
  name: string;
  color: string;
  photoUrl: string | null;
  active: boolean;
  serviceIds: string[];
};

export function StaffRow({ staff, services }: { staff: StaffItem; services: Service[] }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toggleError, setToggleError] = useState<string | null>(null);

  function handleToggle() {
    setToggleError(null);
    startTransition(async () => {
      const result = await toggleStaffActive(staff.id);
      if (result.error) setToggleError(result.error);
    });
  }

  return (
    <li className={`bg-surface border border-border rounded-xl px-4 py-3 flex flex-col gap-3 ${staff.active ? "" : "opacity-60"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <StaffAvatar name={staff.name} color={staff.color} photoUrl={staff.photoUrl} size={36} />
          <p className="font-medium truncate">
            {staff.name}
            {!staff.active && (
              <span className="ml-2 text-xs bg-warning-soft text-warning rounded-full px-2 py-0.5">
                Pausado
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="text-sm border border-border rounded-lg px-3 py-1.5 hover:border-brand active:scale-[0.97]"
          >
            {editing ? "Cerrar" : "Editar"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleToggle}
            className="text-sm border border-border rounded-lg px-3 py-1.5 hover:border-brand active:scale-[0.97] disabled:opacity-50"
          >
            {staff.active ? "Pausar" : "Activar"}
          </button>
        </div>
      </div>

      {toggleError && (
        <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{toggleError}</p>
      )}

      <div className="border-t border-border pt-3">
        <p className="text-sm font-medium mb-2">Foto para la página pública</p>
        <StaffPhotoUploader
          staffId={staff.id}
          name={staff.name}
          color={staff.color}
          photoUrl={staff.photoUrl}
        />
      </div>

      {editing && (
        <div className="border-t border-border pt-3">
          <StaffForm
            action={(prev, formData) => updateStaff(staff.id, prev, formData)}
            services={services}
            initialName={staff.name}
            initialColor={staff.color}
            initialServiceIds={staff.serviceIds}
            submitLabel="Guardar cambios"
            onDone={() => setEditing(false)}
          />
        </div>
      )}
    </li>
  );
}
