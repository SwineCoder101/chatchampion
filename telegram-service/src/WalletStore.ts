import { DotenvConfigOptions } from "dotenv";

const dotenv = require('dotenv');
const { Client } = require('@notionhq/client');
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

export async function addToDatabase(userId, username, key, address) {
  try {
      const response = await notion.pages.create({
          parent: {
              database_id: databaseId,
          },
          properties: {
              'userid': {
                  title: [
                      {
                          text: {
                              content: userId,
                          },
                      },
                  ],
              },
              'key': {
                  rich_text: [
                      {
                          text: {
                              content: key,
                          },
                      },
                  ],
              },
              'address': {
                  rich_text: [
                      {
                          text: {
                              content: address,
                          },
                      },
                  ],
              },
              'username': {
                  rich_text: [
                      {
                          text: {
                              content: username,
                          },
                      },
                  ],
              },
          }
      });
  } catch (error) {
      console.error(error.body);
  }
}

const extractPropertyContent = (property) => {
  return property?.rich_text[0]?.text.content || property?.title[0]?.text.content || "";
};

export async function queryDatabaseByAddress(address: string) {
  try {
      const response = await notion.databases.query({
          database_id: databaseId,
          filter: {
              property: "address",  // Replace with the exact name of your property in Notion
              rich_text: {
                  equals: address
              }
          }
      });

      // Assuming there's only one entry with the given userId
      if (response.results.length > 0) {
          const fullRowEntity = response.results[0].properties;
          return extractValues(fullRowEntity);
      } else {
          console.log("No entries found for the given userId");
          return null;
      }
  } catch (error) {
      console.error("Error querying database:", error);
      return null;
  }
}

export async function queryDatabaseByUserName(username: string) {
  try {
      const response = await notion.databases.query({
          database_id: databaseId,
          filter: {
              property: "username",  // Replace with the exact name of your property in Notion
              rich_text: {
                  equals: username
              }
          }
      });

      // Assuming there's only one entry with the given userId
      if (response.results.length > 0) {
          const fullRowEntity = response.results[0].properties;
          return extractValues(fullRowEntity);
      } else {
          console.log("No entries found for the given userId");
          return null;
      }
  } catch (error) {
      console.error("Error querying database:", error);
      return null;
  }
}


export async function queryDatabaseByUserId(userId: string) {
  try {
      const response = await notion.databases.query({
          database_id: databaseId,
          filter: {
              property: "userid",  // Replace with the exact name of your property in Notion
              title: {
                  equals: userId
              }
          }
      });

      // Assuming there's only one entry with the given userId
      if (response.results.length > 0) {
          const fullRowEntity = response.results[0].properties;
          return extractValues(fullRowEntity);
      } else {
          console.log("No entries found for the given userId");
          return null;
      }
  } catch (error) {
      console.error("Error querying database:", error);
      return null;
  }
}

type NotionProperty = {
  id: string;
  type: 'rich_text' | 'title';
  rich_text?: { text: { content: string } }[];
  title?: { text: { content: string } }[];
};

type NotionPayload = {
  address: NotionProperty;
  username: NotionProperty;
  key: NotionProperty;
  userid: NotionProperty;
};

function extractValues(payload: NotionPayload) {
  const extractContent = (property: NotionProperty) => {
    if (property.type === 'rich_text' && property.rich_text && property.rich_text.length > 0) {
      return property.rich_text[0].text.content;
    } else if (property.type === 'title' && property.title && property.title.length > 0) {
      return property.title[0].text.content;
    }
    return '';
  };

  return {
    address: extractContent(payload.address),
    username: extractContent(payload.username),
    key: extractContent(payload.key),
    userid: extractContent(payload.userid),
  };
}