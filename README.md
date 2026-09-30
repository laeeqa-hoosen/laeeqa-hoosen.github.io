# Rock Paper Scissors Bouncer

An interactive rock-paper-scissors battle royale with multiple game modes, inspired by the classic DVD screensaver bouncing effect.

## Game Features

### Available Game Modes
- **Classic Mode** - The original RPS battle royale. Equal numbers of each type fight until one remains victorious.
- **Infection Mode** - Losers don't die, they get infected. One type spreads like a virus until it has converted everyone.
- **Prediction Mode** - Predict the winner and score points for accuracy. Test your strategic foresight!

### Coming Soon Game Modes
- **Timed Battle** - Continuous spawning for a set time. Most kills wins in this fast-paced challenge.
- **Survival Mode** - Control your character and survive as long as possible against endless waves.
- **Powerup Chaos** - Classic gameplay enhanced with game-changing power-ups and special abilities.
- **King of the Hill** - Control the center territory. Most objects in the zone wins the crown!
- **Tournament** - Single elimination bracket style. Best of 3 rounds determines the ultimate champion.
- **Resource Management** - Limited spawns require strategic thinking. Use your resources wisely to win.

## Game Rules

### Rock Paper Scissors Logic
- **Rock** beats **Scissors** (rock crushes scissors)
- **Paper** beats **Rock** (paper covers rock)  
- **Scissors** beats **Paper** (scissors cut paper)
- Same type collisions result in both icons surviving

### Classic Mode Mechanics
- Icons bounce around the screen at random speeds and directions
- Icons bounce off screen edges (like a screensaver)
- When two icons touch/collide, the stronger one wins based on RPS rules
- The losing icon is destroyed and removed from the screen
- The winning icon continues bouncing
- Game continues until only one type remains

### Infection Mode Mechanics
- Same bouncing and RPS rules as Classic Mode
- The losing icon isn't removed - it converts to the winner's type and pulses in its new colour
- The total number of icons never changes
- Game ends when one type has infected every icon on screen

### Prediction Mode Mechanics
- A Classic Mode round, but you pick which type you think will win before pressing Start
- Your prediction locks in once the round starts; manual spawning is disabled so you can't rig the result
- A correct call scores 10 points times your current streak (10, 20, 30...); a wrong call resets the streak
- Points, accuracy and best streak carry over between rounds until you go back to the menu
- Press Reset after a round to make your next prediction

### Game Controls
- **Start/Pause** - Control the game flow
- **Reset** - Start a fresh round
- **Speed Controls** - Adjust game speed (Slow, Normal, Fast, Ultra, Ludicrous)
- **Manual Spawning** - Add individual rocks, papers, or scissors
- **Starting Count** - Configure how many of each type to start with (1-10)

### Keyboard Shortcuts
| Key | Action |
| --- | --- |
| Space | Start / pause |
| R | Reset |
| 1 / 2 / 3 | Spawn rock / paper / scissors |
| S / N / F / U / L | Slow / Normal / Fast / Ultra / Ludicrous speed |

## Technical Features
- HTML5 Canvas for rendering
- Frame-rate independent animation (same speed on 60Hz and 144Hz displays)
- Collision detection between moving objects
- Dynamic icon spawning and removal
- Canvas scales to fit smaller screens
- Modular game mode system with per-mode UI hooks

## Development Status
- Classic, Infection and Prediction modes fully implemented
- Additional game modes in development
