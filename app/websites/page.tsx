"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { WebsiteCard } from "@/components/websites/WebsiteCard";
import { DeleteWebsiteModal } from "@/components/websites/DeleteWebsiteModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonClasses } from "@/components/ui/Button";
import { useAllScans, useWebsites } from "@/lib/store/hooks";
import { useLocale } from "@/context/LocaleContext";
import type { Website } from "@/types";

export default function WebsitesPage() {
  const { t } = useLocale();
  const websites = useWebsites();
  const scans = useAllScans();
  const [toDelete, setToDelete] = useState<Website | undefined>(undefined);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">{t("nav.websites")}</h1>
          <p className="mt-1 text-sm text-text-secondary">{websites.length} scanned pages</p>
        </div>
        <Link href="/scans/new" className={buttonClasses("primary", "md", "shrink-0")}>
          <PlusCircle size={15} />
          {t("action.addWebsite")}
        </Link>
      </div>

      {websites.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={t("empty.websites.title")}
            body={t("empty.websites.body")}
            action={
              <Link href="/scans/new" className={buttonClasses("primary")}>
                <PlusCircle size={15} />
                {t("action.addWebsite")}
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {websites.map((website) => (
            <WebsiteCard
              key={website.id}
              website={website}
              latestScan={scans.find((s) => s.websiteId === website.id)}
              onDeleteClick={setToDelete}
            />
          ))}
        </div>
      )}

      <DeleteWebsiteModal website={toDelete} onClose={() => setToDelete(undefined)} />
    </div>
  );
}
