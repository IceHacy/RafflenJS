document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('raffleCanvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');

    let dancers = [];
    let waiting = true;
    let winner = null;
    let eventTimer = 0;
    let boss = null;

    class Dancer {
        constructor(name, x, y, image, flippedImage) {
            this.name = name;
            this.x = x;
            this.y = y;
            this.direction = Math.random() * 2 * Math.PI;
            this.size = 48;
            this.lives = 3;
            this.image = image;
            this.flippedImage = flippedImage;
            this.speed = 150;
        }

        update(deltaTime) {
            this.x += Math.cos(this.direction) * this.speed * deltaTime;
            this.y += Math.sin(this.direction) * this.speed * deltaTime;

            if (this.x < 0 || this.x > canvas.width - this.size) {
                this.direction = Math.PI - this.direction;
                this.x = Math.max(0, Math.min(this.x, canvas.width - this.size));
            }

            if (this.y < 0 || this.y > canvas.height - this.size) {
                this.direction = -this.direction;
                this.y = Math.max(0, Math.min(this.y, canvas.height - this.size));
            }
        }

        draw(ctx) {
            let image = this.direction < Math.PI? this.image : this.flippedImage;
            ctx.drawImage(image, this.x, this.y, this.size, this.size);
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.name} (${this.lives})`, this.x + this.size / 2, this.y + this.size + 16);

            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y + this.size + 25, this.size * (this.lives / 3), 5);
        }

        collidesWith(other) {
            return (
                this.x < other.x + other.size &&
                this.x + this.size > other.x &&
                this.y < other.y + other.size &&
                this.y + this.size > other.y
            );
        }
    }

    class Boss {
        constructor(x, y, image) {
            this.x = x;
            this.y = y;
            this.direction = Math.random() * 2 * Math.PI;
            this.size = 64;
            this.speed = 300;
            this.lives = 5;
            this.image = image;
            this.cooldown = 5;
            this.nextDashTime = 0;
        }

        update(time) {
            if (time >= this.nextDashTime) {
                this.direction = Math.random() * 2 * Math.PI;
                this.nextDashTime = time + this.cooldown;
            }
            this.x += Math.cos(this.direction) * this.speed * deltaTime;
            this.y += Math.sin(this.direction) * this.speed * deltaTime;

            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;
        }

        draw(ctx) {
            ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
        }

        collidesWith(dancer) {
            return (
                this.x < dancer.x + dancer.size &&
                this.x + this.size > dancer.x &&
                this.y < dancer.y + dancer.size &&
                this.y + this.size > dancer.y
            );
        }
    }

    function loadImages(sources, callback) {
        let images = {};
        let loadedImages = 0;
        let numImages = 0;

        for (let src in sources) {
            numImages++;
        }

        for (let src in sources) {
            images[src] = new Image();
            images[src].onload = function () {
                if (++loadedImages >= numImages) {
                    callback(images);
                }
            };
            images[src].src = sources[src];
        }
    }

    async function loadNames(url) {
        const response = await fetch(url);
        const text = await response.text();
        return text.split('\n').map(name => name.trim()).filter(name => name.length > 0);
    }

    async function initDancers(images) {
        const names = await loadNames('assets/names.txt');
        for (let i = 0; i < names.length; i++) {
            let x = Math.random() * (canvas.width - 48);
            let y = Math.random() * (canvas.height - 48);
            dancers.push(new Dancer(names[i], x, y, images.dancer, images.dancer_flipped));
        }
        spawnBoss(images);
    }

    function spawnBoss(images) {
        boss = new Boss(Math.random() * canvas.width, Math.random() * canvas.height, images.boss);
    }

    function checkCollisions() {
        for (let i = 0; i < dancers.length; i++) {
            for (let j = i + 1; j < dancers.length; j++) {
                if (dancers[i].collidesWith(dancers[j])) {
                    dancers[i].lives -= 1;
                    dancers[j].lives -= 1;
                }
            }
        }
        dancers = dancers.filter(dancer => dancer.lives > 0 || dancer === winner);
        if (dancers.length === 1 &&!winner) {
            winner = dancers[0];
        }
    }

    function triggerRandomEvent() {
        const event = Math.random();
        if (event < 0.1) {
            const randomEvent = Math.random();
            if (randomEvent < 0.5) {
                dancers.forEach(dancer => dancer.speed *= 1.5);
                console.log("Dancers speed up!");
            } else {
                const newDancers = dancers.map(dancer => new Dancer(
                    dancer.name,
                    Math.random() * canvas.width,
                    Math.random() * canvas.height,
                    dancer.image,
                    dancer.flippedImage
                ));
                dancers.push(...newDancers);
                console.log("Dancers multiplied!");
            }
        }
    }

    function render(deltaTime) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        dancers.forEach(dancer => {
            dancer.update(deltaTime);
            dancer.draw(ctx);
        });

        if (boss) {
            boss.update(time);
            dancers.forEach((dancer, index) => {
                if (boss.collidesWith(dancer)) {
                    dancers.splice(index, 1);
                    boss.lives--;
                    if (boss.lives <= 0) {
                        boss = null;
                    }
                }
            });
            boss.draw(ctx);
        }

        if (waiting) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PRESS ENTER TO START', canvas.width / 2, canvas.height / 2);
        } else if (winner) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Winner: ${winner.name}`, canvas.width / 2, canvas.height / 2);
            restartButton.style.display = 'block';
        }
    }

    let lastTime = 0;
    function gameLoop(time) {
        let deltaTime = (time - lastTime) / 1000;
        lastTime = time;
        if (!waiting &&!winner) {
            checkCollisions();
            eventTimer += deltaTime;
            if (eventTimer >= 10) {
                triggerRandomEvent();
                eventTimer = 0;
            }
        }
        render(deltaTime);
        requestAnimationFrame(gameLoop);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            waiting = false;
        }
    });

    startButton.addEventListener('click', () => {
        waiting = false;
    });

    restartButton.addEventListener('click', () => {
        location.reload();
    });

    loadImages({
        dancer: 'assets/dancer.png',
        dancer_flipped: 'assets/dancer_flipped.png',
        boss: 'assets/boss/i.jpeg'
    }, (images) => {
        initDancers(images);
        requestAnimationFrame(gameLoop);
    });
});
