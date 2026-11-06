"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { removeWebsite } from "@/lib/api/scans";
import { useToast } from "@/context/ToastContext";
import type { Website } from "@/types";

export function DeleteWebsiteModal({
  website,
  onClose,
  onDeleted,
}: {
  website: Website | undefined;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    if (!website) return;
    setDeleting(true);
    await removeWebsite(website.id);
    setDeleting(false);
    toast(`${website.label} removed.`, "info");
    onClose();
    onDeleted?.();
  }

  return (
    <Modal isOpen={Boolean(website)} onClose={onClose} title="Remove website">
      <p className="text-sm text-text-secondary">
        This removes <span className="font-mono text-text">{website?.label}</span> along with all of its scans and
        issues. This can&apos;t be undone.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button variant="danger" size="sm" onClick={handleConfirm} disabled={deleting}>
          {deleting ? "Removing…" : "Remove website"}
        </Button>
      </div>
    </Modal>
  );
}
