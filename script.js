document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('raffleCanvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('startButton');

    let dancers = [];
    let waiting = true;
    let frame = 0;
    let winner = null;

    class Dancer {
        constructor(name, x, y, image, flippedImage) {
            this.name = name;
            this.x = x;
            this.y = y;
            this.direction = Math.random() * 2 * Math.PI;
            this.movementInterval = Math.random() * 3;
            this.animationInterval = 0;
            this.animationFrame = 0;
            this.size = 48;
            this.image = image;
            this.flippedImage = flippedImage;
        }

        update(deltaTime) {
            this.movementInterval -= deltaTime;
            this.animationInterval += deltaTime;

            if (this.movementInterval < 0) {
                this.direction = Math.random() * 2 * Math.PI;
                this.movementInterval = Math.random() * 3;
            }

            if (this.animationInterval > 0.1) {
                this.animationFrame = (this.animationFrame + 1) % 4;  // Assuming 4 frames of animation
                this.animationInterval = 0;
            }

            this.x += Math.cos(this.direction) * deltaTime * 100;
            this.y += Math.sin(this.direction) * deltaTime * 100;

            if (this.x < 0) this.x = 0;
            if (this.x > canvas.width - this.size) this.x = canvas.width - this.size;
            if (this.y < 0) this.y = 0;
            if (this.y > canvas.height - this.size) this.y = canvas.height - this.size;
        }

        draw(ctx) {
            let image = this.direction < Math.PI ? this.image : this.flippedImage;
            let spriteX = this.animationFrame * this.size;
            ctx.drawImage(image, spriteX, 0, this.size, this.size, this.x, this.y, this.size, this.size);
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, this.x + this.size / 2, this.y + this.size + 16);
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
            images[src].onload = function() {
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
            dancers.push(new Dancer(names[i], Math.random() * canvas.width, Math.random() * canvas.height, images.dancer, images.dancer_flipped));
        }
    }

    function selectWinner() {
        if (dancers.length > 0) {
            const winnerIndex = Math.floor(Math.random() * dancers.length);
            winner = dancers[winnerIndex].name;
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
            ctx.fillText(`Winner: ${winner}`, canvas.width / 2, canvas.height / 2);
        }
    }

    let lastTime = 0;
    function gameLoop(time) {
        let deltaTime = (time - lastTime) / 1000;
        lastTime = time;
        render(deltaTime);
        requestAnimationFrame(gameLoop);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            waiting = false;
            selectWinner();
        }
    });

    startButton.addEventListener('click', () => {
        waiting = false;
        selectWinner();
    });

    loadImages({
        dancer: 'assets/dancer.png',
        dancer_flipped: 'assets/dancer_flipped.png'
    }, (images) => {
        initDancers(images);
        requestAnimationFrame(gameLoop);
    });
});
