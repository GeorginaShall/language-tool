import { NewScanForm } from "@/components/scans/NewScanForm";

export default function NewScanPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-xl font-semibold text-text">Scan a Page</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Enter one page and the language it is written in. The checker detects its other language versions and audits
        translation, RTL, and SEO.
      </p>
      <div className="mt-6">
        <NewScanForm />
      </div>
    </div>
  );
}
