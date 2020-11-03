const functions = require("../functions.js");

module.exports = {
  name: "a",
  async execute(message, args, client) {
    message.delete().catch(_ => {});
    
      const data = await functions.SpreadsheetGET(
      "1b-2t41LO_U5j8gJfxPS_rdg4Y8kINwMgSqUKpNdf4RE")
    
    let embed = data.rows.filter(embed => embed.name == args.join(" "));
    const finalEmbed = functions.EmbedBuilder(embed);
    message.channel.send(finalEmbed);
  }
};

