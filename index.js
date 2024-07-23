const express = require('express');
const path = require('path');
const webpush = require('web-push');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const sensorRoutes = require('./routes/sensors'); // Adjust the path accordingly
const crypto = require('crypto');
const session = require('express-session');
const fs = require('fs');


const app = express();

// const randomKey = crypto.randomBytes(32).toString('hex');

// app.use(session({
//   secret: randomKey,
//   resave: false,
//   saveUninitialized: false,
//   cookie: { maxAge: 365 * 24 * 60 * 60 * 1000 } 
// }));

// const isAuthenticated = (req, res, next) => {
//   console.log("Checking authentication status...");
//   if (req.session.isAuthenticated) {
//     console.log("User is authenticated.", req.session.isAuthenticated);
//     next();
//   } else {
//     next()
//     console.log("User is not authenticated. Redirecting to login page.", req.session.isAuthenticated);
//     // res.redirect('/appmobile/login.html');
//   }
// };

// const protectedPaths = ['/','index.html'];

// app.get(protectedPaths, isAuthenticated, (req, res) => {
//   console.log("Handling protected route...");
//   const filename = req.path.substring(1);
//   res.sendFile(path.join(__dirname, 'public', filename));
// });

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.post('/ApiAfficheurdynimac/save-html', (req, res) => {
  const { htmlContent, styles, fileNumber } = req.body;
  const fileName = `exported_page_${fileNumber}.html`;
  const fullHtml = `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Exported Page</title>
      <link rel="stylesheet" href="../style.css">
      <script type="module" src="../export-page.js"></script>
  </head>
  <body>
      <div class="container" style="${styles}">
          ${htmlContent}
      </div>
  </body>
  </html>`;

  const filePath = path.join(__dirname, 'public', 'project', fileName);

  fs.writeFile(filePath, fullHtml, (err) => {
      if (err) {
          return res.status(500).send('Error saving file');
      }
      res.json({ url: `/project/${fileName}` });
  });
});

// app.post('/ApiAfficheurdynimac/authenticate', async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     // Use dynamic import() for node-fetch
//     const fetch = await import('node-fetch');

//     // Make the authentication request to the insecure authentication service using await
//     const response = await fetch.default(`http://kit-authentication:8081/?username=${username}&password=${password}`);

//     if (response.ok) {
//       const userData = await response.json();
//       console.log("Authentication successful. User data:", userData);

//       // If authentication is successful, set a session
//       req.session.isAuthenticated = true;
//       req.session.username = username;

//       // Redirect to a success page or send a success response
//       res.status(200).json({ message: 'Authentication successful' })
//     } else {
//       console.log("Authentication failed. Redirecting to login page.");
//       res.redirect('/appmobile/login.html');
//     }
//   } catch (error) {
//     console.error("Error during authentication:", error);
//     res.status(500).send("Internal server error");
//   }
// });



// app.get('/ApiAfficheurdynimac/logout', (req, res) => {
//   // Clear the session data
//   req.session = null;

//   // Redirect to the login page or any other desired page
//   res.redirect('/appmobile/login.html');
// });









app.use(bodyParser.urlencoded({ extended: true }));
// const port = 2023;


//////////////////////////////////////////////////

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

const energyData = [
  {date: "Janvier 2022", "kwh": 1690.4},
  {date: "Février 2022", "kwh": 1680.1},
  {date: "Mars 2022", "kwh": 1883.0},
  {date: "Avril 2022", "kwh": 1491.7},
  {date: "Mai 2022", "kwh": 1554.8},
  {date: "Juin 2022", "kwh": 1556.9},
  {date: "Juillet 2022", "kwh": 1423.9},
  {date: "Août 2022", "kwh": 1368.2},
  {date: "Septembre 2022", "kwh": 1418.2},
  {date: "Octobre 2022", "kwh": 1503.8},
  {date: "Novembre 2022", "kwh": 1423.0},
  {date: "Décembre 2022", "kwh": 1517.0},
  {date: "Janvier 2023", "kwh": 1723.8},
  {date: "Février 2023", "kwh": 1531.4},
  {date: "Mars 2023", "kwh": 1608.3},
  {date: "Avril 2023", "kwh": 1320.5},
  {date: "Mai 2023", "kwh": 1434.2},
  {date: "Juin 2023", "kwh": 1369.8},
  {date: "Juillet 2023", "kwh": 1295.3},
  {date: "Août 2023", "kwh": 1265.5},
  {date: "Septembre 2023", "kwh": 1320.3},
  {date: "Octobre 2023", "kwh": 1571.6},
  {date: "Novembre 2023", "kwh": 1436.9},
  {date: "Décembre 2023", "kwh": 1459.8}
];

// Endpoint to get all energy data
app.get('/ApiAfficheurdynimac/energy', (req, res) => {
  res.json({ data: energyData });
});
// Define additional routes or handlers as needed
let cachedToken = null;
let lastTokenTimestamp = null;
const tokenExpirationTime = 14400; // seconds, adjust as needed

const clientId = '0oa9wkuauoOl1dDXS417';
const clientSecret = '09LBynp0-Rdpno6yvLO1Rmz3u6fl1nUihiOr3uhBaR9IoCZqrVBzEWx2P5vBbLaJ'; // Replace with the client secret received by SMS
const tokenUrl = 'https://adict-connexion.grdf.fr/oauth2/aus5y2ta2uEHjCWIR417/v1/token';
app.get('/ApiAfficheurdynimac/getToken', (req, res) => {
  // Check if the token is cached and still valid
  if (cachedToken && lastTokenTimestamp && (Date.now() - lastTokenTimestamp) / 1000 < tokenExpirationTime) {
    console.log('Using cached token:', cachedToken);
    res.send(cachedToken);
  } else {
    // Fetch a new token
    console.log('Making a new request for token...');
    const cmd = `curl --location '${tokenUrl}' \
      --header 'Content-Type: application/x-www-form-urlencoded' \
      --data-urlencode 'grant_type=client_credentials' \
      --data-urlencode 'client_id=${clientId}' \
      --data-urlencode 'client_secret=${clientSecret}' \
      --data-urlencode 'scope=/adict/v2'`;

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        res.status(500).send(error);
      }

      // Cache the token and update the timestamp
      cachedToken = JSON.parse(stdout);
      lastTokenTimestamp = Date.now();

      console.log('New token fetched and cached:', cachedToken);
      res.send(cachedToken);
    });
  }
});
/////////////////////////
// app.post('/ApiAfficheurdynimac/graphql', async (req, res) => {
//   try {
//     // Load node-fetch asynchronously
//     const { default: fetch } = await import('node-fetch');

//     // Handle the GraphQL request here
//     const { system, type, groupName } = req.body; // Assuming you send system, type, and groupName in the request body

//     const remoteGraphQLURL = 'http://kit-devices:9999/graphql'; // Remote GraphQL URL

//     const graphqlResponse = await fetch(remoteGraphQLURL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         query: `
//           query GetDevices($filter: String, $sort: String, $limit: String) {
//             getDevices(filter: $filter, sort: $sort, limit: $limit) {
//               items {
//                 id,
//                 name,
//                 uuid,
//                 type,
//                 macAddresses
//               }
//             }
//           }
//         `,
//         variables: {
//           filter: `(&(os.system=${system})(type=${type})(ancestors.name=${groupName}))`,
//         },
//       }),
//     });

//     if (graphqlResponse.ok) {
//       const graphqlData = await graphqlResponse.json();
//       res.json(graphqlData);
//       console.log(graphqlData.data.getDevices.items,"graphqlData====<");
//     } else {
//       res.status(500).json({ error: 'GraphQL request failed' });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });
///////////////
// ******************DATABASE************
// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
// Connect to MongoDB
const mongoUrl = 'mongodb://fluent-mongo:27017/';
// const mongoUrl = 'mongodb://neos50.novatice.fr:27017/';
const dbName = 'sensors';

// Connect to MongoDB using Mongoose
mongoose.connect(`${mongoUrl}${dbName}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

db.once('open', () => {
  console.log('Connected to MongoDB');
  app.use('/ApiAfficheurdynimac', sensorRoutes);
  // setInterval(fetchDataAndSendNotifications, 900000); // 15 minutes in milliseconds
});







////////////////////////////////
// Start the server
const port = 9020;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});