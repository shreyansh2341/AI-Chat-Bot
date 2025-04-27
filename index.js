'use strict';

require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { SessionsClient } = require('@google-cloud/dialogflow');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

io.on('connection', (socket) => {
  socket.on('chat message', async (text) => {

    const sessionClient = new SessionsClient();
    const sessionPath = sessionClient.projectAgentSessionPath(process.env.DIALOGFLOW_PROJECT_ID, socket.id);

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: text,
          languageCode: 'en-US',
        },
      },
    };

    try {
      // console.log('Sending request to Dialogflow');
      const responses = await sessionClient.detectIntent(request);
      // console.log('Response from Dialogflow:', responses);

      const result = responses[0].queryResult;
      const aiText = result.fulfillmentText;
      // console.log('Bot reply: ' + aiText);
      socket.emit('bot reply', aiText);
    } catch (err) {
      console.error('Dialogflow API ERROR:', err);
      socket.emit('bot reply', 'I encountered an error, please try again later.');
    }
  });
});

const PORT= 5000;
server.listen(process.env.PORT || 5000, () => {
  console.log(`Server listening on http://localhost:${PORT}`, server.address().port, app.settings.env);
});
