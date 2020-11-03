const Discord = require("discord.js");
const dialogflow = require("@google-cloud/dialogflow");
const RolesList = require("./info/reaction-roles.json");
const fs = require("fs");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { google } = require("googleapis");

module.exports = {
  EmbedBuilder: function(embed) {
    const newEmbed = new Discord.MessageEmbed();

    if (embed[0].Color !== "undefined") {
      newEmbed.setColor(embed[0].Color);
    }
    if (embed[0].Title !== "undefined") {
      newEmbed.setTitle(embed[0].Title);
    }
    if (embed[0].URL !== "undefined") {
      newEmbed.setURL(embed[0].URL);
    }
    if (embed[0].Author_Text !== "undefined") {
      newEmbed.setAuthor(
        embed[0].Author_Text,
        embed[0].Author_Avatear_Link,
        embed[0].Author_URL
      );
    }
    if (embed[0].Description !== "undefined") {
      newEmbed.setDescription(embed[0].Description);
    }
    if (embed[0].Thumbnail !== "undefined") {
      newEmbed.setThumbnail(embed[0].Thumbnail);
    }
    if (embed[0].Image !== "undefined") {
      newEmbed.setImage(embed[0].Image);
    }
    if (embed[0].Image !== "undefined") {
      newEmbed.setImage(embed[0].Image);
    }
    

    if (embed[0].Footer_Avatar_URL !== "undefined" && embed[0].Footer_Text) {
      newEmbed.setFooter(embed[0].Footer_Text, embed[0].Footer_Avatar_URL);
    }

    if (embed[0].Field_1_Title && embed[0].Field_1_Text) {
      newEmbed.addField(embed[0].Field_1_Title, embed[0].Field_1_Text);
    }
    if (embed[0].Field_2_Title && embed[0].Field_2_Text) {
      newEmbed.addField(embed[0].Field_2_Title, embed[0].Field_2_Text);
    }
    if (embed[0].Field_3_Title && embed[0].Field_3_Text) {
      newEmbed.addField(embed[0].Field_3_Title, embed[0].Field_3_Text);
    }
    if (embed[0].Field_4_Title && embed[0].Field_4_Text) {
      newEmbed.addField(embed[0].Field_4_Title, embed[0].Field_4_Text);
    }
    if (embed[0].Field_5_Title && embed[0].Field_5_Text) {
      newEmbed.addField(embed[0].Field_5_Title, embed[0].Field_5_Text);
    }

    return newEmbed;
  },
  SpreadsheetGET: async function(id) {
    const doc = new GoogleSpreadsheet(id);
    await doc.useServiceAccountAuth({
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY.replace(/\\n/g, "\n")
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    return { sheet, rows };
  },
  SpreadsheetPOST: async function(id, rowData) {
    const doc = new GoogleSpreadsheet(id);
    await doc.useServiceAccountAuth({
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY.replace(/\\n/g, "\n")
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const moreRows = await sheet.addRows(rowData);
  },
  Command: function(client, message, Prefix) {
    client.commands = new Discord.Collection();
    const commandFiles = fs
      .readdirSync("./commands")
      .filter(file => file.endsWith(".js"));
    for (const file of commandFiles) {
      const command = require(`./commands/${file}`);
      client.commands.set(command.name, command);
    }
    const args = message.content.slice(Prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();
    if (!client.commands.has(command)) return;
    try {
      if (command !== "") {
        client.commands.get(command).execute(message, args);
      }
    } catch (error) {
      console.error(error);
    }
  },
  DeletedMessage: async function(client, message) {
    const logs = await message.guild.fetchAuditLogs({ type: 72 });
    const entry = logs.entries.first();

    const embed = new Discord.MessageEmbed()
      .setColor("#c20000")

      .setThumbnail(message.author.displayAvatarURL())
      .setDescription(
        `Deleted message from ${message.author} in ${message.channel}:\n${message.content}`
      )
      .setFooter(
        `Deleted by ${entry.executor.tag}`,
        entry.executor.displayAvatarURL()
      );

    client.channels.cache.get("718176504437276682").send(embed);
  },
  DialogflowQuery: async function(message, query) {
    const config = {
      credentials: {
        private_key: process.env.PRIVATE_KEY.replace(/\\n/g, "\n"),
        client_email: process.env.CLIENT_EMAIL
      }
    };

    const sessionClient = new dialogflow.SessionsClient(config);
    const sessionPath = sessionClient.projectAgentSessionPath(
      process.env.PROJECT_ID,
      message.author.id.substring(0, 11)
    );

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: query,
          languageCode: "en-US"
        }
      }
    };
    const result = await sessionClient.detectIntent(request);
    const intent = result[0].queryResult.intent.displayName;
    const response = result[0].queryResult.fulfillmentText;
    return { result, intent, response };
  },
  Error: function(client, error) {
    const embed = new Discord.MessageEmbed()
      .setColor("#c70000")
      .setAuthor(
        "ERROR",
        "https://cdn.discordapp.com/attachments/717442783794692097/733268935310442556/Untitled-1.png"
      )
      .setDescription(error.stack);
    console.log(error);
  },
  Inform: function(client, answer, message) {
    if (message.guild === null) {
      const embed = new Discord.MessageEmbed()
        .setColor("#ff930f")
        .setAuthor(`${message.author.username} in DM`, message.author.displayAvatarURL())
        .setDescription(`**User:** ${message}\n**Bot:** ${answer.response}`);
      try {
        client.users.cache.get(process.env.OWNER).send(embed);
      } catch (error) {
        console.log(error);
      }
    } else {
      const embed = new Discord.MessageEmbed()
        .setColor("#ff930f")
        .setAuthor(
          `${message.author.tag} in ${message.channel.name}`,
          message.author.displayAvatarURL()
        )
        .setDescription(
          `**${message.author.username}:** [${message}](${message.url})\n**Bot:** ${answer.response}`
        );
      try {
        client.users.cache.get(process.env.OWNER).send(embed);
      } catch (error) {
        console.log(error);
      }
    }
  },
  Mention: function(client, message, id) {
    const embed = new Discord.MessageEmbed()
      .setColor("#00c22a")
      .setAuthor(
        `${message.author.username} mentioned you in ${message.channel.name}`,
        message.author.displayAvatarURL()
      )
      .setDescription(`${message} \n [Link](${message.url})`);

    try {
      client.users.cache.get(id).send(embed);
    } catch (error) {
      console.log(error);
    }
  },
  RoleAdd: async function(reaction, user, id) {
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.log(error);
        return;
      }
    }
    const emojiId = reaction.emoji.id.toString();
    if (!user.bot && reaction.message.id === id) {
      if (
        RolesList.hasOwnProperty(emojiId) ||
        RolesList.hasOwnProperty(reaction.emoji.name)
      ) {
        reaction.message.guild.member(user).roles.add(RolesList[emojiId].role);
      }
    }
  },
  RoleRemove: async function(reaction, user, id) {
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.log(error);
        return;
      }
    }
    const emojiId = reaction.emoji.id.toString();
    if (!user.bot && reaction.message.id === id) {
      if (
        RolesList.hasOwnProperty(emojiId) ||
        RolesList.hasOwnProperty(reaction.emoji.name)
      ) {
        reaction.message.guild
          .member(user)
          .roles.remove(RolesList[emojiId].role);
      }
    }
  }
};
