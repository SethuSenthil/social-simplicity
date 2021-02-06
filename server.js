require('dotenv').config();
const Instagram = require('instagram-web-api')
const express = require('express');
const bodyParser = require('body-parser');
const exphbs  = require('express-handlebars');
const app = express();
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.set('views', `${__dirname}/views`);

app.use(express.static(__dirname + '/public'));

const YOUR_DOMAIN = process.env.DOMAIN

// var admin = require('firebase-admin');

// var serviceAccount = JSON.parse(process.env.FIREBASESERVICEKEY);

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: process.env.DATABASEURL
// });

// var db = admin.database();

app.get('/', async function (req, res) {
    res.render('login', { txt: `text`})
})


app.post('/insta-login', bodyParser.json(), async (req, res) => {

});

const port = process.env.PORT || 4242
app.listen(port, () => console.log(`Running on port ${port}`));