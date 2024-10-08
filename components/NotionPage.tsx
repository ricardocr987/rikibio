"use client";
import * as React from "react";
import { NotionRenderer } from "react-notion-x";
import "react-notion-x/src/styles.css";
import dynamic from "next/dynamic";
import { ExtendedRecordMap } from "notion-types";

type NotionPageProps = {
  recordMap: ExtendedRecordMap;
};

export function NotionPage({ recordMap }: NotionPageProps) {
  const Code = dynamic(() =>
    import("react-notion-x/build/third-party/code").then((m) => m.Code),
  );
  const Collection = dynamic(() =>
    import("react-notion-x/build/third-party/collection").then(
      (m) => m.Collection,
    ),
  );
  const Equation = dynamic(() =>
    import("react-notion-x/build/third-party/equation").then((m) => m.Equation),
  );
  const Pdf = dynamic(
    () => import("react-notion-x/build/third-party/pdf").then((m) => m.Pdf),
    {
      ssr: false,
    },
  );
  const Modal = dynamic(
    () => import("react-notion-x/build/third-party/modal").then((m) => m.Modal),
    {
      ssr: false,
    },
  );

  return (
    <NotionRenderer
      className="w-full h-full"
      recordMap={recordMap}
      darkMode={true}
      fullPage={true}
      components={{
        Code,
        Collection,
        Equation,
        Modal,
        Pdf,
      }}
    />
  );
}
