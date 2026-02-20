<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DOTS & BOXES</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Work+Sans:wght@400;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --player1-color: #e63946;
            --player2-color: #457b9d;
            --dot-color: #2b2d42;
            --line-color: #8d99ae;
            --hover-color: #edf2f4;
            --bg-light: #f8f9fa;
            --bg-white: #ffffff;
            --shadow: rgba(0, 0, 0, 0.08);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Work Sans', sans-serif;
            background: linear-gradient(135deg, #f5f3f4 0%, #e8e8e4 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
            color: #2b2d42;
        }

        .container {
            max-width: 900px;
            width: 100%;
        }

        h1 {
            font-family: 'Playfair Display', serif;
            font-size: 3.5rem;
            text-align: center;
            margin-bottom: 0.5rem;
            color: #2b2d42;
            letter-spacing: 0.05em;
        }

        .subtitle {
            text-align: center;
            font-size: 1rem;
            color: #8d99ae;
            margin-bottom: 2.5rem;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            font-weight: 600;
        }

        .game-area {
            background: var(--bg-white);
            border-radius: 24px;
            padding: 3rem;
            box-shadow: 
                0 10px 40px var(--shadow),
                0 2px 8px var(--shadow);
        }

        .scoreboard {
            display: flex;
            justify-content: space-around;
            margin-bottom: 2.5rem;
            gap: 2rem;
        }

        .player {
            flex: 1;
            text-align: center;
            padding: 1.5rem;
            border-radius: 16px;
            background: var(--bg-light);
            transition: all 0.3s ease;
            border: 3px solid transparent;
        }

        .player.active {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px var(--shadow);
        }

        .player.active.player1 {
            border-color: var(--player1-color);
            background: #fff5f5;
        }

        .player.active.player2 {
            border-color: var(--player2-color);
            background: #f0f7fa;
        }

        .player-name {
            font-weight: 600;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 0.5rem;
            color: #8d99ae;
        }

        .player.active .player-name {
            color: #2b2d42;
        }

        .player-score {
            font-family: 'Playfair Display', serif;
            font-size: 3rem;
            font-weight: 700;
        }

        .player1 .player-score {
            color: var(--player1-color);
        }

        .player2 .player-score {
            color: var(--player2-color);
        }

        .board-container {
            display: flex;
            justify-content: center;
            margin-bottom: 2rem;
        }

        #gameBoard {
            position: relative;
            display: inline-block;
        }

        .dot {
            position: absolute;
            width: 12px;
            height: 12px;
            background: var(--dot-color);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            z-index: 10;
        }

        .line {
            position: absolute;
            background: var(--line-color);
            cursor: pointer;
            transition: all 0.2s ease;
            opacity: 0.3;
        }

        .line:hover {
            opacity: 0.6;
            background: #2b2d42;
            transform: scale(1.05);
        }

        .line.horizontal {
            height: 4px;
            transform: translateY(-50%);
        }

        .line.vertical {
            width: 4px;
            transform: translateX(-50%);
        }

        .line.filled {
            opacity: 1;
            cursor: default;
            transform: scale(1);
        }

        .line.filled.player1 {
            background: var(--player1-color);
        }

        .line.filled.player2 {
            background: var(--player2-color);
        }

        .line.filled:hover {
            transform: scale(1);
        }

        .box {
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: bold;
            border-radius: 8px;
            opacity: 0;
            transform: scale(0.8);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .box.filled {
            opacity: 1;
            transform: scale(1);
        }

        .box.player1 {
            background: linear-gradient(135deg, rgba(230, 57, 70, 0.15), rgba(230, 57, 70, 0.25));
            border: 2px solid rgba(230, 57, 70, 0.3);
            color: var(--player1-color);
        }

        .box.player2 {
            background: linear-gradient(135deg, rgba(69, 123, 157, 0.15), rgba(69, 123, 157, 0.25));
            border: 2px solid rgba(69, 123, 157, 0.3);
            color: var(--player2-color);
        }

        .controls {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }

        button {
            font-family: 'Work Sans', sans-serif;
            font-size: 1rem;
            font-weight: 600;
            padding: 1rem 2.5rem;
            background: #2b2d42;
            color: white;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            box-shadow: 0 4px 16px rgba(43, 45, 66, 0.2);
            transition: all 0.3s ease;
        }

        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 24px rgba(43, 45, 66, 0.3);
            background: #1a1b2e;
        }

        button:active {
            transform: translateY(0);
        }

        .winner-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        .winner-modal.show {
            opacity: 1;
            pointer-events: all;
        }

        .winner-content {
            background: white;
            padding: 3rem 4rem;
            border-radius: 24px;
            text-align: center;
            transform: scale(0.8);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .winner-modal.show .winner-content {
            transform: scale(1);
        }

        .winner-content h2 {
            font-family: 'Playfair Display', serif;
            font-size: 3rem;
            margin-bottom: 1rem;
            color: #2b2d42;
        }

        .winner-content p {
            font-size: 1.5rem;
            margin-bottom: 2rem;
            color: #8d99ae;
        }

        .winner-content .winner-name {
            font-weight: 700;
            font-size: 2rem;
        }

        @media (max-width: 768px) {
            h1 {
                font-size: 2.5rem;
            }

            .game-area {
                padding: 2rem 1.5rem;
            }

            .scoreboard {
                gap: 1rem;
            }

            .player {
                padding: 1rem;
            }

            .player-score {
                font-size: 2rem;
            }

            #gameBoard {
                transform: scale(0.8);
                transform-origin: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>DOTS & BOXES</h1>
        <p class="subtitle">Connect the Dots</p>

        <div class="game-area">
            <div class="scoreboard">
                <div class="player player1 active">
                    <div class="player-name">Player 1</div>
                    <div class="player-score" id="score1">0</div>
                </div>
                <div class="player player2">
                    <div class="player-name">Player 2</div>
                    <div class="player-score" id="score2">0</div>
                </div>
            </div>

            <div class="board-container">
                <div id="gameBoard"></div>
            </div>

            <div class="controls">
                <button onclick="game.newGame()">New Game</button>
            </div>
        </div>
    </div>

    <div class="winner-modal" id="winnerModal">
        <div class="winner-content">
            <h2>Game Over!</h2>
            <p><span class="winner-name" id="winnerName"></span> Wins!</p>
            <button onclick="game.newGame(); document.getElementById('winnerModal').classList.remove('show');">
                Play Again
            </button>
        </div>
    </div>

    <script>
        const game = {
            rows: 6,
            cols: 6,
            cellSize: 80,
            currentPlayer: 1,
            scores: [0, 0],
            lines: {
                horizontal: [],
                vertical: []
            },
            boxes: [],

            init() {
                this.setupBoard();
                this.newGame();
            },

            setupBoard() {
                const board = document.getElementById('gameBoard');
                const width = this.cols * this.cellSize;
                const height = this.rows * this.cellSize;
                
                board.style.width = width + 'px';
                board.style.height = height + 'px';

                // Initialize line arrays
                this.lines.horizontal = Array(this.rows + 1).fill(null).map(() => Array(this.cols).fill(0));
                this.lines.vertical = Array(this.rows).fill(null).map(() => Array(this.cols + 1).fill(0));
                this.boxes = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));

                this.renderBoard();
            },

            renderBoard() {
                const board = document.getElementById('gameBoard');
                board.innerHTML = '';

                // Draw dots
                for (let row = 0; row <= this.rows; row++) {
                    for (let col = 0; col <= this.cols; col++) {
                        const dot = document.createElement('div');
                        dot.className = 'dot';
                        dot.style.left = (col * this.cellSize) + 'px';
                        dot.style.top = (row * this.cellSize) + 'px';
                        board.appendChild(dot);
                    }
                }

                // Draw horizontal lines
                for (let row = 0; row <= this.rows; row++) {
                    for (let col = 0; col < this.cols; col++) {
                        const line = document.createElement('div');
                        line.className = 'line horizontal';
                        line.style.left = (col * this.cellSize) + 'px';
                        line.style.top = (row * this.cellSize) + 'px';
                        line.style.width = this.cellSize + 'px';
                        
                        if (this.lines.horizontal[row][col] === 0) {
                            line.onclick = () => this.drawLine('horizontal', row, col);
                        } else {
                            line.classList.add('filled', `player${this.lines.horizontal[row][col]}`);
                        }
                        
                        board.appendChild(line);
                    }
                }

                // Draw vertical lines
                for (let row = 0; row < this.rows; row++) {
                    for (let col = 0; col <= this.cols; col++) {
                        const line = document.createElement('div');
                        line.className = 'line vertical';
                        line.style.left = (col * this.cellSize) + 'px';
                        line.style.top = (row * this.cellSize) + 'px';
                        line.style.height = this.cellSize + 'px';
                        
                        if (this.lines.vertical[row][col] === 0) {
                            line.onclick = () => this.drawLine('vertical', row, col);
                        } else {
                            line.classList.add('filled', `player${this.lines.vertical[row][col]}`);
                        }
                        
                        board.appendChild(line);
                    }
                }

                // Draw boxes
                for (let row = 0; row < this.rows; row++) {
                    for (let col = 0; col < this.cols; col++) {
                        if (this.boxes[row][col] !== 0) {
                            const box = document.createElement('div');
                            box.className = `box filled player${this.boxes[row][col]}`;
                            box.style.left = (col * this.cellSize + 6) + 'px';
                            box.style.top = (row * this.cellSize + 6) + 'px';
                            box.style.width = (this.cellSize - 12) + 'px';
                            box.style.height = (this.cellSize - 12) + 'px';
                            box.textContent = this.boxes[row][col];
                            board.appendChild(box);
                        }
                    }
                }
            },

            drawLine(type, row, col) {
                // Mark the line as drawn
                this.lines[type][row][col] = this.currentPlayer;

                // Check for completed boxes
                let boxesCompleted = 0;

                if (type === 'horizontal') {
                    // Check box above
                    if (row > 0 && this.isBoxComplete(row - 1, col)) {
                        this.boxes[row - 1][col] = this.currentPlayer;
                        boxesCompleted++;
                    }
                    // Check box below
                    if (row < this.rows && this.isBoxComplete(row, col)) {
                        this.boxes[row][col] = this.currentPlayer;
                        boxesCompleted++;
                    }
                } else {
                    // Check box to the left
                    if (col > 0 && this.isBoxComplete(row, col - 1)) {
                        this.boxes[row][col - 1] = this.currentPlayer;
                        boxesCompleted++;
                    }
                    // Check box to the right
                    if (col < this.cols && this.isBoxComplete(row, col)) {
                        this.boxes[row][col] = this.currentPlayer;
                        boxesCompleted++;
                    }
                }

                // Update score if boxes were completed
                if (boxesCompleted > 0) {
                    this.scores[this.currentPlayer - 1] += boxesCompleted;
                    this.updateScore();
                } else {
                    // Switch player if no boxes were completed
                    this.switchPlayer();
                }

                // Re-render the board
                this.renderBoard();

                // Check if game is over
                this.checkGameOver();
            },

            isBoxComplete(row, col) {
                return this.lines.horizontal[row][col] !== 0 &&
                       this.lines.horizontal[row + 1][col] !== 0 &&
                       this.lines.vertical[row][col] !== 0 &&
                       this.lines.vertical[row][col + 1] !== 0 &&
                       this.boxes[row][col] === 0;
            },

            switchPlayer() {
                this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                
                document.querySelector('.player1').classList.toggle('active');
                document.querySelector('.player2').classList.toggle('active');
            },

            updateScore() {
                document.getElementById('score1').textContent = this.scores[0];
                document.getElementById('score2').textContent = this.scores[1];
            },

            checkGameOver() {
                const totalBoxes = this.rows * this.cols;
                const filledBoxes = this.scores[0] + this.scores[1];

                if (filledBoxes === totalBoxes) {
                    setTimeout(() => {
                        const modal = document.getElementById('winnerModal');
                        const winnerName = document.getElementById('winnerName');
                        
                        if (this.scores[0] > this.scores[1]) {
                            winnerName.textContent = `Player 1 (${this.scores[0]} - ${this.scores[1]})`;
                            winnerName.style.color = 'var(--player1-color)';
                        } else if (this.scores[1] > this.scores[0]) {
                            winnerName.textContent = `Player 2 (${this.scores[1]} - ${this.scores[0]})`;
                            winnerName.style.color = 'var(--player2-color)';
                        } else {
                            winnerName.textContent = `It's a Tie! (${this.scores[0]} - ${this.scores[1]})`;
                            winnerName.style.color = '#2b2d42';
                        }
                        
                        modal.classList.add('show');
                    }, 500);
                }
            },

            newGame() {
                this.currentPlayer = 1;
                this.scores = [0, 0];
                this.lines.horizontal = Array(this.rows + 1).fill(null).map(() => Array(this.cols).fill(0));
                this.lines.vertical = Array(this.rows).fill(null).map(() => Array(this.cols + 1).fill(0));
                this.boxes = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
                
                this.updateScore();
                this.renderBoard();
                
                document.querySelector('.player1').classList.add('active');
                document.querySelector('.player2').classList.remove('active');
            }
        };

        game.init();
    </script>
</body>
</html>
