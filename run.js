// requiring modules
const axios = require("axios");
const utils = require("./utils");
const config = require("./config.json");

// functions
function wait(seconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000);
    });
}
function debugLog(message) {
    console.log(`[ hold4564 Server Cloner ] - ${message}`)
}

// main function
async function cloneServer() {
    // get server
    debugLog("Fetching Target Server ...");
    let targetServer = await utils.getInfo();
    let transferServer = await utils.getInfo({
        guildIdToCopyServer: config.guildIdToBeTransferedTo
    });

    // required variables
    const categorys = {};
    const roles = {};

    // update server
    debugLog("Clearing Server ...");
    await utils.clearServer();
    debugLog("Updating Server Info ...");
    await utils.updateServerInfo(targetServer);
    
    // creating things
    debugLog("Creating Roles ...");
    for (const role of targetServer.roles) {
        if (role.position === 0) {
            for (const _role of transferServer.roles) {
                if (_role.position === 0) {
                    roles[role.id] = _role.id;
                    try {
                        await axios.patch(`https://discord.com/api/v9/guilds/${config.guildIdToBeTransferedTo}/roles/${_role.id}`, role, {
                            headers: {
                                ["Authorization"]: config.discordToken,
                                ["Content-Type"]: "application/json"
                            }
                        });
                    } catch(e) {}
                    break;
                }
            }
            continue;
        }
        try {
            let roleCreated = await utils.forceRequest("post", `https://discord.com/api/v9/guilds/${config.guildIdToBeTransferedTo}/roles`, {
                color: 0,
                name: "new role",
                Permissions: "0"
            }, {
                headers: {
                    ["Authorization"]: config.discordToken,
                    ["Content-Type"]: "application/json"
                }
            })
            roleCreated = roleCreated.data;
            roles[role.id] = roleCreated.id;
            await wait(config.delay);

            try {
                role.id = null;
                role.position = null;
                role.managed = null;
                role.icon = null;
                role.flags = null;
                role.tags = null;
                await axios.patch(`https://discord.com/api/v9/guilds/${config.guildIdToBeTransferedTo}/roles/${roleCreated.id}`, role, {
                    headers: {
                        ["Authorization"]: config.discordToken,
                        ["Content-Type"]: "application/json"
                    }
                });
            } catch(e) {}
        } catch(e) {}
    }
    debugLog("Sorting Roles ...");
    const sortedRoles = [];
    for (const role of targetServer.roles) {
        sortedRoles.push({
            id: roles[role.id],
            position: role.position
        });
    }
    await utils.forceRequest("patch", `https://discord.com/api/v9/guilds/${config.guildIdToBeTransferedTo}/roles`, sortedRoles, {
        headers: {
            ["Authorization"]: config.discordToken,
            ["Content-Type"]: "application/json"
        }
    });

    debugLog("Creating Categorys ...");
    for (const channel of targetServer.channels) {
        if (channel.type === 4) {
            for (const permission of channel.permission_overwrites) {
                const newRoleId = roles[permission.id];
                permission.id = newRoleId || "1";
            }
            let createdChannel = await utils.forceRequest("post", `https://discord.com/api/v9/guilds/${config.guildIdToBeTransferedTo}/channels`, channel, {
                headers: {
                    ["Authorization"]: config.discordToken,
                    ["Content-Type"]: "application/json"
                }
            })
            createdChannel = createdChannel.data;
            categorys[channel.id] = createdChannel.id;
            await wait(config.delay);
        }
    }
    debugLog("Creating Channels ...");
    for (const channel of targetServer.channels) {
        if (channel.type !== 4) {
            for (const permission of channel.permission_overwrites) {
                permission.id = roles[permission.id]
            }
            channel.parent_id = categorys[channel.parent_id]
            try {
                const createdChannel = await utils.forceRequest("post", `https://discord.com/api/v9/guilds/${config.guildIdToBeTransferedTo}/channels`, channel, {
                    headers: {
                        ["Authorization"]: config.discordToken,
                        ["Content-Type"]: "application/json"
                    }
                })
                if (channel.type === 4) {
                    categorys[channel.id] = createdChannel.id;
                }
            } catch(e) {}
            await wait(config.delay);
        }
    }

    debugLog("Finished.");
}

// clone server
debugLog("My discord: hold_4564");
cloneServer();

// fix bugs with creating roles (some times it doesn't work)
// fix permissions for @everyone role, when identifying it