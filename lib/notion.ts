"only server";

import config from "./config";
import { NotionAPI } from "notion-client";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: config.NOTION_SECRET,
});

const notionApi = new NotionAPI({
  activeUser: config.NOTION_USER,
  authToken: config.NOTION_TOKEN,
});

export async function getArticles() {
  return await notion.databases
    .query({
      database_id: config.NOTION_DB,
    })
    .then((x) =>
      x.results
        .map((x: any) => x.properties)
        .filter((x: any) => x.active.checkbox),
    );
}

export async function getPage(slug: string) {
  try {
    return await notion.databases
      .query({
        database_id: config.NOTION_DB,
        filter: {
          property: "slug",
          title: {
            equals: slug,
          },
        },
      })
      .then(async (response: any) => {
        const page = response.results[0];
        const recordMap = page ? await notionApi.getPage(page.id) : null;

        if (recordMap) {
          // Remove the `active` property
          if (recordMap.collection) {
            const collectionKey = Object.keys(recordMap.collection)[0];
            const collection = recordMap.collection[collectionKey];
            if (collection && collection.value && collection.value.schema) {
              delete collection.value.schema.__fb;
            }
          }

          // Remove blog db name
          if (
            recordMap.block &&
            recordMap.block["aa69e037-69eb-40c2-993d-cc231e259bed"]
          ) {
            delete recordMap.block["aa69e037-69eb-40c2-993d-cc231e259bed"];
          }
        }

        return recordMap;
      });
  } catch (error) {
    console.error("Error fetching page content:", error);
    return "";
  }
}

export type Article = {
  slug: {
    id: string;
    type: "rich_text";
    rich_text: {
      type: "text";
      text: {
        content: string;
        link: string | null;
      };
      annotations: {
        bold: boolean;
        italic: boolean;
        strikethrough: boolean;
        underline: boolean;
        code: boolean;
        color: string;
      };
      plain_text: string;
      href: string | null;
    }[];
  };
  tags: {
    id: string;
    type: "multi_select";
    multi_select: {
      id: string;
      name: string;
      color: string;
    }[];
  };
  title: {
    id: "title";
    type: "title";
    title: {
      type: "text";
      text: {
        content: string;
        link: string | null;
      };
      annotations: {
        bold: boolean;
        italic: boolean;
        strikethrough: boolean;
        underline: boolean;
        code: boolean;
        color: string;
      };
      plain_text: string;
      href: string | null;
    }[];
  };
};
