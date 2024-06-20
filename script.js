document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('raffleCanvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');

    let dancers = [];
    let waiting = true;
    let winner = null;
    let eventTimer = 0;
    let restartTimeout = null;
    let music = null;
    let musicVolume = 0;

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
            this.speed = 100; // Initial speed
        }

        update(deltaTime) {
            this.x += Math.cos(this.direction) * this.speed * deltaTime;
            this.y += Math.sin(this.direction) * this.speed * deltaTime;

            // Boundary check and reflection
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
            let image = this.direction < Math.PI ? this.image : this.flippedImage;
            ctx.drawImage(image, this.x, this.y, this.size, this.size);
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.name} (${this.lives})`, this.x + this.size / 2, this.y + this.size + 16);

            // Display health bar
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
        if (dancers.length === 0 && !winner) {
            winner = 'tie';
            restartTimeout = setTimeout(restartGame, 10000); // Restart game after 10 seconds
        } else if (dancers.length === 1 && !winner) {
            winner = dancers[0];
            restartTimeout = setTimeout(restartGame, 10000); // Restart game after 10 seconds
        }
    }

    function triggerRandomEvent() {
        const event = Math.random();
        if (event < 0.1) {
            // 10% chance to trigger an event
            const randomEvent = Math.random();
            if (randomEvent < 0.5) {
                // 50% chance for "Dancer Speed Up"
                dancers.forEach(dancer => dancer.speed *= 1.5);
                console.log("Dancers speed up!");
            } else {
                // 50% chance for "Multiplying of Dancers"
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

    function playRandomMusic() {
        const musicFiles = [
            'assets/music/bg1.mp3',
            'assets/music/bg2.mp3',
            'assets/music/bg3.mp3'
        ];

        const randomIndex = Math.floor(Math.random() * musicFiles.length);
        const musicSrc = musicFiles[randomIndex];

        music = new Audio(musicSrc);
        music.loop = true;
        music.volume = 0;
        music.play();

        // Fade in music
        const fadeInterval = setInterval(() => {
            musicVolume += 0.05;
            music.volume = Math.min(musicVolume, 1);
            if (musicVolume >= 1) {
                clearInterval(fadeInterval);
            }
        }, 200);
    }

    function stopMusic() {
        if (music) {
            // Fade out music
            const fadeInterval = setInterval(() => {
                musicVolume -= 0.05;
                music.volume = Math.max(musicVolume, 0);
                if (musicVolume <= 0) {
                    clearInterval(fadeInterval);
                    music.pause();
                }
            }, 200);
        }
    }

    function restartGame() {
        clearTimeout(restartTimeout);
        winner = null;
        dancers = [];
        music = null;
        musicVolume = 0;
        initDancers({
            dancer: 'assets/dancer.png',
            dancer_flipped: 'assets/dancer_flipped.png'
        });
        playRandomMusic();
        requestAnimationFrame(gameLoop);
    }

    function render(deltaTime) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        dancers.forEach(dancer => {
            dancer.update(deltaTime);
            dancer.draw(ctx);
        });

        if (waiting) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PRESS ENTER TO START', canvas.width / 2, canvas.height / 2);
        } else if (winner === 'tie') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`It's a Tie!`, canvas.width / 2, canvas.height / 2);
            restartButton.style.display = 'block';
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
        if (!waiting && !winner) {
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
        clearTimeout(restartTimeout);
        restartGame();
    });

    loadImages({
        dancer: 'assets/dancer.png',
        dancer_flipped: 'assets/dancer_flipped.png'
    }, (images) => {
        initDancers(images);
        playRandomMusic();
        requestAnimationFrame(gameLoop);
    });
});
