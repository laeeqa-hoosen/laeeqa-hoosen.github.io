# Rock Paper Scissors Bouncer

A visual rock-paper-scissors game inspired by the classic DVD screensaver bouncing effect.

## Game Concept

Rock, paper, and scissors icons bounce around the screen randomly like the classic DVD logo. When two icons collide, the classic rock-paper-scissors rules apply - the winner survives and the loser is destroyed.

## Game Rules

### Rock Paper Scissors Logic
- **Rock** beats **Scissors** (rock crushes scissors)
- **Paper** beats **Rock** (paper covers rock)  
- **Scissors** beats **Paper** (scissors cut paper)
- Same type collisions result in both icons surviving

### Gameplay Mechanics
- Icons bounce around the screen at random speeds and directions
- Icons bounce off screen edges (like a screensaver)
- When two icons touch/collide, the stronger one wins based on RPS rules
- The losing icon is destroyed and removed from the screen
- The winning icon continues bouncing
- Game continues until only one type remains or all icons are gone

## Technical Features
- HTML5 Canvas for rendering
- Smooth animation and physics
- Collision detection between moving objects
- Dynamic icon spawning and removal
- Responsive design

## Goal
The goal is to create an entertaining visualization of rock-paper-scissors where you can watch the battle play out automatically, similar to watching a screensaver but with game logic applied to collisions.