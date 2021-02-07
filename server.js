require('dotenv').config();
const Instagram = require('instagram-web-api')
const express = require('express');
const bodyParser = require('body-parser');
const exphbs  = require('express-handlebars');
const app = express();
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.set('views', `${__dirname}/views`);
const axios = require('axios')

app.use(express.static(__dirname + '/public'));

const DOMAIN = process.env.DOMAIN

let listen=false;

var admin = require('firebase-admin');

var serviceAccount = JSON.parse(process.env.FIREBASESERVICEKEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASEURL
});
setTimeout(function(){ listen=true; }, 3000);
var db = admin.database();
const actualToken = process.env.TOKEN
const Disc = require("@kihtrak/discord-bot-utils")
Disc.setToken(actualToken)
Disc.setPrefix("~")

Disc.onReady(()=>{
  console.log(`Logged in as ${Disc.client.user.tag}!`)
})

Disc.onMessage([{
  cmd: "login",
  desc: "Sends you a login link",
  exe: (msg, args, params)=>{
    const embed = new Disc.Discord.MessageEmbed()
    .setColor('#B106C2')
    .setTitle('Social Simplicity: A Solution to Doom Scrolling')
    .setURL('https://social-simplicity-21.herokuapp.com/login?disc='+msg.author.id)
    .setDescription('Welcome to social simplicity! We\'ll keep things short and sweet. Click [here](https://social-simplicity-21.herokuapp.com/login?disc='+msg.author.id+') to get started.')
    .addField('Instructions', '1. Click the above link and create an account with social simplicity.\n2. Log in with a social media site you would like to receive updates for.', true)
    .setImage('https://i.imgur.com/PAo4Wat.png')
    .setTimestamp()
    .setFooter('Social Simplicity', 'https://i.imgur.com/PAo4Wat.png');
    msg.author.send(embed)
    msg.channel.send("Sent you a DM!")
  }
},{
    cmd: "about",
    desc: "Sends you a link to our homepage",
    exe: (msg, args, params)=>{
      const embed = new Disc.Discord.MessageEmbed()
      .setColor('#B106C2')
      .setTitle('Social Simplicity: A Solution to Doom Scrolling')
      .setURL('https://social-simplicity-21.herokuapp.com/')
      .setDescription('Here is the [link](https://social-simplicity-21.herokuapp.com/) to our homepage.')
      .setThumbnail('https://i.imgur.com/PAo4Wat.png')
      .setTimestamp()
      .setFooter('Social Simplicity', 'https://i.imgur.com/PAo4Wat.png');
      msg.author.send(embed)
    }
  },{
    cmd: "mute",
    desc: "Prevents notifications from being sent for a speficied ammount of time (in hours)",
    exe: (msg, args, params)=>{
        if(!Number(args[0]))
            return msg.author.send("Enter a number after the command")
    }
}
])

// db.ref("accounts").on("child_added", function(snapshot, prevChildKey) {
//   var newPost = snapshot.val().Instagram;
//   if(listen)
//   sendDM(newPost.discID)
// });
let lastCheck=Date.now()
setInterval(function(){ 
  console.log(lastCheck)
  db.ref('accounts').once('value').then((snapshot)=>{
    snapshot.forEach(accountSnapshot=>{
      let discID=""+accountSnapshot.val().discID;
      console.log(discID)
      if(accountSnapshot.val().Instagram!=null){
        let postsToSend=[];
        console.log(accountSnapshot.key)
        try{
          axios.post('http://localhost:4242/get-posts', {}, {params:{
            uid: accountSnapshot.key
          }}).then(res=>{
            res.data.forEach(async(e)=>{
              if(e.timestamp>=lastCheck){
                await postsToSend.push(e)
              }
              console.log(e)
                //console.log(e.timestamp<=currentTime&&e.timestamp>=lastUpdate)
            })
            lastCheck=Date.now()
            postsToSend.forEach(e=>{
              try{
                const embed = new Disc.Discord.MessageEmbed()
                .setColor('#C70039')
                .setTitle('Update from '+e.handle+"!")
                .setDescription('Caption: '+e.caption)
                .setImage(e.displayUrl)
                Disc.client.users.cache.get(discID).send(embed)
              }
              catch{

              }
            })
          })
          
        }
        catch(err){
          
        }
      }
    })
  })
 }, 60000)


let sendDM=(disc)=>{
  try{
    const embed = new Disc.Discord.MessageEmbed()
    .setColor('#FFF400')
    .setTitle('Sign Up Success!')
    .setDescription('Thanks for creating an account with Social Simplicity! Here are the next steps you need to take in order to receive notifications from other social media sites.')
    .addField('Instructions', '1. Once logged in, select the platform you would like to use. Only instagram is available at the moment.\n2. Log in with the credentials for your social media site.\n3. A list of everyone you follow will appear. Select the accounts you would like to receive notifications for.\n4. That\'s it! You will now be notified every time a selected user posts. You may edit this list of people any time.', true)
    .setImage('https://i.imgur.com/PAo4Wat.png')
    .setTimestamp()
    .setFooter('Some footer text here', 'https://i.imgur.com/wSTFkRM.png');
    Disc.client.users.cache.get(''+disc).send(embed)
  }
  catch{

  }
}
app.get('/', async function (req, res) {
    res.render('landing', { DOMAIN})
})

app.get('/signin', async function (req, res) {
    res.render('login', { DOMAIN, platform:"Instagram"})
})

app.get('/login', async function (req, res) {
    res.render('mainsitelogin', { DOMAIN })
})

app.get('/profile', async function (req, res) {
    res.render('profile', { DOMAIN })
    if(req.query.first==1)
      sendDM(req.query.discID+"")
})

app.get('/following', async function (req, res) {
    const uid = req.query.uid
    if(!uid)
        return res.send("No uid provided!")
    db.ref('accounts').child(uid).child('Instagram').once('value',async (snap)=>{
        const { username, password } = snap.val()
        let client = new Instagram({ username, password });
        const log = await client.login()
        console.log(log)
        if(!log.authenticated)
            return res.send("password failed (maybe it changed? try reseting your insta account)")
        const userId = log.userId
        const profile = await client.getProfile()
        console.log(profile)
        let followingsArr = []
        let followings
        do{
            followings = await client.getFollowings({ userId, after: followings?.page_info?.prevCursor})
            prevCursor = followings.page_info.end_cursor
            followingsArr=[...followingsArr,...followings.data]
        }while(followings.page_info.has_next_page)
        console.log(followingsArr)
        res.render('following', { DOMAIN, followingsArr, profile })
    }).catch(e=>res.send)
    
})
const instaClients = {}
const instaIds = {}
app.post('/sign-in', bodyParser.json(), async (req, res) => {
    //console.log(req.body)
    const username = req.body.username
    const password = req.body.password
    const uid = req.body.uid
    if(req.body.platform == "Instagram"){
        const client = new Instagram({ username, password });
        const log = await client.login()
        console.log(log)
        if(!log.authenticated)
            return res.json({status:"Incorrect username/password"})
        instaClients[`${username}@${password}`] = client
        const userId = log.userId
        instaIds[`${username}@${password}`] = userId
        db.ref('accounts').child(uid).child('Instagram').update({ username, password })
        return res.json({status:"success"})
    }
    return res.json({status:"no plat"})
});

app.post('/get-posts', bodyParser.json(), async (req, res) => {
    const uid = req.query.uid
    db.ref('accounts').child(uid).child('Instagram').once('value',async (snap)=>{
        const { username, password, following } = snap.val()
        let client = new Instagram({ username, password });
        const log = await client.login()
        console.log(log)
        if(!log.authenticated)
            return res.json({e:"password failed (maybe it changed? try reseting your insta account)"})
        const userId = log.userId
        let arr = []
        for(let handle in following)
            if(following[handle]){
                const posts = await client.getPhotosByUsername({ username: handle, /*first:1*/ })
                //console.log(posts.user.edge_owner_to_timeline_media.page_info)
                //console.log(JSON.stringify(posts.user.edge_owner_to_timeline_media.edges[0].node))
                for(let post of posts.user.edge_owner_to_timeline_media.edges){
                    const displayUrl = post?.node?.display_url
                    const caption = post?.node?.edge_media_to_caption?.edges?.[0]?.node?.text
                    const timestamp = post?.node?.taken_at_timestamp
                    const video = post?.node?.video_url
                    const obj = {displayUrl,caption:caption?caption:"No caption",timestamp,video}
                    arr.push(obj)
                }
            }
        arr = arr.sort((a,b)=>b.timestamp-a.timestamp)
        //console.log(arr)
        return res.json(arr)
    }).catch(e=>res.json(e))
});

const port = process.env.PORT || 4242
app.listen(port, () => console.log(`Running on port ${port}`));