const { MongoClient } = require("mongodb");
const Logger = require("./Logger");
require("dotenv").config();

const NODE_ENV = process.env.NODE_ENV;

let db;
let mongoClient;

async function connectToMongoDB(env = NODE_ENV) {
  const MONGODB_URI = env === "production" ? process.env.MONGODB_URI : process.env.DEV_MONGODB_URI;
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    db = mongoClient.db("tidy");
    Logger.info(`Connected to MongoDB (${env})`);
  } catch (err) {
    Logger.error("Failed to connect to MongoDB", err);
  }
}

async function closeMongoDB() {
  await mongoClient.close();
  Logger.info("Closed MongoDB connection");
}

async function setup(env = "development") {
  await connectToMongoDB(env).then(async () => {
    const indexes = {
      "discord-servers": {
        id: 1, // name, icon, memberCount, added_at
        organisation_id: 1
      },
      "discord-users": {
        id: 1, // username, avatar, discriminator, global_name, accent_color, banner_color, auth, added_at
      }
    };
    const promises = [];
    for (const col in indexes) {
        const promise = db.createCollection(col).then((collection) => {
            const indexPromises = Object.keys(indexes[col]).map(index => {
                Logger.info(`Creating index for "${col}.${index}" - ${indexes[col][index]}`);
                return collection.createIndex({ [index]: indexes[col][index] });
            });
            return Promise.all(indexPromises);
        });
        promises.push(promise);
    }
    await Promise.all(promises);
    Logger.info("Schema created.");
  });
  await closeMongoDB();
}

async function getOrganisationsFromDiscordUserId(discordId) {
  return new Promise(async (resolve, reject) => {
    try {
      const users = await db.collection("users").find({ discord_id: discordId }).toArray();
      
      if (!users || users.length === 0) {
        Logger.warn(`User not found for discord id: ${discordId}`);
        return reject(new Error("User not found"));
      }

      let orgs = [];
      for (const user of users) {
        const userId = user.id;
        const contact = await db.collection("contacts").findOne({ contact_id_reference: userId });
        if (contact) {
          orgs.push(contact.organization);
        }
      }

      // SORT ORGS BY NAME
      orgs = orgs.sort((a, b) => a.name.localeCompare(b.name || ""));

      resolve(orgs);
    } catch (error) {
      reject(error);
    }
  });
}

async function addDiscordServer(server) {
  return new Promise(async (resolve, reject) => {
    try {
      await db.collection("discord-servers").updateOne({
        id: server.id,
      }, {
        $set: server,
      }, {
        upsert: true,
      });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

async function deleteDiscordServer(id) {
  return new Promise(async (resolve, reject) => {
    try {
      await db.collection("discord-servers").deleteOne({ id });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

async function linkDiscordServerToTidyHQ(guildId, organisationId) {
  return new Promise(async (resolve, reject) => {
    try {
      await db.collection("discord-servers").updateOne({
        id: guildId,
      }, {
        $set: {
          organisation_id: organisationId,
        },
      });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

async function getOrganisationIdFromDiscordServerId(id) {
  return new Promise(async (resolve, reject) => {
    try {
      const server = await db.collection("discord-servers").findOne({ id });
      resolve(server.organisation_id);
    } catch (err) {
      reject(err);
    }
  });
}

async function setDiscordPermissionRoles(guildId, roles) {
  return new Promise(async (resolve, reject) => {
    try {
      await db.collection("discord-servers").updateOne({
        id: guildId,
      }, {
        $set: {
          permission_roles: roles,
        },
      });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

async function getDiscordServer(guildId) {
  return new Promise(async (resolve, reject) => {
    try {
      const server = await db.collection("discord-servers").findOne({ id: guildId });
      resolve(server);
    } catch (err) {
      reject(err);
    }
  });
}

async function getEvents(id, limit, publicOnly = true) {
  return new Promise(async (resolve, reject) => {
    try {
      let events = [];
      let args = {
        organisation_id: id,
      };
      if (publicOnly) {
        args.public = true;
      }
      events = await db
        .collection("events")
        .find(args)
        .sort({
          start_at: -1,
        })
        .project({
          name: 1,
          id: 1,
          start_at: 1,
          image_url: 1,
          body: 1,
          location: 1,
          _id: 0,
        })
        .limit(limit)
        .toArray();
      resolve(events);
    } catch (err) {
      reject(err);
    }
  });
}

async function getEventSummary(id, limit, publicOnly = true, start_at = null) {
  return new Promise(async (resolve, reject) => {
    try {
      let args = {
        organisation_id: id,
      };
      if (publicOnly) {
        args.public = true;
      }
      if (start_at) {
        args.start_at = {
          $gte: new Date(start_at),
        };
      }

      const events = await db
        .collection("events")
        .aggregate([
          { $match: args },
          { $sort: { start_at: 1 } },
          { $limit: limit },
          {
            $lookup: {
              from: "ticket-info",
              localField: "id",
              foreignField: "event_id",
              as: "ticket_info",
            },
          },
          {
            $project: {
              name: 1,
              id: 1,
              start_at: 1,
              image_url: 1,
              body: 1,
              location: 1,
              tickets: "$ticket_info.tickets"
            },
          }
        ])
        .toArray();

      resolve(events);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { connectToMongoDB, db, setup, getOrganisationsFromDiscordUserId, addDiscordServer, deleteDiscordServer, linkDiscordServerToTidyHQ, getOrganisationIdFromDiscordServerId, setDiscordPermissionRoles, getDiscordServer, getEvents, getEventSummary };
