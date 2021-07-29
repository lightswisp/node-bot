//https://discord.com/oauth2/authorize?client_id=869285057355997214&scope=bot&permissions=8589934591

//431092268120670208

const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const client = new Discord.Client();
const token = 'ODY5Mjg1MDU3MzU1OTk3MjE0.YP7-zA.Nwcgo2o3doXQ6XhT7U_kCYkSYAc'
let user_id = ""
let video_url = "https://www.youtube.com/watch?v=60foJDqztBg"
let channelInstance
let connectionInstance
let connected
let stop = false

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on("voiceStateUpdate", async (oldVoice, newVoice) => {
if(!stop){
    if(newVoice.id == user_id && newVoice.channelID){
        connect(newVoice).then(()=>{
            play()
        })
    }
    else if(newVoice.id == user_id && !(newVoice.channelID) && connected){
        disconnect()
    }
 } 
});

client.on("message", async (message)=>{

 if(message.content.startsWith('/start')){
    stop = false
    message.reply(':sunglasses:')
 }

 else if(message.content.startsWith('/user-id')){
  user_id = message.content.replace('/user-id', "").trim()
  message.reply(user_id + ' is selected now !')
  channelInstance = message.guild.voiceStates.cache.get(user_id)

  if(channelInstance && !stop){
    connect(channelInstance).then(()=>{
        play()
    })
  } 
 }

 else if(message.content.startsWith('/bstop')){
 disconnect()
 stop = true
 message.reply('Stopping... :pensive:')
 }

 else if(message.content.startsWith('/audio')){
  video_url = message.content.replace('/audio', "").trim()
  if(connected){
    play()
  }
 }

 else if(message.content.startsWith('/info')){
    message.reply(`[To stop bot, type: /bstop]. To start again: /start`)
    message.reply(`[To change audio link, type: /audio {url}]`)
    message.reply(`[To get user-ids, type: /get]`)
    message.reply(`[Choose userID]`)
    message.reply(`[Type /user-id {id} after!]`)
 }

 else if(message.content.startsWith('/get')){
    message.guild.members.cache.forEach(member => {
        message.reply(`${member.user.username}: ${member.user.id}`)
     })
 }

})

/* BOT FUNCTIONS */
async function connect(Channel){
        console.log(user_id + ' entered the voice!')
        console.log('Connecting...')
        connectionInstance = await Channel.channel.join()  
        channelInstance = Channel.channel    
        connected = true        
}

async function disconnect(){
    console.log(user_id + ' left the voice!')
    console.log('Leaving...') 
    await channelInstance.leave()  
    connected = false
}

async function play(){
    connectionInstance.play(ytdl(video_url, { filter: 'audioonly' }), {
        volume:0.5,
    });
}
/* BOT FUNCTIONS */


client.login(token);