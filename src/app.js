const fs = require('fs');
const readline = require('readline');
const express = require('express');
const { google } = require('googleapis');

const app = express();
const port = 3000;

const SCOPES = ['https://mail.google.com/', 'https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'];

let oAuth2Client;
const TOKEN_PATH = 'token.json';

const oAuthProcess = () => {
    fs.readFile('src/credentials.json', (err, content) => {
        if (err) {
            return console.log('Error loading client secret file:', err);
        }
        // Authorize a client with credentials.
        authorize(JSON.parse(content));
    });
};

const authorize = (credentials, callback, encodedEmail) => {
    const {client_secret, client_id, redirect_uris} = credentials.web;
    oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        // if file not exist or access_token is expired then we have to generate new token.
        const d = Date.now();
        if (err || d >= JSON.parse(token).expiry_date) {
            if(callback) {
                return getNewToken(oAuth2Client, callback, encodedEmail);
            }
            
            return getNewToken(oAuth2Client);
        }

        oAuth2Client.setCredentials(JSON.parse(token));
        if(callback) {
            callback(oAuth2Client, encodedEmail);
        }
    });
};

const getNewToken = (oAuth2Client, callback, encodedEmail) => {
    // it will generate an URL on which authorization code is available which is then converted to access_token.
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);

    // After getting authorization code we need to convert that code into access token.
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) {
                return console.error('Error retrieving access token', err);
            }
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) {
                    return console.error(err);
                }
                console.log('Token stored to', TOKEN_PATH);
            });
            if(callback){
                callback(oAuth2Client, encodedEmail);
            }
        });
    });
}

// Function to encode email from utf8 to base64
const composeEmail = (to, from, subject, message) => {
    const email = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
        "MIME-Version: 1.0\n",
        "Content-Transfer-Encoding: 7bit\n",
        "to: ", to, "\n",
        "from: ", from, "\n",
        "subject: ", subject, "\n\n",
        message
    ].join('');

    const encodedMail = Buffer.from(email).toString("base64").replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return encodedMail;
};

// Function to authorize user client and send email.
const authAndSendEmail = async (auth, encodedEmail) => {
    const gmail = google.gmail({ version: 'v1', auth });

    const emailSend = await gmail.users.messages.send({
        userId: 'me',
        resource: {
            raw: encodedEmail
        }
    });

    console.log('Email Sent!');

    return emailSend;
};

app.get('', (req, res) => {
    res.send('Welcome to Email Sending API.');
});

// Endpoint to authorize.
app.get('/AuthProcess', (req, res) => {
    oAuthProcess();
    res.send('Authorization Done!');
});

// Endpoint to send email.
app.get('/SendEmail/:to/:from/:subject/:messageBody', (req, res) => {
    const { to, from, subject, messageBody } = req.params;
    const encodedEmail = composeEmail(to, from, subject, messageBody);
    console.log(encodedEmail);

    fs.readFile('src/credentials.json', (err, content) => {
        if (err) {
            return console.log('Error loading client secret file:', err);
        }
        
        // Authorize a client with credentials, then we can call the Gmail API.
        authorize(JSON.parse(content), authAndSendEmail, encodedEmail);
    });

    res.send('Email Sent!');
});

app.listen(port, () => {
    console.log('Server is up on port', port);
});