# Rock Paper Scissors Bouncer

An interactive rock-paper-scissors battle royale with multiple game modes, inspired by the classic DVD screensaver bouncing effect.

## Game Features

### Available Game Modes
- **Classic Mode** - The original RPS battle royale. Equal numbers of each type fight until one remains victorious.

### Coming Soon Game Modes
- **Timed Battle** - Continuous spawning for a set time. Most kills wins in this fast-paced challenge.
- **Prediction Mode** - Predict the winner and score points for accuracy. Test your strategic foresight!
- **Survival Mode** - Control your character and survive as long as possible against endless waves.
- **Powerup Chaos** - Classic gameplay enhanced with game-changing power-ups and special abilities.
- **King of the Hill** - Control the center territory. Most objects in the zone wins the crown!
- **Tournament** - Single elimination bracket style. Best of 3 rounds determines the ultimate champion.
- **Infection Mode** - One type spreads like a virus, converting others. Can you contain the outbreak?
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
- Game continues until only one type remains or all icons are gone

### Game Controls
- **Start/Pause** - Control the game flow
- **Reset** - Start a fresh round
- **Speed Controls** - Adjust game speed (Slow, Normal, Fast, Ultra, Ludicrous)
- **Manual Spawning** - Add individual rocks, papers, or scissors
- **Starting Count** - Configure how many of each type to start with (1-10)

## Technical Features
- HTML5 Canvas for rendering
- Smooth animation and physics
- Collision detection between moving objects
- Dynamic icon spawning and removal
- Responsive design
- Modular game mode system
- Custom UI for each game mode
- State management and game persistence

## Development Status
- Classic Mode fully implemented
- Additional game modes in development
- Regular updates and new features planned