//author: dandera
//purpose: custom discord bot for Stale Oreos Server. Manage and Archive data from Stale Oreo UHC matches
//created: 2021-03-15
//last edited: 2021-04-04

/*
----------------------FINISHED-----------------------------------------------------------------------
    UHC Player cards [excluding filters] are done
    UHC Game cards are done
    new JSON file structure for member and game data is done
-----------------------------------------------------------------------------------------------------
----------------------TO DO--------------------------------------------------------------------------
    Update history menu selector to be more flexible
    Write mew leaderboard code. Old code is unable to read from the new json file structure
    Write new data entry code. Old code is unable to read or write to new json file structure
    Implement a new way to edit the JSON files without using file exchange on filezilla
        Allow members to edit their own member file through commands in discord
        Allow select members to edit game data through commands in discord
    Create a plan for how to implement future data objects from minecraft plugin
-----------------------------------------------------------------------------------------------------
*/

const Discord = require('discord.js');
const client = new Discord.Client();
const fetch = require('node-fetch');
var fs = require("fs");

client.on('ready', () => {
    console.log('Connected as ' + client.user.tag);
    client.user.setActivity('Arguing with json files');
})

client.on('message', message => {//if event message is triggered
    if(message.content.toString().toLowerCase().split(' ')[0] == 's!t'){//if first element in message content is the call for bot response
        ProcessCommand(message);//forward message to process
    }
})

function ProcessCommand(message){
    //first command to be called when event message finds a message that starts with the bot command key 's!o'
    //ProcessCommand will take the second element of the array from the message content to decide which function to call
    const cmd_arr = message.content.toLowerCase().split(' ');//seperate received string into elements
    if(cmd_arr.length == 1){//if the string contains no commands for te bot
        return;
    }
    const cmd = cmd_arr[1]
    if(cmd == 'uhc'){
        UHC_Stat(message, 'all');
    }else if(cmd == 'team' || cmd == 'teams'){
        UHC_Stat(message, 'team');
    }else if(cmd == 'solo'){
        UHC_Stat(message, 'solo');
    }else if(cmd == 'leaderboard' || cmd == 'leader' || cmd == 'lb'){

    }else if(cmd == 'help'){

    }else if(cmd == 'enter'){
        
    }else if (cmd == 'history'){
        Print_Game_Card(message, cmd_arr[2]);
    }else if(cmd == 'spreadsheet' || cmd == 'sheet' || cmd == 'excel' || cmd == 'google'){
        message.channel.send('https://docs.google.com/spreadsheets/d/1EfzHNmcwAIgFR-lyNLQv_yc6-o2yJ3qfBZ-WtrhtjwA/edit?usp=sharing');
    }
}

function UHC_Stat(message, path){
    //player has requested player stat cards.
    //determine which player(s) stat cards have been requested then fetch required information from game_data json files
    //when all data is collected call message embed and reply with player stat cards
    /*
        ----------------- To Do -----------------
        data filters
        -----------------------------------------
    */
    var temp_Arr = message.content.toLowerCase().split(' ').slice(2);//create an array of the input names. Remove the first 2 elements as they are no longer needed (s!o uhc)
    if(temp_Arr.length == 0){//check to make sure user input names into the command
        message.channel.send('You must include a name in your command. Try `s!o help uhc`');
        return;
    }
    const menu = fs.readFileSync('./menu.txt').toString().split('\n');//read menu.txt from disk. This file has all the recognized inputs for each user
    var loop = 0;
    var inloop = 0;
    let uID_Arr = [];
    let check = false;
    let err_Arr = [];
    var user_in = [];
    var filter = [];
    temp_Arr.forEach(Element => {//seperate filter inputs from user inputs
        if(Element.startsWith('f+') || Element.startsWith('f-')){//if input begins with f+ or f- it is a filter input ---- this implementation may change later
            filter[filter.length] = Element;
        }else{
            user_in[user_in.length] = Element;
        }
    })
    if(user_in.length == 0){//check to make sure there is at least one user input
        message.channel.send('You must include a name in your command. Try `s!o help uhc`');
        return;
    }
    user_in.forEach(Element => {//run through each input name and look for a match in the menu.
        loop = 0;
        check = false;
        while(loop < menu.length){
            inloop = 0;
            while(inloop < menu[loop].split('|')[1].split(',').length){
                if(Element == menu[loop].split('|')[1].split(',')[inloop]){//check to see if the names match
                    if(uID_Arr.includes(menu[loop].split('|')[0]) == false){//check to make sure this user is not already on the output list
                        uID_Arr[uID_Arr.length] = menu[loop].split("|")[0];//add this user ID to the output list
                    }
                    check = true;
                }
                inloop++;
            }
            loop++;
        }
        if(check == false){//if no match for the input name was found. Add the input name to the array of rejected inputs
            err_Arr[err_Arr.length] = Element;
        }
    })
    if(err_Arr.length == 1){//if there was only one rejected input name, return singular error message
        message.channel.send('Unable to determine the user: `' + err_Arr[0] + '`\nTry `s!o help names`');
    }else if(err_Arr.length > 1){//if there were multiple rejected input names, return array error message
        message.channel.send('Umable to determine the users: `' + err_Arr.join(', ') + '`\nTry `s!o help names`');
    }
    if(uID_Arr.length == 0){//if none of the input names found a match, end function
        return;
    }

    //set up filters if any apply
    if(filter.length != 0){

        //this has yet to be done, will have to return to this later
        //plans: include several ways to manipulate data to view stats from different angles
        //example: only include the past 6 months, or past 1 year
        //view stats from a single year
        //NOTE: when this function is implemented there will be a bug where attendance won't be correct
        //To fix this, rework how total_games is calculated in function Print_User_card()
    }
    //uID_Arr has been finalized, continue on to data collection
    const Game_Dat_Main = JSON.parse(fs.readFileSync('./Game_Data_Main.json', 'utf8'));
    let g_Arr = [];
    loop = 0;
    while(loop < uID_Arr.length){//preform this task for each identified user
        g_Arr = [];//clear g_Arr from the previous loop
        Game_Dat_Main.Game_History.forEach(Element => {//for each of the games in the main directory
            if(path == 'all' || path == 'solo' && Element.isSolo == true || path == 'team' && Element.isSolo == false){//check to make sure the path (solo game / team game / combined) matches the request
                if(Element.participants.includes(uID_Arr[loop])){//if the user is in the participants list for this game
                    g_Arr[g_Arr.length] = Element.id;//add this game ID to the array of games for this user
                    //NOTE: This is a dumb implementation but it works so fuck it
                }
            }
        })
        Print_User_Card(message, uID_Arr[loop], g_Arr, path, filter);//pass completed list of relevant games onto function print_user_card
        loop++;
    }
}

function Print_User_Card(message, uID, g_Arr, path, filter){
    //this function was called from function UHC_Stat
    //this function uses input uID (user ID) and g_Arr (array of game IDs) to calculate statics for the identified user
    //the output of this function is a message embed containing all calculated stats to the channel the command originated
    /*
        ----------------- To Do -----------------
        data filter implementation
            - total_games must be updated to take filters into account
        -----------------------------------------
    */
    //declare all variables relevant to output
    console.log(g_Arr)
    var games_won = 0;
    var runner_ups = 0;
    var first_bloods = 0;
    var first_deaths = 0;
    var kdr = null;
    var avg_kills = null;
    var win_rate = null;
    var attendence = null;

    //helping variables to find calculate the above
    var games_played = 0;
    var total_games = 0;
    var kills = 0;
    var deaths = 0;

    //load member data from disc
    const Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    const User_Data = Member_Data.Member_Objects[parseInt(uID.slice(1), 10) - 1];
    const Team_Data = Member_Data.Team_Objects[parseInt(User_Data.team.slice(1), 10) - 1];
    //load game directory from disc
    const Game_Data = JSON.parse(fs.readFileSync('./Game_Data_Main.json', 'utf8'));
    if(path == 'all'){//if the path is all games, call the total games count from the game data json file
        total_games = Game_Data.Total_Games;
    }else{
        Game_Data.Game_History.forEach(Element => {
            if(path == 'team' && Element.isSolo == false || path == 'solo' && Element.isSolo == true){//go through the directory and determine how many games of either team or solo were played
                total_games++;
            }
        })
    }
    games_played = g_Arr.length;
    var game_file = null;
    g_Arr.forEach(Element => {//for each game_ID in the array from g_Arr input
        game_file = [];//clear previous game file from active memory
        game_file = JSON.parse(fs.readFileSync('./Game_Data/' + Element + '.json', 'utf8'));//read the json file for this game from disc
        if(game_file.winner == uID){
            games_won++;
        }
        if(game_file.runner_up == uID){
            runner_ups++;
        }
        if(game_file.first_blood == uID){
            first_bloods++;
        }
        if(game_file.first_death == uID){
            first_deaths++;
        }
        loop = 0
        while(loop < game_file.participants.length){//scan through the participants array for the correct uID
            if(game_file.participants[loop].id == uID){//once the correct uID is found, add in kills & deaths from file
                kills = kills + game_file.participants[loop].kills;
                if(game_file.participants[loop].died == true){
                    deaths++;
                }
                if(game_file.isSolo == false){//if the game was a team game, check to see if the user was on the winning team
                    if(game_file.participants[loop].team == game_file.winner){
                        games_won++
                    }else if(game_file.participants[loop].team == game_file.runner_up){
                        runner_ups++
                    }
                }
                loop = game_file.participants.length;
            }
            
            loop++;
        }
    })
    //data has been compiled from json files
    //calculate the remaining statistics
    kdr = kills / deaths;
    if(kdr.toString().length > 7){//check to see if there is a super long decimal. If there is, limit it to 7 characters
        kdr = kdr.toString();
        kdr = kdr.slice(0, -1 * (kdr.length - 7));
    }
    win_rate = parseInt(((games_won / games_played) * 100), 10).toString() + '%';
    avg_kills = kills / games_played;
    if(avg_kills.toString().length > 7){//check to see if there is a super long decimal. If there is, limit it to 7 characters
        avg_kills = avg_kills.toString();
        avg_kills = avg_kills.slice(0, -1 * (avg_kills.length - 7));
    }
    attendence = parseInt(((games_played / total_games) * 100), 10).toString() + '%';
    
    //build message embed
    var title = null
    if(path == 'all'){//create the title for the card depending on if the path is all/team or solo
        title = User_Data.alias + ' Stat Card';
    }else if(path == 'team'){
        title = User_Data.alias + ' Team Stat Card';
    }else if(path == 'solo'){
        title = User_Data.alias + ' Solo Stat Card';
    }else{
        title = 'Err: path not found';
    }
    //catch bad numbers
    if(games_played == 0){
        kdr = 0;
        avg_kills = 0;
        win_rate = "0%";
        attendence = "0%";
    }
    const Player_Card = new Discord.MessageEmbed()
        .setTitle(title)
        .setThumbnail(User_Data.img)
        .setColor(Team_Data.color)
        .addField('**Games Won**', games_won)
        .addField('**Runner-ups**', runner_ups)
        .addField('**First Bloods**', first_bloods)
        .addField('**First Deaths**', first_deaths)
        .addField('**K/D ratio**', kdr)
        .addField('**Average Kills per Game**', avg_kills)
        .addField('**Win Rate**', win_rate)
        .addField('**Game Attendence**', attendence);
    if(filter != null){
        Player_Card.setFooter(filter);
    }
    console.log(Player_Card);
    message.channel.send(Player_Card);
}

function Print_Game_Card(message, gID){
    //function Print_Game_Card will be called from either function history or history_menu_update
    //inputs are the game ID and message
    //build a game card message embed based off the gID.json file and return it to message.channel

    //read data from disk
    const game_file = JSON.parse(fs.readFileSync('./Game_Data/' + gID + '.json', 'utf8'));
    const Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    console.log(game_file);
    
    //declare variables
    var winner = null;
    var runner_up = null;
    var first_blood = null;
    var first_death = null;
    var color = null;
    var loop = 0;
    var thumb = null;

    if(game_file.isSolo == true){//if the game was a solo game
        winner = Member_Data.Member_Objects[parseInt(game_file.winner.slice(1), 10) - 1].alias;//get the username for the winner
        thumb = Member_Data.Member_Objects[parseInt(game_file.winner.slice(1), 10) - 1].img;//get the thumbnail player skin render address for the winner
        var team = Member_Data.Member_Objects[parseInt(game_file.winner.slice(1), 10) - 1].team;//fetch which faction the winner is a part of
        color = Member_Data.Team_Objects[parseInt(team.slice(1), 10) - 1].color//get the hex color of the faction the winner is in
        runner_up = Member_Data.Member_Objects[parseInt(game_file.runner_up.slice(1), 10) - 1].alias;//get the username for the runner-up0
    }else{
        winner = game_file.winner + ' Team';//set up the team that won
        runner_up = game_file.runner_up + ' Team';//set up the team that came second
        switch(game_file.winner) {//set the color to the color corresponding to the winning team
            case 'Dark Red':
                color = 'AA0000';
                break;
            case 'Red':
                color = 'FF5555';
                break;
            case 'Gold':
                color = 'FFAA00';
                break;
            case 'Yellow':
                color = 'FFFF55';
                break;
            case 'Dark Green':
                color = '00AA00';
                break;
            case 'Green':
                color = '55FF55';
                break;
            case 'Aqua':
                color = '55FFFF';
                break;
            case 'Dark Aqua':
                color = '00AAAA';
                break;
            case 'Dark Blue':
                color = '0000AA'
                break;
            case 'Blue':
                color = '5555FF';
                break;
            case 'Magenta':
                color = 'FF55FF';
                break;
            case 'Dark Purple':
                color = 'AA00AA';
                break;
            case 'White':
                color = 'FFFFFF';
                break;
            case 'Gray':
                color = 'AAAAAA';
                break;
            case 'Dark Gray':
                color = '555555';
                break;
            case 'Black':
                color = '000000';
                break;
        }
        loop = 0;
        while(loop < game_file.participants.length){//scan through participants [search for the first member who was on the winning team & wasn't dead at the end of the match]
            if(game_file.participants[loop].team == game_file.winner && game_file.participants[loop].died == false){
                thumb = Member_Data.Member_Objects[parseInt(game_file.participants[loop].id.slice(1), 10) - 1].img;//set the skin render thumbnail as this user [on the winning team & was never died]
                loop = game_file.participants.length;
            }
            loop++;
        }
    }
    if(game_file.first_blood != null){
        first_blood = Member_Data.Member_Objects[parseInt(game_file.first_blood.slice(1), 10) - 1].alias;//if first_blood is not empty, find username
    }
    if(game_file.first_death != null){
        first_death = Member_Data.Member_Objects[parseInt(game_file.first_death.slice(1), 10) - 1].alias;//if first_death is not empty, find username
    }
    var participants = [];//create the participants array
    if(game_file.isSolo == true){//if this game card is for a solo game do the following:
        game_file.participants.forEach(Element => {//for every participant create a string in the array
            if(Element.died == true){
                participants[participants.length] = '💀 ' + Member_Data.Member_Objects[parseInt(Element.id.slice(1), 10) - 1].alias;//if the user died in the round include a skull emoji and their username
            }else{
                participants[participants.length] = '🏆 ' + Member_Data.Member_Objects[parseInt(Element.id.slice(1), 10) - 1].alias;//if the user did not die in the round include a trophy and their username
            }
            if(Element.kills > 0){
                if(Element.kills == 1){
                    participants[participants.length - 1] = participants[participants.length - 1] + ' - 1 Kill';//if the user had a kill, include ' - 1 Kill' after their name
                }else{
                    participants[participants.length - 1] = participants[participants.length - 1] + ' - ' + Element.kills + ' Kills';//if the user had multiple kills, include ' - # Kills' afteir their name
                }
            }
        })
    }else{
        loop = 0;//if the game card is for a team game. Organize participants so they are grouped by team
        while(loop < game_file.teams.length){//For each team in the game do the following
            participants[participants.length] = '**' + game_file.teams[loop] + ' Team**';//create a header for the team "TeamColor Team". Make it bold so it stands out from the player names
            game_file.participants.forEach(Element => {//go through the participants and get all the members of this team
                if(Element.team == game_file.teams[loop]){
                    if(Element.died == true){
                        participants[participants.length] = '💀 ' + Member_Data.Member_Objects[parseInt(Element.id.slice(1), 10) - 1].alias;//if the user died in the round include a skull emoji followed by their name
                    }else{
                        participants[participants.length] = '🏆 ' + Member_Data.Member_Objects[parseInt(Element.id.slice(1), 10) - 1].alias;//if the user did not die in the round include a trophy emoji followed by their name
                    }
                    if(Element.kills > 0){
                        if(Element.kills == 1){
                            participants[participants.length - 1] = participants[participants.length - 1] + ' - 1 Kill';//if the user made a kill include ' - 1 Kill' after their name
                        }else{
                            participants[participants.length - 1] = participants[participants.length - 1] + ' - ' + Element.kills + ' Kills';// if the user made multiple kills include ' - # Kills' after their name
                        }
                    }
                    //NOTE: This is a pretty ugly code block. Lots of nesting. A cleaner implementation is probably possible
                }
            })
            participants[participants.length] = ' ';//include an empty line between teams so it is easier to read
            loop++;
        }
    }
    //all data us compiled, move on to creating the message embed
    const Game_Card = new Discord.MessageEmbed()
        .setTitle('**' + game_file.title + '**')
        .setDescription(game_file.date)//set the description (appears in small font below the title) as the game date
        .addField('**Winner**', winner)
        .setColor(color)
        .addField('**Runner-up**', runner_up);
    if(first_blood != null){//if first blood is not empty, include it as a field
        Game_Card.addField('**First Blood**', first_blood);
    }
    if(first_death != null){//if first death is not empty, include it as a field
        Game_Card.addField('**First Death**', first_death);
    }
    if(thumb != null){//if there is a thumbnail, include it
        Game_Card.setThumbnail(thumb);
    }
    Game_Card.addField('**Players**', participants.join('\n'));//add the participants array as a field. It's listed here and not above so it will come after winner/runnerup/fblood/fdeath
    if(game_file.videolink != null){//if there is a video of this UHC round, include the video URL and set the video thumbnail as the attached image
        Game_Card.addField('**Watch the Video Here**', game_file.videolink);
        //get thumbnail
        var video_thumb = 'https://img.youtube.com/vi/' + game_file.videolink.split('/')[game_file.videolink.split('/').length - 1] + '/mqdefault.jpg';
        //the thumbnail for the video is stored at https://img.youtube.com/vi/<youtube video id>/mqdefault.jpg
        //take the video ID from the saved video and paste it into this URL to get the video thumbnail to display in the message embed
        Game_Card.setImage(video_thumb);
    }
    console.log(Game_Card);
    message.channel.send(Game_Card);//send the game card to the channel
}


client.login("ODI2NjEyOTc0ODE3OTAyNTky.YGPBUg.d8tLLguuBZ80cHMZJdjvbau1E7Q")
