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
})

export async function getArticles() {
  return await notion.databases.query({
    database_id: config.NOTION_DB
  }).then((x) => x.results.map((x: any) => x.properties));
}

export async function getPage(slug: string) {
  try {
    return await notion.databases.query({
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
      return page ? await notionApi.getPage(page.id) : null;
    });
  } catch (error) {
    console.error("Error fetching page content:", error);
    return '';
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
