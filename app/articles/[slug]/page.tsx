import * as React from "react";
import { getPage } from "@/lib/notion";
import { NotionPage } from "@/components/NotionPage";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Page(context: any) {
  const recordMap = await getPage(context.params.slug as string);
  
  if (!recordMap) return <>ups</>
  
  return (
    <>
      <NotionPage recordMap={recordMap} />
      <div className="flex justify-center mt-6">
        <Link href="/">
          <Button>
            Home
          </Button>
        </Link>
      </div>
    </>
  );
}
