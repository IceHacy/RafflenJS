document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('raffleCanvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('startButton');

    let dancers = [];
    let waiting = true;
    let frame = 0;

    class Dancer {
        constructor(name, x, y, image, flippedImage) {
            this.name = name;
            this.x = x;
            this.y = y;
            this.direction = Math.random() * 2 * Math.PI;
            this.movementInterval = Math.random() * 3;
            this.animationInterval = 0;
            this.animation = false;
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
                this.animation = !this.animation;
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
            ctx.drawImage(image, this.x, this.y, this.size, this.size);
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

    function initDancers(images) {
        for (let i = 0; i < 100; i++) {
            dancers.push(new Dancer(`Dancer ${i}`, Math.random() * canvas.width, Math.random() * canvas.height, images.dancer, images.dancer_flipped));
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
        }
    });

    startButton.addEventListener('click', () => {
        waiting = false;
    });

    loadImages({
        dancer: 'assets/dancer.png',
        dancer_flipped: 'assets/dancer_flipped.png'
    }, (images) => {
        initDancers(images);
        requestAnimationFrame(gameLoop);
    });
});
