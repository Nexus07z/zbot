const got = require("got");
const fs = require("fs");
const path = require("path");
const { readcommands } = require("../System/ReadCommands.js");
const {
  pushPlugin, // -------------------- PUSH NEW INSTALLED PLUGIN IN DATABASE
  isPluginPresent, // --------------- CHECK IF PLUGIN IS ALREADY PRESENT IN DATABASE
  delPlugin, // --------------------- DELETE A PLUGIN FROM THE DATABASE
  getAllPlugins, // ----------------- GET ALL PLUGINS FROM DATABASE
  checkMod, // ---------------------- CHECK IF SENDER IS MOD
} = require("../System/MongoDB/MongoDb_Core.js");

let mergedCommands = ["install", "uninstall", "plugins", "pluginlist"];
module.exports = {
  name: "plugininstaller",
  alias: [...mergedCommands],
  uniquecommands: ["install", "uninstall", "plugins", "pluginlist"],
  description: "Install, Uninstall, List plugins",
  start: async (Arashi, m, { text, args, pushName, prefix, inputCMD, isCreator, isintegrated, doReact }) => {
    switch (inputCMD) {
      case "install":
        chechSenderModStatus = await checkMod(m.sender);
        if (!chechSenderModStatus && !isCreator && !isintegrated) {
          await doReact("❌");
          return Arashi.sendMessage(m.from, {
            text: `Sorry, only *Owners* and *Mods* can use this command !`,
            quoted: m,
          });
        }
        try {
          var url = new URL(text);
        } catch (e) {
          console.log(e);
          return await Arashi.sendMessage(
            m.from,
            { text: `Invalid URL !` },
            { quoted: m }
          );
        }

        if (url.host === "gist.github.com") {
          url.host = "gist.githubusercontent.com";
          url = url.toString() + "/raw";
        } else {
          url = url.toString();
        }
        var { body, statusCode } = await got(url);
        if (statusCode == 200) {
          try {
            var folderName = "Plugins";
            fileName = path.basename(url);

            // check if plugin is already installed and present in that Database array
            plugin = await isPluginPresent(fileName);
            if (plugin) {
              return m.reply(`*${fileName}* plugin is already Installed !`);
            }

            // Check if that file is present in same directory
            if (fs.existsSync(`./Plugins/${fileName}`)) {
              return m.reply(
                `*${fileName}* plugin is already Present Locally !`
              );
            }

            var filePath = path.join(folderName, fileName);
            fs.writeFileSync(filePath, body);
            console.log("Plugin saved successfully!");
          } catch (error) {
            console.log("Error:", error);
          }
          await m.reply(`Installing *${fileName}*... `);
          await readcommands();
          await pushPlugin(fileName, text);
          await m.reply(`*${fileName}* Installed Successfully !`);
        }
        break;

      case "plugins":
        await doReact("🧩");
        const plugins = await getAllPlugins();
        if (!plugins.length) {
          await Arashi.sendMessage(
            m.from,
            { text: `No additional plugins installed !` },
            { quoted: m }
          );
        } else {
          txt = "*『    Installed Plugins List    』*\n\n";
          for (var i = 0; i < plugins.length; i++) { 
            txt += `🔖 *Plugin ${i+1}*\n*🎀 Name:* ${plugins[i].plugin}\n*🧩 Url:* ${plugins[i].url}\n\n`;
          }
          txt += `⚜️ To uninstall a plugin type *uninstall* plugin-name !\n\nExample: *${prefix}uninstall* audioEdit.js`;
          await Arashi.sendMessage(m.from, { text: txt }, { quoted: m });
        }

        break;

      case "uninstall":
        chechSenderModStatus = await checkMod(m.sender);
        if (!chechSenderModStatus && !isCreator && !isintegrated) {
          await doReact("❌");
          return Arashi.sendMessage(m.from, {
            text: `Sorry, only *Owners* and *Mods* can use this command !`,
            quoted: m,
          });
        }
        if (!text) {
          return await m.reply(
            `Please provide a plugin name !\n\nExample: *${prefix}uninstall* audioEdit.js`
          );
        }
        await doReact("🧩");
        fileName = text;
        plugin = isPluginPresent(fileName)

        if (!plugin) {
          await doReact("❌");
          return await m.reply(`*${fileName}* plugin is not installed !`);
        }

        if (fs.existsSync(`./Plugins/${fileName}`)) {
          fs.unlinkSync(`./Plugins/${fileName}`);
          await delPlugin(fileName);
          await readcommands();
          await m.reply(
            `*${fileName}* plugin uninstalled successfully !\n\nPlease restart the bot to clear cache !`
          );
        } else {
          await doReact("❌");
          return m.reply(`*${fileName}* plugin is not installed !`);
        }

        break;

      case "pluginlist":
        await doReact("🧩");
        textssf = `*『    Installable Plugins List    』*\n\n
*🎀 Name:* audioEdit.js\n🔖 *Number of commads:* 8\n*🧩 Url:*
*🎀 Name:* text-to-speech.js\n🔖 *Number of commads:* 7\n*🧩 Url:* \n\n
*🎀 Name:* image-edit.js\n🔖 *Number of commads:* 4\n*🧩 Url:* \n\n     
*🎀 Name:* logo-maker.js\n🔖 *Number of commads:* 40\n*🧩 Url:* \n\n 
*🎀 Name:* fun.js\n🔖 *Number of commads:* 17\n*🧩 Url:* \n\n
*🎀 Name:* chat-GPT.js\n🔖 *Number of commands:* 2\n*🧩 Url:* \n\n
*🎀 Name:* tiktokdl.js\n🔖 *Number of commands:* 4\n*🧩 Url:* \n\n
*🎀 Name:* nsfw-image.js\n🔖 *Number of commands:* 1\n*🧩 Url:* \n\n

⚜️ To install a plugin type *install* _plugin-url_ !\n\nExample: *${prefix}install* https://gist.githubusercontent.com/Hridoy0016/xyz...\n\n⚜️ To uninstall a plugin type *uninstall* _plugin-name_ !\n\nExample: *${prefix}uninstall* audioEdit.js\n`;
          await Arashi.sendMessage(m.from, { image: {url: botImage1},caption: textssf }, { quoted: m });
          break;
      default:
        break;
    }
  },
};
