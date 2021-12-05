//Bot \/
const Discord      = require('discord.js');
const ytdl         = require('ytdl-core');
const fetch        = require('node-fetch');
const client       = new Discord.Client();
const bot_token    = process.env['bot_token']
let servers        = []
let bitrate        = 384000 * 4  //common for all servers

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});


client.on('message', async (message)=>{
  if(message.content.startsWith('-play') && message.author.id != client.user.id){
   let link = message.content.replace('-play', '').replace(' ', '')

   if(message.guild.voiceStates.cache.get(message.author.id) && message.guild.voiceStates.cache.get(message.author.id).channelID){

        if(message.client.voice.connections.get(message.guild.id) && message.client.voice.connections.get(message.guild.id).channel.id == message.guild.voiceStates.cache.get(message.author.id).channelID){
          console.log('we are in the same channel')
          get_link(link, message.guild.id).then(()=>{
             message.channel.send("Track(s) are/is added")
             message.channel.send("[ * INFO * ] This bot is currently in beta build, some bugs may appear! New features were added: multiple server audio playback and new commands -> [-pause, -resume]")
             message.channel.send({files:[servers[message.guild.id].track_image]})
            if(servers[message.guild.id].queue_done){
              console.log("Play")
              play(message.guild.id)         
            }
          })
        }
        else{
         console.log('different channels')
         connect(message.guild.voiceStates.cache.get(message.author.id), message.channel.id).then(()=>{
          get_link(link, message.guild.id).then(()=>{
            message.channel.send("Track(s) are/is added")
            message.channel.send("[ * INFO * ] This bot is currently in beta build, some bugs may appear! New features were added: multiple server audio playback and new commands -> [-pause, -resume]")
            message.channel.send({files:[servers[message.guild.id].track_image]})
            play(message.guild.id)
            console.log(message.guild.voiceStates.cache.get(message.author.id).channelID)
          })
        })
        }

    }
    else{
      message.channel.send('You must connect to the channel first!')
    }
  }

  else if(message.content.startsWith('-next')){
    if(servers[message.guild.id].queue.length > 1){
    message.channel.send(`Skipping to the next track!`)
    message.channel.send(servers[message.guild.id].queue.length - 1 + " tracks left to play")
    servers[message.guild.id].dispatcher.emit('finish')
    }
    else{
      message.channel.send("Nothing to skip! please add tracks to the queue")
    }
  }

  else if(message.content.startsWith('-pause')){
    servers[message.guild.id].dispatcher.pause()
    message.channel.send("Paused...")
  }
 else if(message.content.startsWith('-resume') || message.content.startsWith('-unpause')|| message.content.startsWith('-play')){
     servers[message.guild.id].dispatcher.resume()
     message.channel.send("Resumed...")
  }

  else if(message.content.startsWith('-leave')){
    message.channel.send("Bye bye...")
    disconnect(message.guild.voiceStates.cache.get(client.user.id))
    servers[message.guild.id].queue = []
    servers[message.guild.id].dispatcher.end()
    servers.splice(message.guild.id, 1);
  }

  else if(message.content.startsWith("-debug")){
    console.log("-----------DEBUG--------------")
    console.log(servers)
    console.log("-----------DEBUG--------------")
  }

  else if(message.content.startsWith("-clear")){

    servers[message.guild.id].queue = []
    servers[message.guild.id].dispatcher.end();
  }

  else if(message.content.startsWith('-queue')){
    if(servers[message.guild.id].queue.length > 0){
    message.channel.send("Current track is: (" + servers[message.guild.id].queue[0] + ") " + servers[message.guild.id].queue.length + " more tracks are left to play!")
    }
    else{
      message.channel.send("Queue is empty!")
    }
  }

  else if(message.content.startsWith('-help')){
    message.channel.send(`-play {link} -> to play a video from youtube.\n-next -> to skip current track.\n-leave -> to disconnect from current channel.\n-clear -> to clear the queue`)
  }

})

async function get_track_image(track, serverID){
  console.log("Getting image for: " + track)
  let response = await fetch(track)
  let body = await response.text()
  servers[serverID].track_image = body.match(/https:\/\/i\.ytimg\.com\/vi\/[a-zA-Z0-9-_]*\/hqdefault\.jpg/)[0]
}

async function get_tracks_from_playlist(playlist, serverID){
  console.log("-> "+playlist)
  let list = new Set()
  try{
    let response = await fetch("https://www.youtube.com/playlist?"+playlist.match(/list=[a-zA-Z0-9-_]*/))
    let body = await response.text()
    servers[serverID].track_image = body.match(/https:\/\/i\.ytimg\.com\/vi\/[a-zA-Z0-9-_]*\/hqdefault\.jpg/)[0]
    body.match(/\/watch\?v=[a-zA-Z0-9-_]*/g).forEach(el=>{
    list.add("https://www.youtube.com"+el)
    })
   }catch(e){
     // Possibly not a playlist
    await get_track_image("https://www.youtube.com"+playlist.match(/\/watch\?v=[a-zA-Z0-9-_]*/), serverID)
    return ["https://www.youtube.com"+playlist.match(/\/watch\?v=[a-zA-Z0-9-_]*/)]   
   } 
  return list
}

async function get_link(query, serverID){
  console.log("Get link for :" + serverID)
  return new Promise(async resolve => {
    console.log(query)
    let link = null
    if(/http:\/\/|https:\/\//.test(query)){

     if(/[?&]list=/.test(query)){
       get_tracks_from_playlist(query, serverID).then((tracks)=>{
         tracks.forEach((track)=>{
          servers[serverID].queue.push(track)
         })
         resolve()
       })
     }
     else{
     await get_track_image(query, serverID)
     servers[serverID].queue.push(query)
     resolve()
     }
    }
    else{
    let url = encodeURI("https://www.youtube.com/results?search_query="+query)
    console.log(url)
    let response = await fetch(url)
    let body = await response.text()
    link = ("https://www.youtube.com"+body.match(/\/watch\?v=[a-zA-Z0-9-_]*\\u0026list=[a-zA-Z0-9-_]*|\/watch\?v=[a-zA-Z0-9-_]*/))
    link = link.replace('\\u0026', '&')
    
    if(/[?&]list=/.test(link)){
       get_tracks_from_playlist(link, serverID).then((tracks)=>{
         tracks.forEach((track)=>{
          servers[serverID].queue.push(track)
         })
         resolve()
       })
     }
     else{
       await get_track_image(link, serverID)
       servers[serverID].queue.push(link)
       resolve()
     }

  } 
 }) 
}

async function connect(Channel, messageChannel){
      
        console.log('Connecting...')
        servers[Channel.channel.guild.id] = {
          connectionInstance: null,
          queue: [],
          playing: false,
          dispatcher: null,
          queue_done: false,
          bitrate: bitrate,
          track_image: null,
          timeout: null,
          messageChannel: messageChannel
      try{
        servers[Channel.channel.guild.id].connectionInstance = await Channel.channel.join()  
        console.log("connected to :" + Channel.channel.guild.id)
      }catch(e){
	console.log(e)
	client.channels.cache.get(messageChannel).send(e)   
      }
}

async function disconnect(Channel){
    console.log('Leaving...') 
    await Channel.channel.leave()
    //We need to clear timeout here
}

function play(serverID){
  if(servers[serverID].timeout != null){
    clearTimeout(servers[serverID].timeout)
  }
  servers[serverID].queue_done = false; 
  console.log("[*] Queue: " + servers[serverID].queue)
  console.log("[*] Current track to play: " + servers[serverID].queue[0])

     try{
      servers[serverID].dispatcher = servers[serverID].connectionInstance.play(ytdl(servers[serverID].queue[0], { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1<<25 }), {
          volume:0.65,
          bitrate: bitrate,
          highWaterMark: 1
      }).on('finish', ()=>{
        servers[serverID].queue.shift()
        if ( servers[serverID].queue.length > 0 ) { 
          play(serverID) 
        }
        else { 
          servers[serverID].queue_done = true 
          servers[serverID].timeout = setTimeout(()=>{
            servers[serverID].connectionInstance.channel.leave()
            client.channels.cache.get(servers[serverID].messageChannel).send("Leaving because of inactivity within 5 minutes!")
          }, (5 * 1000 * 60))
        }
      })
    }
    catch(e){
      console.log(e)
    }

  }

client.login(bot_token);
