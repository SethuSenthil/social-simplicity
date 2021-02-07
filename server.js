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
//How often the bot checks insta in miliseconds
let refreshRate=1500000

app.use(express.static(__dirname + '/public'));

const DOMAIN = process.env.DOMAIN

var admin = require('firebase-admin');

var serviceAccount = JSON.parse(process.env.FIREBASESERVICEKEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASEURL
});

var db = admin.database();
const actualToken = process.env.TOKEN
const Disc = require("@kihtrak/discord-bot-utils")
Disc.setToken(actualToken)
Disc.setPrefix("!")

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
    desc: "Prevents notifications from being sent for a specified ammount of time (in hours)",
    exe: (msg, args, params)=>{
        if(!Number(args[0]))
            return msg.author.send("Enter a number after the command")
        changeMute(1, msg.author.id)
        msg.channel.send("You have muted your accounts for "+parseInt(args[0])+" hours")
        setTimeout(()=>{
          changeMute(0, msg.author.id)
        },parseInt(args[0])*1000*60*60)
    }
},{
  cmd: "unmute",
  desc: "Unmutes yourself.",
  exe: async (msg, args, params)=>{
    changeMute(0, msg.author.id)
    msg.channel.send("All your accounts are now unmuted!")
  }
},{
  cmd: "refresh",
  desc: "sets refresh rate in seconds",
  exe: (msg, args, params)=>{
    let seconds = parseInt(args[0])
    msg.channel.send("Refresh rate set to "+seconds+" seconds!")
    refresh=seconds
  }
},{
  cmd: "get",
  desc: "Get your firebase UID",
  exe: (msg, args, params)=>{
    var ref = db.ref('accounts');
    ref.orderByChild('discID').equalTo(''+msg.author.id).on("child_added", function(snapshot) {
      msg.channel.send(snapshot.key)
    });
  }
}
])

let changeMute=(m, id)=>{
  var ref = db.ref('accounts');
        ref.orderByChild('discID').equalTo(''+id).on("child_added", function(snapshot) {
          ref.child(snapshot.key).update({
            mute: m
           })
        });
}
// db.ref("accounts").on("child_added", function(snapshot, prevChildKey) {
//   var newPost = snapshot.val().Instagram;
//   if(listen)
//   sendDM(newPost.discID)
// });


let lastCheck=Math.floor(Date.now()/1000)
setInterval(function(){ 
  console.log(lastCheck)
  db.ref('accounts').once('value').then((snapshot)=>{
    snapshot.forEach(async(accountSnapshot)=>{
      let discID=""
      let mute=accountSnapshot.val().mute
      if(accountSnapshot.val().discID)
        discID=""+accountSnapshot.val().discID;
      if(discID!="")
      console.log(discID)
      if(accountSnapshot.val().Instagram!=null){
        let postsToSend=[];
        console.log(accountSnapshot.key)
          axios.post('https://social-simplicity-21.herokuapp.com/get-posts-2', [], {params:{
            uid: accountSnapshot.key
          }}).then(res=>{
            res.data.forEach(async(e)=>{
              if(e.timestamp>=lastCheck){
                await postsToSend.push(e)
              }//1612696754674
            })
            lastCheck=Math.floor(Date.now()/1000)
            postsToSend.forEach(e=>{
              console.log(e)
              try{
                const embed = new Disc.Discord.MessageEmbed()
                .setColor('#C70039')
                .setTitle('Update from '+e.handle+"!")
                .setDescription('Caption: '+e.caption)
                .setImage(e.displayUrl)
                if(discID!=""&&mute==0)
                  Disc.client.users.cache.get(discID).send(embed)
              }
              catch{

              }
            })
          })
      }
    })
  })
 }, refreshRate)


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

app.get('/get-posts', bodyParser.json(), async (req, res) => {
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
                for(let post of posts.user.edge_owner_to_timeline_media.edges){
                    const displayUrl = post?.node?.display_url
                    const caption = post?.node?.edge_media_to_caption?.edges?.[0]?.node?.text
                    const timestamp = post?.node?.taken_at_timestamp
                    const video = post?.node?.video_url
                    const obj = {displayUrl,caption:caption?caption:"No caption",timestamp,video, handle}
                    arr.push(obj)
                }
            }
        arr = arr.sort((a,b)=>b.timestamp-a.timestamp)
        return res.json(arr)
    }).catch(e=>res.json(e))
});

app.get('/get-post', bodyParser.json(), async (req, res) => {
    console.log("retunred")
    return res.send("https://scontent-iad3-1.cdninstagram.com/v/t51.2885-15/e35/146711608_329003628452944_1173123558701968683_n.jpg?_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=104&_nc_ohc=g-YapnS4VnEAX9RQuVo&tp=1&oh=e0e9988290d8b23192bd5b0c3f57cf58&oe=6049401A")
})

const cache = {}
app.get('/get-posts-unity', bodyParser.json(), async (req, res) => {
  const username = req.query.username
  const password = req.query.password
  let verified = false
  let uid="NONE"
  db.ref("accounts").orderByChild('Instagram/password').equalTo(''+password).on("child_added", function(snapshot) {
    verified=true;
  })
  db.ref("accounts").orderByChild('Instagram/username').equalTo(''+username).on("child_added", function(snapshot) {
    if(verified)
    uid=snapshot.key
  })
  if(uid!="NONE"){
    if(!cache[uid])
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
                for(let post of posts.user.edge_owner_to_timeline_media.edges){
                    const displayUrl = post?.node?.display_url
                    const caption = post?.node?.edge_media_to_caption?.edges?.[0]?.node?.text
                    const timestamp = post?.node?.taken_at_timestamp
                    const video = post?.node?.video_url
                    const obj = {displayUrl,caption:caption?caption:"No caption",timestamp,video, handle}
                    arr.push(obj)
                }
            }
        cache[uid] = arr.sort((a,b)=>b.timestamp-a.timestamp)
    return res.send((cache[uid])[Math.random()*(cache[uid]).length].displayUrl)
  }).catch(e=>res.send(e))
  }
});

app.post('/get-posts-2', bodyParser.json(), async (req, res) => {
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
              for(let post of posts.user.edge_owner_to_timeline_media.edges){
                  const displayUrl = post?.node?.display_url
                  const caption = post?.node?.edge_media_to_caption?.edges?.[0]?.node?.text
                  const timestamp = post?.node?.taken_at_timestamp
                  const video = post?.node?.video_url
                  const obj = {displayUrl,caption:caption?caption:"No caption",timestamp,video, handle}
                  arr.push(obj)
              }
          }
      arr = arr.sort((a,b)=>b.timestamp-a.timestamp)
      return res.json(arr)
  }).catch(e=>res.json(e))
});

const port = process.env.PORT || 4242
app.listen(port, () => console.log(`Running on port ${port}`));