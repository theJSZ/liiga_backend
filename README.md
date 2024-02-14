## Backend functionality for [Finnish Pinball League database app](https://thejsz.github.io)

#### What and why
The Finnish pinball league was played 6 tournaments per year over 10 years. The results were stored in 60 separate Google Sheets, making it not very easy to check for example:
- What machines did a particular pair of players play
- When did a particular player play a particular machine
- How many individual matches did a particular player play and how many did they win

The app allows you to find this information and more, with links to the original Sheets for verification purposes

#### How
The database was created by scraping the Sheets using Python, then the data was checked and formatted by a combination of manual and automatic work. The difference between the two database files is that the first one only included qualification results (13'113 matches) while the second one was updated with playoff results, making the total number of 1 vs 1 matches 14'915. In the case of a match where more than two players met, it was handled as a bunch of two player matches. Example: A, B, and C play and finish in this order. Recorded results are: A beat B, A beat C, B beat C.

#### How to use the app
There are 5 different views and various things you can click to navigate:
- **Main view.** Here you see a list of all players and a list of all machines that were featured in the league
  - Click any player name -> **player view**
  - Click any machine name -> **machine view**
- **Player view.** Here you see a list of all players and a list of all machines the selected player played, along with win-loss numbers for each
  - Click the big player name -> **main view**
  - Click any other player name -> **player vs player view**
  - Click any machine name -> **player vs machine view**
  - Click any point on the "over time" graph -> **original Google Sheets for that tournament**
- **Machine view.** Here you see a list of all players who played that machine and their win-loss numbers. Green for mostly wins, red for mostly losses, gray otherwise
  - Click the machine name -> **main view**
  - Click any player name -> **player vs machine view**
  - Click any tournament date -> **original Google Sheets for that tournament**
- **Player vs player view.** Here you see a list of all matches the selected players played, color coded: green means the player listed first won, red means they lost
  - Click either of the player names -> **player view**
  - Click any machine name -> **player vs machine view**
  - Click any event date -> **original Google Sheets for that tournament**
- **Player vs machine view.** Here you see a list of all matches the selected player played on the selected machine, color coded green for win, red for loss
  - Click the big player name -> **player view**
  - Click any other player name -> **player vs player view**
  - Click the machine name -> **machine view**
  - Click any event date -> **original Google Sheets for that tournament**
.
