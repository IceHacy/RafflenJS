document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('raffleCanvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');

    let dancers = [];
    let waiting = true;
    let winner = null;
    let music = null;
    let musicVolume = 0;

    const musicFiles = [
        'assets/music/bg1.mp3',
        'assets/music/bg2.mp3',
        'assets/music/bg3.mp3'
    ];

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
        }

        update(deltaTime) {
            this.x += Math.cos(this.direction) * deltaTime * 100;
            this.y += Math.sin(this.direction) * deltaTime * 100;

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
        let numImages = Object.keys(sources).length;

        for (const src in sources) {
            images[src] = new Image();
            images[src].onload = () => {
                if (++loadedImages === numImages) {
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
        dancers = names.map(name => new Dancer(name, Math.random() * canvas.width, Math.random() * canvas.height, images.dancer, images.dancer_flipped));
    }

    function playRandomMusic() {
        const randomIndex = Math.floor(Math.random() * musicFiles.length);
        music = new Audio(musicFiles[randomIndex]);
        music.loop = true;
        music.volume = 0;
        music.play();
        fadeInMusic();
    }

    function fadeInMusic() {
        const fadeInterval = setInterval(() => {
            musicVolume += 0.05;
            if (musicVolume >= 1) {
                musicVolume = 1;
                clearInterval(fadeInterval);
            }
            music.volume = musicVolume;
        }, 200);
    }

    function stopMusic() {
        if (!music) return;
        fadeOutMusic();
    }

    function fadeOutMusic() {
        const fadeInterval = setInterval(() => {
            musicVolume -= 0.05;
            if (musicVolume <= 0) {
                musicVolume = 0;
                music.pause();
                clearInterval(fadeInterval);
            }
            music.volume = musicVolume;
        }, 200);
    }

    function checkCollisions() {
        dancers.forEach((dancer, i) => {
            dancers.slice(i + 1).forEach(other => {
                if (dancer.collidesWith(other)) {
                    dancer.lives -= 1;
                    other.lives -= 1;
                }
            });
        });
        dancers = dancers.filter(dancer => dancer.lives > 0 || dancer === winner);
        if (dancers.length === 1 &&!winner) {
            winner = dancers[0];
            setTimeout(() => {
                restartGame();
            }, 10000);
        } else if (dancers.length === 0) {
            winner = 'tie';
            setTimeout(() => {
                restartGame();
            }, 10000);
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
            if (winner === 'tie') {
                ctx.fillText(`It's a Tie`, canvas.width / 2, canvas.height / 2);
            } else {
                ctx.fillText(`Winner: ${winner.name}`, canvas.width / 2, canvas.height / 2);
            }
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
        if (e.key === 'Enter' || e.type === 'click') {
            waiting = false;
            playRandomMusic();
            requestAnimationFrame(gameLoop);
        }
    });

    startButton.addEventListener('click', () => {
        waiting = false;
        playRandomMusic();
        requestAnimationFrame(gameLoop);
    });

    restartButton.addEventListener('click', () => {
        clearTimeout(restartTimeout);
        restartGame();
    });

    let restartTimeout;
    function restartGame() {
        winner = null;
        dancers = [];
        music.pause();
        stopMusic();
        loadImages({
            dancer: 'assets/dancer.png',
            dancer_flipped: 'assets/dancer_flipped.png'
        }, (images) => {
            initDancers(images)
               .then(() => {
                    playRandomMusic();
                    waiting = true;
                    restartTimeout = setTimeout(() => {
                        waiting = false;
                    }, 10000);
                })
               .catch(console.error);
        });
    }

    loadImages({
        dancer: 'assets/dancer.png',
        dancer_flipped: 'assets/dancer_flipped.png'
    }, (images) => {
        initDancers(images)
           .then(() => {
                playRandomMusic();
                requestAnimationFrame(gameLoop);
            })
           .catch(console.error);
    });
});
