var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: {
      preload: preload,
      create: create,
      update: update,
      extend: {
                  player: null,
                  healthpoints: null,
                  reticle: null,
                  moveKeys: null,
                  playerBullets: null,
                  enemyBullets: null,
                  time: 0,
              }
  }
};

var game = new Phaser.Game(config);
var gameOver = false;
var enemiesKilled = 0;
var enemyiesKilledText;

var Bullet = new Phaser.Class({

  Extends: Phaser.GameObjects.Image,

  initialize:

  // Bullet Constructor
  function Bullet (scene)
  {
      Phaser.GameObjects.Image.call(this, scene, 0, 0, 'bullet');
      this.speed = 1;
      this.born = 0;
      this.direction = 0;
      this.xSpeed = 0;
      this.ySpeed = 0;
      this.setSize(12, 12, true);
  },

  // Fires a bullet from the player to the reticle
  fire: function (shooter, target)
  {
      this.setPosition(shooter.x, shooter.y); // Initial position
      this.direction = Math.atan( (target.x-this.x) / (target.y-this.y));

      // Calculate X and y velocity of bullet to moves it from shooter to target
      if (target.y >= this.y)
      {
          this.xSpeed = this.speed*Math.sin(this.direction);
          this.ySpeed = this.speed*Math.cos(this.direction);
      }
      else
      {
          this.xSpeed = -this.speed*Math.sin(this.direction);
          this.ySpeed = -this.speed*Math.cos(this.direction);
      }

      this.rotation = shooter.rotation; // angle bullet with shooters rotation
      this.born = 0; // Time since new bullet spawned
  },

  // Updates the position of the bullet each cycle
  update: function (time, delta)
  {
      this.x += this.xSpeed * delta;
      this.y += this.ySpeed * delta;
      this.born += delta;
      if (this.born > 1800)
      {
          this.setActive(false);
          this.setVisible(false);
      }
  }

});

function preload ()
{
  // Load in images and sprites
  this.load.spritesheet('player_handgun', 'assets/sprites/player_handgun.png',
      { frameWidth: 66, frameHeight: 60 }
  ); // Made by tokkatrain: https://tokkatrain.itch.io/top-down-basic-set
  this.load.image('bullet', 'assets/sprites/bullet7.png');
  this.load.image('target', 'assets/sprites/ball-tlb.png');
  this.load.image('crosshair', 'assets/sprites/crosshair.png');
  this.load.image('cursor', 'assets/sprites/cursor.png');
  this.load.image('background', 'assets/images/background.png');
}

function create ()
{
  // Set world bounds
  this.physics.world.setBounds(0, 0, 1600, 1200);

  // Add 2 groups for Bullet objects
  playerBullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
  enemyBullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });

  // Add background player, enemy, reticle, healthpoint sprites

  var background = this.add.image(800, 600, 'background');
  player = this.physics.add.sprite(800, 600, 'player_handgun');
  enemy = this.physics.add.sprite(300, 600, 'player_handgun');
  reticle = this.physics.add.sprite(800, 700, 'crosshair');
  cursor = this.physics.add.sprite(800, 700, 'cursor');
  hp1 = this.add.image(-175, -250, 'target').setScrollFactor(0.5, 0.5);
  hp2 = this.add.image(-115, -250, 'target').setScrollFactor(0.5, 0.5);
  hp3 = this.add.image(-55, -250, 'target').setScrollFactor(0.5, 0.5);
  // Set image/sprite properties
  background.setOrigin(0.5, 0.5).setDisplaySize(1600, 1200);
  player.setOrigin(0.5, 0.5).setDisplaySize(132, 120).setCollideWorldBounds(true).setDrag(500, 500);
  enemy.setOrigin(0.5, 0.5).setDisplaySize(132, 120).setCollideWorldBounds(true);
  reticle.setOrigin(0.5, 0.5).setDisplaySize(25, 25).setCollideWorldBounds(true);
  cursor.setOrigin(0.5, 0.5).setDisplaySize(25, 25).setCollideWorldBounds(true).setVisible(false);
  hp1.setOrigin(0.5, 0.5).setDisplaySize(50, 50);
  hp2.setOrigin(0.5, 0.5).setDisplaySize(50, 50);
  hp3.setOrigin(0.5, 0.5).setDisplaySize(50, 50);
  hp1.setScrollFactor(0);
  hp2.setScrollFactor(0);
  hp3.setScrollFactor(0);
  livesLeftText = this.add.text(-300, -250, 'Lives Left:', { font: "35px Arial"},);
  livesLeftText.setScrollFactor(0);
  livesLeftText.setOrigin(0.5, 0.5);
  count = 0;
  enemiesKilled = this.add.text(-250, -175, 'Enemies Killed: ' + count, { font: "35px Arial"},);
  enemiesKilled.setScrollFactor(0);
  enemiesKilled.setOrigin(0.5, 0.5);
  pauseText = this.add.text(1000, -250, 'Pause game', { font: "35px Arial"},);
  pauseText.setScrollFactor(0);
  pauseText.setOrigin(0.5, 0.5);
  pauseText.setInteractive();
  pauseText.on('pointerdown', () => { console.log('pointerover');});

  // Set sprite variables
  player.health = 3;
  enemy.health = 3;
  enemy.lastFired = 0;

  // Set camera properties
  this.cameras.main.zoom = 0.5;
  this.cameras.main.startFollow(player);

  // Creates object for input with WASD kets
  moveKeys = this.input.keyboard.addKeys({
      'up': Phaser.Input.Keyboard.KeyCodes.W,
      'down': Phaser.Input.Keyboard.KeyCodes.S,
      'left': Phaser.Input.Keyboard.KeyCodes.A,
      'right': Phaser.Input.Keyboard.KeyCodes.D
  });

  // Enables movement of player with WASD keys
  this.input.keyboard.on('keydown-W', function (event) {
      player.setAccelerationY(-800);
  });
  this.input.keyboard.on('keydown-S', function (event) {
      player.setAccelerationY(800);
  });
  this.input.keyboard.on('keydown-A', function (event) {
      player.setAccelerationX(-800);
  });
  this.input.keyboard.on('keydown-D', function (event) {
      player.setAccelerationX(800);
  });

  // Stops player acceleration on uppress of WASD keys
  this.input.keyboard.on('keyup-W', function (event) {
      if (moveKeys['down'].isUp)
          player.setAccelerationY(0);
  });
  this.input.keyboard.on('keyup-S', function (event) {
      if (moveKeys['up'].isUp)
          player.setAccelerationY(0);
  });
  this.input.keyboard.on('keyup-A', function (event) {
      if (moveKeys['right'].isUp)
          player.setAccelerationX(0);
  });
  this.input.keyboard.on('keyup-D', function (event) {
      if (moveKeys['left'].isUp)
          player.setAccelerationX(0);
  });

  // Fires bullet from player on left click of mouse
  this.input.on('pointerdown', function (pointer, time, lastFired) {
      if (player.active === false)
          return;

      // Get bullet from bullets group
      var bullet = playerBullets.get().setActive(true).setVisible(true);

      if (bullet && gameOver == false)
      {
          bullet.fire(player, reticle);
          this.physics.add.collider(enemy, bullet, enemyHitCallback);
      }
  }, this);

  // Pointer lock will only work after mousedown
  game.canvas.addEventListener('mousedown', function () {
      game.input.mouse.requestPointerLock();
  });

  // Exit pointer lock when Q or escape (by default) is pressed.
  this.input.keyboard.on('keydown_Q', function (event) {
      if (game.input.mouse.locked)
          game.input.mouse.releasePointerLock();
  }, 0, this);

  // Move reticle upon locked pointer move
  this.input.on('pointermove', function (pointer) {
      if (this.input.mouse.locked)
      {
          reticle.x += pointer.movementX;
          reticle.y += pointer.movementY;
          cursor.x += pointer.movementX;
          cursor.y += pointer.movementY;
      }
  }, this);

}

function enemyHitCallback(enemyHit, bulletHit)
{
  // Reduce health of enemy
  if (bulletHit.active === true && enemyHit.active === true)
  {
      enemyHit.health = enemyHit.health - 1;
      console.log("Enemy hp: ", enemyHit.health);

      // Kill enemy if health <= 0
      if (enemyHit.health <= 0)
      {
         enemyHit.setActive(false).setVisible(false);
         enemy.setOrigin(0.5, 0.5).setDisplaySize(132, 120).setCollideWorldBounds(true);
         enemy.x = Math.floor(Math.random() * (2000 - -500 + 1)) + -500;
         enemy.y = Math.floor(Math.random() * (2000 - -2000 + 1)) + -2000;
         console.log(enemy.x + " " + enemy.y);
         enemyHit.health = 2;
         enemyHit.setActive(true).setVisible(true);
         count++;
         enemiesKilled.setText('Enemies Killed: ' + count);
      }

      // Destroy bullet
      bulletHit.setActive(false).setVisible(false);
  }
}

function playerHitCallback(playerHit, bulletHit)
{
  // Reduce health of player
  if (bulletHit.active === true && playerHit.active === true)
  {
      playerHit.health = playerHit.health - 1;
      console.log("Player hp: ", playerHit.health);

      // Kill hp sprites and kill player if health <= 0
      if (playerHit.health == 2)
      {
          hp3.destroy();
      }
      else if (playerHit.health == 1)
      {
          hp2.destroy();
      }
      else
      {
          // Game over state should execute here
          hp1.destroy();
          //Here we are setting the player and reticle to not visible any longer, and enabling the menu cursor as game is over.
          cursor.setVisible(true);
          enemy.destroy();
          player.setVisible(false);
          bulletHit.setVisible(false);
          reticle.setVisible(false);
          gameOver = true;
          livesLeftText.setVisible(false);
          console.log("GAME OVER!");

      }

      // Destroy bullet
      bulletHit.setActive(false).setVisible(false);
  }
}

function enemyFire(enemy, player, time, gameObject)
{
  if (enemy.active === false)
  {
      return;
  }

  if ((time - enemy.lastFired) > 1000)
  {
      enemy.lastFired = time;

      // Get bullet from bullets group
      var bullet = enemyBullets.get().setActive(true).setVisible(true);

      if (bullet)
      {
          bullet.fire(enemy, player);
          // Add collider between bullet and player
          gameObject.physics.add.collider(player, bullet, playerHitCallback);
      }
  }
}

// Ensures sprite speed doesnt exceed maxVelocity while update is called
function constrainVelocity(sprite, maxVelocity)
{
  if (!sprite || !sprite.body)
    return;

  var angle, currVelocitySqr, vx, vy;
  vx = sprite.body.velocity.x;
  vy = sprite.body.velocity.y;
  currVelocitySqr = vx * vx + vy * vy;

  if (currVelocitySqr > maxVelocity * maxVelocity)
  {
      angle = Math.atan2(vy, vx);
      vx = Math.cos(angle) * maxVelocity;
      vy = Math.sin(angle) * maxVelocity;
      sprite.body.velocity.x = vx;
      sprite.body.velocity.y = vy;
  }
}

// Ensures reticle does not move offscreen
function constrainReticle(reticle)
{
  var distX = reticle.x-player.x; // X distance between player & reticle
  var distY = reticle.y-player.y; // Y distance between player & reticle

  // Ensures reticle cannot be moved offscreen (player follow)
  if (distX > 800)
      reticle.x = player.x+800;
  else if (distX < -800)
      reticle.x = player.x-800;

  if (distY > 600)
      reticle.y = player.y+600;
  else if (distY < -600)
      reticle.y = player.y-600;
}

function update (time, delta)
{
  // Rotates player to face towards reticle
  player.rotation = Phaser.Math.Angle.Between(player.x, player.y, reticle.x, reticle.y);

  // Rotates enemy to face towards player
  enemy.rotation = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);

  //Make reticle move with player
    reticle.body.velocity.x = player.body.velocity.x;
    reticle.body.velocity.y = player.body.velocity.y;
    //Checking if the game is over in the update, if it is currently over then we disable the keyboard input to stop the player from moving
    if(gameOver){
        // disable enable keyboard input this.input.keyboard.enabled = false;
        gameOver = false;
        this.scene.restart();
    }

  // Constrain velocity of player
  constrainVelocity(player, 500);

  // Constrain position of constrainReticle
  constrainReticle(reticle);

  // Make enemy fire
  enemyFire(enemy, player, time, this);
}
