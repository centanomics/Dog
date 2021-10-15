require('dotenv').config();
const uuid = require('uuid');
const express = require('express');
const path = require('path');
const app = express();
const port = 4000;

//server setup
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
const prefix = '~';

client.login(process.env.DISCORD_BOT_TOKEN);

// when the bot is ready logs it and sets a status
client.on('ready', () => {
  console.log('Social Credit Bot is ready!');
  client.user.setPresence({
    activity: {
      name: '/count',
      type: 'PLAYING',
    },
  });
});

client.on('message', async (message) => {
  // if the user is a bot skip
  if (message.author.bot) {
    return;
  }
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
  // if the user is a bot skip
  if (oldMessage.author.bot) {
    return;
  }

  // checks to see if a user has said a specific word(s)
  const regex = new RegExp(process.env.WORD_REGEX, 'g');
  const wordsCount = [...newMessage.content.matchAll(regex)];

  //if the user exists in the db, add to their count. If not creat a user in the db
  if (wordsCount.length !== 0) {
    const userCount = await WordCount.findOne({
      guildId: newMessage.guild.id,
      userId: newMessage.author.id,
    });
    // if the user doesnt exist create a new user
    if (userCount === null) {
      const newUserCount = new WordCount({
        _id: uuid.v4(),
        userId: newMessage.author.id,
        guildId: newMessage.guild.id,
        count: wordsCount.length,
      });

      const upUserCount = await newUserCount.save();
    } else {
      const userCountFields = {
        count: userCount.count + wordsCount.length,
      };

      const upUserCount = await WordCount.findByIdAndUpdate(
        userCount._id,
        { $set: userCountFields },
        { new: true }
      );
    }
  }
});
