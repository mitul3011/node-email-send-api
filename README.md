# node-email-send-api

1. Enter `npm install` command to install all the npm modules listed inside `package.json` file.
2. Enter `node src/app.js` to start the server.
3. Enter `localhost:3000/AuthProcess` in browser to authenticate user.
   1. Now, it will print **Authentication URL** inside console.
   2. We have to visit that URL interms of getting authorization code.
   3. Copy and paste authorization code into console.
4. After authorization, Enter `localhost:3000/enter_recipient_email/enter_sender_email/enter_subject/enter_body_of_email`.
5. For Example, `localhost:3000/example123@email.com/example321@email.com/Hello Receiver/Hello World!`
6. Mail will be sent successfully.
