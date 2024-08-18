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