const { Client, MessageEmbed, MessageActionRow, MessageSelectMenu } = require("discord.js");
const client = new Client({ intents: 32767, partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const config = require("./config.js");

client.on("ready", async () => {
    console.log("Logged in...");

    client.guilds.cache.get(config.guildID).commands?.create({
        name: "review",
        description: "Get client review",
        options: [{
            name: "client",
            description: "Client mention for the review",
            required: true,
            type: "USER"
        },
        {
            name: "booster",
            description: "Booster mention for the review",
            required: true,
            type: "USER"
        },
        {
            name: "support",
            description: "Support mention for the review",
            required: true,
            type: "USER"
        }]
    });
});

client.on("interactionCreate", interaction => {
    if (!interaction.isCommand) return;

    if (interaction.commandName == "review") {
        if (!interaction.member.roles.cache.get(config.ticketManagerRole)) interaction.reply({ content: "**You're not allowed to use this command**", ephemeral: true })
        else {
            let UserClient = interaction.options.getUser("client");
            let booster = interaction.options.getUser("booster");
            let support = interaction.options.getUser("support");

            let options = {
                booster: [],
                support: []
            }
            for (i = 0; i < 5; i++) {
                options.booster.push({
                    label: `Rate ${i + 1}/5`,
                    description: 'Rating for the booster',
                    value: `${i + 1}`,
                })
                options.support.push({
                    label: `Rate ${i + 1}/5`,
                    description: 'Rating for the support',
                    value: `${i + 1}`,
                })
            }
            let boosterRate,
                supportRate;
            interaction.reply({ content: "**Review embeds has been generated**", ephemeral: true })
            interaction.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setTitle("Booster of the service.")
                        .setColor("GREEN")
                        .setDescription(`${booster} (\`${booster.id}\`)`)
                        .setTimestamp()
                ],
                components: [
                    new MessageActionRow()
                        .addComponents(
                            new MessageSelectMenu()
                                .setCustomId('boosterRate')
                                .setPlaceholder('Booster Rate')
                                .addOptions(options.booster),
                        )]
            }).then(msg => {
                const filter = i => i.user.id === UserClient.id;

                msg.awaitMessageComponent({ filter, componentType: 'SELECT_MENU' })
                    .then(i => {
                        boosterRate = i.values[0];
                        i.reply({ content: "**Your rate for booster has been recorded, thank you**", ephemeral: true });
                        msg.delete();
                        post();
                    })
            })

            interaction.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setTitle("Support of the service.")
                        .setColor("GREEN")
                        .setDescription(`${support} (\`${support.id}\`)`)
                        .setTimestamp()
                ],
                components: [
                    new MessageActionRow()
                        .addComponents(
                            new MessageSelectMenu()
                                .setCustomId('supportRate')
                                .setPlaceholder('Support Rate')
                                .addOptions(options.support),
                        )]
            }).then(msg => {
                const filter = i => i.user.id === UserClient.id;

                msg.awaitMessageComponent({ filter, componentType: 'SELECT_MENU' })
                    .then(i => {
                        supportRate = i.values[0];
                        i.reply({ content: "**Your rate for support has been recorded, thank you**", ephemeral: true });
                        msg.delete();
                        post();
                    })
            })
            const post = () => {
                if (supportRate && boosterRate) {
                    interaction.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setDescription("**Please type your review as you would normally send a message below and press send (enter).**")
                                .setColor("GREEN")
                        ]
                    }).then(msg => {
                        const stars = (num) => {
                            switch (num) {
                                default: return "⭐"
                                case "2": return "⭐⭐"
                                case "3": return "⭐⭐⭐"
                                case "4": return "⭐⭐⭐⭐"
                                case "5": return "⭐⭐⭐⭐⭐"
                            }
                        }
                        const filter = (msg) => msg.author.id === UserClient.id;

                        msg.channel.awaitMessages({ filter, max: 1, time: 5 * 60000 })
                            .then(messages => {
                                client.channels.cache.get(config.reviewChannel).send({
                                    embeds: [
                                        new MessageEmbed()
                                            .setTitle("New Review")
                                            .setDescription(`Client: ${UserClient.tag}`)
                                            .addField("**Support User**", `${support.tag} - ${stars(supportRate)}`)
                                            .addField("**Booster User**", `${booster.tag} - ${stars(boosterRate)}`)
                                            .addField("**Comment**", messages.first().content)
                                            .setColor("GREEN")
                                            .setTimestamp()
                                    ]
                                })
                                msg.edit({
                                    embeds: [
                                        new MessageEmbed()
                                            .setTitle("Feedback has been recorded.")
                                            .setDescription(`**Thank you for your business!**`)
                                            .setColor("GREEN")
                                            .setTimestamp()
                                    ]
                                })
                            })
                    })
                }
            }
        }
    }
})

client.login(config.token)