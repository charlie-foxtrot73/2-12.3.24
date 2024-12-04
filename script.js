const url = "https://d5dsv84kj5buag61adme.apigw.yandexcloud.net";
const users = JSON.parse(localStorage.getItem('users')) || {};
const score = JSON.parse(localStorage.getItem('score')) || {};
const colors = ['red', 'green', 'blue', 'yellow'];
const sounds = {
    red: new Audio('sounds/1.mp3'),
    green: new Audio('sounds/1.mp3'),
    blue: new Audio('sounds/1.mp3'),
    yellow: new Audio('sounds/1.mp3'),
};

document.addEventListener('DOMContentLoaded', () => {


    if (document.getElementById('startGame')) {
        const gameBoard = document.getElementById('gameBoard');
        let sequence = [];
        let userSequence = [];
        let scoreCounter = 0;
    
        const startGame = () => {
            scoreCounter = 0;
            sequence = [];
            document.getElementById('score').innerText = 'Score: 0';
            nextSequence();
        };
    
        const nextSequence = () => {
            userSequence = [];
            const nextColor = Math.floor(Math.random() * colors.length);
            sequence.push(colors[nextColor]);
            showSequence();
        };
    
        const showSequence = () => {
            let i = 0;
            const intervalTime = 1500;
            const interval = setInterval(() => {
                const color = sequence[i];
                highlightColor(color);
                sounds[color].play();
    
                if (i === sequence.length - 1) {
                    clearInterval(interval);
                    setTimeout(() => {
                        enableUserInput();
                    }, 1000);
                }
                i++;
            }, intervalTime);
        };
    
        const highlightColor = (color) => {
            const colorButton = document.querySelector(`.${color}`);
            colorButton.style.opacity = '1';
    
            setTimeout(() => {
                colorButton.style.opacity = '0.5'; 
            }, 500);
        };
    
        const enableUserInput = () => {
            gameBoard.addEventListener('click', handleUserInput);
        };
    
        const handleUserInput = (e) => {
            const colorClicked = e.target.classList[1];
            if (colors.includes(colorClicked)) {
                userSequence.push(colorClicked);
                sounds[colorClicked].play();
    
                const colorButton = e.target;
                colorButton.style.opacity = '1'; 
    
                setTimeout(() => {
                    colorButton.style.opacity = '0.5'; 
                }, 300);
    
                if (userSequence[userSequence.length - 1] !== sequence[userSequence.length - 1]) {
                    alert('Game over.');
                    gameBoard.removeEventListener('click', handleUserInput);
                    sequence = [];
                    userSequence = [];
                    updateLeaderboard(localStorage.getItem('currentUser'), scoreCounter); // Добавлено
                } else if (userSequence.length === sequence.length) {
                    scoreCounter++;
                    localStorage.setItem('score', scoreCounter);
                    document.getElementById('score').innerText = 'Score: ' + scoreCounter;
                    updateScoreOnServer(scoreCounter);
                    nextSequence();
                }
                
            }
        };
    
        const updateScoreOnServer = async (score) => {
            const currentUser = localStorage.getItem('currentUser');
            if (!currentUser) {
                console.error('User not authorized.');
                return;
            }

            try {
                const response = await fetch(`${url}/players/${currentUser}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({  score }),
                    credentials: 'include',
                });
    
                if (!response.ok) {
                    throw new Error('Error w/ updating the score');
                }

                const result = await response.json();
                console.log(result); 

            } catch (error) {
                console.error('Error:', error.message || 'Unknown error');
            }
        };
    
        document.getElementById('startGame').addEventListener('click', startGame);
    
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            document.getElementById('score').innerText = score[currentUser] || 0;
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
}


const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        try {
            const login = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            const passHash = await hashPassword(password);

            const response = await fetch(`${url}/players`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", 
                },
                body: JSON.stringify({ login, password: passHash }),
            });

            if (!response.ok) {
                throw new Error('Registration error');
            }

            const result = await response.json();
            alert("User successfully registed.");

        } catch (error) {
            alert("Error: " + (error.message || "Unknown error"));
        }
    });
}



const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
            const login = document.getElementById('login').value;
            const password = document.getElementById('password').value;
            const passHash = await hashPassword(password);
            const response = await fetch(`${url}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ login, password: passHash }),
                 credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Log in error');
            }
            const result = await response.json();
            localStorage.setItem('currentUser', login);
            alert("You have logged in.");
            window.location.href = "game.html";
        } catch (error) {
            alert("Error: " + (error.message || "Unknown error"));
        }
    });
}
});

const updateLeaderboard = (username, score) => {
    const userRecords = JSON.parse(localStorage.getItem('userRecords')) || {};
    if (!userRecords[username] || score > userRecords[username]) {
        userRecords[username] = score;
        localStorage.setItem('userRecords', JSON.stringify(userRecords));
    }
};