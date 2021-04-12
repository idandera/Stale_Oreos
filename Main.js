//author: dandera
//purpose: custom discord bot for Stale Oreos Server. Manage and Archive data from Stale Oreo UHC matches
//created: 2021-03-15
//last edited: 2021-04-11

/*
----------------------FINISHED-----------------------------------------------------------------------
    Updated leaderboard code. Added ability to filter by minecraft version
    Updated history menu selector. It can read json and has a lot of filter settings now
    UHC Player cards [excluding filters] are done
    UHC Game cards are done
    new JSON file structure for member and game data is done
    new system for organizing people to join UHC
    new system for entering game data into the archive
    new system for editing profile data for every user
    new system for editing select game data (title and video)
-----------------------------------------------------------------------------------------------------
----------------------TO DO--------------------------------------------------------------------------
    Create a plan for how to implement future data objects from minecraft plugin
-----------------------------------------------------------------------------------------------------
*/

const Discord = require('discord.js');
const client = new Discord.Client();
const fetch = require('node-fetch');
var fs = require("fs");

client.on('ready', () => {
    console.log('Connected as ' + client.user.tag);
    client.user.setActivity('Soft is Better');
})

client.on('message', message => {//if event message is triggered
    if(message.content.toString().toLowerCase().split(' ')[0] == 's!o'){//if first element in message content is the call for bot response
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
        Leaderboard_Det(message)
    }else if(cmd == 'help'){
        Help(message)
    }else if(cmd == 'enter'){
        Enter_game(message);
    }else if(cmd == 'history'){
        History(message);
    }else if(cmd == 'spreadsheet' || cmd == 'sheet' || cmd == 'excel' || cmd == 'google'){
        message.channel.send('https://docs.google.com/spreadsheets/d/1EfzHNmcwAIgFR-lyNLQv_yc6-o2yJ3qfBZ-WtrhtjwA/edit?usp=sharing');
    }else if(cmd == 'notify'){
        Notify_Det(message);
    }else if(cmd == 'reply'){
        Notify_Reply(message);
    }else if(cmd == 'notifs' || cmd == 'notifications'){
        Notifications(message)
    }else if(cmd == 'join'){
        Join(message);
    }else if(cmd == 'profile'){
        Profile(message);
    }else if(cmd == 'edit' && cmd_arr.length > 2){
        if(cmd_arr[2] == 'profile'){
            Edit_profile_data(message);
        }else if(cmd_arr[2] == 'game'){
            Edit_game_data(message);
        }else{
            message.channel.send('Improper input. Try `s!o help edit`');
        }
    }else{
        message.channel.send('I did not understand the command `' + cmd + '`. Try `s!o help`')
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
    if(temp_Arr[0].startsWith('v(')){
        temp_Arr[0] = temp_Arr[0].slice(2, -1);
    }else if(temp_Arr[0].startsWith('version(')){
        temp_Arr[0] = temp_Arr[0].slice(8, -1);
    }
    const mc_versions = fs.readFileSync('./mc_versions.txt').toString().split('\n');
    loop = 0;
    var version = null;
    var low_date = [];
    var high_date = [];
    while(loop < mc_versions.length){
        if(temp_Arr[0] == mc_versions[loop].split('|')[0]){
            version = temp_Arr[0];
            low_date = mc_versions[loop].split('|')[1].split('-');
            if((loop + 1) == mc_versions.length){
                high_date = [10000,12,31];
            }else{
                high_date = mc_versions[loop + 1].split('|')[1].split('-');
            }
            temp_Arr = temp_Arr.slice(1);
            loop = mc_versions.length;
        }
        loop++;
    }
    if(version != null){
        loop = 0;
        while(loop < 3){
            low_date[loop] = parseInt(low_date[loop], 10);
            high_date[loop] = parseInt(high_date[loop], 10);
            loop++;
        }
    }
    temp_Arr.forEach(Element => {//seperate filter inputs from user inputs
        /*
        if(Element.startsWith('f+') || Element.startsWith('f-')){//if input begins with f+ or f- it is a filter input ---- this implementation may change later
            filter[filter.length] = Element;
        }else{
            user_in[user_in.length] = Element;
        }*/
        user_in[user_in.length] = Element;
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
    var g_Date = [];
    loop = 0;
    console.log(uID_Arr, low_date, high_date)
    g_Arr = [];//clear g_Arr from the previous loop
    Game_Dat_Main.Game_History.forEach(Element => {//for each of the games in the main directory
       if(path == 'all' || path == 'solo' && Element.isSolo == true || path == 'team' && Element.isSolo == false){//check to make sure the path (solo game / team game / combined) matches the request
            if(version != null){
                g_Date = Element.date.split(' ')[0].split('-');
                while(loop < 3){
                    g_Date[loop] = parseInt(g_Date[loop], 10);
                    loop++;
                }
                if(g_Date == low_date || g_Date[0] == low_date[0] && g_Date[1] == low_date[1] && g_Date[2] > low_date[2] || g_Date[0] == low_date[0] && g_Date[1] > low_date[1] || g_Date[0] > low_date[0]){
                    //the game date is after or on the start date
                    if(g_Date == high_date || g_Date[0] == high_date[0] && g_Date[1] == high_date[1] && g_Date[2] < high_date[2] || g_Date[0] == high_date[0] && g_Date[1] < high_date[1] || g_Date[0] < high_date[0]){
                        //the game date is before or on the end date
                        g_Arr[g_Arr.length] = Element.id;
                    }
                }
            }else{
                g_Arr[g_Arr.length] = Element.id;//add this game ID to the array of games for this user
                //NOTE: This is a dumb implementation but it works so fuck it
            }
            /*if(Element.participants.includes(uID_Arr[loop])){//if the user is in the participants list for this game
                
            }*/
        }
    })
    uID_Arr.forEach(Element => {//pass completed list of relevant games onto function print_user_card
        Print_User_Card(message, Element, g_Arr, path, version);
    })
}

function Print_User_Card(message, uID, g_Arr, path, filter){
    console.log('print_user_card', uID)
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
    var loop = 0;
    var games_won = 0;
    var runner_ups = 0;
    var first_bloods = 0;
    var first_deaths = 0;
    var kdr = null;
    var avg_kills = null;
    var win_rate = null;
    var attendance = null;

    //helping variables to find calculate the above
    var games_played = 0;
    var total_games = g_Arr.length;
    var kills = 0;
    var deaths = 0;

    //load member data from disc
    const Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    const User_Data = Member_Data.Member_Objects[parseInt(uID.slice(1), 10) - 1];
    const Team_Data = Member_Data.Team_Objects[parseInt(User_Data.team.slice(1), 10) - 1];
    //load game directory from disc
    const Game_Data = JSON.parse(fs.readFileSync('./Game_Data_Main.json', 'utf8'));
    var Filter_Arr = [];
    Game_Data.Game_History.forEach(Element => {
        loop = 0;
        while(loop < g_Arr.length){
            if(Element.id == g_Arr[loop] && Element.participants.includes(uID)){
                Filter_Arr[Filter_Arr.length] = g_Arr[loop];
            }
            loop++;
        }
    })
    g_Arr = [];
    g_Arr = Filter_Arr;
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
    attendance = parseInt(((games_played / total_games) * 100), 10).toString() + '%';
    
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
    if(filter != null){
        title = title + ' (MC Version ' + filter + ')';
    }
    //catch bad numbers
    if(games_played == 0){
        kdr = 0;
        avg_kills = 0;
        win_rate = "0%";
        attendance = "0%";
    }
    const Player_Card = new Discord.MessageEmbed()
        .setTitle(title)
        .setDescription(games_played + ' games played')
        .setThumbnail(User_Data.img)
        .setColor(Team_Data.color)
        .addFields(
            {name: '**Games Won**', value: games_won, inline: true},
            {name: '**Runner-ups**', value: runner_ups, inline: true},
            {name: '\u200B', value: '\u200B'},
            {name: '**First Bloods**', value: first_bloods, inline: true},
            {name: '**First Deaths**', value: first_deaths, inline: true},
            {name: '\u200B', value: '\u200B'},
            {name: '**K/D Ratio**', value: kdr, inline: true},
            {name: '**Average Kills per Game**', value: avg_kills, inline: true},
            {name: '\u200B', value: '\u200B'},
            {name: '**Win Rate**', value: win_rate, inline: true},
            {name: '**Game Attendance**', value: attendance, inline: true}
        )
        .setFooter('Sample Size: ' + total_games, 'https://i.imgur.com/857yijB.png');
    console.log(Player_Card);
    message.channel.send(Player_Card);
}

function Print_Game_Card(message, gID){
    //function Print_Game_Card will be called from either function history or history_menu_update
    //inputs are the game ID and message
    //build a game card message embed based off the gID.json file and return it to message.channel

    /*
    -------------------------------------WISH LIST-------------------------------------------------------------
        In a later version of Discord.js, if they ever add the ability to add videos to message embeds
        replace the current setImage and videolink to a embeded youtube video

        MessageEmbed.video is already there in the JSON so I don't know why you can't already do this, but if
        you try to write to the video property it does nothing. Apparently it's not implemented.

        Keep an eye on new discord.js versions to see if they add this feature at all
    -----------------------------------------------------------------------------------------------------------
    */
    
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
            case 'Orange':
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
            case 'Purple':
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
        .setColor(color)
        .addFields(
            { name: '**Winner**', value: winner, inline: true},
            { name: '**Runner-up**', value: runner_up, inline: true}
        );
    if(first_blood != null && first_death != null){
        Game_Card.addFields(
            { name: '\u200B', value: '\u200B'},
            { name: '**First Blood**', value: first_blood, inline: true},
            { name: '**First Death**', value: first_death, inline: true}
        )
    }else if(first_blood != null){
        Game_Card.addField('**First Blood**', first_blood);
    }else if(first_death != null){
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
    Game_Card.setFooter('internal game ID: ' + gID, 'https://i.imgur.com/857yijB.png')
    console.log(Game_Card);
    message.channel.send(Game_Card);//send the game card to the channel
}

function History(message){
    //function history will be called from ProcessCommand
    //take message input and determine what game search method the user is trying to use
    //output (1): create an array of game IDs that match search criteria and send them to Game_Menu_init
    //output (2): if only one game ID is found in the search, pass to Print_Game_Card and pass on the game ID

    var in_Arr = message.content.toString().toLowerCase().split(' ').slice(2);//create an array of inputs (cut off the s!o history)

    /*search methods
        [none] bring up a menu of all games ever played
        [search-by-year] bring up a menu of all games played in a given year
        [search-by-month] bring up a menu of all games played in a given month
        [search-by-patch] bring up a menu of all games played in a given minecraft patch
        [search-by-ID] bring up a game based on it's ID
        [search-by-participants] bring up a menu of games a given user participated in
        [search-by-type] bring up a menu of solo or team games
        [search-by-date] bring up a menu of games played on a given day
        [search-by-name] bring up a menu of games that match a given name
        
        //some of these methods can be stacked
        //search-by-type can be stacked with all other search methods (except name)
    */

    //load game directory from disk
    const Game_Main = JSON.parse(fs.readFileSync('./Game_Data_Main.json', 'utf8'));
    //load member directory from disk
    const Member_Main = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    //init output game ID array
    var g_Arr = [];
    var err_Arr = [];
    var filters = [];
    var loop = 0;
    var inloop = 0;
    //search method: none
    if(in_Arr.length == 0){//if the user included no arguments, bring up a menu with all games
        Game_Menu_init(message, Game_Main.Game_History, []);
        return;
    }

    //search method: game ID
    if(in_Arr[0].startsWith('g') && isNaN(in_Arr[0].slice(1)) == false){//did the user input a game ID (a game ID is the letter g followed by an integer)
        var game_num = 0;
        var gID = null
        in_Arr.forEach(Element => {//for each of the inputs find the game ID and call print_game_card for that game
            game_num = parseInt(Element.slice(1));
            gID = null;
            if(game_num.toString().length == 1){//gIDs are formatted as g###.json on disk, so make sure the game ID is formatted correctly, ex: g003.json, g010.json
                gID = 'g00' + game_num.toString();
            }else if(game_num.toString().length == 2){
                gID = 'g0' + game_num.toString();
            }else{
                gID = 'g' + game_num.toString();
            }
            if(game_num == 0 || game_num > Game_Main.Game_History.length){//check to make sure this is a valid game ID
                err_Arr[err_Arr.length] = gID
            }else{
                Print_Game_Card(message, gID);
            }
        })
        if(err_Arr.length == 1){//if there were any rejected game ID inputs, reply with an error message.
            message.channel.send('Error: `' + err_Arr[0] + '` is not a valid game ID. Try `s!o help history`');
        }else if(err_Arr.length > 1){
            message.channel.send('Error: `' + err_Arr.join(', ') + '` are not valid game IDs. Try `s!o help history`');
        }
        return;
    }

    //search method: type
    var Filtered_Arr = [];
    var filters = []
    var check = [];
    in_Arr.forEach(Element => {
        check[check.length] = false
    })

    //search method: type
    if(in_Arr[0] == 'solo'){//check to see if the user wants to search only solo or only team games
        filters[filters.length] = 'Type {solo}';
        check[0] = true;
        Game_Main.Game_History.forEach(Element => {
            if(Element.isSolo == true){
                Filtered_Arr[Filtered_Arr.length] = Element;//craete an array of only solo games
            }
        })
    }else if(in_Arr[0] == 'team' || in_Arr[0] == 'teams'){
        filters[filters.length] = 'Type {team}';
        check[0] = true;
        Game_Main.Game_History.forEach(Element => {
            if(Element.isSolo == false){
                Filtered_Arr[Filtered_Arr.length] = Element;//create an array of only team games
            }
        })
    }else{
        Game_Main.Game_History.forEach(Element => {
            Filtered_Arr[Filtered_Arr.length] = Element;//create an array of team & solo games
        })
    }

    //search method: date range
    loop = 0;
    var g_date = [];
    while(loop < in_Arr.length){
        if(in_Arr[loop].startsWith('date(') || in_Arr[loop].startsWith('range(')){
            check[loop] = true;
            check[loop + 1] = true;
            //create array for the low and high bound of the date range
            var start_date = [];
            var end_date = [];
            if(in_Arr[loop].includes('-')){
                start_date = in_Arr[loop].slice(5).split('-');//cut off 'date(' from this string to get only the date
                end_date = in_Arr[loop + 1].slice(0, -1).split('-');//cut off the ) from the endof this string to get the date
            }else if(in_Arr[loop].includes('/')){//using / instead of - in the date is also valid
                start_date = in_Arr[loop].slice(5).split('/');
                end_date = in_Arr[loop + 1].slice(0, -1).split('/');
            }else{
                message.channel.send('Error: invalid format `' + start_date + '`. Try `s!o help history`.');
                return;
            }
            loop = 0;
            while(loop < 3){
                start_date[loop] = parseInt(start_date[loop], 10);
                end_date[loop] = parseInt(end_date[loop], 10);
                loop++;
            }
            //check to make sure the input dates make sense
            if(start_date[0] < 2010 || start_date[1] < 1 || start_date[1] > 12 || start_date[2] < 1 || start_date[2] > 31 || isNaN(start_date[0]) || isNaN(start_date[1]) || isNaN(start_date[2])){
                message.channel.send('Error: Improper format `' + start_date.join('-') + '`. Try `s!o help history`');
                return;
            }
            if(end_date[0] < 2010 || end_date[1] < 1 || end_date[1] > 12 || end_date[2] < 1 || end_date[2] > 31 || isNaN(end_date[0]) || isNaN(end_date[1]) || isNaN(end_date[2])){
                message.channel.send('Error: Improper format `' + end_date.join('-') + '`. Try `s!o help history`');
                return;
            }
            g_Arr = [];
            g_date = [];
            Filtered_Arr.forEach(Element => {
                g_date = [];
                g_date = Element.date.split(' ')[0].split('-');
                loop = 0;
                while(loop < 3){
                    g_date[loop] = parseInt(g_date[loop], 10);
                    loop++;
                }
                //determine if the date is after or on the start date
                if(g_date == start_date || g_date[0] == start_date[0] && g_date[1] == start_date[1] && g_date[2] > start_date[2] || g_date[0] == start_date[0] && g_date[1] > start_date[1] || g_date[0] > start_date[0]){
                    //the game date is after or on the start date
                    if(g_date == end_date || g_date[0] == end_date[0] && g_date[1] == end_date[1] && g_date[2] < end_date[2] || g_date[0] == end_date[0] && g_date[1] < end_date[1] || g_date[0] < end_date[0]){
                        //the game date is before or on the end date
                        g_Arr[g_Arr.length] = Element;
                    }
                }
            })
            Filtered_Arr = [];
            Filtered_Arr = g_Arr;
            g_Arr = [];
            filters[filters.length] = 'Date Range {' + start_date.join('/') + ' - ' + end_date.join('/') + '}'
            loop = in_Arr.length;
        }
        loop++;
    }
    
    //search method: name
    loop = 0;
    while(loop < in_Arr.length){
        if(in_Arr[loop].startsWith('name(') && check[loop] == false || in_Arr[loop].startsWith('title') && check[loop] == false){//check to see if any of the elements is looking for a game title
            //user is attempting to search by name
            var name_search = null;
            check[loop] = true;
            name_search = in_Arr[loop].split('(')[1];
            if(name_search.includes(')')){
                name_search = name_search.split(')')[0];
            }else{
                loop++;
                while(loop < in_Arr.length){//add all the words within the parenthesis after name or title prompts
                    if(in_Arr[loop].includes(')')){
                        name_search = name_search + ' ' + in_Arr[loop].split(')')[0];
                        check[loop] = true;
                        loop = in_Arr.length;
                    }else{
                        name_search = name_search + ' ' + in_Arr[loop];
                        check[loop] = true;
                    }
                    loop++;
                }
            }
            filters[filters.length] = 'Title {' + name_search + '}';
            //after the search term has been compiled into a string
            g_Arr = [];
            Filtered_Arr.forEach(Element => {//scan through all the games for titles that match the search term
                if(Element.title.toLowerCase().includes(name_search)){
                    g_Arr[g_Arr.length] = Element
                }
            })
            Filtered_Arr = [];
            Filtered_Arr = g_Arr;
            g_Arr = [];
        }
        loop++
    }

    //search method: year
    loop = 0;
    while(loop < in_Arr.length){
        if(isNaN(in_Arr[loop]) == false && parseInt(in_Arr[loop], 10) > 2010 && check[loop] == false){//check to see if this any of the inputs are a year. (an integer and greater than 2010)
            //input was a valid year
            g_Arr = [];
            check[loop] = true;
            filters[filters.length] = 'Year {' + in_Arr[loop] + '}'
            Filtered_Arr.forEach(Element => {//scan through the array of games to find all games from the year the user entered
                if(Element.date.split('-')[0] == in_Arr[loop]){
                    g_Arr[g_Arr.length] = Element;
                }
            })
            //games have not in the correct year have been removed from the filtered array
            Filtered_Arr = [];
            Filtered_Arr = g_Arr;
            g_Arr = [];
        }
        loop++;
    }

    //search method: month
    loop = 0;
    while(loop < in_Arr.length){
        if(in_Arr[loop].split('-').length == 2 && check[loop] == false && isNaN(in_Arr[loop].split('-')[0]) == false && isNaN(in_Arr[loop].split('-')[1]) == false || in_Arr[loop].split('/').length == 2 && check[loop] == false && isNaN(in_Arr[loop].split('/')[0]) == false && isNaN(in_Arr[loop].split('/')[1]) == false){//check to see if the input is a year-month input or year/month input
            //determine the year and month the user input
            g_Arr = [];
            check[loop] = true;
            var y_m = [];
            if(in_Arr[loop].includes('-')){
                y_m[0] = parseInt(in_Arr[loop].split('-')[0], 10);
                y_m[1] = parseInt(in_Arr[loop].split('-')[1], 10);
            }else{
                y_m[0] = parseInt(in_Arr[loop].split('/')[0], 10);
                y_m[1] = parseInt(in_Arr[loop].split('/')[1], 10);
            }
            filters[filters.length] = 'Month {' + y_m.join('/') + '}';
            //we now have year and month as integers in an array
            if(y_m[0] < 2010 || y_m[1] < 1 || y_m[1] > 12){//check to make sure the year/month combo is valid
                message.channel.send('Error. Invalid input `' + y_m.join('-') + '`. Try `s!o help history`');
                return;
            }
            //format the year-month into a string so it matches the format in the game directory
            var date_str = y_m[0].toString() + '-';
            if(y_m[1] < 10){
                date_str = date_str + '0' + y_m[1].toString();
            }else{
                date_str = date_str + y_m[1].toString();
            }
            Filtered_Arr.forEach(Element => {//sort through the array for games matching the specified year-month
                if(Element.date.startsWith(date_str)){
                    g_Arr[g_Arr.length] = Element;
                }
            })
            //the array has been filtered to only have games from the input month
            Filtered_Arr = [];
            Filtered_Arr = g_Arr;
            g_Arr = [];
        }
        loop++
    }
    
    //search method: day
    loop = 0;
    while(loop < in_Arr.length){
        if(in_Arr[loop].split('-').length == 3 && check[loop] == false || in_Arr[loop].split('/').length == 3 && check[loop] == false){
            g_date = [];
            //determine what the input date was in the input array
            if(in_Arr[loop].includes('-')){
                g_date = in_Arr[loop].split('-');
            }else if(in_Arr[loop].includes('/')){
                g_date = in_Arr[loop].split('/');
            }
            inloop = 0
            while(inloop < 3){
                g_date[inloop] = parseInt(g_date[inloop], 10);
                inloop++
            }
            filters[filters.length] = 'Date {' + g_date.join('/') + '}';
            if(g_date[0] < 2010 || g_date[1] < 1 || g_date[1] > 12 || g_date[2] < 1 || g_date[2] > 31){//check to see if the input date makes sense
                message.channel.send('Error. Improper format `' + g_date.join('-') + '`. Try `s!o help history`');
                return;
            }
            var search_date = null//create a string of the date so it's the same format as the directory dates
            search_date = g_date[0] + '-'
            if(g_date[1] < 10){
                search_date = search_date + '0' + g_date[1].toString() + '-';
            }else{
                search_date = search_date + g_date[1].toString() + '-';
            }
            if(g_date[2] < 10){
                search_date = search_date + '0' + g_date[2].toString();
            }else{
                search_date = search_date + g_date[2].toString();
            }
            g_Arr = [];
            Filtered_Arr.forEach(Element => {//scan throuhg the game array to find games with the same date as the search date
                if(Element.date.startsWith(search_date)){
                    g_Arr[g_Arr.length] = Element;
                }
            })
            Filtered_Arr = [];
            Filtered_Arr = g_Arr;
            g_Arr = [];
        }
        loop++
    }

    //search method: user
    loop = 0;
    var users_Arr = [];//create an array to store user IDs if any are found
    const user_menu = fs.readFileSync('./menu.txt').toString().split('\n');
    while(loop < in_Arr.length){
        if(in_Arr[loop].startsWith('u') && isNaN(in_Arr[loop].slice(1)) == false && check[loop] == false){//check to see if a user ID was directly entered
            //check to make sure it is a valid user ID
            if(parseInt(in_Arr[loop].slice(1), 10) > Member_Main.Member_Objects.length){
                message.channel.send('Error: User ID `' + in_Arr[loop] + '` is not found in the directory. Try `s!o help names`');
                return;
            }
            if(parseInt(in_Arr[loop].slice(1), 10) < 10){//format the user ID correctly so it can be searched for in the member directory
                users_Arr[users_Arr.length] = 'u00' + parseInt(in_Arr[loop].slice(1), 10);
            }else if(parseInt(in_Arr[loop].slice(1), 10) < 100){
                users_Arr[users_Arr.length] = 'u0' + parseInt(in_Arr[loop].slice(1), 10);
            }else{
                users_Arr[users_Arr.length] = 'u' + parseInt(in_Arr[loop].slice(1), 10);
            }
            check[loop] = true;
        }else if(check[loop] == false){//check to see if the input matches any of the names in menu.txt
            user_menu.forEach(Element => {
                inloop = 0;
                while(inloop < Element.split('|')[1].split(',').length){
                    if(in_Arr[loop] == Element.split('|')[1].split(',')[inloop]){//if a match is found in menu.txt store it in the users array
                        check[loop] = true;
                        users_Arr[users_Arr.length] = Element.split('|')[0];
                    }
                    inloop++;
                }
            })
        }
        loop++;
    }
    //after this while loop, if there were any valid name inputs they have now had their corresponding user IDs put in the user array
    loop = 0;
    while(loop < users_Arr.length){//if no users were found, users.length will be 0 and this loop will be skipped
        filters[filters.length] = 'User {' + users_Arr[loop] + ': ' + Member_Main.Member_Objects[parseInt(users_Arr[loop].slice(1), 10) - 1].alias + '}';
        g_Arr = [];
        Filtered_Arr.forEach(Element => {//scan through the game array and remove games that do not have this user in them
            if(Element.participants.includes(users_Arr[loop])){//is this user ID held in the participants array for this game?
                g_Arr[g_Arr.length] = Element;
            }
        })
        Filtered_Arr = [];
        Filtered_Arr = g_Arr;
        g_Arr = [];
        loop++;
    }

    //search by game version
    loop = 0;
    const mc_versions = fs.readFileSync('./mc_versions.txt').toString().split('\n');
    var version_in = null;
    var version_date = [];
    var version_next_date = [];
    while(loop < in_Arr.length){
        if(in_Arr[loop].startsWith('version(') && check[loop] == false || in_Arr[loop].startsWith('v(') && check[loop] == false){//did the user indicate they are entering a minecraft version
            console.log('MINECRAFT VERSION: ' + Filtered_Arr)            
            check[loop] = true;
            version_in = in_Arr[loop].split('(')[1].slice(0,-1);//get the input the user gave
            inloop = 0;
            while(inloop < mc_versions.length){
                if(mc_versions[inloop].split('|')[0] == version_in){//find the version in mc_version.txt and get it's start date
                    version_date = mc_versions[inloop].split('|')[1].split('-');
                    if(mc_versions.length == inloop + 1){
                        version_next_date = [10000,12,31];
                    }else{
                        version_next_date = mc_versions[inloop + 1].split('|')[1].split('-');
                    }
                }
                inloop++
            }
            if(version_date.length == 0){//make sure a match was found
                message.channel.send('Error: Unable to determine `MC - ' + in_Arr[loop].split('(')[1].slice(0,-1) + '`');
                return;
            }
            inloop = 0;
            while(inloop < 3){
                version_date[inloop] = parseInt(version_date[inloop], 10);
                version_next_date[inloop] = parseInt(version_next_date[inloop], 10);
                inloop++;
            }
            filters[filters.length] = 'MC Version {' + version_in + '}';
            g_Arr = [];
            Filtered_Arr.forEach(Element => {//scan through match history and sort out games that are in this minecraft version
                g_date = [];
                g_date = Element.date.split(' ')[0].split('-');
                inloop = 0;
                while(inloop < 3){
                    g_date[inloop] = parseInt(g_date[inloop], 10);
                    inloop++;
                }
                //determine if the date is after or on the start date
                if(g_date == version_date || g_date[0] == version_date[0] && g_date[1] == version_date[1] && g_date[2] > version_date[2] || g_date[0] == version_date[0] && g_date[1] > version_date[1] || g_date[0] > version_date[0]){
                    //the game date is after or on the start date
                    if(g_date == version_next_date || g_date[0] == version_next_date[0] && g_date[1] == version_next_date[1] && g_date[2] < version_next_date[2] || g_date[0] == version_next_date[0] && g_date[1] < version_next_date[1] || g_date[0] < version_next_date[0]){
                        //the game date is before or on the end date
                        g_Arr[g_Arr.length] = Element;
                    }
                }
            })
            Filtered_Arr = [];
            Filtered_Arr = g_Arr;
            g_Arr = [];
        }
        loop++;
    }

    //after all filters are run, continue on to print game card if there was only one match or call game_menu_init if there is more than one
    if(Filtered_Arr.length == 0){
        const no_results = new Discord.MessageEmbed()
            .setDescription('No results found from search terms:')
            .setFooter(filters.join('\n'));
        message.channel.send(no_results);
    }else if(Filtered_Arr.length == 1){
        Print_Game_Card(message, Filtered_Arr[0].id);
    }else{
        Game_Menu_init(message, Filtered_Arr, filters);
    }
}

function Leaderboard_Det(message){
    //leaderboard function will receive a message and create a embed of the current uhc rankings
    //leaderboard will have some data maniluplation. Filtering for team/solo games and filtering for minecraft versions
    //only filtering the game array will be done in this function
    //building the leaderboard embed will be done in the next function: Print_Leaderboard

    //the command array
    const cmd_Arr = message.content.toString().toLowerCase().split(' ').slice(2);
    //load data from disk
    const Game_Main = JSON.parse(fs.readFileSync('./Game_Data_Main.json', 'utf8'));
    const Member_Main = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));

    if(cmd_Arr.length == 0){//user entered no additional filters
        Print_Leaderboard(message, Game_Main.Game_History, 'UHC Leaderboard');
        return;
    }
    if(cmd_Arr.length > 2){
        message.channel.send('Invalid format: Try `s!o help leaderboard`');
        return;
    }
    var Filtered_Arr = [];
    var g_Arr = [];
    var loop = [];
    var version = null;
    var low_date = [];
    var high_date = [];
    var g_date = [];
    const mc_versions = fs.readFileSync('./mc_versions.txt').toString().split('\n')
    //the command has additional arguments in it
    if(cmd_Arr[0] == 'solo'){//is the user asking for a solo games only leaderboard
        Game_Main.Game_History.forEach(Element => {//scan for games that were only solo
            if(Element.isSolo == true){
                Filtered_Arr[Filtered_Arr.length] = Element;
            }
        })
        if(cmd_Arr.length == 2){
            mc_versions.forEach(Element => {
                if(Element.split('|')[0] == cmd_Arr[1]){
                    version = Element.split('|')[0];
                    low_date = Element.split('|')[1].split('-');
                    
                }
            })
            loop = 0;
            while(loop < mc_versions.length){
                if(mc_versions[loop].split('|')[0] == cmd_Arr[1]){
                    version = mc_versions[loop].split('|')[0];
                    low_date = mc_versions[loop].split('|')[1].split('-');
                    if(loop + 1 == mc_versions.length){
                        high_date = [10000,12,31];
                    }else{
                        high_date = mc_versions[loop+1].split('|')[1].split('-');
                    }
                    loop = mc_versions.length;
                }
                loop++;
            }
            if(version == null){
                message.channel.send('Unable to determine `MC - ' + cmd_Arr[1] + '`. Try `s!o help leaderboard`');
                return;
            }
            loop = 0;
            while(loop < 3){
                low_date[loop] = parseInt(low_date[loop], 10);
                high_date[loop] = parseInt(high_date[loop], 10);
                loop++;
            }
            g_Arr = [];
            Filtered_Arr.forEach(Element => {
                g_date = [];
                g_date = Element.date.split(' ')[0].split('-');
                loop = 0;
                while(loop < 3){
                    g_date[loop] = parseInt(g_date[loop], 10);
                    loop++;
                }
                //determine if the date is after or on the start date
                if(g_date == low_date || g_date[0] == low_date[0] && g_date[1] == low_date[1] && g_date[2] > low_date[2] || g_date[0] == low_date[0] && g_date[1] > low_date[1] || g_date[0] > low_date[0]){
                    //the game date is after or on the start date
                    if(g_date == high_date || g_date[0] == high_date[0] && g_date[1] == high_date[1] && g_date[2] < high_date[2] || g_date[0] == high_date[0] && g_date[1] < high_date[1] || g_date[0] < high_date[0]){
                        //the game date is before or on the end date
                        g_Arr[g_Arr.length] = Element;
                    }
                }
                
            })
            Print_Leaderboard(message, g_Arr, 'UHC Solo Leaderboard (MC Version ' + version + ')')
        }else{ 
            Print_Leaderboard(message, Filtered_Arr, 'UHC Solo Leaderboard')
        }
    }else if(cmd_Arr[0] == 'team' || cmd_Arr[0] == 'teams'){//is the user asking for teams only leaderboard
        Game_Main.Game_History.forEach(Element => {//scan for games that were only solo
            if(Element.isSolo == false){
                Filtered_Arr[Filtered_Arr.length] = Element;
            }
        })
        if(cmd_Arr.length == 2){
            mc_versions.forEach(Element => {
                if(Element.split('|')[0] == cmd_Arr[1]){
                    version = Element.split('|')[0];
                    low_date = Element.split('|')[1].split('-');
                    
                }
            })
            loop = 0;
            while(loop < mc_versions.length){
                if(mc_versions[loop].split('|')[0] == cmd_Arr[1]){
                    version = mc_versions[loop].split('|')[0];
                    low_date = mc_versions[loop].split('|')[1].split('-');
                    if(loop + 1 == mc_versions.length){
                        high_date = [10000,12,31];
                    }else{
                        high_date = mc_versions[loop+1].split('|')[1].split('-');
                    }
                    loop = mc_versions.length;
                }
                loop++;
            }
            if(version == null){
                message.channel.send('Unable to determine `MC - ' + cmd_Arr[1] + '`. Try `s!o help leaderboard`');
                return;
            }
            loop = 0;
            while(loop < 3){
                low_date[loop] = parseInt(low_date[loop], 10);
                high_date[loop] = parseInt(high_date[loop], 10);
                loop++;
            }
            g_Arr = [];
            Filtered_Arr.forEach(Element => {
                g_date = [];
                g_date = Element.date.split(' ')[0].split('-');
                loop = 0;
                while(loop < 3){
                    g_date[loop] = parseInt(g_date[loop], 10);
                    loop++;
                }
                //determine if the date is after or on the start date
                if(g_date == low_date || g_date[0] == low_date[0] && g_date[1] == low_date[1] && g_date[2] > low_date[2] || g_date[0] == low_date[0] && g_date[1] > low_date[1] || g_date[0] > low_date[0]){
                    //the game date is after or on the start date
                    if(g_date == high_date || g_date[0] == high_date[0] && g_date[1] == high_date[1] && g_date[2] < high_date[2] || g_date[0] == high_date[0] && g_date[1] < high_date[1] || g_date[0] < high_date[0]){
                        //the game date is before or on the end date
                        g_Arr[g_Arr.length] = Element;
                    }
                }
                
            })
            Print_Leaderboard(message, g_Arr, 'UHC Team Leaderboard (MC Version ' + version + ')')
        }else{
            Print_Leaderboard(message, Filtered_Arr, 'UHC Team Leaderboard')
        }
    }else if(isNaN(cmd_Arr[0]) == false){
        mc_versions.forEach(Element => {
            if(Element.split('|')[0] == cmd_Arr[0]){
                version = Element.split('|')[0];
                low_date = Element.split('|')[1].split('-');
            }
        })
        loop = 0;
        while(loop < mc_versions.length){
            if(mc_versions[loop].split('|')[0] == cmd_Arr[0]){
                version = mc_versions[loop].split('|')[0];
                low_date = mc_versions[loop].split('|')[1].split('-');
                if(loop + 1 == mc_versions.length){
                    high_date = [10000,12,31];
                }else{
                    high_date = mc_versions[loop+1].split('|')[1].split('-');
                }
                loop = mc_versions.length;
            }
            loop++;
        }
        if(version == null){
            message.channel.send('Unable to determine `MC - ' + cmd_Arr[0] + '`. Try `s!o help leaderboard`');
            return;
        }
        loop = 0;
        while(loop < 3){
            low_date[loop] = parseInt(low_date[loop], 10);
            high_date[loop] = parseInt(high_date[loop], 10);
            loop++;
        }
        g_Arr = [];
        Game_Main.Game_History.forEach(Element => {
            g_date = [];
            g_date = Element.date.split(' ')[0].split('-');
            loop = 0;
            while(loop < 3){
                g_date[loop] = parseInt(g_date[loop], 10);
                loop++;
            }
            //determine if the date is after or on the start date
            if(g_date == low_date || g_date[0] == low_date[0] && g_date[1] == low_date[1] && g_date[2] > low_date[2] || g_date[0] == low_date[0] && g_date[1] > low_date[1] || g_date[0] > low_date[0]){
                //the game date is after or on the start date
                if(g_date == high_date || g_date[0] == high_date[0] && g_date[1] == high_date[1] && g_date[2] < high_date[2] || g_date[0] == high_date[0] && g_date[1] < high_date[1] || g_date[0] < high_date[0]){
                    //the game date is before or on the end date
                    g_Arr[g_Arr.length] = Element;
                }
            }
        })
        Print_Leaderboard(message, g_Arr, 'UHC Leaderboard (MC Version ' + version + ')')
    }
}

function Print_Leaderboard(message, g_Arr, title){
    //received filtered game array from Leaderboard_Det
    //using that filtered game array, build the leaderboard message embed

    if(g_Arr.length == 0){//check to see if the number of games in the array is greater than 0
        const Err_lb = new Discord.MessageEmbed()
            .setTitle(title)
            .setDescription('No data found.');
        message.channel.send(Err_lb);
        return;
    }

    //declare variables
    const Member_Main = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    var member_arr = [];
    var loop = 0;

    Member_Main.Member_Objects.forEach(Element => {//set up the variables for this ranking
        member_arr[member_arr.length] = Element;
        member_arr[member_arr.length - 1].wins = 0;
        member_arr[member_arr.length - 1].runner_ups = 0;
        member_arr[member_arr.length - 1].first_bloods = 0;
        member_arr[member_arr.length - 1].first_deaths = 0;
        member_arr[member_arr.length - 1].kills = 0;
        member_arr[member_arr.length - 1].deaths = 0;
        member_arr[member_arr.length - 1].attendance = 0;
    })
    var game_file = [];
    g_Arr.forEach(Element => {//for each of the games in the filtered array do the following
        game_file = [];
        game_file = JSON.parse(fs.readFileSync('./Game_Data/' + Element.id + '.json', 'utf8'));
        if(game_file.isSolo == true){
            //add a point to wins for the winner
            member_arr[parseInt(game_file.winner.slice(1), 10) - 1].wins++
            //add a point to runner up for the runner up
            member_arr[parseInt(game_file.runner_up.slice(1), 10) - 1].runner_ups++
        }else{
            //add a point to all members of a winning team and a point to all members of the runner up team
            loop = 0;
            while(loop < game_file.participants.length){
                if(game_file.participants[loop].team == game_file.winner){
                    member_arr[parseInt(game_file.participants[loop].id.slice(1), 10) - 1].wins++;
                }
                if(game_file.participants[loop].team == game_file.runner_up){
                    member_arr[parseInt(game_file.participants[loop].id.slice(1), 10) - 1].runner_ups++;
                }
                loop++;
            }
        }
        if(game_file.first_blood != null){//add a point to the first blood
            member_arr[parseInt(game_file.first_blood.slice(1), 10) - 1].first_bloods++;
        }
        if(game_file.first_death != null){//add a point to the first death
            member_arr[parseInt(game_file.first_death.slice(1), 10) - 1].first_deaths++;
        }
        loop = 0;
        while(loop < game_file.participants.length){
            member_arr[parseInt(game_file.participants[loop].id.slice(1), 10) - 1].kills = member_arr[parseInt(game_file.participants[loop].id.slice(1), 10) - 1].kills + game_file.participants[loop].kills;
            if(game_file.participants[loop].died == true){
                member_arr[parseInt(game_file.participants[loop].id.slice(1), 10) - 1].deaths++;
            }
            member_arr[parseInt(game_file.participants[loop].id.slice(1), 10) - 1].attendance++;
            loop++;
        }
    })
    //game data is compiled
    var inloop = 0;
    var swap = null;
    loop = 0;
    while(loop < member_arr.length){
        inloop = 0;
        while(inloop < member_arr.length - 1){
            if(member_arr[inloop].attendance < member_arr[inloop + 1].attendance){
                swap = null;
                swap = member_arr[inloop];
                member_arr[inloop] = member_arr[inloop + 1];
                member_arr[inloop + 1] = swap;
            }
            inloop++;
        }
        loop++;
    }
    //member_arr cut off all the players who didn't play in any of these games
    while(member_arr[member_arr.length - 1].attendance == 0){
        swap = [];
        swap = member_arr.slice(0, -1);
        member_arr = [];
        member_arr = swap;
    }
    if(member_arr.length == 0){//check to make sure that there are still members in this array
        const Err_lb = new Discord.MessageEmbed()
            .setTitle(title)
            .setDescription('No data found.');
        message.channel.send(Err_lb);
        return;
    }
    
    //create attendance top 5
    let attendance_board = [];
    loop = 1;
    attendance_board[0] = '1. ' + member_arr[0].alias
    while(loop < 5 && loop < member_arr.length && member_arr[loop].attendance > 0){
        if(member_arr[loop].attendance == member_arr[loop - 1].attendance){
            attendance_board[attendance_board.length] = attendance_board[attendance_board.length - 1].split(' ')[0] + ' ' + member_arr[loop].alias;
        }else{
            attendance_board[attendance_board.length] = (attendance_board.length + 1) + '. ' + member_arr[loop].alias;
        }
        loop++;
    }
    
    //create a winner top 5
    let win_board = [];
    loop = 0;
    while(loop < member_arr.length){
        inloop = 0;
        while(inloop < member_arr.length - 1){
            if(member_arr[inloop].wins < member_arr[inloop + 1].wins){
                swap = null;
                swap = member_arr[inloop];
                member_arr[inloop] = member_arr[inloop + 1];
                member_arr[inloop + 1] = swap;
            }
            inloop++;
        }
        loop++;
    }
    win_board[0] = '1. ' + member_arr[0].alias
    var thumbnail = member_arr[0].img
    var color = Member_Main.Team_Objects[parseInt(member_arr[0].team.slice(1), 10) - 1].color
    loop = 1;
    while(loop < 5 && loop < member_arr.length && member_arr[loop].wins > 0){
        if(member_arr[loop].wins == member_arr[loop - 1].wins){
            win_board[win_board.length] = win_board[win_board.length - 1].split(' ')[0] + ' ' + member_arr[loop].alias;
        }else{
            win_board[win_board.length] = (win_board.length + 1) + '. ' + member_arr[loop].alias;
        }
        loop++;
    }

    //create runner up top 5
    let runnerup_board = [];
    loop = 0;
    while(loop < member_arr.length){
        inloop = 0;
        while(inloop < member_arr.length - 1){
            if(member_arr[inloop].runner_ups < member_arr[inloop + 1].runner_ups){
                swap = null;
                swap = member_arr[inloop];
                member_arr[inloop] = member_arr[inloop + 1];
                member_arr[inloop + 1] = swap;
            }
            inloop++;
        }
        loop++;
    }
    runnerup_board[0] = '1. ' + member_arr[0].alias
    loop = 1;
    while(loop < 5 && loop < member_arr.length && member_arr[loop].runner_ups > 0){
        if(member_arr[loop].wins == member_arr[loop - 1].wins){
            runnerup_board[runnerup_board.length] = runnerup_board[runnerup_board.length - 1].split(' ')[0] + ' ' + member_arr[loop].alias;
        }else{
            runnerup_board[runnerup_board.length] = (runnerup_board.length + 1) + '. ' + member_arr[loop].alias;
        }
        loop++;
    }

    //create first_kill top 5
    let firstblood_board = [];
    loop = 0;
    while(loop < member_arr.length){
        inloop = 0;
        while(inloop < member_arr.length - 1){
            if(member_arr[inloop].first_bloods < member_arr[inloop + 1].first_bloods){
                swap = null;
                swap = member_arr[inloop];
                member_arr[inloop] = member_arr[inloop + 1];
                member_arr[inloop + 1] = swap;
            }
            inloop++;
        }
        loop++;
    }
    firstblood_board[0] = '1. ' + member_arr[0].alias
    loop = 1;
    while(loop < 5 && loop < member_arr.length && member_arr[loop].first_bloods > 0){
        if(member_arr[loop].wins == member_arr[loop - 1].wins){
            firstblood_board[firstblood_board.length] = firstblood_board[firstblood_board.length - 1].split(' ')[0] + ' ' + member_arr[loop].alias;
        }else{
            firstblood_board[firstblood_board.length] = (firstblood_board.length + 1) + '. ' + member_arr[loop].alias;
        }
        loop++;
    }

    //create first_death top 5
    let firstdeath_board = [];
    loop = 0;
    while(loop < member_arr.length){
        inloop = 0;
        while(inloop < member_arr.length - 1){
            if(member_arr[inloop].first_deaths < member_arr[inloop + 1].first_deaths){
                swap = null;
                swap = member_arr[inloop];
                member_arr[inloop] = member_arr[inloop + 1];
                member_arr[inloop + 1] = swap;
            }
            inloop++;
        }
        loop++;
    }
    firstdeath_board[0] = '1. ' + member_arr[0].alias
    loop = 1;
    while(loop < 5 && loop < member_arr.length && member_arr[loop].first_deaths > 0){
        if(member_arr[loop].wins == member_arr[loop - 1].wins){
            firstdeath_board[firstdeath_board.length] = firstdeath_board[firstdeath_board.length - 1].split(' ')[0] + ' ' + member_arr[loop].alias;
        }else{
            firstdeath_board[firstdeath_board.length] = (firstdeath_board.length + 1) + '. ' + member_arr[loop].alias;
        }
        loop++;
    }

    //create the values for win_rate, avg kills per game, k/d ratio
    member_arr.forEach(Element => {
        if(Element.deaths == 0 && Element.kills == 0){
            Element.kdr = 0;
        }else if(Element.deaths == 0){
            Element.kdr = 5000;//to avoid a NaN value, set the kdr as an integer that is way higher than any possible kdr so they will be #1 with their perfect kdr
        }else{
            Element.kdr = (Element.kills / Element.deaths);
        }
        Element.avg_kills = (Element.kills / Element.attendance);
        Element.win_rate = (Element.wins / Element.attendance);
    })
    
    //create top 5 for kill/death ratio
    let kdr_board = [];
    loop = 0;
    while(loop < member_arr.length){
        inloop = 0;
        while(inloop < member_arr.length - 1){
            if(member_arr[inloop].kdr < member_arr[inloop + 1].kdr){
                swap = null;
                swap = member_arr[inloop];
                member_arr[inloop] = member_arr[inloop + 1];
                member_arr[inloop + 1] = swap;
            }
            inloop++;
        }
        loop++;
    }
    kdr_board[0] = '1. ' + member_arr[0].alias
    loop = 1;
    while(loop < 5 && loop < member_arr.length && member_arr[loop].kdr > 0){
        if(member_arr[loop].wins == member_arr[loop - 1].wins){
            kdr_board[kdr_board.length] = kdr_board[kdr_board.length - 1].split(' ')[0] + ' ' + member_arr[loop].alias;
        }else{
            kdr_board[kdr_board.length] = (kdr_board.length + 1) + '. ' + member_arr[loop].alias;
        }
        loop++;
    }

    //create top 5 average kills
    let avg_kills_board = [];
    loop = 0;
    while(loop < member_arr.length){
        inloop = 0;
        while(inloop < member_arr.length - 1){
            if(member_arr[inloop].avg_kills < member_arr[inloop + 1].avg_kills){
                swap = null;
                swap = member_arr[inloop];
                member_arr[inloop] = member_arr[inloop + 1];
                member_arr[inloop + 1] = swap;
            }
            inloop++;
        }
        loop++;
    }
    avg_kills_board[0] = '1. ' + member_arr[0].alias
    loop = 1;
    while(loop < 5 && loop < member_arr.length && member_arr[loop].avg_kills > 0){
        if(member_arr[loop].wins == member_arr[loop - 1].wins){
            avg_kills_board[avg_kills_board.length] = avg_kills_board[avg_kills_board.length - 1].split(' ')[0] + ' ' + member_arr[loop].alias;
        }else{
            avg_kills_board[avg_kills_board.length] = (avg_kills_board.length + 1) + '. ' + member_arr[loop].alias;
        }
        loop++;
    }

    //create top 5 win rate
    let win_rate_board = [];
    loop = 0;
    while(loop < member_arr.length){
        inloop = 0;
        while(inloop < member_arr.length - 1){
            if(member_arr[inloop].win_rate < member_arr[inloop + 1].win_rate){
                swap = null;
                swap = member_arr[inloop];
                member_arr[inloop] = member_arr[inloop + 1];
                member_arr[inloop + 1] = swap;
            }
            inloop++;
        }
        loop++;
    }
    win_rate_board[0] = '1. ' + member_arr[0].alias
    loop = 1;
    while(loop < 5 && loop < member_arr.length && member_arr[loop].win_rate > 0){
        if(member_arr[loop].wins == member_arr[loop - 1].wins){
            win_rate_board[win_rate_board.length] = win_rate_board[win_rate_board.length - 1].split(' ')[0] + ' ' + member_arr[loop].alias;
        }else{
            win_rate_board[win_rate_board.length] = (win_rate_board.length + 1) + '. ' + member_arr[loop].alias;
        }
        loop++;
    }

    //console.log(member_arr)
    const Leaderboard_Embed = new Discord.MessageEmbed()
        .setTitle(title)
        .setThumbnail(thumbnail)
        .setColor(color)
        .addFields(
            { name: '**Most Wins**', value: win_board.join('\n'), inline: true },
            { name: '**Most Runnerups**', value: runnerup_board.join('\n'), inline: true }
        )
        .addFields(
            { name: '\u200B', value: '\u200B'},
            { name: '**Most First Bloods**', value: firstblood_board.join('\n'), inline: true },
            { name: '**Most First Deaths**', value: firstdeath_board.join('\n'), inline: true }
        )
        .addFields(
            { name: '\u200B', value: '\u200B'},
            { name: '**Best K/D Ratio**', value: kdr_board.join('\n'), inline: true },
            { name: '**Highest Average Kills per Game**', value: avg_kills_board.join('\n'), inline: true }
        )
        .addFields(
            { name: '\u200B', value: '\u200B'},
            { name: '**Best Win Rate**', value: win_rate_board.join('\n'), inline: true },
            { name: '**Best Attendance**', value: attendance_board.join('\n'), inline: true }
        )
        .setFooter('Sample Size: ' + g_Arr.length, 'https://i.imgur.com/857yijB.png');
    message.channel.send(Leaderboard_Embed);
}

async function Game_Menu_init(message, g_Arr, filters){
    //create a message embed to create a menu of options for the user to select from using emoji reactions
    //determine how many options there are in the search and create a menu. If there are more than 10 options, create an 'next page' option and 'previous page' option so the user can navigate between pages
    //only add as many reactions as are needed. Do not spend time adding reactions beyond the number of options there are
    //once the reactions are loaded. Pass along to function Game_Menu_Update


    //declare relevant variables
    var options = 0;
    var pages = 0;
    options = g_Arr.length;
    const emojis = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟', '⏮', '⏭'];
    var loop = 0;
    //create the message embed we will be using as a menu
    const menu_embed = new Discord.MessageEmbed()
        .setTitle('Loading...');
    if(filters.length > 0){//if there were any search terms, include them as a footer in the menu so the user knows if their search terms were recognized
        menu_embed.setFooter(filters.join('\n'));
    }
    const menu = await message.channel.send(menu_embed);
    //the embed as been sent to discord. We now have the json for the message in discord in the constant - menu

    while(loop < g_Arr.length && loop < 10){//start adding the variables. Make sure to add them in order, so wait for confirmation from discord that each reaction was added successfully
        await menu.react(emojis[loop])
            .catch(err => {//if there was an error adding a reaction. Update the message embed to reflect that there was an error
                const embed_err = new Discord.MessageEmbed()
                    .setTitle('Error')
                    .setDescription('Encountered an error while loading reactions.')
                    .addField('error message: ', err);
                menu.edit(embed_err);
                return;
            })
        loop++;
    }
    //determine how many pages there will be in this menu
    pages = parseInt(g_Arr.length / 10, 10) + 1;
    if(pages > 1){//if there is more than one page, add the arrow key options
        await menu.react(emojis[10])
            .catch(err => {//if there was an error adding a reaction. Update the message embed to reflect that there was an error
                const embed_err = new Discord.MessageEmbed()
                    .setTitle('Error')
                    .setDescription('Encountered an error while loading reactions.')
                    .addField('error message: ', err);
                menu.edit(embed_err);
                return;
            })
        await menu.react(emojis[11])
            .catch(err => {//if there was an error adding a reaction. Update the message embed to reflect that there was an error
                const embed_err = new Discord.MessageEmbed()
                    .setTitle('Error')
                    .setDescription('Encountered an error while loading reactions.')
                    .addField('error message: ', err);
                menu.edit(embed_err);
                return;
            })
    }
    //embed with all reaction buttons have been succesfully added. Move on to Game_Menu_Update
    Game_Menu_Update(message, g_Arr, filters, menu, 1, pages);
}

async function Game_Menu_Update(message, g_Arr, filters, menu, page, pages){
    //Game_Menu_Update is called from Game_Menu_init
    //the inputs of this function the original input command - message, game object array, relevant filter titles, the discord object of the menu, what page to display and how many pages there are
    //generate the display of the message embed with all the options relevant to the current inputs
    //each page can only have 10 options and (when necessary) forward and backward keys to navigate pages
    //If a user selects a number reaction, pass to Print_Game_Card for the relevant game ID
    //If a user selects an arrow key, call Game_Menu_Update again to display the relevant page
    
    //declare relevant variables
    var title = null
    if(filters.length == 0){//set up title to reflect if this was a 'all games' or a search results menu
        title = 'Game History';
    }else{
        title = 'Search Results';
    }
    const emojis = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟', '⏮', '⏭'];
    var body = [];
    var count = [];
    var loop = page * 10 - 10;

    //generate the array of options for this page
    while(loop < (page * 10) && loop < g_Arr.length){
        body[body.length] = emojis[body.length] + '. ' + g_Arr[loop].date + ' - ' + g_Arr[loop].title;
        loop++;
    }
    count = body.length;//note how many valid options there are in this array
    loop = 0;

    if(page < pages){//if necessary, add the next page and previous page options as valid options in the menu
        body[body.length] = '⏭.Next Page';
    }
    if(page > 1){
        body[body.length] = '⏮.Previous Page';
    }
    //generate the new menu embed
    const MenuEmbed = new Discord.MessageEmbed()
        .setTitle(title)
        .addField('Selection', body.join('\n'));
    if(pages > 1){//if there is more than one page, include which page is being displayed as the description of the embed (will appear as a sub-title)
        MenuEmbed.setDescription('Page (' + page + '/' + pages + ')');
    }
    if(filters.length != 0){//if there are filters, display them as a footer so the user can confirm that their search query worked
        MenuEmbed.setFooter(filters.join('\n'));
    }
    menu.edit(MenuEmbed);
    //menu embed has been updated. Now set up a collector for the user response

    const filter = (reaction, user) => {//set up a filter for valid reactions. Must be one of the following emojis and must be from the user who initiated the search
        return ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟', '⏮', '⏭'].includes(reaction.emoji.name) && user.id === message.author.id;
    }
    const selection = await menu.awaitReactions(filter, {max: 1, time: 45000, errors: ['Game History Error']})
    .then(collected => {
        if(collected.size == 0){//if the user never chose an option from the menu, cancel the function
            message.channel.send('Operation timed out');
            menu.delete();
            return;
        }
        const reaction = collected.first();//we are only interested in the first reaction the user input
        //if-else tree. Based on which reaction they gave, proceed.
        if(reaction.emoji.name === '1⃣'){
            Print_Game_Card(message, g_Arr[(10*page) - 10].id);//if they chose reaction 1, send them to the game ID listed as option 1 in the menu (this is essentially copy-pasted for 1-10)
            menu.delete();
        }else if(reaction.emoji.name === '2⃣'){
            if(count > 1){
                Print_Game_Card(message, g_Arr[(10*page) - 9].id);
                menu.delete();
            }else{
                menu.reactions.resolve('2⃣').users.remove(message.author.id);//if they chose a reaction that is not relevant to any option, remove their reaction and reload the menu on the same page
                Game_Menu_Update(message, g_Arr, filters, menu, page, pages);
            }
        }else if(reaction.emoji.name === '3⃣'){
            if(count > 2){
                Print_Game_Card(message, g_Arr[(10*page) - 8].id);
                menu.delete();
            }else{
                menu.reactions.resolve('3⃣').users.remove(message.author.id);
                Game_Menu_Update(message, g_Arr, filters, menu, page, pages);
            }
        }else if(reaction.emoji.name === '4⃣'){
            if(count > 3){
                Print_Game_Card(message, g_Arr[(10*page) - 7].id);
                menu.delete();
            }else{
                menu.reactions.resolve('4⃣').users.remove(message.author.id);
                Game_Menu_Update(message, g_Arr, filters, menu, page, pages);
            }
        }else if(reaction.emoji.name === '5⃣'){
            if(count > 4){
                Print_Game_Card(message, g_Arr[(10*page) - 6].id);
                menu.delete();
            }else{
                menu.reactions.resolve('5⃣').users.remove(message.author.id);
                Game_Menu_Update(message, g_Arr, filters, menu, page, pages);
            }
        }else if(reaction.emoji.name === '6⃣'){
            if(count > 5){
                Print_Game_Card(message, g_Arr[(10*page) - 5].id);
                menu.delete();
            }else{
                menu.reactions.resolve('6⃣').users.remove(message.author.id);
                Game_Menu_Update(message, g_Arr, filters, menu, page, pages);
            }
        }else if(reaction.emoji.name === '7⃣'){
            if(count > 6){
                Print_Game_Card(message, g_Arr[(10*page) - 4].id);
                menu.delete();
            }else{
                menu.reactions.resolve('7⃣').users.remove(message.author.id);
                Game_Menu_Update(message, g_Arr, filters, menu, page, pages);
            }
        }else if(reaction.emoji.name === '8⃣'){
            if(count > 7){
                Print_Game_Card(message, g_Arr[(10*page) - 3].id);
                menu.delete();
            }else{
                menu.reactions.resolve('8⃣').users.remove(message.author.id);
                Game_Menu_Update(message, g_Arr, filters, menu, page, pages);
            }
        }else if(reaction.emoji.name === '9⃣'){
            if(count > 8){
                Print_Game_Card(message, g_Arr[(10*page) - 2].id);
                menu.delete();
            }else{
                menu.reactions.resolve('9⃣').users.remove(message.author.id);
                Game_Menu_Update(message, g_Arr, filters, menu, page, pages);
            }
        }else if(reaction.emoji.name === '🔟'){
            if(count > 9){
                Print_Game_Card(message, g_Arr[(10*page) - 1].id);
                menu.delete();
            }else{
                menu.reactions.resolve('🔟').users.remove(message.author.id);
                Game_Menu_Update(message, g_Arr, filters, menu, page, pages);
            }
        }else if(reaction.emoji.name === '⏮'){
            menu.reactions.resolve('⏮').users.remove(message.author.id);
            if(page != 1){
                Game_Menu_Update(message, g_Arr, filters, menu, page - 1, pages);//if they chose previous page, reload the menu on the last page
            }else{
                Game_Menu_Update(message, g_Arr, filters, menu, page, pages);//if they chose previous page, but are already on the first page, reload page 1
            }
        }else if(reaction.emoji.name === '⏭'){
            menu.reactions.resolve('⏭').users.remove(message.author.id);
            if(page != pages){
                Game_Menu_Update(message, g_Arr, filters, menu, page + 1, pages);//if they chose next page, reload the menu on the next page
            }else{
                Game_Menu_Update(message, g_Arr, filters, menu, page, pages);//if they chose next page, but are already on the last page, reload the last page
            }
        }
    })
}

function Notifications(message){
    //someone wants to update their notifications setting
    const Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    var in_Arr = message.content.toString().toLowerCase().split(' ').slice(2);
    if(in_Arr.length == 0){
        message.channel.send('Error. Try `s!o help notifs`');
        return;
    }
    var notifs = null;
    if(in_Arr[0] == 'on'){
        notifs = true;
    }else if(in_Arr[0] == 'off'){
        notifs = false;
    }else{
        message.channel.send('Unable to determine input `' + in_Arr[0] + '`. Try `s!o help notifs`');
        return;
    }
    var check = false;
    Member_Data.Member_Objects.forEach(Element => {
        if(Element.discord == message.author.id){
            check = true;
            Element.notif = notifs;
            console.log(Element);
        }
    })
    if(check == true){
        fs.writeFileSync('./Member_Data_Main.json', JSON.stringify(Member_Data, null, 4), 'utf8');
        message.react('✅');
    }else{
        message.channel.send('Unable to find user `' + message.author.username + '` on file. Try `s!o join`');
    }
}

async function Notify_Det(message){
    //A UHC is being planned, send a notification to all the members who want UHC notifications
    //this is the first function in a multi function process, the next function is notif_send and the final is notif_reply
    if(message.author.id != '252099253940387851' && message.author.id != '742510148647387256' && message.author.id != '268214197714812929' && message.author.id != '268152589437108224'){
        message.channel.send('You are not authorized to use this command.');
        return;
    }
    const in_Arr = message.content.toString().toLowerCase().split(' ').slice(2);
    if(in_Arr.length == 0){
        message.channel.send('Improper format. Try `s!o help notify`');
        return;
    }
    //There will be a few different pieces of info needed from the person setting up the match
    //When will the match be
    //Will it be solo or teams
    //Any additional comments {make a comments field optional}

    //declare variables used in this function
    var match_time = [];
    var comments = null;

    var loop = 0;

    match_time = in_Arr[0].split(':');
    loop = 0
    while(loop < 2){//turn the input string into an array of integers
        match_time[loop] = parseInt(match_time[loop], 10);
        loop++;
    }

    //the format should be hours:minutes
    if(isNaN(match_time[0]) || match_time[0] < 0 || match_time[0] > 23 || isNaN(match_time[1]) || match_time[1] < 0 || match_time[1] > 59){
        message.channel.send('Improper time format: `' + match_time.join(':') + '`. Try `s!o help notify`');
        return;
    }
    //the time has been set
    
    if(in_Arr.length > 1){//If the author included game comments, include them as a string. Include any capitalizations they had
        comments = message.content.toString().split(' ').slice(3).join(' ');
    }
    
    //all inputs have been logged. Move on to next step of notifying members of the upcoming game
    const Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json'), 'utf8');
    //create a string for displaying match time (make it so that even if minutes is single digit, the string still shows two minute digits)
    var match_time_display = match_time[0].toString() + ':';
    if(match_time[1] < 10){
        match_time_display = match_time_display + '0' + match_time[1].toString();
    }else{
        match_time_display = match_time_display + match_time[1].toString();
    }
    var set_JSON = '{ "time": "' + match_time_display + '",\n"Active": "true",\n"Home_msg": "null",\n"Home_channel": "null",\n"Home_guild": "null",\n"Coming": [ ],\n"Not_Coming": [ ],\n"Maybe": [ ]}';
    var notif_JSON = JSON.parse(set_JSON)
    const Double_Check_Embed = new Discord.MessageEmbed()
        .setTitle('Are you sure?')
        .addField('Game start time', match_time_display)
        .setColor('15ccc7');
    if(comments != null){
        Double_Check_Embed.addField('Note', comments);
    }
    var invited_members = 0;
    Member_Data.Member_Objects.forEach(Element => {
        if(Element.notif == true){
            invited_members++;
        }
    })
    const confirm = await message.channel.send(Double_Check_Embed);
    const filter = m => m.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 15000 }, );
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            confirm.delete();
            return;
        }
        var rep_string = collected.first().content.toString().toLowerCase();
        if(rep_string == 'y' || rep_string == 'yes'){
            //proceed with function
            message.channel.send('Invitations sent to ' + invited_members + ' members ✅');
            Notif_Send(message, notif_JSON, comments);
            confirm.delete();
        }else{
            message.channel.send('Function Canceled');
            confirm.delete();
        }

    })
}

async function Notify_Reply(message){
    //a user has sent a command saying they want to change their status in the coming UHC
    
    //load relevant data
    const match_JSON = JSON.parse(fs.readFileSync('./Planned_Game.json', 'utf8'));
    if(match_JSON.Active.toString() == "false"){//check to make sure there is a game coming up
        message.channel.send('Error. No scheduled game found on file.');
        return;
    }
    const Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    var path = null;
    var in_Arr = message.content.toString().toLowerCase().split(' ').slice(2);
    if(in_Arr.length == 0){
        message.channel.send('Error. improper format. Try `s!o help reply`');
        return;
    }
    if(in_Arr[0] == 'coming' || in_Arr[0] == 'can'){
        path = 'y'
    }else if(in_Arr[0] == 'cant' || in_Arr[0] == "can't" || in_Arr[0] == 'not'){
        path = 'n'
    }else if(in_Arr[0] == 'maybe'){
        path = 'm'
    }else{
        message.channel.send('Unable to determine input: `' + in_Arr[0] + '`. Try `s!o help reply`');
        return;
    }
    const guild = client.guilds.cache.get(match_JSON.Home_guild);
    const channel = guild.channels.cache.get(match_JSON.Home_channel);
    const Home_msg = await channel.messages.fetch(match_JSON.Home_msg);
    var check = false;
    Member_Data.Member_Objects.forEach(Element => {
        if(Element.discord == message.author.id){
            Notify_Handle_Reply(Home_msg, Element, path);
            check = true;
        }
    })
    if(check == false){
        message.channel.send('Error. Unable to find user `' + message.author.username + '` in data files. Try `s!o join`');
    }
}

async function Notif_Send(message, match_JSON, comments){
    //a UHC has been set, send invitations to all members who are signed up for notifications
    
    //read member data from disc
    
    const Member_Main = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    const Home_Embed = new Discord.MessageEmbed()
        .setColor('15ccc7')  
        .setTitle('Waiting for Replies...')
        .setDescription(match_JSON.time + ' UTC');
    //send an embed to the channel that will be actively updated showing who is coming/might come and can't come
    const Home_msg = await message.channel.send(Home_Embed);
    match_JSON.Home_msg = Home_msg.id
    match_JSON.Home_guild = message.guild.id
    match_JSON.Home_channel = Home_msg.channel.id
    //start by writing the game data to disc
    fs.writeFileSync('./Planned_Game.json', JSON.stringify(match_JSON, null, 4), 'utf8');
    //determine how much time is left until the game starts
    var start_time = [];
    var delay = 0;
    //send invitations to members
    const date = new Date();
    start_time[0] = parseInt(match_JSON.time.split(':')[0], 10);
    start_time[1] = parseInt(match_JSON.time.split(':')[1], 10);
    console.log(start_time)
    var time = [0,0,0]
    time[0] = parseInt(date.getHours(), 10);
    time[1] = parseInt(date.getMinutes(), 10);
    time[2] = parseInt(date.getSeconds(), 10);
    console.log(time);
    if(start_time[0] > time[0]){
        delay = (start_time[0] - time[0]) * 3600000;
        delay = delay + (start_time[1] - time[1]) * 60000;
        delay = delay + parseInt(time[2] / 1000);
    }else if(start_time[0] < time[0]){
        delay = (start_time[0] - 1) * 3600000;
        delay = delay + ((start_time[1]) * 60000);
        delay = delay + ((24 - time[0]) * 3600000);
        delay = delay + ((60 - time[1]) * 60000);
        delay = delay + (time[2] * 1000);
    }else{
        delay = (start_time[1] - time[1]) * 60000;
        delay = delay + (time[2] * 1000) - 59000;
    }
    Member_Main.Member_Objects.forEach(Element => {
        if(Element.notif == true){//make sure that this user has notifs on
            console.log(Element)
            Notif_Reply(message, Home_msg, match_JSON, Element, comments, delay);
        }
    })
    
    //send an invitation to each member who has notifications turned on. Set up a collector for them to reply
    Update_Game_Clock(Home_msg, true);//start the process of updating the live countdown clock
}

async function Notif_Reply(message, Home_msg, match_JSON, member_obj, comments, delay){
    //this function will be called once for each member who has signed up for UHC notifications
    //
    
    //build an embed to send to this user
    const DM_Embed = new Discord.MessageEmbed()
        .setTitle('UHC Invitation')
        .setColor('15ccc7')
        .setDescription('Hello ' + member_obj.name + ',\nYou have been invited to a UHC Game');
    if(comments != null){
        DM_Embed.setFooter(comments);
    }
    //check what timezone this user is in and adjust the game time display to show it in their timezone
    var time_disp = match_JSON.time.split(':');
    if(member_obj.timezone != 0){
        time_disp[0] = parseInt(time_disp[0], 10) + parseInt(member_obj.timezone, 10);
        if(time_disp[0] < 0){
            time_disp[0] = time_disp[0] + 24;
        }else if(time_disp[0] > 23){
            time_disp[0] = time_disp[0] - 24;
        }
        if(time_disp[0] > 13){
            time_disp[0] = time_disp[0] - 12;
            DM_Embed.addField('Planned Time', time_disp.join(':') + ' PM\n(' + match_JSON.time + ' UTC)');
        }else if(time_disp[0] == 0){
            time_disp[0] = 12;
            DM_Embed.addField('Planned Time', time_disp.join(':') + ' AM\n(' + match_JSON.time + ' UTC)');
        }else if(time_disp[0] == 12){
            DM_Embed.addField('Planned Time', time_disp.join(':') + ' PM\n(' + match_JSON.time + ' UTC)');
        }else{
            DM_Embed.addField('Planned Time', time_disp.join(':') + ' AM\n(' + match_JSON.time + ' UTC)');
        }
        
    }else{
        DM_Embed.addField('Planned Time', match_JSON.time);
    }
    DM_Embed.addField('React to reply...', "✅ - I'm coming!\n❌ - I can't come\n🤔 - I may be able to come.");
    //console.log(member_obj)
    console.log('fetching... ' + member_obj.discord);
    const user = client.users.cache.get(member_obj.discord);
    const invitation = await user.send(DM_Embed);
    const emojis = ['✅', '❌', '🤔'];
    var loop = 0;
    while(loop < 3){
        invitation.react(emojis[loop]);
        loop++;
    }
    const filter = (reaction, user) => {
        return ['✅', '❌', '🤔'];
    }
    const selection = await invitation.awaitReactions(filter, {max: 1, time: delay})
        .then(collected => {
            if(collected.size == 0){
                user.send("Invitation expired.\nIf you are still coming, please let us know in " + message.channel.name);
                return;
            }
            const reaction = collected.first();
            const reply_Embed = new Discord.MessageEmbed();
            if(reaction.emoji.name == '✅'){
                Notify_Handle_Reply(Home_msg, member_obj, 'y');
                reply_Embed
                    .setDescription('Thanks for responding ✅\nYou will receive a reminder when the game is about to start.')
                    .setFooter('To change your response DM me one of the following.\ns!o reply coming\ns!o reply cant\ns!o reply maybe')
                    .setColor('15ccc7');
                user.send(reply_Embed);
                //they have chosen to come!
            }else if(reaction.emoji.name == '❌'){
                //they can't come :(
                Notify_Handle_Reply(Home_msg, member_obj, 'n');
                reply_Embed
                    .setDescription('Thanks for responding ❌')
                    .setFooter('To change your response DM me one of the following.\ns!o reply coming\ns!o reply cant\ns!o reply maybe')
                    .setColor('15ccc7');
                user.send(reply_Embed);
            }else if(reaction.emoji.name == '🤔'){
                //they aren't sure
                Notify_Handle_Reply(Home_msg, member_obj, 'm');
                reply_Embed
                    .setDescription('Thanks for responding 🤔\nYou will receive a reminder when the game is about to start.')
                    .setFooter('To change your response DM me one of the following.\ns!o reply coming\ns!o reply cant\ns!o reply maybe')
                    .setColor('15ccc7');
                user.send(reply_Embed);
            }
            invitation.delete();
        })
}

function Update_Game_Clock(Home_msg, isFirst){
    //an update is required on Home_msg
    //declare variables
    var start_time = [];
    var delay = 0;
    const match_JSON = JSON.parse(fs.readFileSync('./Planned_Game.json', 'utf8'));
    //determine how much time is left until the game starts
    const date = new Date();
    start_time[0] = parseInt(match_JSON.time.split(':')[0], 10);
    start_time[1] = parseInt(match_JSON.time.split(':')[1], 10);
    console.log(start_time)
    var time = [0,0,0]
    time[0] = parseInt(date.getHours(), 10);
    time[1] = parseInt(date.getMinutes(), 10);
    time[2] = parseInt(date.getSeconds(), 10);
    console.log(time);
    if(start_time[0] > time[0]){
        delay = (start_time[0] - time[0]) * 3600000;
        delay = delay + (start_time[1] - time[1]) * 60000;
        delay = delay + parseInt(time[2] / 1000);
    }else if(start_time[0] < time[0]){
        delay = (start_time[0] - 1) * 3600000;
        delay = delay + ((start_time[1]) * 60000);
        delay = delay + ((24 - time[0]) * 3600000);
        delay = delay + ((60 - time[1]) * 60000);
        delay = delay + (time[2] * 1000);
    }else{
        delay = (start_time[1] - time[1]) * 60000;
        delay = delay + (time[2] * 1000) - 59000;
    }
    console.log('delay: ' + delay);
    var setDelay = 0;
    if(isFirst == true){
        setDelay = time[2] * 1000;
        setDelay = setDelay - 900;
    }else{
        setDelay = 60000;
    }
    if(delay > -300000){
        Update_Home_Embed(Home_msg, delay);
        setTimeout(function(){
            Update_Game_Clock(Home_msg, false);
        }, setDelay)
    }else{
        match_JSON.Active = 'false';
        fs.writeFileSync('./Planned_Game.json', JSON.stringify(match_JSON, null, 4), 'utf8');
    }
    if(isFirst == true && delay > 1900000){//is the first time this function is being called for this UHC
        //set timeouts for reminders
        setTimeout(function(){
            Notify_Warning(Home_msg, true);
        }, (delay - 1800000))
    }
    if(isFirst == true && delay > 60000){
        setTimeout(function(){
            Notify_Warning(Home_msg, false);
        }, delay)
    }
}

function Notify_Warning(message, isFirst){
    const match_JSON = JSON.parse(fs.readFileSync('./Planned_Game.json', 'utf8'));
    const Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    if(match_JSON.Coming.length != 0){
        match_JSON.Coming.forEach(Element => {
            Warning(Member_Data.Member_Objects[parseInt(Element.slice(1), 10) - 1], isFirst);
        })
    }
    if(match_JSON.Maybe.length != 0 && isFirst == true){
        match_JSON.Maybe.forEach(Element => {
            console.log(Element)
            console.log(parseInt(Element.slice(1), 10))
            Maybe_Followup(message, Member_Data.Member_Objects[parseInt(Element.slice(1), 10) - 1]);
        })
    }
    if(isFirst == true){
        message.channel.send('The UHC game is starting in 30 minutes!')
    }else{
        message.channel.send('The UHC game is starting!')
    }
    
}

function Warning(member_obj, isFirst){
    console.log('fetching... ' + member_obj.name)
    const user = client.users.cache.get(member_obj.discord);
    if(isFirst == true){
        user.send('The UHC game is starting in 30 minutes!')
    }else{
        user.send('The UHC game is starting!')
    }
    
}

async function Maybe_Followup(Home_msg, member_obj){
    //this user previous replied with "maybe"
    //when this function is called, there is one hour until the game starts
    //send a follow up message asking if they will be able to come or not

    
    const Maybe_Embed = new Discord.MessageEmbed()
        .setTitle('UHC Invitation Follow-up')
        .setDescription('Hello ' + member_obj.name + ',\nThere is 30 minutes left until the UHC round is scheduled to begin. Will you be able to join?')
        .addField('React to reply...', "✅ - I'm coming!\n❌ - I can't come")
        .setDescription('This menu will remain active until the game begins')
        .setColor('15ccc7');
    //the rest of this is the same as in Notif_Reply() except the maybe option is removed
    console.log('fetching... ' + member_obj.discord);
    const user = client.users.cache.get(member_obj.discord);
    const invitation = await user.send(Maybe_Embed);
    const emojis = ['✅', '❌'];
    var loop = 0;
    while(loop < 2){
        invitation.react(emojis[loop]);
        loop++;
    }
    const filter = (reaction, user) => {
        return ['✅', '❌'];
    }
    const selection = await invitation.awaitReactions(filter, {max: 1, time: 1800000})
        .then(collected => {
            const reply_Embed = new Discord.MessageEmbed();
            if(collected.size == 0){
                user.send("Invitation expired.\nIf you are still coming, please let us know in " + message.channel.name);
                return;
            }
            const reaction = collected.first();
            if(reaction.emoji.name == '✅'){
                Notify_Handle_Reply(Home_msg, member_obj, 'y');
                reply_Embed
                    .setDescription('Thanks for responding ✅\nYou will receive a reminder when the game is about to start.')
                    .setFooter('To change your response DM me one of the following.\ns!o reply coming\ns!o reply cant\ns!o reply maybe')
                    .setColor('15ccc7');
                user.send(reply_Embed);
                //they have chosen to come!
            }else if(reaction.emoji.name == '❌'){
                //they can't come :(
                Notify_Handle_Reply(Home_msg, member_obj, 'n');
                reply_Embed
                    .setDescription('Thanks for responding ❌')
                    .setFooter('To change your response DM me one of the following.\ns!o reply coming\ns!o reply cant\ns!o reply maybe')
                    .setColor('15ccc7');
                user.send(reply_Embed);
            }else{
                user.send('invalid selection.\nIf you are still coming, please let us know in ' + message.channel.name);
                return;
            }
            invitation.delete();
        })
}

function Notify_Handle_Reply(Home_msg, member_obj, reply){
    //a user has replied to the invitation message
    console.log('notify handle reply: ' + member_obj.alias)
    const match_JSON = JSON.parse(fs.readFileSync('./Planned_Game.json', 'utf8'));
    if(reply == 'y'){
        Home_msg.channel.send('**' + member_obj.alias + '** is coming!');
    }else if(reply == 'n'){
        Home_msg.channel.send('**' + member_obj.alias + "** can't come 😭");
    }else if(reply == 'm'){
        if(member_obj.pronouns == 'm'){
            Home_msg.channel.send('**' + member_obj.alias + "** isn't sure if he can come.");
        }else if(member_obj.pronouns == 'f'){
            Home_msg.channel.send('**' + member_obj.alias + "** isn't sure if she can come.");
        }else if(member_obj.pronouns == 'n'){
            Home_msg.channel.send('**' + member_obj.alias + "** isn't sure if they can come.");
        }
    }
    var filtered = [];
    if(match_JSON.Not_Coming.includes(member_obj.id)){
        filtered = [];
        match_JSON.Not_Coming.forEach(Element => {//filter out this user from the not coming list
            if(Element != member_obj.id){
                filtered[filtered].length = Element
            }
        })
        match_JSON.Not_Coming = [];
        match_JSON.Not_Coming = filtered;
    }
    if(match_JSON.Maybe.includes(member_obj.id)){
        filtered = [];
        match_JSON.Maybe.forEach(Element => {//filter out this user from the not coming list
            if(Element != member_obj.id){
                filtered[filtered].length = Element
            }
        })
        match_JSON.Maybe = [];
        match_JSON.Maybe = filtered;
    }
    if(match_JSON.Coming.includes(member_obj.id)){
        filtered = [];
        match_JSON.Coming.forEach(Element => {//filter out this user from the not coming list
            if(Element != member_obj.id){
                filtered[filtered].length = Element
            }
        })
        match_JSON.Coming = [];
        match_JSON.Coming = filtered;
    }
    if(reply == 'y'){
        match_JSON.Coming[match_JSON.Coming.length] = member_obj.id;
    }
    if(reply == 'n'){
        match_JSON.Not_Coming[match_JSON.Not_Coming.length] = member_obj.id;
    }
    if(reply == 'm'){
        match_JSON.Maybe[match_JSON.Maybe.length] = member_obj.id;
    }
    console.log(match_JSON)
    fs.writeFileSync('./Planned_Game.json', JSON.stringify(match_JSON, null, 4), 'utf8');//write into the game file that this user is not coming
}

function Update_Home_Embed(Home_msg, delay){
    //an update is required on Home_msg due to someone replying to the invitation
    //load relevant data
    const match_JSON = JSON.parse(fs.readFileSync('./Planned_Game.json', 'utf8'));
    const Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    //declare variables
    var coming = [];
    var not_coming = [];
    var maybe = [];
    //create arrays of aliases of all the players coming, not coming, and maybes
    match_JSON.Coming.forEach(Element => {
        coming[coming.length] = Member_Data.Member_Objects[parseInt(Element.slice(1), 10) - 1].alias;
    })
    match_JSON.Not_Coming.forEach(Element => {
        not_coming[not_coming.length] = Member_Data.Member_Objects[parseInt(Element.slice(1), 10) - 1].alias;
    })
    match_JSON.Maybe.forEach(Element => {
        maybe[maybe.length] = Member_Data.Member_Objects[parseInt(Element.slice(1), 10) - 1].alias;
    })
    if(coming.length == 0){
        coming[0] = 'empty';
    }
    if(not_coming.length == 0){
        not_coming[0] = 'empty';
    }
    if(maybe.length == 0){
        maybe[0] = 'empty';
    }
    
    var delay_ms = 0;
    var time_left = [0, 0, 0];
    delay_ms = delay;
    while(delay_ms > 3599999){
        time_left[0]++;
        delay_ms = delay_ms - 3600000;
    }
    while(delay_ms > 59999){
        time_left[1]++;
        delay_ms = delay_ms - 60000;
    }
    if(delay_ms > 0){
        time_left[2] = parseInt(delay_ms/1000, 10);
    }
    if(time_left[1] < 10){
        time_left[1] = '0' + time_left[1].toString();
    }
    if(time_left[2] < 10){
        time_left[2] = '0' + time_left[2].toString();
    }
    //all values have been generated
    //build the new embed
    const New_Embed = new Discord.MessageEmbed()
        .setTitle('Waiting for Replies...')
        .setDescription(match_JSON.time + ' UTC')
        .setColor('15ccc7')
        .addField('**Coming**', coming.join('\n'))
        .addField('**Maybe**', maybe.join('\n'))
        .addField("**Can't Come**", not_coming.join('\n'))
        .setFooter('Game starting in: ' + time_left.join(':'));
    console.log(New_Embed);
    Home_msg.edit(New_Embed);
}

function Profile(message){
    //create an embed for a user showing their information
    
    var in_Arr = message.content.toString().toLowerCase().split(' ').slice(2)
    const Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    var user_obj = null;
    var loop = 0;
    if(in_Arr.length == 0){
        Member_Data.Member_Objects.forEach(Element => {
            if(Element.discord == message.author.id){
                user_obj = Element;
            }
        })
    }else{
        const menu = fs.readFileSync('./menu.txt').toString().split('\n');
        if(in_Arr[0].startsWith('u') && isNaN(in_Arr[0].slice(1)) == false && parseInt(in_Arr[0].slice(1), 10) < Member_Data.Member_Objects.length){
            user_obj = Member_Data.Member_Objects[parseInt(in_Arr[0].slice(1), 10) - 1];
        }else{
            menu.forEach(Element => {
                loop = 0;
                while(loop < Element.split('|')[1].split(',').length){
                    if(Element.split('|')[1].split(',')[loop] == in_Arr[0]){
                        user_obj = Member_Data.Member_Objects[parseInt(Element.split('|')[0].slice(1), 10) - 1]
                        loop = Element.split('|')[1].split(',').length;
                    }
                    loop++;
                }
            })
        }
    }
    if(user_obj == null){
        message.channel.send('Unable to determine user `' + in_Arr[0] + '`')
        return;
    }
    console.log(user_obj)
    //a user object has been obtained
    //continue on to build a embed to display the data
    const Profile_Embed = new Discord.MessageEmbed()
        .setTitle(user_obj.alias)
        .setColor(Member_Data.Team_Objects[parseInt(user_obj.team.slice(1), 10) - 1].color)
        .setThumbnail(user_obj.img)
    if(user_obj.pronouns == 'm'){
        Profile_Embed.setDescription('(he/him)');
    }else if(user_obj.pronouns == 'f'){
        Profile_Embed.setDescription('(she/her)');
    }else if(user_obj.pronouns == 'n'){
        Profile_Embed.setDescription('(they/them)')
    }
    Profile_Embed
        .addField('Team', Member_Data.Team_Objects[parseInt(user_obj.team.slice(1), 10) - 1].name)
        .setFooter('Internal user ID: ' + user_obj.id, 'https://i.imgur.com/857yijB.png');
    if(user_obj.timezone > -1){
        Profile_Embed.addField('Timezone', 'UTC+' + user_obj.timezone.toString());
    }else{
        Profile_Embed.addField('Timezone', 'UTC' + user_obj.timezone.toString());
    }
    if(user_obj.notif == false){
        Profile_Embed.addField('UHC Signup', 'not signed up');
    }else{
        Profile_Embed.addField('UHC Signup', 'signed up');
    }
    console.log(Profile_Embed)
    message.channel.send(Profile_Embed)
}

function Join(message){
    //a person has asked to join Stale Oreos
    const Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    var check = false;
    Member_Data.Member_Objects.forEach(Element => {
        if(Element.discord == message.author.id){
            check = true;
        }
    })
    if(check == true){
        Profile(message);
        return;
    }
    var new_uID = null;
    Member_Data.Total_Members = Member_Data.Total_Members + 1;
    if(Member_Data.Total_Members < 10){
        new_uID = 'u00' + Member_Data.Total_Members.toString();
    }else if(Member_Data.Total_Members < 100){
        new_uID = 'u0' + Member_Data.Total_Members.toString();
    }else{
        new_uID = 'u' + Member_Data.Total_Members.toString();
    }
    var user_obj = {//create the object for this user, leave null the properties we will fill later on in this process
        id: new_uID,
        discord: message.author.id,
        name: null,
        alias: null,
        pronouns: null,
        team: null,
        img: "https://i.imgur.com/857yijB.png",
        notif: true,
        timezone: 0
    }
    console.log(user_obj)
    //need to collect their name, alias, pronouns, team and timezone
    Join_alias(message, user_obj);
}

async function Join_alias(message, user_obj){
    //called from function Join
    //ask what their minecraft username is
    //pass to Join_name

    const q_Embed = new Discord.MessageEmbed()
        .setTitle('What is your MineCraft username?')
        .setColor('c711dd')
        .setAuthor('@' + message.author.username, 'https://i.imgur.com/857yijB.png');
    const question = await message.channel.send(q_Embed);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            question.delete();
            return;
        }
        var alias = collected.first().content.toString();
        if(alias.split(' ').length > 1){
            message.channel.send('Improper format. Minecraft usernames must be one word')
            question.delete();
            return;
        }
        user_obj.alias = alias;
        Join_name(message, user_obj);
        question.delete();
        collected.first().delete();
    })
}

async function Join_name(message, user_obj){
    //called from function Join_alias
    //ask what their minecraft username is
    //pass to Join_pronouns

    const q_Embed = new Discord.MessageEmbed()
        .setTitle('What is should I call you?')
        .setColor('c711dd')
        .setAuthor('@' + message.author.username, 'https://i.imgur.com/857yijB.png');
    const question = await message.channel.send(q_Embed);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            question.delete();
            return;
        }
        var name = collected.first().content.toString();
        user_obj.name = name;
        Join_pronouns(message, user_obj);
        question.delete();
        collected.first().delete();
    })
}

async function Join_pronouns(message, user_obj){
    //called from function Join_name
    //ask what their pronouns are
    //pass to Join_timezone

    const q_Embed = new Discord.MessageEmbed()
        .setTitle('What are your pronouns?')
        .setDescription('Reply with one of the following letters:\nhe/him - m\nshe/her - f\nthey/them - n')
        .setColor('c711dd')
        .setAuthor('@' + message.author.username, 'https://i.imgur.com/857yijB.png');
    const question = await message.channel.send(q_Embed);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            question.delete();
            return;
        }
        var pronouns_in = collected.first().content.toString().toLowerCase();
        if(pronouns_in.length > 1){
            message.channel.send('Improper format. Reply must be one letter')
            question.delete();
            return;
        }
        if(pronouns_in == 'm' || pronouns_in == 'f' || pronouns_in == 'n'){
            user_obj.pronouns = pronouns_in;
            console.log(user_obj);
        }else{
            message.channel.send('Invalid response. This system can only handle m/f/n responses');
            return;
        }
        Join_timezone(message, user_obj);
        question.delete();
        collected.first().delete();
    })
}

async function Join_timezone(message, user_obj){
    //called from Join_pronouns
    //ask what their timezone is (in relation to UTC)
    //call Join_team
    
    const q_Embed = new Discord.MessageEmbed()
        .setTitle('What timezone are you in?')
        .setDescription('Reply with how far ahead or behind you are from UTC\nif you are 4 hours behind UTC: -4\nif you are 6 hours ahead of UTC: 6')
        .setColor('c711dd')
        .setAuthor('@' + message.author.username, 'https://i.imgur.com/857yijB.png');
    const question = await message.channel.send(q_Embed);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            question.delete();
            return;
        }
        var timezone = collected.first().content.toString().toLowerCase();
        timezone = parseInt(timezone, 10)
        if(isNaN(timezone, 10) || timezone < -12 || timezone > 12){
            message.channel.send('Improper format. Reply must be an integer between -12 and +12')
            question.delete();
            return;
        }
        user_obj.timezone = timezone;
        console.log(user_obj);
        Join_team(message, user_obj);
        question.delete();
        collected.first().delete();
    })
}

async function Join_team(message, user_obj){
    //called from Join_timezone
    //ask what faction the member is in
    //final function in this array

    const q_Embed = new Discord.MessageEmbed()
        .setTitle('What faction are you in?')
        .setColor('c711dd')
        .setAuthor('@' + message.author.username, 'https://i.imgur.com/857yijB.png');
    const Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    const emojis = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟'];
    const temp_Embed = new Discord.MessageEmbed()
        .setTitle('Loading...');
    const question = await message.channel.send(temp_Embed);
    var loop = 0;
    while(loop < Member_Data.Team_Objects.length && loop < 10){
        await question.react(emojis[loop]);
        loop++;
    }
    var body = [];
    loop = 0;
    while(loop < Member_Data.Team_Objects.length && loop < 10){
        body[body.length] = emojis[loop] + '. ' + Member_Data.Team_Objects[loop].name;
        loop++;
    }
    q_Embed.addField('React to choose a team:', body.join('\n'));
    question.edit(q_Embed)
    const filter = (reaction, user) => {
        return['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟'].includes(reaction.emoji.name) && user.id === message.author.id;
    }
    const selection = await question.awaitReactions(filter, {max: 1, time: 60000})
        .then(collected => {
            if(collected.size == 0){
                message.channel.send('Operation timed out');
                question.delete();
                return;
            }
            const reaction = collected.first();
            var team_selected = null;
            if(reaction.emoji.name === '1⃣' && Member_Data.Team_Objects.length > 0){
                team_selected = 't001';
            }else if(reaction.emoji.name === '2⃣' && Member_Data.Team_Objects.length > 1){
                team_selected = 't002';
            }else if(reaction.emoji.name === '3⃣' && Member_Data.Team_Objects.length > 2){
                team_selected = 't003';
            }else if(reaction.emoji.name === '4⃣' && Member_Data.Team_Objects.length > 3){
                team_selected = 't004';
            }else if(reaction.emoji.name === '5⃣' && Member_Data.Team_Objects.length > 4){
                team_selected = 't005';
            }else if(reaction.emoji.name === '6⃣' && Member_Data.Team_Objects.length > 5){
                team_selected = 't006';
            }else if(reaction.emoji.name === '7⃣' && Member_Data.Team_Objects.length > 6){
                team_selected = 't007';
            }else if(reaction.emoji.name === '8⃣' && Member_Data.Team_Objects.length > 7){
                team_selected = 't008';
            }else if(reaction.emoji.name === '9⃣' && Member_Data.Team_Objects.length > 8){
                team_selected = 't009';
            }else if(reaction.emoji.name === '🔟' && Member_Data.Team_Objects.length > 9){
                team_selected = 't010';
            }
            if(team_selected == null){
                message.channel.send('Invalid selection.');
                return;
            }
            user_obj.team = team_selected;
            //all data has been gathered
            //save into the member data json
            const Reload_Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));//it's possible another user made an edit since we began this function, reload to avoid overwriting data
            Reload_Member_Data.Member_Objects[parseInt(user_obj.id.slice(1), 10) - 1] = user_obj;
            Reload_Member_Data.Total_Members = Reload_Member_Data.Member_Objects.length;
            fs.writeFileSync('./Member_Data_Main.json', JSON.stringify(Reload_Member_Data, null, 4), 'utf8');
            var user_menu = fs.readFileSync('./menu.txt').toString().split('\n');
            user_menu[user_menu.length] = user_obj.id + '|' + user_obj.name.toLowerCase() + ',' + user_obj.alias.toLowerCase();
            fs.writeFileSync('./menu.txt', user_menu.join('\n'));
            console.log(user_obj);
            message.channel.send('User Profile successfully created ✅\nTo get a custom thumbnail image, DM dandera.');
            Profile(message);
            question.delete();
        })
        

}

function Enter_game(message){
    //user wants to enter a game
    //create an object to store all relevant data and collect all data from user
    //this process will be multiple functions

    const Game_Data = JSON.parse(fs.readFileSync('./Game_Data_Main.json', 'utf8'));
    var game_id = null;
    if(Game_Data.Total_Games + 1 < 10){
        game_id = 'g00' + (Game_Data.Total_Games + 1).toString();
    }else if(Game_Data.Total_Games + 1 < 100){
        game_id = 'g0' + (Game_Data.Total_Games + 1).toString();
    }else{
        game_id = 'g' + (Game_Data.Total_Games + 1).toString();
    }
    var game_obj = {
        id: game_id,
        date: null,
        title: null,
        isSolo: null,
        participants: []
    }
    Enter_game_date(message, game_obj);
}

async function Enter_game_date(message, game_obj){
    console.log(game_obj);
    const q_Embed = new Discord.MessageEmbed()
        .setTitle('When was the game played?')
        .setDescription('format your response as\nyear-month-day\nexample: 2021-3-20')
        .setColor('c711dd')
        .setAuthor('@' + message.author.username, 'https://i.imgur.com/857yijB.png');
    const question = await message.channel.send(q_Embed);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            question.delete();
            return;
        }
        var date = [];
        date = collected.first().toString().split('-')
        if(date.length != 3){
            message.channel.send('Improper format. Reply must be in year-month-day format');
            return;
        }
        var loop = 0;
        while(loop < 3){
            date[loop] = parseInt(date[loop], 10);
            if(isNaN(date[loop]) == true){
                message.channel.send('Improper format. Reply must be in year-month-day format');
                return;
            }
            loop++;
        }
        if(date[0] < 2010){
            message.channel.send('`' + date[0] + '` is not a valid year.')
            return;
        }
        if(date[1] < 1 || date[1] > 12){
            message.channel.send('`' + date[1] + '` is not a valid month.');
            return;
        }
        if(date[2] < 1 || date[2] > 31){
            message.channel.send('`' + date[2] + '` is not a valid day.');
            return;
        }
        var date_str = date[0].toString() + '-'
        if(date[1] < 10){
            date_str = date_str + '0' + date[1].toString() + '-';
        }else{
            date_str = date_str + date[1].toString() + '-';
        }
        if(date[2] < 10){
            date_str = date_str + '0' + date[2].toString();
        }else{
            date_str = date_str + date[2].toString();
        }
        game_obj.date = date_str;
        Enter_game_type(message, game_obj);
    })
}

async function Enter_game_type(message, game_obj){
    //function called by Enter_game
    //determine if the game was solo or teams
    //pass on to Enter_game_participants

    console.log(game_obj);
    const q_Embed = new Discord.MessageEmbed()
        .setTitle('Was the game solo or teams?')
        .setDescription('Solo - s\nTeams - t')
        .setColor('c711dd')
        .setAuthor('@' + message.author.username, 'https://i.imgur.com/857yijB.png');
    const question = await message.channel.send(q_Embed);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            question.delete();
            return;
        }
        var gameType = null;
        var reply = collected.first().toString().toLowerCase()
        if(reply == 's' || reply == 'solo'){
            gameType = true;
        }else if(reply == 't' || reply == 'team' || reply == 'teams'){
            gameType = false;
        }else{
            message.channel.send('Unable to determine `' + reply + '`. Try `s!o help enter`');
            return
        }
        game_obj.isSolo = gameType;
        Enter_game_participants(message, game_obj);
    })
}

async function Enter_game_participants(message, game_obj){
    //function called by Enter_game
    //determine if the game was solo or teams
    //pass on to Enter_game_participants

    console.log(game_obj);
    const q_Embed = new Discord.MessageEmbed()
        .setTitle('Who played in the match?')
        .setColor('c711dd')
        .setAuthor('@' + message.author.username, 'https://i.imgur.com/857yijB.png');
    const question = await message.channel.send(q_Embed);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            question.delete();
            return;
        }
        var participants = [];
        var reply = collected.first().toString().toLowerCase().split(' ');
        if(reply.length < 2){
            message.channel.send('There must be at least 2 participants.');
            return;
        }
        const Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
        const menu = fs.readFileSync('./menu.txt').toString().split('\n');
        var loop = 0;
        var inloop = 0;
        var check = false;
        reply.forEach(Element => {
            if(Element.startsWith('u') && isNaN(Element.slice(1)) == false){//the input is a user ID
                //check to see if its a valid user ID
                if(parseInt(Element.slice(1), 10) - 1 < Member_Data.Total_Members){
                    if(parseInt(Element.slice(1), 10) < 10){
                        participants[participants.length] = 'u00' + parseInt(Element.slice(1), 10);
                    }else if(parseInt(Element.slice(1), 10) < 100){
                        participants[participants.length] = 'u0' + parseInt(Element.slice(1), 10);
                    }else{
                        participants[participants.length] = 'u' + parseInt(Element.slice(1), 10);
                    }
                }else{
                    message.channel.send('Unable to determine input `'  + Element + '`');
                    return;
                }
            }else{
                loop = 0;
                check = false;
                while(loop < menu.length){
                    inloop = 0;
                    while(inloop < menu[loop].split('|')[1].split(',').length){
                        if(menu[loop].split('|')[1].split(',')[inloop] == Element){
                            participants[participants.length] = menu[loop].split('|')[0];
                            check = true;
                        }
                        inloop++;
                    }
                    loop++;
                }
                if(check == false){
                    message.channel.send('Unable to determine input `' + Element + '`')
                }
            }
        })
        game_obj.participants = participants;
        if(game_obj.isSolo == true){
            var game_file_obj_solo = {
                date: game_obj.date,
                title: null,
                isSolo: game_obj.isSolo,
                winner: null,
                runner_up: null,
                first_blood: null,
                first_death: null,
                videolink: null,
                participants: []
            }
            game_obj.participants.forEach(Element => {
                game_file_obj_solo.participants[game_file_obj_solo.participants.length] = {
                    id: Element,
                    kills: null,
                    died: null
                }
            })
            Enter_game_winner(message, game_obj, game_file_obj_solo);
        }else{
            var game_file_obj_team = {
                date: game_obj.date,
                title: null,
                isSolo: game_obj.isSolo,
                winner: null,
                runner_up: null,
                first_blood: null,
                first_death: null,
                videolink: null,
                teams: [],
                participants: []
            }
            Enter_game_teams(message, game_obj, game_file_obj_team);
        }
    })
}

async function Enter_game_teams(message, game_obj, game_file_obj){
    //function called by Enter_game_participants
    //get a list of teams in this game
    //pass on to Enter_game_team_members

    console.log(game_obj);
    const q_Embed = new Discord.MessageEmbed()
        .setTitle('What teams played in the match?')
        .setColor('c711dd')
        .setDescription('respond with color names\nblack\ndark_blue\ndark_green\ndark_aqua\ndark_red\ndark_purple - purple\ngold\ngray\ndark_gray\nblue\ngreen\naqua\nred\nmagenta - light_purple\nyellow\nwhite')
        .setAuthor('@' + message.author.username, 'https://i.imgur.com/857yijB.png');
    const question = await message.channel.send(q_Embed);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            question.delete();
            return;
        }
        var teams = [];
        var reply = collected.first().toString().toLowerCase().split(' ');
        if(reply.length < 2){
            message.channel.send('There must be at least 2 teams.');
            return;
        }
        const Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
        reply.forEach(Element => {
            if(Element == 'black'){
                teams[teams.length] = 'Black';
            }else if(Element == 'dark_blue' || Element == 'd_blue'){
                teams[teams.length] = 'Dark Blue';
            }else if(Element == 'dark_green' || Element == 'd_green'){
                teams[teams.length] = 'Dark Green';
            }else if(Element == 'dark_aqua' || Element == 'd_aqua'){
                teams[teams.length] = 'Dark Aqua';
            }else if(Element == 'dark_red' || Element == 'd_red'){
                teams[teams.length] = 'Dark Red';
            }else if(Element == 'dark_purple' || Element == 'd_purple' || Element == 'purple'){
                teams[teams.length] = 'Purple';
            }else if(Element == 'gold' || Element == 'orange'){
                teams[teams.length] = 'Orange';
            }else if(Element == 'gray' || Element == 'grey'){
                teams[teams.length] = 'Gray';
            }else if(Element == 'dark_gray' || Element == 'dark_grey' || Element == 'd_gray' || Element == 'd_grey'){
                teams[teams.length] = 'Dark Gray';
            }else if(Element == 'blue'){
                teams[teams.length] = 'Blue';
            }else if(Element == 'green'){
                teams[teams.length] = 'Green';
            }else if(Element == 'aqua'){
                teams[teams.length] = 'Aqua';
            }else if(Element == 'red'){
                teams[teams.length] = 'Red';
            }else if(Element == 'light_purple' || Element == 'l_purple' || Element == 'magenta' || Element == 'pink'){
                teams[teams.length] = 'Magenta';
            }else if(Element == 'yellow'){
                teams[teams.length] = 'Yellow';
            }else if(Element == 'white'){
                teams[teams.length] = 'White';
            }else{
                message.channel.send('Unable to determine input `' + Element + '`');
                return;
            }
        })
        if(teams.length > (game_obj.participants.length / 2)){
            message.channel.send('Error, too many teams. There must be at least two players per team.');
            return;
        }
        game_file_obj.teams = teams;
        game_obj.participants.forEach(Element => {
            game_file_obj.participants[game_file_obj.participants.length] = {
                id: Element,
                team: null,
                kills: null,
                died: null
            }
        })
        Enter_game_team_participants(message, game_obj, game_file_obj, 0);    
    })
}

async function Enter_game_team_participants(message, game_obj, game_file_obj, pos){
    //function called by Enter_game_teams
    //get a list of teams in this game
    //pass on to Enter_game_team_members

    console.log(game_obj);
    const q_Embed = new Discord.MessageEmbed()
        .setTitle('Who was in ' + game_file_obj.teams[pos] + ' Team')
        .setColor('c711dd')
        .setAuthor('@' + message.author.username, 'https://i.imgur.com/857yijB.png');
    const question = await message.channel.send(q_Embed);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            question.delete();
            return;
        }
        var participants = [];
        var reply = collected.first().toString().toLowerCase().split(' ');
        if(reply.length < 2){
            message.channel.send('There must be at least 2 players per team.');
            return;
        }
        const menu = fs.readFileSync('./menu.txt').toString().split('\n');
        var loop = 0;
        var inloop = 0;
        var check = false;
        reply.forEach(Element => {
            loop = 0;
            check = false;
            while(loop < menu.length){
                inloop = 0;
                while(inloop < menu[loop].split('|')[1].split(',').length){
                    if(menu[loop].split('|')[1].split(',')[inloop] == Element){
                        check = true;
                        participants[participants.length] = menu[loop].split('|')[0];
                    }
                    inloop++;
                }
                loop++;
            }
            if(check == false){
                message.channel.send('Unable to determine input `' + Element + '`');
                return;
            }
        })
        var check = false;
        participants.forEach(Element => {
            loop = 0;
            check = false;
            while(loop < game_file_obj.participants.length){
                if(game_file_obj.participants[loop].id == Element){
                    if(game_file_obj.participants[loop].team != null){
                        message.channel.send('Error. Can not add one person to two different teams');
                        return;
                    }
                    check = true;
                    game_file_obj.participants[loop].team = game_file_obj.teams[pos];
                    loop = game_file_obj.participants.length;
                }
                loop++
            }
            if(check == false){
                message.channel.send('Error. Can not add a user to a team who did not play in the game.');
                return;
            }
        })
        if(pos == game_file_obj.teams.length - 2){
            game_file_obj.participants.forEach(Element => {
                if(Element.team == null){
                    Element.team = game_file_obj.teams[pos + 1];
                }
            })
            Enter_game_winner_team(message, game_obj, game_file_obj)
        }else{
            Enter_game_team_participants(message, game_obj, game_file_obj, pos + 1);
        }
    })
}

async function Enter_game_winner_team(message, game_obj, game_file_obj){
    console.log(game_obj)
    console.log(game_file_obj)

    const q_Embed = new Discord.MessageEmbed()
        .setTitle('Who won?')
        .setDescription('Reply with the team color\nIf the color is two words (ex: dark blue) use an underscore: dark_blue')
        .setColor('c711dd')
        .setAuthor('@' + message.author.username, 'https://i.imgur.com/857yijB.png');
    const question = await message.channel.send(q_Embed);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            question.delete();
            return;
        }
        var win_in = collected.first().toString().toLowerCase();
        if(win_in.split(' ').length != 1){
            message.channel.send('Error. Reply must be one word.')
            return;
        }
        var winner = null;
        if(win_in == 'black' && game_file_obj.teams.includes('Black')){
            winner = 'Black';
        }else if(win_in == 'dark_blue' && game_file_obj.teams.includes('Dark Blue')){
            winner = 'Dark Blue';
        }else if(win_in == 'dark_green' && game_file_obj.teams.includes('Dark Green')){
            winner = 'Dark Green';
        }else if(win_in == 'dark_aqua' && game_file_obj.teams.includes('Dark Aqua')){
            winner = 'Dark Aqua';
        }else if(win_in == 'dark_red' && game_file_obj.teams.includes('Dark Red')){
            winner = 'Dark Red';
        }else if(win_in == 'dark_purple' && game_file_obj.teams.includes('Purple') || win_in == 'purple' && game_file_obj.teams.includes('Purple')){
            winner = 'Purple';
        }else if(win_in == 'gold' && game_file_obj.teams.includes('Orange') || win_in == 'orange' && game_file_obj.teams.includes('Orange')){
            winner = 'Orange';
        }else if(win_in == 'gray' && game_file_obj.teams.includes('Gray') || win_in == 'grey' && game_file_obj.teams.includes('Gray')){
            winner = 'Gray';
        }else if(win_in == 'dark_gray' && game_file_obj.teams.includes('Dark Gray') || win_in == 'dark_grey' && game_file_obj.teams.includes('Dark Gray')){
            winner = 'Dark Gray';
        }else if(win_in == 'blue' && game_file_obj.teams.includes('Blue')){
            winner = 'Blue';
        }else if(win_in == 'green' && game_file_obj.teams.includes('Green')){
            winner = 'Green';
        }else if(win_in == 'aqua' && game_file_obj.teams.includes('Aqua')){
            winner = 'Aqua';
        }else if(win_in == 'red' && game_file_obj.teams.includes('Red')){
            winner = 'Red';
        }else if(win_in == 'light_purple' && game_file_obj.teams.includes('Magenta') || win_in == 'magenta' && game_file_obj.teams.includes('Magenta') || win_in == 'pink' && game_file_obj.teams.includes('Magenta')){
            winner = 'Magenta';
        }else if(win_in == 'yellow' && game_file_obj.teams.includes('Yellow')){
            winner = 'Yellow';
        }else if(win_in == 'white' && game_file_obj.teams.includes('White')){
            winner = 'White';
        }else{
            message.channel.send('Unable to determine input `' + win_in + '`');
            return;
        }
        if(winner == null){
            return;
        }
        game_file_obj.winner = winner;
        game_file_obj.participants.forEach(Element => {//go through participants, if they weren't on the winning team. set their died status to true
            if(Element.team != winner){
                Element.died = true;
            }
        })
        if(game_file_obj.teams.length == 2){//if there are only two teams, we can already tell who the runner-up team is
            //set game_file_obj.runner_up to the other team
            if(winner == game_file_obj.teams[0]){
                game_file_obj.runner_up = game_file_obj.teams[1];
            }else{
                game_file_obj.runner_up = game_file_obj.teams[0];
            }
            Enter_game_firstblood(message, game_obj, game_file_obj)
        }else{
            Enter_game_team_runnerup(message, game_obj, game_file_obj)
        }
    })
    
}

async function Enter_game_team_runnerup(message, game_obj, game_file_obj){
    console.log(game_obj)
    console.log(game_file_obj)

    const q_Embed = new Discord.MessageEmbed()
        .setTitle('Who was the Runner-up?')
        .setDescription('Reply with the team color\nIf the color is two words (ex: dark blue) use an underscore: dark_blue')
        .setColor('c711dd')
        .setAuthor('@' + message.author.username, 'https://i.imgur.com/857yijB.png');
    const question = await message.channel.send(q_Embed);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            question.delete();
            return;
        }
        var runner_in = collected.first().toString().toLowerCase();
        if(runner_in.split(' ').length != 1){
            message.channel.send('Error. Reply must be one word.')
            return;
        }
        var runner_up = null;
        if(runner_in == 'black' && game_file_obj.teams.includes('Black')){
            runner_up = 'Black';
        }else if(runner_in == 'dark_blue' && game_file_obj.teams.includes('Dark Blue')){
            runner_up = 'Dark Blue';
        }else if(runner_in == 'dark_green' && game_file_obj.teams.includes('Dark Green')){
            runner_up = 'Dark Green';
        }else if(runner_in == 'dark_aqua' && game_file_obj.teams.includes('Dark Aqua')){
            runner_up = 'Dark Aqua';
        }else if(runner_in == 'dark_red' && game_file_obj.teams.includes('Dark Red')){
            runner_up = 'Dark Red';
        }else if(runner_in == 'dark_purple' && game_file_obj.teams.includes('Purple') || runner_in == 'purple' && game_file_obj.teams.includes('Purple')){
            runner_up = 'Purple';
        }else if(runner_in == 'gold' && game_file_obj.teams.includes('Orange') || runner_in == 'orange' && game_file_obj.teams.includes('Orange')){
            runner_up = 'Orange';
        }else if(runner_in == 'gray' && game_file_obj.teams.includes('Gray') || runner_in == 'grey' && game_file_obj.teams.includes('Gray')){
            runner_up = 'Gray';
        }else if(runner_in == 'dark_gray' && game_file_obj.teams.includes('Dark Gray') || runner_in == 'dark_grey' && game_file_obj.teams.includes('Dark Gray')){
            runner_up = 'Dark Gray';
        }else if(runner_in == 'blue' && game_file_obj.teams.includes('Blue')){
            runner_up = 'Blue';
        }else if(runner_in == 'green' && game_file_obj.teams.includes('Green')){
            runner_up = 'Green';
        }else if(runner_in == 'aqua' && game_file_obj.teams.includes('Aqua')){
            runner_up = 'Aqua';
        }else if(runner_in == 'red' && game_file_obj.teams.includes('Red')){
            runner_up = 'Red';
        }else if(runner_in == 'light_purple' && game_file_obj.teams.includes('Magenta') || runner_in == 'magenta' && game_file_obj.teams.includes('Magenta') || runner_in == 'pink' && game_file_obj.teams.includes('Magenta')){
            runner_up = 'Magenta';
        }else if(runner_in == 'yellow' && game_file_obj.teams.includes('Yellow')){
            runner_up = 'Yellow';
        }else if(runner_in == 'white' && game_file_obj.teams.includes('White')){
            runner_up = 'White';
        }else{
            message.channel.send('Unable to determine input `' + win_in + '`');
            return;
        }
        if(runner_up == null){
            return;
        }
        game_file_obj.runner_up = runner_up;
        Enter_game_firstblood(message, game_obj, game_file_obj)
    })
}

async function Enter_game_winner(message, game_obj, game_file_obj){
    console.log(game_obj, game_file_obj)
    const q_Embed = new Discord.MessageEmbed()
        .setTitle('Who won?')
        .setColor('c711dd')
        .setAuthor('@' + message.author.username, 'https://i.imgur.com/857yijB.png');
    const question = await message.channel.send(q_Embed);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            question.delete();
            return;
        }
        var win_in = collected.first().toString().toLowerCase();
        if(win_in.split(' ').length > 1){
            message.channel.send('Improper input. There can only be one winner in a solo game.');
            return;
        }
        const menu = fs.readFileSync('./menu.txt').toString().split('\n');
        var winner = null;
        var loop = 0;
        menu.forEach(Element => {
            loop = 0;
            while(loop < Element.split('|')[1].split(',').length){
                if(Element.split('|')[1].split(',')[loop] == win_in){
                    winner = Element.split('|')[0];
                }
                loop++;
            }
        })
        if(winner == null){
            message.channel.send('Unable to determine input `' + win_in + '`');
            return;
        }
        game_file_obj.winner = winner;
        game_file_obj.participants.forEach(Element => {
            if(Element.id != winner){
                Element.died = true;
            }else{
                Element.died = false;
            }
        })
        Enter_game_runnerup(message, game_obj, game_file_obj);
    })
}

async function Enter_game_runnerup(message, game_obj, game_file_obj){
    console.log(game_obj, game_file_obj)
    const q_Embed = new Discord.MessageEmbed()
        .setTitle('Who was the Runner-up?')
        .setColor('c711dd')
        .setAuthor('@' + message.author.username, 'https://i.imgur.com/857yijB.png');
    const question = await message.channel.send(q_Embed);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            question.delete();
            return;
        }
        var win_in = collected.first().toString().toLowerCase();
        if(win_in.split(' ').length > 1){
            message.channel.send('Improper input. There can only be one winner in a solo game.');
            return;
        }
        const menu = fs.readFileSync('./menu.txt').toString().split('\n');
        var runnerup = null;
        var loop = 0;
        menu.forEach(Element => {
            loop = 0;
            while(loop < Element.split('|')[1].split(',').length){
                if(Element.split('|')[1].split(',')[loop] == win_in){
                    runnerup = Element.split('|')[0];
                }
                loop++;
            }
        })
        if(runnerup == null){
            message.channel.send('Unable to determine input `' + win_in + '`');
            return;
        }
        game_file_obj.runner_up = runnerup;
        Enter_game_firstblood(message, game_obj, game_file_obj);
    })
}

async function Enter_game_firstblood(message, game_obj, game_file_obj){
    console.log(game_obj, game_file_obj)
    const q_Embed = new Discord.MessageEmbed()
        .setTitle('Who got the first kill of the game?')
        .setDescription('If there was no pvp kills, reply wih the world "null"')
        .setColor('c711dd')
        .setAuthor('@' + message.author.username, 'https://i.imgur.com/857yijB.png');
    const question = await message.channel.send(q_Embed);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            question.delete();
            return;
        }
        var blood_in = collected.first().toString().toLowerCase();
        if(blood_in.split(' ').length > 1){
            message.channel.send('Improper input. There can only be one first kill');
            return;
        }
        const menu = fs.readFileSync('./menu.txt').toString().split('\n');
        var first_blood = null;
        var loop = 0;
        menu.forEach(Element => {
            loop = 0;
            while(loop < Element.split('|')[1].split(',').length){
                if(Element.split('|')[1].split(',')[loop] == blood_in){
                    first_blood = Element.split('|')[0];
                }
                loop++;
            }
        })
        if(first_blood == null && blood_in != 'null'){
            message.channel.send('Unable to determine input `' + blood_in + '`');
            return;
        }
        if(blood_in == 'null'){
            first_blood = null;
        }
        game_file_obj.first_blood = first_blood;
        Enter_game_firstdeath(message, game_obj, game_file_obj);
    })
}

async function Enter_game_firstdeath(message, game_obj, game_file_obj){
    console.log(game_obj, game_file_obj)
    const q_Embed = new Discord.MessageEmbed()
        .setTitle('Who was the first to die in the game?')
        .setColor('c711dd')
        .setAuthor('@' + message.author.username, 'https://i.imgur.com/857yijB.png');
    const question = await message.channel.send(q_Embed);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            question.delete();
            return;
        }
        var death_in = collected.first().toString().toLowerCase();
        if(death_in.split(' ').length > 1){
            message.channel.send('Improper input. There can only be one first death');
            return;
        }
        const menu = fs.readFileSync('./menu.txt').toString().split('\n');
        var first_death = null;
        var loop = 0;
        menu.forEach(Element => {
            loop = 0;
            while(loop < Element.split('|')[1].split(',').length){
                if(Element.split('|')[1].split(',')[loop] == death_in){
                    first_death = Element.split('|')[0];
                }
                loop++;
            }
        })
        if(first_death == null){
            message.channel.send('Unable to determine input `' + death_in + '`');
            return;
        }
        game_file_obj.first_death = first_death;
        game_file_obj.participants.forEach(Element => {
            if(Element.id == first_death){
                Element.died = true;
            }
        })
        if(game_obj.isSolo == true){
            Enter_game_kills(message, game_obj, game_file_obj, 0);
        }else{
            Enter_game_deaths(message, game_obj, game_file_obj, 0);
        }
        
    })
}

async function Enter_game_deaths(message, game_obj, game_file_obj, pos){
    if(game_file_obj.participants[pos].died == true){
        //this player has already been determined to be dead
        //no need to ask if they died
        if(game_file_obj.participants.length == pos + 1){//all users have been checked for deaths
            Enter_game_kills(message, game_obj, game_file_obj, pos);
        }else{
            Enter_game_deaths(message, game_obj, game_file_obj, pos + 1);//check the next user
        }
    }else{//the user's died porperty is null. Check to see if they died in the game
        const Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
        const q_Embed = new Discord.MessageEmbed()
            .setTitle('Did ' + Member_Data.Member_Objects[parseInt(game_obj.participants[pos].slice(1), 10) - 1].alias + ' survive to the end of the game?')
            .setDescription('Yes - y\nNo - n')
            .setColor('c711dd')
            .setAuthor('@' + message.author.username, 'https://i.imgur.com/857yijB.png');
        const question = await message.channel.send(q_Embed);
        const filter = m => message.content.author == message.channel.author;
        const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
        collector.on('end', collected => {
            if(collected.size == 0){
                message.channel.send('Operation timed out.');
                question.delete();
                return;
            }
            var died = null;
            var reply = collected.first().toString().toLowerCase();
            if(reply == 'y' || reply == 'yes'){
                died = false;
            }else if(reply == 'n' || reply == 'no'){
                died = true;
            }else{
                message.channel.send('Unable to determine `' + reply + '`. Try `s!o help enter`');
                return
            }
            game_file_obj.participants[pos].died = died;
            if(game_obj.participants.length == pos + 1){
                Enter_game_kills(message, game_obj, game_file_obj, 0);
            }else{
                Enter_game_deaths(message, game_obj, game_file_obj, pos + 1);
            }
        })
    }
}

async function Enter_game_kills(message, game_obj, game_file_obj, pos){
    console.log(game_obj, game_file_obj)
    const Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    var pronouns = null
    if(Member_Data.Member_Objects[parseInt(game_obj.participants[pos].slice(1), 10)].pronouns == 'm'){
        pronouns = 'he';
    }else if(Member_Data.Member_Objects[parseInt(game_obj.participants[pos].slice(1), 10)].pronouns == 'f'){
        pronouns = 'she';
    }else{
        pronouns = 'they';
    }
    const q_Embed = new Discord.MessageEmbed()
        .setTitle('How many kills did ' + Member_Data.Member_Objects[parseInt(game_obj.participants[pos].slice(1), 10) - 1].alias + ' get?')
        .setDescription('reply with a whole number\nIf ' + pronouns + ' got no kills, reply with "0"')
        .setColor('c711dd')
        .setAuthor('@' + message.author.username, 'https://i.imgur.com/857yijB.png');
    const question = await message.channel.send(q_Embed);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            question.delete();
            return;
        }
        var reply = parseInt(collected.first(), 10);
        if(isNaN(reply)){
            message.channel.send('Reply must be a whole number.');
            return;
        }
        game_file_obj.participants[pos].kills = reply;
        if(game_obj.participants.length == (pos + 1)){
            Enter_game_title(message, game_obj, game_file_obj);
        }else{
            Enter_game_kills(message, game_obj, game_file_obj, pos + 1);
        }
    })
}

async function Enter_game_title(message, game_obj, game_file_obj){
    console.log(game_obj, game_file_obj);
    const q_Embed = new Discord.MessageEmbed()
        .setTitle('What would you like to call this game?')
        .setDescription('This can be changed later')
        .setColor('c711dd')
        .setAuthor('@' + message.author.username, 'https://i.imgur.com/857yijB.png');
    const question = await message.channel.send(q_Embed);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            question.delete();
            return;
        }
        
        var title = collected.first().toString();
        game_obj.title = title;
        game_file_obj.title = title;
        Enter_game_end(message, game_obj, game_file_obj);
    })
}

function Enter_game_end(message, game_obj, game_file_obj){
    console.log(game_obj, game_file_obj);
    var Game_Data = JSON.parse(fs.readFileSync('./Game_Data_Main.json', 'utf8'));
    Game_Data.Game_History[Game_Data.Game_History.length] = game_obj;
    Game_Data.Total_Games = Game_Data.Total_Games + 1;
    fs.writeFileSync('./Game_Data_Main.json', JSON.stringify(Game_Data, null, 4), 'utf8');
    fs.writeFileSync('./Game_Data/' + game_obj.id + '.json', JSON.stringify(game_file_obj, null, 4), 'utf8');
    Print_Game_Card(message, game_obj.id)
}

async function Edit_profile_data(message){
    //a user wants to make an edit to their profile.
    //Determine which user this is and then determine what they want to edit
    var Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    var member_obj = null;
    Member_Data.Member_Objects.forEach(Element => {
        if(Element.discord == message.author.id){
            member_obj = Element
        }
    })
    if(member_obj == null){
        message.channel.send('Error, unable to finder user <@' + message.author + '> on file.\nTry `s!o help edit profile` or `s!o join`');
        return;
    }
    const menu_embed = new Discord.MessageEmbed()
        .setTitle('Loading...');
    const menu_msg = await message.channel.send(menu_embed);
    //load a reaction menu
    const emojis = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟'];
    //option 1 - name
    //option 2 - alias
    //option 3 - pronounse
    //option 4 - team
    //option 5 - image
    //option 6 - notif
    //option 7 - timezone
    var loop = 0;
    while(loop < 7){
        await menu_msg.react(emojis[loop]);
        loop++;
    }
    menu_embed
        .setTitle('Profile Settings')
        .setColor(Member_Data.Team_Objects[parseInt(member_obj.team.slice(1), 10) - 1].color)
        .addField('Chose one of the following with a reaction...', '1⃣ - Name\n2⃣ - MineCraft Username\n3⃣ - Pronouns\n4⃣ - Faction\n5⃣ - image\n6⃣ - UHC Notifications\n7⃣ - timezone');
    menu_msg.edit(menu_embed);
    const filter = (reaction, user) => {
        return['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟'].includes(reaction.emoji.name) && user.id === message.author.id;
    }//set up a reaction collector to get the users answer to the menu
    const selection = await menu_msg.awaitReactions(filter, {max: 1, time: 60000})
        .then(collected => {
            if(collected.size == 0){
                message.channel.send('Operation timed out.');
                menu_msg.delete();
                return;
            }
            const reaction = collected.first();//take the returned message and pass forward to the appropriate function to continue the process
            if(reaction.emoji.name === '1⃣'){
                Edit_profile_name(message, member_obj);
                menu_msg.delete();
            }else if(reaction.emoji.name === '2⃣'){
                Edit_profile_alias(message, member_obj);
                menu_msg.delete();
            }else if(reaction.emoji.name === '3⃣'){
                Edit_profile_pronouns(message, member_obj);
                menu_msg.delete();
            }else if(reaction.emoji.name === '4⃣'){
                Edit_profile_faction(message, member_obj);
                menu_msg.delete();
            }else if(reaction.emoji.name === '5⃣'){
                Edit_profile_image(message, member_obj);
                menu_msg.delete();
            }else if(reaction.emoji.name === '6⃣'){
                Edit_profile_notifs(message, member_obj);
                menu_msg.delete();
            }else if(reaction.emoji.name === '7⃣'){
                Edit_profile_timezone(message, member_obj);
                menu_msg.delete();
            }else{
                message.channel.send('Invalid input "' + reaction + '"');
                return;
            }
        })
}

async function Edit_profile_name(message, user_obj){
    //edit the name for a user
    var Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    const question = new Discord.MessageEmbed()
        .setTitle('What should I call you?')
        .setColor(Member_Data.Team_Objects[parseInt(user_obj.team.slice(1), 10) - 1].color)
        .setDescription('your name is currently set to "' + user_obj.name + '"');
    const prompt = await message.channel.send(question);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });//create a message collector to get the reply
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            prompt.delete();
            return;
        }
        var reply = collected.first().toString();
        if(reply.length > 200){//check to make sure the answer isnt too long
            message.channel.send('Your name must be less than 200 characters');
            return;
        }
        user_obj.name = reply;
        Member_Data.Member_Objects[parseInt(user_obj.id.slice(1), 10) - 1] = user_obj;
        message.channel.send('Your name has been set to `' + reply + '`');
        fs.writeFileSync('./Member_Data_Main.json', JSON.stringify(Member_Data, null, 4), 'utf8');
    })
}

async function Edit_profile_alias(message, user_obj){
    //edit the alias for a user
    var Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    const question = new Discord.MessageEmbed()
        .setTitle('What is your MineCraft username?')
        .setColor(Member_Data.Team_Objects[parseInt(user_obj.team.slice(1), 10) - 1].color)
        .setDescription('your MineCraft username is currently set to "' + user_obj.alias + '"');
    const prompt = await message.channel.send(question);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });//create a message collector to get the reply
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            prompt.delete();
            return;
        }
        var reply = collected.first().toString();
        if(reply.length > 16){//check to make sure the answer isnt too long
            message.channel.send('Your username must be less than 17 characters');
            return;
        }
        user_obj.alias = reply;
        Member_Data.Member_Objects[parseInt(user_obj.id.slice(1), 10) - 1] = user_obj;
        message.channel.send('Your MineCraft username has been set to `' + reply + '`');
        fs.writeFileSync('./Member_Data_Main.json', JSON.stringify(Member_Data, null, 4), 'utf8');
    })
}

async function Edit_profile_pronouns(message, user_obj){
    //edit the pronouns for a user
    var Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    const question = new Discord.MessageEmbed()
        .setTitle('What are your pronouns?')
        .setColor(Member_Data.Team_Objects[parseInt(user_obj.team.slice(1), 10) - 1].color)
        .setDescription('reply with one of the following\nhe/him - m\nshe/her - f\nthey/them - n');
    const prompt = await message.channel.send(question);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });//create a message collector to get the reply
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            prompt.delete();
            return;
        }
        var reply = collected.first().toString().toLowerCase();
        if(reply == 'm'){
            user_obj.pronouns = 'm'
        }else if(reply == 'f'){
            user_obj.pronouns = 'f'
        }else if(reply == 'n'){
            user_obj.pronouns = 'n'
        }else{
            message.channel.send('Unable to determine the input `' + reply + '`');
            return;
        }
        Member_Data.Member_Objects[parseInt(user_obj.id.slice(1), 10) - 1] = user_obj;
        message.channel.send('Your MineCraft username has been set to `' + reply + '`');
        fs.writeFileSync('./Member_Data_Main.json', JSON.stringify(Member_Data, null, 4), 'utf8');
    })
}

async function Edit_profile_faction(message, user_obj){
    //edit the faction for a user
    var Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    const question = new Discord.MessageEmbed()
        .setTitle('Loading...');
    const prompt = await message.channel.send(question);
    const emojis = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟'];
    var loop = 0;
    while(loop < 10 && loop < Member_Data.Team_Objects.length){
        await prompt.react(emojis[loop]);
        loop++;
    }
    var body = [];
    loop = 0;
    while(loop < Member_Data.Team_Objects.length && loop < 10){
        body[body.length] = emojis[loop] + ' - ' + Member_Data.Team_Objects[loop].name;
        loop++;
    }
    question
        .setTitle('Chose a team')
        .setColor(Member_Data.Team_Objects[parseInt(user_obj.team.slice(1), 10) - 1].color)
        .addField('React with a number...', body.join('\n'));
    prompt.edit(question)
    const filter = (reaction, user) => {//set up a filter for valid reactions. Must be one of the following emojis and must be from the user who initiated the search
        return ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟'].includes(reaction.emoji.name) && user.id === message.author.id;
    }
    const selection = await prompt.awaitReactions(filter, {max: 1, time: 60000})
        .then(collected => {
            if(collected.size == 0){
                message.channel.send('Operation timed out');
                question.delete();
                return;
            }
            const reaction = collected.first();
            var team_selected = null;
            if(reaction.emoji.name === '1⃣' && Member_Data.Team_Objects.length > 0){
                team_selected = 't001';
            }else if(reaction.emoji.name === '2⃣' && Member_Data.Team_Objects.length > 1){
                team_selected = 't002';
            }else if(reaction.emoji.name === '3⃣' && Member_Data.Team_Objects.length > 2){
                team_selected = 't003';
            }else if(reaction.emoji.name === '4⃣' && Member_Data.Team_Objects.length > 3){
                team_selected = 't004';
            }else if(reaction.emoji.name === '5⃣' && Member_Data.Team_Objects.length > 4){
                team_selected = 't005';
            }else if(reaction.emoji.name === '6⃣' && Member_Data.Team_Objects.length > 5){
                team_selected = 't006';
            }else if(reaction.emoji.name === '7⃣' && Member_Data.Team_Objects.length > 6){
                team_selected = 't007';
            }else if(reaction.emoji.name === '8⃣' && Member_Data.Team_Objects.length > 7){
                team_selected = 't008';
            }else if(reaction.emoji.name === '9⃣' && Member_Data.Team_Objects.length > 8){
                team_selected = 't009';
            }else if(reaction.emoji.name === '🔟' && Member_Data.Team_Objects.length > 9){
                team_selected = 't010';
            }
            if(team_selected == null){
                message.channel.send('Invalid selection.');
                return;
            }
            user_obj.team = team_selected;
            Member_Data.Member_Objects[parseInt(user_obj.id.slice(1), 10) - 1] = user_obj;
            message.channel.send('Your team has been set to **' + Member_Data.Team_Objects[parseInt(team_selected.slice(1), 10) - 1].name + '**');
            fs.writeFileSync('./Member_Data_Main.json', JSON.stringify(Member_Data, null, 4), 'utf8');
        })
}

async function Edit_profile_image(message, user_obj){
    //edit the thumbnail image for a user
    var Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    const question = new Discord.MessageEmbed()
        .setTitle('What do you want your new image to be?')
        .setColor(Member_Data.Team_Objects[parseInt(user_obj.team.slice(1), 10) - 1].color)
        .setDescription('reply with a direct link image to a png\n\nIf you need help, try "s!o help edit profile image"');
    const prompt = await message.channel.send(question);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });//create a message collector to get the reply
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            prompt.delete();
            return;
        }
        var reply = collected.first().toString()
        if(reply.startsWith('https://') && reply.includes('.png') || reply.startsWith('https://') && reply.includes('.gif')){
            user_obj.img = reply;
        }else{
            message.channel.send('Invalid response. Reply must be a direct link to a .png or a .gif file');
            return;
        }
        Member_Data.Member_Objects[parseInt(user_obj.id.slice(1), 10) - 1] = user_obj;
        message.channel.send('Your thumbnail  has been set to \n' + reply);
        fs.writeFileSync('./Member_Data_Main.json', JSON.stringify(Member_Data, null, 4), 'utf8');
    })
}

async function Edit_profile_notifs(message, user_obj){
    //edit the uhc notifications for a user
    var Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    const question = new Discord.MessageEmbed()
        .setTitle('Do you want UHC Notifications?')
        .setColor(Member_Data.Team_Objects[parseInt(user_obj.team.slice(1), 10) - 1].color)
        .setDescription('reply with one of the following\nyes - y\nno - n');
    const prompt = await message.channel.send(question);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });//create a message collector to get the reply
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            prompt.delete();
            return;
        }
        var reply = collected.first().toString().toLowerCase();
        if(reply == 'y' || reply == 'yes'){
            user_obj.notif = true
            message.channel.send('Your UHC notifications have been turned on!');
        }else if(reply == 'n' || reply == 'no'){
            user_obj.notif = false
            message.channel.send('Your UHC notifications have been turned off!');
        }else{
            message.channel.send('Unable to determine the input `' + reply + '`');
            return;
        }
        Member_Data.Member_Objects[parseInt(user_obj.id.slice(1), 10) - 1] = user_obj;
        fs.writeFileSync('./Member_Data_Main.json', JSON.stringify(Member_Data, null, 4), 'utf8');
    })
}

async function Edit_profile_timezone(message, user_obj){
    //edit the timezone for a user
    var Member_Data = JSON.parse(fs.readFileSync('./Member_Data_Main.json', 'utf8'));
    const question = new Discord.MessageEmbed()
        .setTitle('What is your timezone?')
        .setColor(Member_Data.Team_Objects[parseInt(user_obj.team.slice(1), 10) - 1].color)
        .setDescription('reply with your timezone as a positive or negative number in how many hours ahead or behind you are from UTC\nExample: -4 (4 hours behind UTC)');
    const prompt = await message.channel.send(question);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000 });//create a message collector to get the reply
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            prompt.delete();
            return;
        }
        var reply = collected.first().toString().toLowerCase();
        if(isNaN(reply)){
            message.channel.send('Reply must be an integer.');
            return;
        }
        reply = parseInt(reply, 10);
        if(reply < -12 || reply > 12){
            message.channel.send('Your timezone must be between UTC-12 and UTC+12. Check to see what your timezone is in relation to UTC.');
            return;
        }
        user_obj.timezone = reply;
        Member_Data.Member_Objects[parseInt(user_obj.id.slice(1), 10) - 1] = user_obj;
        if(reply > -1){
            message.channel.send('Your timezone has been set to `UTC+' + reply.toString() + '`');
        }else{
            message.channel.send('Your timezone has been set to `UTC' + reply.toString() + '`');
        }
        
        fs.writeFileSync('./Member_Data_Main.json', JSON.stringify(Member_Data, null, 4), 'utf8');
    })
}

async function Edit_game_data(message){
    const in_str = message.content.toString().toLowerCase().split(' ')
    if(in_str.length != 4){
        message.channel.send('Improper command format. Try `s!o help edit game`');
        return;
    }
    let g_ID_in = message.content.toString().split(' ')[3].toLowerCase();
    const Game_Data = JSON.parse(fs.readFileSync('./Game_Data_Main.json', 'utf8'));
    var game_number = null;
    console.log('Game ID input: ' + g_ID_in);
    if(isNaN(g_ID_in) == false){
        game_number = parseInt(g_ID_in, 10);
    }else{
        game_number = parseInt(g_ID_in.slice(1), 10);
    }
    if(isNaN(game_number)){
        message.channel.send('Invalid game ID `' + game_number + '`');
        return;
    }
    var gID = null;
    if(game_number < 10){
        gID = 'g00' + game_number.toString();
    }else if(game_number < 100){
        gID = 'g0'+ game_number.toString();
    }else{
        gID = 'g' + game_number.toString();
    }
    if(game_number > Game_Data.Total_Games){
        message.channel.send('The game ID `' + gID + '` is not found in the archive. Try `s!o history`');
        return;
    }
    //game ID has been obtained and is a valid game ID
    var game_obj = Game_Data.Game_History[game_number - 1];
    console.log(game_obj);
    const menu_embed = new Discord.MessageEmbed()
        .setTitle('Loading...');
    const menu_msg = await message.channel.send(menu_embed);
    const emoji = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟'];
    //option 1 - title
    //option 2 - videolink
    var loop = 0;
    while(loop < 2){
        await menu_msg.react(emoji[loop]);
        loop++;
    }
    menu_embed
        .setTitle('Game ' + gID + ' Data')
        .setDescription('Chose one of the following with a reaction...\n1⃣ - Game Title\n2⃣ - Videolink');
    menu_msg.edit(menu_embed);
    const filter = (reaction, user) => {
        return['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟'].includes(reaction.emoji.name) && user.id === message.author.id;
    }//set up a reaction collector to get the users answer to the menu
    const selection = await menu_msg.awaitReactions(filter, {max: 1, time: 60000})
        .then(collected => {
            if(collected.size == 0){
                message.channel.send('Operation timed out.');
                menu_msg.delete();
                return;
            }
            const reaction = collected.first();//take the returned message and pass forward to the appropriate function to continue the process
            if(reaction.emoji.name === '1⃣'){
                Edit_game_title(message, game_obj);
                menu_msg.delete();
            }else if(reaction.emoji.name === '2⃣'){
                Edit_game_video(message, game_obj);
                menu_msg.delete();
            }else{
                message.channel.send('Invalid input "' + reaction + '"');
                return;
            }
        })
}

async function Edit_game_title(message, game_obj){
    //edit the game title
    var Game_File = JSON.parse(fs.readFileSync('./Game_Data/' + game_obj.id + '.json', 'utf8'));
    var Game_Data = JSON.parse(fs.readFileSync('./Game_Data_Main.json', 'utf8'));
    const question = new Discord.MessageEmbed()
        .setTitle('What should be the new title for ' + game_obj.id)
        .setDescription('The title is currently "' + game_obj.title + '"');
    const prompt = await message.channel.send(question);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            prompt.delete();
            return;
        }
        var reply = collected.first().toString();
        if(reply.length > 200){
            message.channel.send('The new title must be less than 200 characters.');
            return;
        }
        game_obj.title = reply;
        Game_File.title = reply;
        Game_Data.Game_History[parseInt(game_obj.id.slice(1), 10) - 1] = game_obj;
        fs.writeFileSync('./Game_Data_Main.json', JSON.stringify(Game_Data, null, 4), 'utf8');
        fs.writeFileSync('./Game_Data/' + game_obj.id + '.json', JSON.stringify(Game_File, null, 4), 'utf8');
        message.channel.send('Game title updated');
        Print_Game_Card(message, game_obj.id);
    })
}

async function Edit_game_video(message, game_obj){
    //edit the game videolink
    var Game_Data = JSON.parse(fs.readFileSync('./Game_Data_Main.json', 'utf8'));
    var Game_File = JSON.parse(fs.readFileSync('./Game_Data/' + game_obj.id + '.json', 'utf8'));
    const question = new Discord.MessageEmbed()
        .setTitle('What should be the new video for ' + game_obj.id)
        .setDescription('Respond with a youtube link. Make sure it is a youtu.be link, Get it from the share button, not copy pasting from the search bar.');
    const prompt = await message.channel.send(question);
    const filter = m => message.content.author == message.channel.author;
    const collector = message.channel.createMessageCollector(filter, {max: 1, time: 60000});
    collector.on('end', collected => {
        if(collected.size == 0){
            message.channel.send('Operation timed out.');
            prompt.delete();
            return;
        }
        var reply = collected.first().toString();
        if(reply.includes('youtu.be') == false){
            message.channel.send('Not a valid link. Must be a youtu.be link');
            return;
        }
        //-----------experimental code
        var video_id = null;
        video_id = reply.split('/')[reply.split('/').length - 1];
        
        //-----end experimental code
        Game_File.videolink = reply;
        Game_Data.Game_History[parseInt(game_obj.id.slice(1), 10) - 1] = game_obj;

        fs.writeFileSync('./Game_Data/' + game_obj.id + '.json', JSON.stringify(Game_File, null, 4), 'utf8');
        message.channel.send('Game videolink updated');
        Print_Game_Card(message, game_obj.id);
    })
}

function Help(message){//the help function. For when you just don't know what the fuck to do
    const cmd_Arr = message.content.toString().toLowerCase().split(' ').slice(2);
    const Help_Embed = new Discord.MessageEmbed();
    if(cmd_Arr.length == 0){
        Help_Embed
            .setTitle('Help Menu')
            .addField('Functions', 's!o uhc [name] - player stats\ns!o solo [name] - solo player stats\ns!o team [name] - team player stats\ns!o leaderboard - uhc leaderboards\ns!o history - search for an archived game\ns!o spreadsheet - link to google excel archive\ns!o help notifs - turn on/off notifications for UHC\ns!o help notify - set up a UHC (restricted command)\ns!o join - sign up to be a member of Stale Oreos\ns!o help names - bring up a list of all recognized user inputs')
            .setFooter('For more information on these commands do `s!o help [command]`');
        message.channel.send(Help_Embed);
        return;
    }
    if(cmd_Arr[0] == 'uhc'){
        Help_Embed
            .setTitle('UHC Player Stat Command')
            .addField('format', 's!o uhc [name]\n s!o uhc [name] [name] ... [name]')
            .addField('examples', 's!o uhc alex\ns!o uhc alex drew owen\ns!o uhc @dandera\ns!o uhc u002 u003');
    }else if(cmd_Arr[0] == 'solo'){
        Help_Embed
            .setTitle('UHC Solo Player Stat Command')
            .addField('format', 's!o solo [name]\n s!o solo [name] [name] ... [name]')
            .addField('examples', 's!o solo alex\ns!o solo alex drew owen\ns!o solo @dandera\ns!o solo u002 u003');
    }else if(cmd_Arr[0] == 'team' || cmd_Arr[0] == 'teams'){
        Help_Embed
            .setTitle('UHC Team Player Stat Command')
            .addField('format', 's!o team [name]\n s!o team [name] [name] ... [name]')
            .addField('examples', 's!o team alex\ns!o team alex drew owen\ns!o team @dandera\ns!o team u002 u003');
    }else if(cmd_Arr[0] == 'leaderboard' || cmd_Arr[0] == 'lb' || cmd_Arr[0] == 'leader'){
        Help_Embed
            .setTitle('Leaderboard Command')
            .setDescription('Display a embed with the top 5 ranking players in 8 categories.')
            .addField('format', 's!o leaderboard - show leaderboard data from all games\ns!o leaderboard solo - show leaderboard data from only solo games\ns!o leaderboard team - show leaderboard data from only team games\ns!o solo [version] - show data from only solo games in a certain version of Minecraft\ns!o teams [version] - show data from only teams games in a certain version of Minecraft\ns!o [version] - show all data from games played in a certain version of Minecraft')
            .addField('Examples', 's!o leaderboard solo 1.15\ns!o leaderboard 1.16\ns!o leaderboard teams')
    }else if(cmd_Arr[0] == 'enter'){
        Help_Embed
            .setTitle('Enter Data Function')
            .addField('null', 'This function has to be rewritten');
    }else if(cmd_Arr[0] == 'names' || cmd_Arr[0] == 'name'){
        const menu = fs.readFileSync('./menu.txt').toString().split('\n')
            let body = [];
            menu.forEach(Element => {
                body[body.length] = Element.split('|')[0] + ' - ' + Element.split('|')[1].split(',').join(', ');
            })
        Help_Embed
            .addField('Registered Members', body.join('\n'));
    }else if(cmd_Arr[0] == 'history'){
        Help_Embed
            .setTitle('History Command')
            .addField('**Search Methods**', 'the following can be used in the same command')
            .addField('No Search Term', 'If no search term is used, a menu of all games played will be returned\ns!o history')
            .addField('Title', 'Search for games by title\ns!o history title(enter title here)\nexample: s!o history title(close combat)')
            .addField('Date', 'Search for games on a particular date\ns!o history year-month-day\nexample: s!o history 2021-4-2')
            .addField('Month', 'Search for games played in a particular month\ns!o history year-month\nexample: s!o history 2020-3')
            .addField('Year', 'Search for games played in a particular year\ns!o history year\nexample: s!o history 2020')
            .addField('Date Range', 'Search for games played within a range of dates\ns!o history range(year-month-day year-month day)\nexample: s!o history range(2020-11-1 2021-1-10)')
            .addField('Minecraft Version', 'Search for games played in a certain MineCraft version\ns!o history v(version)\nexample: s!o history v(1.16)')
            .addField('Participants', 'Search for games that had certain players\ns!o history ben drew - s!o history mel - s!o history u010 u018')
            .addField('Game ID', 'If you know the ID of the game you want\ns!o history gID\nexample: s!o history g005')
            .addField('Game Type', 'Search for games that were either solo or team\ns!o history solo\ns!o history team')
    }else if(cmd_Arr[0] == 'notify'){
        Help_Embed
            .setTitle('Set up a UHC')
            .addField('**Command Format**', 's!o notify [hour:minute] [comments/additional info]\n\n**Important**\nAlways enter the planned start time in UTC!\nAnything else after the time in the command will be included in the invitations as a message.')
            .addField('**What this command does**', 's!o notify will preform several tasks.\n- Invitation cards will be DMd to every member signed up for notifications.\n- An embed will be created displaying the current list of people Coming/Not Coming and Maybe Coming\n- At 30 minutes before UHC, reminders will be sent out\n- At the planned start time, reminders will be sent out.')
            .setFooter('This command is restricted to server admins');
    }else if(cmd_Arr[0] == 'notifs'){
        Help_Embed
            .setTitle('UHC Notifications')
            .addField('Command Format', 's!o notifs on\ns!o notifs off')
            .addField('What this command does', 'UHC Notifications are sent out when a UHC is being set up.\nTo be included in the mailing list you must use the command to turn your notification setting on.\nYou can turn off notifications at any time')
    }else if(cmd_Arr[0] == 'join'){
        Help_Embed
            .setTitle('Join Stale Oreos')
            .setDescription('Activate this function with s!o join\nFollow the prompts to fill out your profile data');
    }else if(cmd_Arr[0] == 'edit'){
        if(cmd_Arr.length == 1){
            Help_Embed
                .setTitle('Edit Data Function')
                .setDescription('Edit profile and game data with s!o edit')
                .addField('s!o edit profile', 'Edit your profile data, Follow menu prompts to make changes to your profile\nChange your name\nChange your MC username\nChange your pronouns\nChange your faction\nChange your thumbnail image\nChange your UHC Notifications\nChange your timezone')
                .addField('s!o edit game [gID]', 'Edit a game title and video link');
        }else if(cmd_Arr[1] == 'profile'){
            Help_Embed
                .setTitle('Edit Profile Settings')
                .addField('s!o edit profile', 'Edit your profile data, Follow menu prompts to make changes to your profile\nChange your name\nChange your MC username\nChange your pronouns\nChange your faction\nChange your thumbnail image\nChange your UHC Notifications\nChange your timezone');
        }else if(cmd_Arr[1] == 'game'){
            Help_Embed
                .setTitle('Edit Game Data')
                .addField('s!o edit game (game id)', 'To get the game ID, use s!o history and find the game. The footer of the game card will provide the game ID\nEdit Title - change the title of the game\nEdit Video - change the video link for the game\nNOTE - must be a youtu.be link, not a youtube.com link. Get it from the share option below the video.')
        }
    }
    
    else{
        Help_Embed
            .addField('No function found', 'unable to determine input ' + "'" + cmd_Arr[0] + "'" + '\nTry s!o help');
    }
    message.channel.send(Help_Embed);
}

client.login(" ")
