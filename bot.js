require('dotenv').config();
const uuid = require('uuid');
const express = require('express');
const path = require('path');
const app = express();
const port = 4000;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.listen(port, () => {
  console.log(`Dog listening on port ${port}`);
});

// discord bot

const Discord = require('discord.js');
const connectDB = require('./config/db');
const WordCount = require('./models/WordCount');

connectDB();

const client = new Discord.Client();
const prefix = '/';

client.login(process.env.DISCORD_BOT_TOKEN);

client.on('ready', () => {
  console.log('Dog is ready!');
  client.user.setPresence({
    activity: {
      name: '/count',
      type: 'PLAYING',
    },
  });
});

client.on('message', async (message) => {
  if (message.author.bot) {
    return;
  }
  const words = process.env.WORD.split(',');
  if (
    message.content.includes(words[0]) ||
    message.content.includes(words[1])
  ) {
    const userCount = await WordCount.findOne({
      guildId: message.guild.id,
      userId: message.author.id,
    });
    // console.log(userCount);
    if (userCount === null) {
      const newUserCount = new WordCount({
        _id: uuid.v4(),
        userId: message.author.id,
        guildId: message.guild.id,
        count: 1,
      });

      const upUserCount = await newUserCount.save();
    } else {
      const userCountFields = {
        count: userCount.count + 1,
      };

      const upUserCount = await WordCount.findByIdAndUpdate(
        userCount._id,
        { $set: userCountFields },
        { new: true }
      );
    }
  }

  if (!message.content.startsWith(prefix)) {
    return;
  }

  const args = message.content.slice(prefix.length).split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'count') {
    const userCount = await WordCount.findOne({
      guildId: message.guild.id,
      userId: message.author.id,
    });

    if (userCount === null) {
      message.channel.send("You haven't said the n word yet, congrats!");
    } else {
      message.channel.send(
        `You have said the n word ${userCount.count} time(s)`
      );
    }
    return;
  }
});
