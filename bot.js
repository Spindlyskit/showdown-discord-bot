'use strict'

const commando = require('discord.js-commando');
const path = require('path');
const oneLine = require('common-tags').oneLine;
const sqlite = require('sqlite');
const config = require('config.json')('./config.json');
const dataparser = require('./utilitys/dataparser.js');
const rankmanager = require('./utilitys/rankmanager.js')

const client = new commando.Client({
	owner: config.owner,
	commandPrefix: '!'
});

client.parser = new dataparser.Parser(client);;
client.rankmanager = new rankmanager.GuildRankManager(client);

client
	.on('error', console.error)
	.on('warn', console.warn)
	.on('debug', console.log)
	.on('ready', () => {
		console.log(`Client ready; logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})`);
		client.user.setAvatar('./assets/img/pfp.png')
			.then("Set new avatar!");
	})
	.on('disconnect', () => { console.warn('Disconnected!'); })
	.on('reconnecting', () => { console.warn('Reconnecting...'); })
	.on('commandError', (cmd, err) => {
		if(err instanceof commando.FriendlyError) return;
		console.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
	})
	.on('commandBlocked', (msg, reason) => {
		console.log(oneLine`
			Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; ${reason}
		`);
	})
	.on('commandPrefixChange', (guild, prefix) => {
		console.log(oneLine`
			Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('commandStatusChange', (guild, command, enabled) => {
		console.log(oneLine`
			Command ${command.groupID}:${command.memberName}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('groupStatusChange', (guild, group, enabled) => {
		console.log(oneLine`
			Group ${group.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('message', msg => {
		if (msg.guild.id == config.console.guild &&
			msg.channel.id == config.console.channel
			&& config.console.auth.indexOf(msg.author.id) >= 0) {
				var cmdmsg = new commando.CommandMessage(msg, client.registry.findCommands('eval')[0], msg.content);
				cmdmsg.run();
			}
	});

client.registry
    .registerDefaults()
    .registerGroups([
		['info', 'Informational'],
		['opt', 'Option'],
		['voice', 'Voice'],
		['driver', 'Driver'],
		['mod', 'Moderator'],
		['lead', 'Leader'],
		['admin', 'Administrator'],
		['rowner', 'Room Owner']
    ])
	.registerCommandsIn(path.join(__dirname, 'commands'));

client.setProvider(
	sqlite.open(path.join(__dirname, 'database.sqlite3')).then(db => new commando.SQLiteProvider(db))
).catch(console.error);

client.login(config.token);
