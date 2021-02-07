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
let refreshRate=10000

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
        
    }
},{
  cmd: "unmute",
  desc: "Unmutes yourself.",
  exe: (msg, args, params)=>{
    
  }
},{
  cmd: "refresh",
  desc: "sets refresh rate in seconds",
  exe: (msg, args, params)=>{
    let seconds = parseInt(args[1])
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

let getUIDFromToken=()=>{
  db.ref('accounts').once('value').then((snapshot)=>{
    snapshot.forEach(accountSnapshot=>{
      if(accountSnapshot.val().discID===msg.author.id)
        return accountSnapshot.key
    })
  })
}
// db.ref("accounts").on("child_added", function(snapshot, prevChildKey) {
//   var newPost = snapshot.val().Instagram;
//   if(listen)
//   sendDM(newPost.discID)
// });


// let lastCheck=Math.floor(Date.now()/1000)
// setInterval(function(){ 
//   console.log(lastCheck)
//   db.ref('accounts').once('value').then((snapshot)=>{
//     snapshot.forEach(accountSnapshot=>{
//       let discID=""
//       let mute=accountSnapshot.val().mute
//       if(accountSnapshot.val().discID)
//         discID=""+accountSnapshot.val().discID;
//       if(discID!="")
//       console.log(discID)
//       if(accountSnapshot.val().Instagram!=null){
//         let postsToSend=[];
//         console.log(accountSnapshot.key)
//         try{
//           axios.get('https://social-simplicity-21.herokuapp.com/get-posts', {params:{
//             uid: accountSnapshot.key
//           }}).then(res=>{
//             res.data.forEach(async(e)=>{
//               if(e.timestamp>=lastCheck){
//                 await postsToSend.push(e)
//               }//1612696754674
//             })
//             lastCheck=Math.floor(Date.now()/1000)
//             postsToSend.forEach(e=>{
//               try{
//                 const embed = new Disc.Discord.MessageEmbed()
//                 .setColor('#C70039')
//                 .setTitle('Update from '+e.handle+"!")
//                 .setDescription('Caption: '+e.caption)
//                 .setImage(e.displayUrl)
//                 if(discID!=""&&mute==0)
//                   Disc.client.users.cache.get(discID).send(embed)
//               }
//               catch{

//               }
//             })
//           })
          
//         }
//         catch(err){
          
//         }
//       }
//     })
//   })
//  }, refreshRate)


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
    return res.json(([{"displayUrl":"https://scontent-iad3-1.cdninstagram.com/v/t51.2885-15/e35/146711608_329003628452944_1173123558701968683_n.jpg?_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=104&_nc_ohc=g-YapnS4VnEAX9RQuVo&tp=1&oh=e0e9988290d8b23192bd5b0c3f57cf58&oe=6049401A","caption":"No caption","timestamp":1612701350,"handle":"yinforthewin"},{"displayUrl":"https://scontent-iad3-1.cdninstagram.com/v/t51.2885-15/e35/131595344_3350813321712590_6827048596812120537_n.jpg?_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=102&_nc_ohc=xZMR-rxUH1oAX86EuBk&tp=1&oh=fba8abbc3dc4b3ef3d57186c67f13db5&oe=6047F4E8","caption":"Semester took my ability to smile properly","timestamp":1608339584,"handle":"yinforthewin"},{"displayUrl":"https://scontent-iad3-1.cdninstagram.com/v/t51.2885-15/e35/109448062_289844752234263_7735183925030082321_n.jpg?_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=103&_nc_ohc=MxEFa1qMZ3EAX_P19uv&tp=1&oh=06b5f58100970cf92dc6e391403577cd&oe=6049B0E6","caption":"No caption","timestamp":1594953951,"handle":"yinforthewin"},{"displayUrl":"https://scontent-iad3-1.cdninstagram.com/v/t51.2885-15/e35/74713600_762413550890598_7769749799565184593_n.jpg?_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=106&_nc_ohc=A1iuy7V_s24AX_BkNNI&tp=1&oh=7ad9f207852e441614a2016b86842cfa&oe=6049167D","caption":"I haven't grown since freshman year lol","timestamp":1571626304,"handle":"yinforthewin"},{"displayUrl":"https://scontent-iad3-1.cdninstagram.com/v/t51.2885-15/e35/43628365_295865164354601_2232991383166367372_n.jpg?_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=105&_nc_ohc=XHUH_vUQtDQAX-VCyQB&tp=1&oh=691f5b0f8b52b99d49595142782dc65e&oe=60485DE3","caption":"GMCs\nYeh idk what was in my mouth\nPC: @kihtrakr @jamespostrandomstuff","timestamp":1540176208,"handle":"yinforthewin"},{"displayUrl":"https://scontent-iad3-1.cdninstagram.com/v/t51.2885-15/e35/21225025_483863278643629_2202526729094823936_n.jpg?_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=101&_nc_ohc=BD0NEdPSGnIAX8oHgBe&tp=1&oh=99c921715032c5243df14989524166d0&oe=60496347","caption":"I went to Williamsburg for a week with @jeffreyy713 . I tagged him in the pictures that he took for me.","timestamp":1504381463,"handle":"yinforthewin"},{"displayUrl":"https://scontent-iad3-1.cdninstagram.com/v/t51.2885-15/e35/13257004_223323038052451_376010010_n.jpg?_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=107&_nc_ohc=fkXtlt3mAo4AX8yjHIA&tp=1&oh=b37a7e8fad7ddc7c9ca2e465ce9c4660&oe=604B22FD","caption":"Visited National Aquarium today...saw this thing","timestamp":1464374952,"handle":"yinforthewin"},{"displayUrl":"https://scontent-iad3-1.cdninstagram.com/v/t51.2885-15/e35/13183462_751935031609934_579192862_n.jpg?_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=102&_nc_ohc=-RuM7vjqmtsAX8tnAng&tp=1&oh=ca8aaae8cc823b1f92a9946ef580add1&oe=60482549","caption":"Looks so real...\n#Gettysburg","timestamp":1463527623,"handle":"yinforthewin"},{"displayUrl":"https://scontent-iad3-1.cdninstagram.com/v/t51.2885-15/e35/12935013_493355557527040_1596007241_n.jpg?_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=104&_nc_ohc=ZDPRV9dxEQcAX9p2ZBd&tp=1&oh=774451294f6a0ffe04e410b60448ee4f&oe=604AA5A6","caption":"Made this with some friends today. What? I was bored...\n#mudpuddle","timestamp":1461438817,"handle":"yinforthewin"}]).map(el=>""+el.timestamp))
})
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
  }
});

const port = process.env.PORT || 4242
app.listen(port, () => console.log(`Running on port ${port}`));