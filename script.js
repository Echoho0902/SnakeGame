document.addEventListener('DOMContentLoaded', () => {
    // 获取Canvas元素和上下文
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // 获取按钮和分数元素
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const restartBtn = document.getElementById('restartBtn');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('highScore');
    
    // 游戏配置
    const gridSize = 20; // 网格大小
    const gameSpeed = 150; // 游戏速度（毫秒）
    
    // 游戏状态
    let snake = [];
    let food = {};
    let direction = 'right';
    let nextDirection = 'right';
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    let gameInterval;
    let isPaused = false;
    let isGameOver = true;
    
    // 动画相关变量
    let foodAnimationFrame = 0;
    let snakeAnimationFrame = 0;
    let lastFrameTime = 0;
    let newFoodPosition = null;
    let foodAppearAnimation = 0;
    let scoreAnimation = { value: 0, x: 0, y: 0, opacity: 0, active: false };
    let gameOverAnimation = 0;
    
    // 初始化游戏
    function initGame() {
        // 初始化蛇（3个格子长，位于画布中央）
        const centerX = Math.floor(canvas.width / (2 * gridSize));
        const centerY = Math.floor(canvas.height / (2 * gridSize));
        
        snake = [
            {x: centerX, y: centerY},
            {x: centerX - 1, y: centerY},
            {x: centerX - 2, y: centerY}
        ];
        
        // 生成第一个食物
        generateFood();
        
        // 重置游戏状态
        direction = 'right';
        nextDirection = 'right';
        score = 0;
        scoreElement.textContent = score;
        highScoreElement.textContent = highScore;
        
        // 更新按钮状态
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        
        // 绘制初始状态
        draw();
    }
    
    // 开始游戏
    function startGame() {
        if (isGameOver) {
            isGameOver = false;
            initGame();
        }
        
        if (!gameInterval) {
            gameInterval = setInterval(gameLoop, gameSpeed);
            isPaused = false;
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            pauseBtn.textContent = '暂停';
            
            // 启动动画循环
            lastFrameTime = performance.now();
            requestAnimationFrame(draw);
        }
    }
    
    // 暂停游戏
    function pauseGame() {
        if (isPaused) {
            gameInterval = setInterval(gameLoop, gameSpeed);
            isPaused = false;
            pauseBtn.textContent = '暂停';
        } else {
            clearInterval(gameInterval);
            gameInterval = null;
            isPaused = true;
            pauseBtn.textContent = '继续';
        }
    }
    
    // 重新开始游戏
    function restartGame() {
        clearInterval(gameInterval);
        gameInterval = null;
        isGameOver = true;
        initGame();
    }
    
    // 游戏主循环
    function gameLoop() {
        direction = nextDirection;
        moveSnake();
        
        if (checkCollision()) {
            gameOver();
            return;
        }
        
        if (eatFood()) {
            generateFood();
            updateScore();
        }
        
        // 不再直接调用draw，而是使用requestAnimationFrame
        if (!isGameOver && !isPaused) {
            requestAnimationFrame(draw);
        }
    }
    
    // 移动蛇
    function moveSnake() {
        const head = {x: snake[0].x, y: snake[0].y};
        
        switch (direction) {
            case 'up':
                head.y--;
                break;
            case 'down':
                head.y++;
                break;
            case 'left':
                head.x--;
                break;
            case 'right':
                head.x++;
                break;
        }
        
        snake.unshift(head); // 在蛇头添加新的头部
        
        // 如果没有吃到食物，移除尾部；否则保留尾部（蛇变长）
        if (head.x !== food.x || head.y !== food.y) {
            snake.pop();
        }
    }
    
    // 检查碰撞
    function checkCollision() {
        const head = snake[0];
        
        // 检查是否撞墙
        if (
            head.x < 0 ||
            head.y < 0 ||
            head.x >= canvas.width / gridSize ||
            head.y >= canvas.height / gridSize
        ) {
            return true;
        }
        
        // 检查是否撞到自己（从第5个身体部分开始检查，因为蛇不可能撞到紧邻头部的几个身体部分）
        for (let i = 4; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    // 检查是否吃到食物
    function eatFood() {
        const head = snake[0];
        return head.x === food.x && head.y === food.y;
    }
    
    // 生成食物
    function generateFood() {
        // 创建一个临时数组，存储所有可能的食物位置
        const possibleFoodPositions = [];
        
        // 遍历整个游戏区域
        for (let x = 0; x < canvas.width / gridSize; x++) {
            for (let y = 0; y < canvas.height / gridSize; y++) {
                // 检查当前位置是否被蛇占据
                let isSnake = false;
                for (const segment of snake) {
                    if (segment.x === x && segment.y === y) {
                        isSnake = true;
                        break;
                    }
                }
                
                // 如果当前位置没有被蛇占据，则添加到可能的食物位置数组中
                if (!isSnake) {
                    possibleFoodPositions.push({x, y});
                }
            }
        }
        
        // 从可能的位置中随机选择一个作为食物位置
        if (possibleFoodPositions.length > 0) {
            const randomIndex = Math.floor(Math.random() * possibleFoodPositions.length);
            newFoodPosition = possibleFoodPositions[randomIndex];
            foodAppearAnimation = 0; // 重置食物出现动画
            
            // 如果是第一次生成食物，直接设置位置
            if (!food.x && !food.y) {
                food = newFoodPosition;
            }
            // 否则，动画将在draw函数中处理食物的过渡
        }
    }
    
    // 更新分数
    function updateScore() {
        score++;
        scoreElement.textContent = score;
        
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        // 设置分数动画
        const head = snake[0];
        scoreAnimation = {
            value: '+1',
            x: head.x * gridSize + gridSize / 2,
            y: head.y * gridSize,
            opacity: 1,
            active: true
        };
    }
    
    // 游戏结束
    function gameOver() {
        clearInterval(gameInterval);
        gameInterval = null;
        isGameOver = true;
        gameOverAnimation = 0;
        
        // 游戏结束动画将在draw函数中处理
        
        // 更新按钮状态
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        
        // 启动游戏结束动画循环
        requestAnimationFrame(animateGameOver);
    }
    
    // 游戏结束动画
    function animateGameOver(timestamp) {
        if (!isGameOver) return;
        
        // 计算动画进度
        gameOverAnimation += 0.02;
        if (gameOverAnimation > 1) gameOverAnimation = 1;
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 重新绘制游戏元素
        draw();
        
        // 绘制半透明黑色遮罩，透明度随动画进度增加
        ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * gameOverAnimation})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 文字缩放效果
        const scale = 0.5 + (gameOverAnimation * 0.5);
        
        // 绘制游戏结束文字
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2 - 30);
        ctx.scale(scale, scale);
        ctx.font = '30px Poppins';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束!', 0, 0);
        ctx.restore();
        
        // 绘制分数文字，带有延迟出现效果
        if (gameOverAnimation > 0.3) {
            const scoreOpacity = (gameOverAnimation - 0.3) / 0.7;
            ctx.font = '20px Poppins';
            ctx.fillStyle = `rgba(255, 255, 255, ${scoreOpacity})`;
            ctx.textAlign = 'center';
            ctx.fillText(`得分: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
        }
        
        // 如果动画未完成，继续请求下一帧
        if (gameOverAnimation < 1) {
            requestAnimationFrame(animateGameOver);
        }
    }
    
    // 绘制游戏
    function draw() {
        // 获取当前时间戳用于动画
        const now = performance.now();
        const deltaTime = now - lastFrameTime;
        lastFrameTime = now;
        
        // 更新动画帧
        foodAnimationFrame += deltaTime * 0.003;
        snakeAnimationFrame += deltaTime * 0.002;
        
        // 处理食物出现动画
        if (newFoodPosition) {
            foodAppearAnimation += 0.1;
            if (foodAppearAnimation >= 1) {
                food = newFoodPosition;
                newFoodPosition = null;
                foodAppearAnimation = 0;
            }
        }
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制蛇
        snake.forEach((segment, index) => {
            const x = segment.x * gridSize;
            const y = segment.y * gridSize;
            const size = gridSize - 1;
            
            // 添加轻微的呼吸效果
            const breathEffect = Math.sin(snakeAnimationFrame + index * 0.2) * 0.05 + 0.95;
            const adjustedSize = size * breathEffect;
            const offset = (size - adjustedSize) / 2;
            
            // 创建渐变色
            const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
            
            if (index === 0) {
                // 蛇头
                gradient.addColorStop(0, '#388E3C');
                gradient.addColorStop(1, '#2E7D32');
                ctx.fillStyle = gradient;
                
                // 绘制圆角矩形作为蛇头
                roundRect(ctx, x + offset, y + offset, adjustedSize, adjustedSize, 6 * breathEffect);
                
                // 绘制眼睛
                ctx.fillStyle = 'white';
                
                // 根据方向确定眼睛位置
                let eyeX1, eyeY1, eyeX2, eyeY2;
                const eyeSize = gridSize / 5 * breathEffect;
                const eyeOffset = gridSize / 3 * breathEffect;
                
                switch(direction) {
                    case 'up':
                        eyeX1 = x + eyeOffset;
                        eyeY1 = y + eyeOffset;
                        eyeX2 = x + size - eyeOffset;
                        eyeY2 = y + eyeOffset;
                        break;
                    case 'down':
                        eyeX1 = x + eyeOffset;
                        eyeY1 = y + size - eyeOffset;
                        eyeX2 = x + size - eyeOffset;
                        eyeY2 = y + size - eyeOffset;
                        break;
                    case 'left':
                        eyeX1 = x + eyeOffset;
                        eyeY1 = y + eyeOffset;
                        eyeX2 = x + eyeOffset;
                        eyeY2 = y + size - eyeOffset;
                        break;
                    case 'right':
                        eyeX1 = x + size - eyeOffset;
                        eyeY1 = y + eyeOffset;
                        eyeX2 = x + size - eyeOffset;
                        eyeY2 = y + size - eyeOffset;
                        break;
                }
                
                ctx.beginPath();
                ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
                ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                
                // 绘制瞳孔，添加眨眼动画
                const blinkEffect = Math.sin(snakeAnimationFrame * 5) > 0.95 ? 0.1 : 1;
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(eyeX1, eyeY1, eyeSize / 2 * blinkEffect, 0, Math.PI * 2);
                ctx.arc(eyeX2, eyeY2, eyeSize / 2 * blinkEffect, 0, Math.PI * 2);
                ctx.fill();
                
            } else {
                // 蛇身体部分，使用渐变色
                const colorPos = (index % 5 / 5) + Math.sin(snakeAnimationFrame) * 0.1; // 创建颜色循环变化
                gradient.addColorStop(0, `hsl(${120 + colorPos * 30}, 70%, 45%)`);
                gradient.addColorStop(1, `hsl(${120 + colorPos * 30}, 70%, 35%)`);
                ctx.fillStyle = gradient;
                
                // 绘制圆角矩形作为蛇身
                const radius = index === 1 ? 5 * breathEffect : 4 * breathEffect; // 第一节身体部分圆角稍大
                roundRect(ctx, x + offset, y + offset, adjustedSize, adjustedSize, radius);
                
                // 添加高光效果
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.beginPath();
                ctx.arc(x + size / 4, y + size / 4, size / 6 * breathEffect, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // 绘制食物
        if (food.x !== undefined && food.y !== undefined) {
            const foodX = food.x * gridSize + gridSize / 2;
            const foodY = food.y * gridSize + gridSize / 2;
            
            // 添加食物脉动动画
            const pulseEffect = Math.sin(foodAnimationFrame * 2) * 0.1 + 1.1;
            const foodRadius = (gridSize / 2 - 1) * pulseEffect;
            
            // 创建食物的径向渐变
            const foodGradient = ctx.createRadialGradient(
                foodX - foodRadius / 3, foodY - foodRadius / 3, foodRadius / 5,
                foodX, foodY, foodRadius
            );
            foodGradient.addColorStop(0, '#FF5252');
            foodGradient.addColorStop(0.7, '#F44336');
            foodGradient.addColorStop(1, '#D32F2F');
            
            ctx.fillStyle = foodGradient;
            ctx.beginPath();
            ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // 添加食物的高光
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(foodX - foodRadius / 3, foodY - foodRadius / 3, foodRadius / 4, 0, Math.PI * 2);
            ctx.fill();
            
            // 添加食物的叶子，添加轻微摆动
            const leafAngle = Math.sin(foodAnimationFrame * 3) * 0.2;
            ctx.fillStyle = '#4CAF50';
            ctx.save();
            ctx.translate(foodX, foodY - foodRadius + 2);
            ctx.rotate(leafAngle);
            ctx.beginPath();
            ctx.ellipse(0, 0, foodRadius / 4, foodRadius / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // 如果有新食物位置，绘制食物出现动画
            if (newFoodPosition) {
                const newFoodX = newFoodPosition.x * gridSize + gridSize / 2;
                const newFoodY = newFoodPosition.y * gridSize + gridSize / 2;
                const newFoodRadius = (gridSize / 2 - 1) * foodAppearAnimation;
                
                // 创建新食物的径向渐变
                const newFoodGradient = ctx.createRadialGradient(
                    newFoodX - newFoodRadius / 3, newFoodY - newFoodRadius / 3, newFoodRadius / 5,
                    newFoodX, newFoodY, newFoodRadius
                );
                newFoodGradient.addColorStop(0, '#FF5252');
                newFoodGradient.addColorStop(0.7, '#F44336');
                newFoodGradient.addColorStop(1, '#D32F2F');
                
                ctx.fillStyle = newFoodGradient;
                ctx.beginPath();
                ctx.arc(newFoodX, newFoodY, newFoodRadius, 0, Math.PI * 2);
                ctx.fill();
                
                // 添加闪光效果
                ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * (1 - foodAppearAnimation)})`;
                ctx.beginPath();
                ctx.arc(newFoodX, newFoodY, newFoodRadius * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // 绘制分数动画
        if (scoreAnimation.active) {
            scoreAnimation.y -= 1;
            scoreAnimation.opacity -= 0.02;
            
            if (scoreAnimation.opacity <= 0) {
                scoreAnimation.active = false;
            } else {
                ctx.font = 'bold 16px Poppins';
                ctx.fillStyle = `rgba(76, 175, 80, ${scoreAnimation.opacity})`;
                ctx.textAlign = 'center';
                ctx.fillText(scoreAnimation.value, scoreAnimation.x, scoreAnimation.y);
            }
        }
        
        // 如果游戏未结束且未暂停，请求下一帧动画
        if (!isGameOver && !isPaused) {
            requestAnimationFrame(draw);
        }
    }
    
    // 辅助函数：绘制圆角矩形
     function roundRect(context, x, y, width, height, radius) {
         if (width < 2 * radius) radius = width / 2;
         if (height < 2 * radius) radius = height / 2;
         
         context.beginPath();
         context.moveTo(x + radius, y);
         context.arcTo(x + width, y, x + width, y + height, radius);
         context.arcTo(x + width, y + height, x, y + height, radius);
         context.arcTo(x, y + height, x, y, radius);
         context.arcTo(x, y, x + width, y, radius);
         context.closePath();
         context.fill();
     }
    
    // 键盘控制
    document.addEventListener('keydown', (e) => {
        // 如果游戏结束或暂停，不处理按键
        if (isGameOver || isPaused) return;
        
        switch (e.key) {
            // 方向键
            case 'ArrowUp':
                if (direction !== 'down') nextDirection = 'up';
                break;
            case 'ArrowDown':
                if (direction !== 'up') nextDirection = 'down';
                break;
            case 'ArrowLeft':
                if (direction !== 'right') nextDirection = 'left';
                break;
            case 'ArrowRight':
                if (direction !== 'left') nextDirection = 'right';
                break;
                
            // WASD键
            case 'w':
            case 'W':
                if (direction !== 'down') nextDirection = 'up';
                break;
            case 's':
            case 'S':
                if (direction !== 'up') nextDirection = 'down';
                break;
            case 'a':
            case 'A':
                if (direction !== 'right') nextDirection = 'left';
                break;
            case 'd':
            case 'D':
                if (direction !== 'left') nextDirection = 'right';
                break;
                
            // 空格键暂停/继续
            case ' ':
                if (!isGameOver) pauseGame();
                break;
        }
    });
    
    // 按钮事件监听
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    restartBtn.addEventListener('click', restartGame);
    
    // 移动端触摸控制
    let touchStartX = 0;
    let touchStartY = 0;
    
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault();
    }, false);
    
    canvas.addEventListener('touchmove', (e) => {
        if (isGameOver || isPaused) return;
        
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        // 确定滑动方向（水平或垂直）
        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平滑动
            if (dx > 0 && direction !== 'left') {
                nextDirection = 'right';
            } else if (dx < 0 && direction !== 'right') {
                nextDirection = 'left';
            }
        } else {
            // 垂直滑动
            if (dy > 0 && direction !== 'up') {
                nextDirection = 'down';
            } else if (dy < 0 && direction !== 'down') {
                nextDirection = 'up';
            }
        }
        
        // 更新触摸起始点
        touchStartX = touchEndX;
        touchStartY = touchEndY;
        
        e.preventDefault();
    }, false);
    
    // 初始化游戏
    initGame();
});