/*╔═══════════════════════════════════════╗
    ALL BOTS
  ╚═══════════════════════════════════════╝*/
const Discord = require("discord.js");
const Prefix = "?";
const client = new Discord.Client({
  partials: ["MESSAGE", "CHANNEL", "REACTION"]
, clientOptions: {
        fetchAllMembers: true
    },});
const functions = require("./functions.js");
const df = require("./dialogflow-functions.js");
const usersMap = new Map();

process.on("error", error => functions.Error(client, error));
process.on("uncaughtException", error => functions.Error(client, error));
process.on("unhandledRejection", error => functions.Error(client, error));
//client.on("messageDelete", async message => {functions.DeletedMessage(client, message)})

client.once("ready", () => {
  client.user.setActivity("the VRML Bot 👀", {
    url: "https://www.twitch.tv/echoarena_vrml",
    type: "WATCHING"
  });
  console.log("Ready!");
});
client.on("error", error => functions.Error(client, error));

client.login(process.env.BOT);

const express = require("express");
const app = express();
app.get("/", (request, response) => {
  response.sendStatus(200);
});
app.listen(process.env.PORT);

/*╔═══════════════════════════════════════╗
    Individual Const
  ╚═══════════════════════════════════════╝*/

const GravityWatchChannels = [
  "630095256964300801",
  "630095400811888650",
  "630095256964300801",
  "630095221149138965"
];

/*╔═══════════════════════════════════════╗
    Message
  ╚═══════════════════════════════════════╝*/

client.on("message", async message => {
  /*┌───────────────────────────┐
      Team Gravity Repost
    └───────────────────────────┘ */
  if (
    GravityWatchChannels.includes(message.channel.id) &&
    message.author.bot &&
    message.content.includes("Team Gravity") &&
    !message.content.includes("scores")
  ) {
    try {
      client.channels.cache.get("743091749282381845").send(message);
    } catch (e) {
      console.log(e);
    }
  }
  if (!message.author.bot && message.cleanContent.length <= 256) {
    /*┌───────────────────────────┐
        Mentions
      └───────────────────────────┘ */
    const News = ["nada", "na_da"];
    if (
      News.includes(message.content.toLowerCase()) &&
      !message.author.bot &&
      !message.content.toLowerCase().includes("canada")
    ) {
      functions.Mention(client, message, "338649491894829057");
    } else if (
      message.content.toLowerCase().includes("sendo") &&
      !message.author.bot &&
      message.guild.id != "632570524463136779"
    ) {
      functions.Mention(client, message, "119095000050040832");
    } else if (
      /*╔═══════════════════════════════════════╗
          Dialogflow
        ╚═══════════════════════════════════════╝*/
      /*┌───────────────────────────┐
          DM
        └───────────────────────────┘ */
      message.channel.type == "dm" &&
      client.user.id != message.author.id &&
      !message.content.startsWith(Prefix)
    ) {
      const df = require("./dialogflow-functions.js");
      const answer = await functions.DialogflowQuery(
        message,
        message.cleanContent
      );
      df.Function(client, answer, message);
      /*┌───────────────────────────┐
          Public
        └───────────────────────────┘ */
    } else if (
      (message.cleanContent.startsWith("@" + client.user.username + " ") ||
        message.cleanContent.startsWith(client.user.username + " ") ||
        message.cleanContent.startsWith(
          client.user.username.toLowerCase() + " "
        )) &&
      client.user.id != message.author.id &&
      !message.member.roles.cache.has("748631446217818123")
    ) {
      const answer = await functions.DialogflowQuery(
        message,
        message.cleanContent
          .split(" ")
          .slice(1)
          .join(" ")
      );
      //SPAM PROTECTION
      if (usersMap.has(message.author.id)) {
        const userData = usersMap.get(message.author.id);
        let msgCount = userData.msgCount;
        ++msgCount;
        if (parseInt(msgCount) === 5) {
          setTimeout(() => {
            message.reply(
              "Slow down buddy! If you want to chat to me that much let's move to DM!"
            );
          }, 2000);
        }
        if (parseInt(msgCount) === 10) {
          setTimeout(() => {
            message.reply("I don't wanna talk to you anymore. 😤");
          }, 3000);
          message.member.roles.add("748631446217818123");
          client.channels.cache
            .get("724967322867204096")
            .send(`I don't like to talk to <@${message.author.id}> anymore!`);
          setTimeout(() => {
            console.log("Auto unmuted after 60 minutes.");
            message.member.roles.remove("748631446217818123");
          }, 3600000);
        } else {
          userData.msgCount = msgCount;
          usersMap.set(message.author.id, userData);
        }
      } else {
        usersMap.set(message.author.id, {
          msgCount: 1,
          lastMessage: message,
          timer: null
        });
        setTimeout(() => {
          usersMap.delete(message.author.id);
          console.log("User removed from the map");
        }, 40000);
      }
      // PUBLIC REDIRECTS
      if (
        answer.intent === "Register | Event" ||
        answer.intent === "Sheet | Looking for Team" ||
        answer.intent === "Sheet | Recruiting"
      ) {
        message.reply(
          "Happy to help. Let's continue this conversation in a DM..."
        );
        message.author.send(answer.response);
      } else if (answer.intent.substring(0, 4) === "Spam") {
        const allowedChannels = ["328962843800109067", "688765312023396374"]; //bot channel, meme channel
        if (allowedChannels.includes(message.channel.id)) {
          message.reply(answer.response);
        } else {
          message.reply(
            "Try that again in the <#328962843800109067> or in a DM!"
          );
        }
      } else {
        df.Function(client, answer, message);
      }
      /*╔═══════════════════════════════════════╗
          Commands
        ╚═══════════════════════════════════════╝*/
    } else if (!message.content.startsWith(Prefix) || message.author.bot)
      return;
    try {
      functions.Command(client, message, Prefix);
    } catch (error) {
      functions.Error(client, error);
    }
  }
});
