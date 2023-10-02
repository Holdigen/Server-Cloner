// requiring modules
const axios = require("axios");
const config = require("./config.json");

// functions
function wait(seconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000);
    });
}
async function forceRequest(requestType, ...args) {
    let result;
    // for (let i = 0; i < 5; i++) {
    //   try {
    //     result = await axios[requestType](...args);
    //   } catch (e) {}
    //   if (result) {
    //     break;
    //   }
    //   await wait(config.delay / 2);
    // }
    try {
        result = await axios[requestType](...args);
    } catch (e) {
        result = {};
    }
  
    return result;
}
async function getInfo(customServer) {
    let configuration = customServer || config

    let serverInfo = await forceRequest("get", `https://discord.com/api/v10/guilds/${configuration.guildIdToCopyServer}`, {
        headers: {
            ["Authorization"]: config.discordToken,
            ["Content-Type"]: "application/json"
        }
    });
    serverInfo = serverInfo.data;

    const channels = await forceRequest("get", `https://discord.com/api/v10/guilds/${configuration.guildIdToCopyServer}/channels`, {
        headers: {
            ["Authorization"]: config.discordToken,
            ["Content-Type"]: "application/json"
        }
    });
    serverInfo.channels = channels.data;

    return serverInfo;
}

// return variables
module.exports = {
    roleBits: {
        CREATE_INSTANT_INVITE: 0x00000001,
        KICK_MEMBERS: 0x00000002,
        BAN_MEMBERS: 0x00000004,
        ADMINISTRATOR: 0x00000008,
        MANAGE_CHANNELS: 0x00000010,
        MANAGE_GUILD: 0x00000020,
        ADD_REACTIONS: 0x00000040,
        VIEW_AUDIT_LOG: 0x00000080,
        PRIORITY_SPEAKER: 0x00000100,
        STREAM: 0x00000200,
        VIEW_CHANNEL: 0x00000400,
        SEND_MESSAGES: 0x00000800,
        SEND_TTS_MESSAGES: 0x00001000,
        MANAGE_MESSAGES: 0x00002000,
        EMBED_LINKS: 0x00004000,
        ATTACH_FILES: 0x00008000,
        READ_MESSAGE_HISTORY: 0x00010000,
        MENTION_EVERYONE: 0x00020000,
        USE_EXTERNAL_EMOJIS: 0x00040000,
        VIEW_GUILD_INSIGHTS: 0x00080000,
        CONNECT: 0x00100000,
        SPEAK: 0x00200000,
        MUTE_MEMBERS: 0x00400000,
        DEAFEN_MEMBERS: 0x00800000,
        MOVE_MEMBERS: 0x01000000,
        USE_VAD: 0x02000000,
        CHANGE_NICKNAME: 0x04000000,
        MANAGE_NICKNAMES: 0x08000000,
        MANAGE_ROLES: 0x10000000,
        MANAGE_WEBHOOKS: 0x20000000,
        MANAGE_EMOJIS_AND_STICKERS: 0x40000000,
        USE_APPLICATION_COMMANDS: 0x80000000,
        REQUEST_TO_SPEAK: 0x0010000000,
        MANAGE_THREADS: 0x0040000000,
        USE_PUBLIC_THREADS: 0x0080000000,
        USE_PRIVATE_THREADS: 0x0100000000,
        USE_EXTERNAL_STICKERS: 0x0200000000
    },
    getInfo: getInfo,
    forceRequest: forceRequest,
    clearServer: async function() {
        const serverInfo = await getInfo({
            guildIdToCopyServer: config.guildIdToBeTransferedTo
        });

        for (const channel of serverInfo.channels) {
            try {
                await forceRequest("delete", `https://discord.com/api/v9/channels/${channel.id}`, {
                    headers: {
                        ["Authorization"]: config.discordToken,
                        ["Content-Type"]: "application/json"
                    }
                })
            } catch (e){}
            await wait(config.delay);
        }
        for (const role of serverInfo.roles) {
            try {
                await forceRequest("delete", `https://discord.com/api/v9/guilds/${config.guildIdToBeTransferedTo}/roles/${role.id}`, {
                    headers: {
                        ["Authorization"]: config.discordToken,
                        ["Content-Type"]: "application/json"
                    }
                })
            } catch (e){}
            await wait(config.delay);
        }
        for (const emoji of serverInfo.emojis) {
            if (emoji.available && !emoji.managed) {
                try {
                    await forceRequest("delete", `https://discord.com/api/v9/guilds/${config.guildIdToBeTransferedTo}/emojis/${emoji.id}`, {
                        headers: {
                            ["Authorization"]: config.discordToken,
                            ["Content-Type"]: "application/json"
                        }
                    })
                } catch (e){}
                await wait(config.delay);
            }
        }
        for (const sticker of serverInfo.stickers) {
            if (sticker.available && !sticker.managed) {
                try {
                    await forceRequest("delete", `https://discord.com/api/v9/guilds/${config.guildIdToBeTransferedTo}/stickers/${sticker.id}`, {
                        headers: {
                            ["Authorization"]: config.discordToken,
                            ["Content-Type"]: "application/json"
                        }
                    })
                } catch (e){}
                await wait(config.delay);
            }
        }
    },
    updateServerInfo: async function(serverData) {
        let serverIcon = await axios.get(`https://cdn.discordapp.com/icons/${serverData.id}/${serverData.icon}.png?size=1024`, { responseType: "arraybuffer" });
        serverIcon = Buffer.from(serverIcon.data, "binary").toString("base64");

        try {
            await forceRequest("patch", `https://discord.com/api/v9/guilds/${config.guildIdToBeTransferedTo}`, {
                name: serverData.name,
                description: serverData.description,
                icon: "data:image/png;base64," + serverIcon
            }, {
                headers: {
                    ["Authorization"]: config.discordToken,
                    ["Content-Type"]: "application/json"
                }
            })
        } catch(e) {}
    }
};