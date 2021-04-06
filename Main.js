//author: dandera
//purpose: custom discord bot for Stale Oreos Server. Manage and Archive data from Stale Oreo UHC matches
//created: 2021-03-15
//last edited: 2021-04-06

/*
----------------------FINISHED-----------------------------------------------------------------------
    Updated leaderboard code. Added ability to filter by minecraft version
    Updated history menu selector. It can read json and has a lot of filter settings now
    UHC Player cards [excluding filters] are done
    UHC Game cards are done
    new JSON file structure for member and game data is done
-----------------------------------------------------------------------------------------------------
----------------------TO DO--------------------------------------------------------------------------
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
        Leaderboard_Det(message)
    }else if(cmd == 'help'){
        Help(message)
    }else if(cmd == 'enter'){
        
    }else if (cmd == 'history'){
        History(message);
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
    var attendance = null;

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
    //catch bad numbers
    if(games_played == 0){
        kdr = 0;
        avg_kills = 0;
        win_rate = "0%";
        attendance = "0%";
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
        .addField('**Game Attendance**', attendance);
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
    Game_Card.setFooter('internal game ID: ' + gID, 'https://i.imgur.com/857yijB.png')
    console.log(Game_Card);
    fs.writeFileSync('./test_embed.json', JSON.stringify(Game_Card));
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
        Filtered_Arr.forEach(Element => {
            g_date = [];
            g_date = Element.date.split(' ')[0].split('-');
            loop = 0;
            while(loop < 3){
                g_date[loop] = parseInt(g_date[loop], 10);
                loop++;
            }
            console.log(g_date)
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
    while(loop < 5 && loop < member_arr.length){
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
    loop = 1;
    while(loop < 5 && loop < member_arr.length){
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
            if(member_arr[inloop].runner_ups < member_arr[inloop + 1].wins){
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
    while(loop < 5 && loop < member_arr.length){
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
            if(member_arr[inloop].runner_ups < member_arr[inloop + 1].first_bloods){
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
    while(loop < 5 && loop < member_arr.length){
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
            if(member_arr[inloop].runner_ups < member_arr[inloop + 1].first_deaths){
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
    while(loop < 5 && loop < member_arr.length){
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
            Element.kdr = 500;
        }else{
            Element.kdr = (Element.kills / Element.deaths);
        }
        Element.avg_kills = (Element.kills / Element.attendance);
        Element.win_rate = (Element.wins / g_Arr.length);
    })

    //create top 5 for kill/death ratio
    let kdr_board = [];
    loop = 0;
    while(loop < member_arr.length){
        inloop = 0;
        while(inloop < member_arr.length - 1){
            if(member_arr[inloop].runner_ups < member_arr[inloop + 1].kdr){
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
    while(loop < 5 && loop < member_arr.length){
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
            if(member_arr[inloop].avg_kills < member_arr[inloop + 1].kdr){
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
    while(loop < 5 && loop < member_arr.length){
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
            if(member_arr[inloop].win_rate < member_arr[inloop + 1].kdr){
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
    while(loop < 5 && loop < member_arr.length){
        if(member_arr[loop].wins == member_arr[loop - 1].wins){
            win_rate_board[win_rate_board.length] = win_rate_board[win_rate_board.length - 1].split(' ')[0] + ' ' + member_arr[loop].alias;
        }else{
            win_rate_board[win_rate_board.length] = (win_rate_board.length + 1) + '. ' + member_arr[loop].alias;
        }
        loop++;
    }

    console.log(member_arr)
    const Leaderboard_Embed = new Discord.MessageEmbed()
        .setTitle(title)
        .setThumbnail(thumbnail)
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
        .setFooter('Sample Size: ' + g_Arr.length)
    message.channel.send(Leaderboard_Embed)
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

function Help(message){//the help function. For when you just don't know what the fuck to do
    const cmd_Arr = message.content.toString().toLowerCase().split(' ').slice(2);
    const Help_Embed = new Discord.MessageEmbed();
    if(cmd_Arr.length == 0){
        Help_Embed
            .setTitle('Help Menu')
            .addField('Functions', 's!o uhc [name] - player stats\ns!o solo [name] - solo player stats\ns!o team [name] - team player stats\ns!o leaderboard - uhc leaderboards\ns!o history - search for an archived game\ns!o spreadsheet - link to google excel archive\ns!o help names - bring up a list of all recognized user inputs')
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
            .addField('null', 'This function has to be rewritten')
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
    }else{
        Help_Embed
            .addField('No function found', 'unable to determine input ' + "'" + cmd_Arr[0] + "'" + '\nTry s!o help');
    }
    message.channel.send(Help_Embed);
}

client.login("ODI2NjEyOTc0ODE3OTAyNTky.YGPBUg.d8tLLguuBZ80cHMZJdjvbau1E7Q")
