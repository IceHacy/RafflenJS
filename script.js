class Dancer {
    constructor(x, y, name, image, context) {
        this.x = x;
        this.y = y;
        this.vx = Math.random() * 2 - 1;
        this.vy = Math.random() * 2 - 1;
        this.name = name;
        this.image = image;
        this.context = context;
        this.size = 48;
        this.hp = 3;
        this.movementInterval = Math.random() * 1.0;
        this.animationInterval = 0.0;
        this.direction = Math.random() * 360;
        this.animation = false;
    }

    update(deltaTime) {
        this.movementInterval -= deltaTime;
        this.animationInterval += deltaTime;

        if (this.movementInterval < 0) {
            this.direction = Math.random() * 360;
            this.movementInterval = Math.random();
        }

        if (this.animationInterval > 0.1) {
            this.animation = !this.animation;
            this.animationInterval = 0.0;
        }

        let movementSpeed = 1.5 * 10;
        this.x += Math.cos(this.direction) * deltaTime * movementSpeed;
        this.y += Math.sin(this.direction) * deltaTime * movementSpeed;

        if (this.x < 0) this.x = 0;
        if (this.x > 1024 - this.size) this.x = 1024 - this.size;
        if (this.y < 0) this.y = 0;
        if (this.y > 600 - this.size) this.y = 600 - this.size;
    }

    draw() {
        this.context.drawImage(this.image, this.x, this.y, this.size, this.size);
        this.context.fillStyle = 'white';
        this.context.fillText(this.name, this.x + this.size / 2, this.y - 10);
    }

    checkCollision(otherDancer) {
        if (
            this.x < otherDancer.x + otherDancer.size &&
            this.x + this.size > otherDancer.x &&
            this.y < otherDancer.y + otherDancer.size &&
            this.y + this.size > otherDancer.y
        ) {
            this.hp--;
            otherDancer.hp--;
            return true;
        }
        return false;
    }
}

let canvas = document.getElementById('raffleCanvas');
let context = canvas.getContext('2d');
context.font = "16px Arial";
context.textAlign = "center";

let dancers = [];
let lastTime = 0;
let animationFrameId;

function loadNames() {
    return fetch('assets/names.txt')
        .then(response => response.text())
        .then(text => text.split('\n').filter(name => name.trim() !== ''));
}

function init() {
    loadNames().then(names => {
        for (let i = 0; i < names.length; i++) {
            let x = Math.random() * (canvas.width - 48);
            let y = Math.random() * (canvas.height - 48);
            let image = new Image();
            image.src = 'assets/dancer.png';
            let dancer = new Dancer(x, y, names[i], image, context);
            dancers.push(dancer);
        }
        requestAnimationFrame(gameLoop);
    });
}

function gameLoop(timestamp) {
    let deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    context.clearRect(0, 0, canvas.width, canvas.height);

    dancers.forEach(dancer => {
        dancer.update(deltaTime);
        dancer.draw();
    });

    for (let i = 0; i < dancers.length; i++) {
        for (let j = i + 1; j < dancers.length; j++) {
            if (dancers[i].checkCollision(dancers[j])) {
                if (dancers[i].hp <= 0) {
                    dancers.splice(i, 1);
                }
                if (dancers[j].hp <= 0) {
                    dancers.splice(j, 1);
                }
            }
        }
    }

    if (dancers.length > 1) {
        if (Math.random() < 0.1) {
            // Random events like speed up or multiplying dancers
            if (Math.random() < 0.5) {
                // Speed up a random dancer
                let randomDancer = dancers[Math.floor(Math.random() * dancers.length)];
                randomDancer.vx *= 2;
                randomDancer.vy *= 2;
            } else {
                // Multiply a random dancer
                let randomDancer = dancers[Math.floor(Math.random() * dancers.length)];
                let newDancer = new Dancer(randomDancer.x, randomDancer.y, randomDancer.name, randomDancer.image, context);
                dancers.push(newDancer);
            }
        }
        animationFrameId = requestAnimationFrame(gameLoop);
    } else {
        context.fillStyle = 'white';
        context.fillText(`${dancers[0].name} is the winner!`, canvas.width / 2, canvas.height / 2);
    }
}

document.getElementById('startButton').addEventListener('click', () => {
    if (!animationFrameId) {
        init();
    }
});

document.getElementById('restartButton').addEventListener('click', () => {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    dancers = [];
    context.clearRect(0, 0, canvas.width, canvas.height);
    init();
});
