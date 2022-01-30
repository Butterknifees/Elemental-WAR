var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 300
            },
            debug: false
        }

    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};
var game = new Phaser.Game(config);
var player;
var cursors;
var platforms;
var collision_p_v = false;
var powerups;
var villian;
var emitter_start = false;
var collected_powerup = false;
var has_waterball = true;
var fireball;
var waterball;
var score = 0;
var scoreText;
var factor = 1;
var coins;




function preload() {
    //loading all the required images
    this.load.image('background', 'assets_main/background.jpg');
    this.load.spritesheet('idle', 'assets_main/hero_movements/idlefinal.png', { frameWidth: 79, frameHeight: 52 });
    this.load.spritesheet('jump', 'assets_main/hero_movements/jumpnewfinal.png', { frameWidth: 76, frameHeight: 74 });
    this.load.spritesheet('move_right', 'assets_main/hero_movements/run_right.png', { frameWidth: 81, frameHeight: 55 });
    this.load.spritesheet('move_left', 'assets_main/hero_movements/leftrun.png', { frameWidth: 79.25, frameHeight: 51 });
    this.load.spritesheet('attack', 'assets_main/hero_movements/sp_attack.png', { frameWidth: 90, frameHeight: 58 });
    this.load.spritesheet('villianright', "assets_main/villian_movements/villianwalkright.png", { frameWidth: 75, frameHeight: 45 });
    this.load.spritesheet('villianleft', "assets_main/villian_movements/villianwalkleft.png", { frameWidth: 75, frameHeight: 45 });
    this.load.image('ground', 'assets_main/platform.png');
    this.load.image('powerup', 'assets_main/powerup.png');
    this.load.image('redball', 'assets_main/redball.png');
    this.load.image('blueball', 'assets_main/plasmaball.png');
    this.load.image('coin', 'assets_main/coin.png');
}

function create() {
    //adding background
    this.add.image(400, 300, "background").setSize(800, 600, true);

    //creating platform group and platforms
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(0.67).refreshBody();
    platforms.create(600, 400, 'ground').setScale(0.33).refreshBody();
    platforms.create(45, 250, 'ground').setScale(0.33).refreshBody();
    platforms.create(750, 220, 'ground').setScale(0.33).refreshBody();

    //creating fireball for main player
    fireball = this.physics.add.image(850, 182, 'redball').setAlpha(0.6).setScale(0.3);
    fireball.body.setAllowGravity(false);

    //creating waterball for enemy
    waterball = this.physics.add.image(850, 182, 'blueball').setAlpha(0.6).setScale(0.4);
    waterball.body.setAllowGravity(false);

    //creating group for powerup object
    powerups = this.physics.add.group();
    powerups.create(400, 300, 'powerup').setScale(0.05).setAlpha(0.8);

    //creating group for coins
    coins = this.physics.add.group({
        key: 'coin',
        repeat: 10,
        setXY: {
            x: 14,
            y: 100,
            stepX: 69
        }
    });

    //creating player object
    player = this.physics.add.sprite(32, 400, 'idle');
    player.setCollideWorldBounds(true);

    //creating enemy object
    villian = this.physics.add.sprite(10, 150, 'villianright');
    villian.setCollideWorldBounds(true);

    //all the animations created for our hero and villain
    this.anims.create({
        key: 'jump_',
        frames: this.anims.generateFrameNumbers('jump', { start: 0, end: 19 }),
        frameRate: 20,
        repeat: -1
    });

    this.anims.create({
        key: 'hero_idle_',
        frames: this.anims.generateFrameNumbers('idle', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'hero_left',
        frames: this.anims.generateFrameNumbers('move_left', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'hero_right',
        frames: this.anims.generateFrameNumbers('move_right', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: "hero_attack_",
        frames: this.anims.generateFrameNumbers('attack', { start: 0, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: "villian_right",
        frames: this.anims.generateFrameNumbers('villianright', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: "villian_left",
        frames: this.anims.generateFrameNumbers('villianleft', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
    });

    //score of the game
    scoreText = this.add.text(16, 16, 'Score: 0', {
        fontFamily: 'agency fb',
        fontSize: '35px',
        backgroundColor: '#add8e6',
        fill: '#000'
    });

    //setting a bounce for all the coins that we have added to the game
    coins.children.iterate(function(child) {
        child.setBounce(Phaser.Math.FloatBetween(0.4, 0.8));
        child.setScale(0.06).setAlpha(1);
    });

    //adding collider for all the required game objects
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(villian, platforms);
    this.physics.add.collider(platforms, powerups);
    this.physics.add.collider(powerups, platforms);
    this.physics.add.collider(coins, platforms);

    // fucntion for collecting a powerup its arguments are player and powerup
    this.physics.add.overlap(player, powerups, collectPowerUp, null, this);

    function collectPowerUp(player, powerups) {
        powerups.disableBody(true, true);
        player.setTint(0xff0000);
        collected_powerup = true;
        score += 100;
        scoreText.setText('Score ' + score);
    }

    //function for killing villian on getting hit by fireball
    this.physics.add.overlap(villian, fireball, killvillain, null, this);

    function killvillain(villain, fireball) {
        var random = Phaser.Math.Between(70, 730);
        villain.setPosition(random, 80);
        waterball.setPosition(850, 152);
        fireball.setPosition(950, 152);
        fireball.setVelocityX(0);
        score += 1000;
        scoreText.setText('Score ' + score);
    }

    //function for collision between fireball and waterball which results in both disappearing
    this.physics.add.overlap(waterball, fireball, power_hit, null, this);

    function power_hit(waterball, fireball) {
        waterball.setPosition(850, 152);
        fireball.setPosition(950, 152);
        scoreText.setText('Score ' + score);
    }

    //function to detect collision between player and enemy
    this.physics.add.collider(player, villian, hitVillian, null, this);

    function hitVillian(player, villian) {
        collision_p_v = true;
    }

    //function for collection of coins
    this.physics.add.overlap(player, coins, collect_coin, null, this);

    function collect_coin(player, coin) {
        coin.disableBody(true, true);
        score += 10;
        scoreText.setText('Score: ' + score);
        if (coins.countActive(true) === 0) {
            coins.children.iterate(function(child) {
                child.enableBody(true, child.x, 0, true, true);
            });
        }
    }

    //function for killing player when hit by waterball
    this.physics.add.overlap(player, waterball, killhero, null, this);

    function killhero(player, waterball) {
        waterball.disableBody(true, true);
        fireball.disableBody(true, true);
        player.anims.play('hero_idle_',true);
        this.physics.pause();
        player.setTint(0xff0000);
        villian.setTint(0x0000FF);
        player.anims.stop(true);
        alert("game over");
        collision_p_v = false;
    }
}

function update() {
    //a cursor to take input from the 
    cursors = this.input.keyboard.createCursorKeys();
    var x = Phaser.Math.Between(0, 100);

    //waterball.setPosition(villian.x, villian.y);
    if (has_waterball) {
        waterball.setPosition(villian.x, villian.y);
    }

    //to return waterball after it crosses canvas
    if (waterball.x < 0 || waterball.x > 800) {
        has_waterball = true;
        waterball.setAlpha(0.6);
        waterball.setPosition(villian.x, villian.y);
    }

    //for jump frame
    if (player.body.velocity.y != 0) {
        player.anims.play('jump_', true);
    }

    //condition for moving the villian right or left
    if (villian.x < 50) {
        villian.setVelocityX(150 * factor);
    } else if (villian.x > 750) {
        villian.setVelocityX(-150 * factor);
    } else if (villian.body.touching.down && x == 50 && has_waterball) {
        villian.setVelocityY(-330);
        if (villian.body.velocity.x > 0) {
            waterball.setVelocityX(300 * factor);
            waterball.setAlpha(1);
            has_waterball = false;

        } else {
            waterball.setVelocityX(-300 * factor);
            waterball.setAlpha(1);
            has_waterball = false;
        }
    }

    //condition for playing the animations for the villian
    if (villian.body.velocity.x >= 0) {
        villian.anims.play('villian_right', true);
    } else if (villian.body.velocity.x < 0) {
        villian.anims.play('villian_left', true);
    }

    //maiking sure that the villian never becomes static
    if (villian.body.velocity.x == 0) {
        villian.setVelocityX(150);
    }

    //conditions and controls of our player
    if (cursors.up._justDown && player.body.touching.down) {
        player.setVelocityY(-330);
    } else if (cursors.down.isDown && player.body.touching.down) {
        player.setVelocityX(0);
        if (cursors.left._justDown) {
            player.flipX = true;
        }
        player.anims.play('hero_attack_', true);
    } else if (cursors.left.isDown) {
        player.setVelocityX(-150);
        player.flipX = false;
        player.anims.play('hero_left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(150);
        player.flipX = false;
        player.anims.play('hero_right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('hero_idle_', true);
    }

    //equipping fireball
    if (collected_powerup) {
        fireball.setPosition(player.x, player.y);
    }

    //releasing fireball
    if (collected_powerup && cursors.down._justDown) {
        if (cursors.left._justDown) {
            fireball.setVelocityX(-300);
            collected_powerup = false;
            player.clearTint();
        } else if (cursors.right._justDown) {
            fireball.setVelocityX(300);
            collected_powerup = false;
            player.clearTint();
        } else {
            fireball.setVelocityX(300);
            collected_powerup = false;
            player.clearTint();
        }

    }

    //spawning of fireball in random positions after collected
    if (fireball.x < 0 || fireball.x > 900) {
        fireball.setVelocityX(0);
        fireball.setPosition(850, 152);
        if (x < 20) {
            powerups.create(750, 152, 'powerup').setScale(0.05).setAlpha(0.8);
        } else if (x >= 20 && x < 40) {
            powerups.create(70, 100, 'powerup').setScale(0.05).setAlpha(0.8);
        } else if (x >= 40 && x < 60) {
            powerups.create(750, 250, 'powerup').setScale(0.05).setAlpha(0.8);
        } else if (x >= 60 && x < 80) {
            powerups.create(70, 460, 'powerup').setScale(0.05).setAlpha(0.8);
        } else if (x >= 80 && x < 90) {
            powerups.create(720, 460, 'powerup').setScale(0.05).setAlpha(0.8);
        } else {
            powerups.create(400, 300, 'powerup').setScale(0.05).setAlpha(0.8);
        }
    }

    //spawning of villain in a random postion after kill
    if (collision_p_v) {
        if (cursors.down.isDown && player.body.touching.down) {
            var random = Phaser.Math.Between(70, 730);
            score += 500;
            scoreText.setText('Score ' + score);
            villian.setPosition(random, 80);
            waterball.setPosition(850,182);
            collision_p_v = false;
        } else {
            this.physics.pause();
            player.setTint(0xff0000);
            player.anims.play('hero_idle_',true);
            villian.setTint(0x0000FF);
            alert("game over");
            collision_p_v = false;
        }
    }

    //adding difficulty to the game by increasing speed of the villain and waterball
    if (score >= 2000 && score < 3000) {
        factor = 1.2;
    } else if (score >= 3000 && score < 4000) {
        factor = 1.3;
    } else if (score >= 4000 && score < 5000) {
        factor = 1.4;
    } else if (score >= 5000 && score < 6000) {
        factor = 1.5;
    } else if (score >= 6000 && score < 7000) {
        factor = 1.6;
    } else if (score >= 7000 && score < 8000) {
        factor = 1.7;
    }
}