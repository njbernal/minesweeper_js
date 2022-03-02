const HEIGHT = 8;
const WIDTH = 8;
const MINES = 8;
const BOARD_HEIGHT = 500;
const BOARD_WIDTH = 500;
const CELL_HEIGHT = BOARD_HEIGHT / HEIGHT;
const CELL_WIDTH = BOARD_WIDTH / WIDTH;
const canvas = document.getElementById('canvas');
const msg = document.getElementById('msg');
let board = [];
let lost = false;
let moves_made = [];
let flags = [];
let mines = [];
let AI;

function create_board() {
    canvas.innerHTML = "";
    msg.innerHTML = "";
    board = [];
    lost = false;
    moves_made = [];
    flags = [];
    mines = [];
    AI = new MinesweeperAI(HEIGHT, WIDTH);

    // create board
    canvas.style.width = BOARD_WIDTH + WIDTH * 2 + "px";
    canvas.style.height = BOARD_WIDTH + HEIGHT * 2 + "px";
    for (let j = 0; j < HEIGHT; j++) {
        let row_div = document.createElement("div")
        row_div.className = "row"
        canvas.appendChild(row_div)
        let row = []
        for (let i = 0; i < WIDTH; i++) {
            let div = document.createElement("div");
            row.push(div)
            div.className = "box";
            div.style.width = CELL_WIDTH + "px";
            div.style.height = CELL_HEIGHT + "px";
            div.innerHTML = " ";
            div.id = `${j}${i}`;
            div.onclick = handle_click;
            div.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                handle_click(event);
            })
            row_div.appendChild(div)
        }
        board.push(row)
    }
    
    for (let i = 0; i < MINES; i++) {
        let row = Math.floor(Math.random() * HEIGHT);
        let col = Math.floor(Math.random() * WIDTH);
        mines.push(JSON.stringify([row, col]))
    }
}

function handle_click(e) {
    let target = e.target;
    let btn = e.button;

    let id = (target.getAttribute('id'));
    let row = parseInt(id[0]);
    let col = parseInt(id[1]);
    let cell = [row, col];
    let cell_s = JSON.stringify(cell);
    if (mines.includes(cell_s) && btn == 0) {
        lost = true;
        end_game();
    }
    else if (btn == 2) {
        if (!moves_made.includes(cell_s)) {
            if (!flags.includes(cell_s)) {
                flags.push(cell_s)
                board[cell[0]][cell[1]].style.backgroundImage = 'url("img/flag.png")';
                board[cell[0]][cell[1]].style.backgroundSize = '50% 50%';
                board[cell[0]][cell[1]].style.backgroundRepeat = 'no-repeat';
                board[cell[0]][cell[1]].style.backgroundPosition = 'center';
            }
            else {
                index = flags.indexOf(cell_s);
                flags.splice(index, 1);
                board[cell[0]][cell[1]].style.backgroundImage = '';
            }
        }
    }
    else {
        if (!lost && !flags.includes(cell_s)) {
            make_move(cell)
        }
    }
    if (flags.length == MINES) {
        end_game();
    }
}

function mark_mine(cell) {
    cell_s = JSON.stringify(cell);
    if (!moves_made.includes(cell_s)) {
        if (!flags.includes(cell_s)) {
            flags.push(cell_s)
            board[cell[0]][cell[1]].style.backgroundImage = 'url("img/flag.png")';
            board[cell[0]][cell[1]].style.backgroundSize = '50% 50%';
            board[cell[0]][cell[1]].style.backgroundRepeat = 'no-repeat';
            board[cell[0]][cell[1]].style.backgroundPosition = 'center';
        }
        else {
            index = flags.indexOf(cell_s);
            flags.splice(index, 1);
            board[cell[0]][cell[1]].style.backgroundImage = '';
        }
    }
}

function make_move(cell) {
    board[cell[0]][cell[1]].style.backgroundImage = '';
    moves_made.push(JSON.stringify(cell));
    let neighbors = get_neighbors(cell);
    let local_mines = get_mines(neighbors);
    board[cell[0]][cell[1]].innerHTML = local_mines;
    return neighbors;
}

function end_game() {
    let color = "";
    let message = "";
    if (lost == true) {
        message = "YOU LOST";
        color = "#aa0000";
    }
    else {
        message = "YOU WON";
        color = "#00aa00";
    }
    let div = document.createElement('div');
    div.className = 'cover';
    div.style.width = BOARD_WIDTH + WIDTH * 2 + "px";
    div.style.height = BOARD_HEIGHT + HEIGHT * 2 + "px";
    div.style.marginLeft = -WIDTH * 2 + "px";
    div.style.backgroundColor = color;
    canvas.prepend(div);

    msg.style.color = color;
    msg.innerHTML = message;

    for (i in mines) {
        mine = eval(mines[i]);
        show_mine(mine);
    }
}

function show_mine(cell) {
    board[cell[0]][cell[1]].style.backgroundImage = 'url("img/poop.png")';
    board[cell[0]][cell[1]].style.backgroundSize = '50% 50%';
    board[cell[0]][cell[1]].style.backgroundRepeat = 'no-repeat';
    board[cell[0]][cell[1]].style.backgroundPosition = 'center';
}

function get_neighbors(cell) {
    let row = cell[0];
    let col = cell[1];
    let neighbors = [];
    for (let i = -1; i < 2; i++) {
        if (row + i >= 0 && row + i < HEIGHT) {
            for (let j = -1; j < 2; j++) {
                if (col + j >= 0 && col + j < WIDTH) {
                    if (col + j == col && row + i == row) {
                        continue;
                    }
                    neighbors.push(JSON.stringify([row + i, col + j]));
                }
            }
        }
    }
    return neighbors;
}

// A Function to return how many mines are in the CELLS array (neighbors)
function get_mines(cells) {
    let local_mines = 0;
    for (let i = 0; i < cells.length; i++) {
        let cell = cells[i];
        if (mines.includes(cell)) {
            local_mines++;
        }
    }
    return local_mines;
}



// THIS WILL BE ai.js at some point when I figure out modules
class Sentence {
    constructor(cells, count) {
        this.cells = cells;
        this.mines = [];
        this.safes = [];
        this.count = count;
    }
    known_mines() {
        return this.mines;
    }
    known_safes() {
        return this.safes;
    }
    mark_mine(cell) {
        if (this.cells.includes(cell)) {
            this.count--;
            this.mines.push(cell);
            let id = this.cells.indexOf(cell);
            this.cells.splice(id, 1);
        }
    }
    mark_safe(cell) {
        if (this.cells.includes(cell)) {
            this.safes.push(cell);
            let id = this.cells.indexOf(cell);
            this.cells.splice(id, 1);
        }
    }
}

class MinesweeperAI {
    constructor(height, width) {
        this.height = height;
        this.width = width;
        this.mines = [];
        this.safes = [];
        this.knowledge = [];
    }
    mark_mine(cell) {
        this.mines.push(JSON.stringify(cell));
        for (let i in this.knowledge) {
            this.knowledge[i].mark_mine(JSON.stringify(cell));
        }
    }
    mark_safe(cell) {
        this.safes.push(JSON.stringify(cell));
        for (let i in this.knowledge) {
            this.knowledge[i].mark_safe(JSON.stringify(cell));
        }
    }
    make_safe_move() {
        let difference = this.safes.filter(x => moves_made.indexOf(x) === -1);
        // console.log(`safes: ${this.safes}`);
        // console.log(`moves: ${moves_made}`);
        // console.log(`diff: ${difference}`);
        if (difference.length == 0) {
            return null;
        } 
        else {
            let cell = difference.pop();
            console.log(`AI making safe move ${cell}`)
            cell = JSON.parse(cell);
            // console.log(`making safe move ${cell}`);
            return cell;
        }
    }
    make_random_move() {
        console.log("No safe moves available. Making random move");
        while (true) {
            let row = Math.floor(Math.random() * HEIGHT);
            let col = Math.floor(Math.random() * WIDTH);
            let cell = [row, col];
            if (!moves_made.includes(JSON.stringify(cell))) {
                return cell;
            }
        }
    }
    add_knowledge(move) {
        let neighbors = make_move(move);
        let local_mines = get_mines(neighbors);
        moves_made.push(JSON.stringify(move));
        let diff1 = neighbors.filter(x => this.safes.indexOf(x) === -1);
        let difference = diff1.filter(x => moves_made.indexOf(x) === -1);
        // console.log(`difference: ${difference}`);
        // console.log(difference);
        if (local_mines == difference.length) {
            for (let i in difference) {
                if (!this.mines.includes(difference[i])) {
                    mark_mine(JSON.parse(difference[i]));
                    this.mark_mine(JSON.parse(difference[i]));
                }
            }
        }
        else if (local_mines == 0) {
            for (let i in difference) {
                // console.log(`safe: ${neighbors[i]}`);
                let cell = difference[i];
                if (!moves_made.includes(cell)) {
                    this.mark_safe(JSON.parse(difference[i]));
                }
            }
        }
        
        // AI portion of knowledge
        if (difference.length > 0) {
            let diff = [...difference];
            for (let i in diff) {
                if (this.mines.includes(diff[i])) {
                    difference.splice(i, 1);
                    this.mark_mine(JSON.parse(diff[i]));
                    local_mines--;
                }
            }

            let s = new Sentence(difference, local_mines);
            this.knowledge.push(s);
            
            let know = [...this.knowledge];
            for (let i = 0; i < know.length; i++) {
                let cs = [...know[i].cells];
                if (cs.length == 0) {
                    this.knowledge.splice(i, 1);
                }
                else if (know[i].count == 0) {
                        //this.mark_safe(JSON.parse(this.knowledge[i].cells[j]));
                    for (let j = 0; j < cs.length; j++) {
                        let cell_to_change = JSON.parse(cs[j]);
                        if (!this.mines.includes(JSON.stringify(cell_to_change))) {
                            if (!moves_made.includes(JSON.stringify(cell_to_change))) {
                                this.mark_safe(cell_to_change);
                            }
                        }
                    }
                }
                else if (cs.length == know[i].count) {
                    for (let j in know[i].cells) {
                        let cell_to_change = JSON.parse(cs[j]);
                        if (!this.mines.includes(JSON.stringify(cell_to_change))) {
                            // console.log(`marking mine ${cell_to_change}`);
                            this.mark_mine(cell_to_change);
                            mark_mine(cell_to_change);
                        }
                    }
                }
            }
        }
        let win = check_win();
        if (win) {
            end_game();
        }
    }
}

function check_win() {
    let counter = 0;
    if (flags.length == MINES) {
        for (let i in flags) {
            if (mines.includes(flags[i])) {
                counter++;
            }
        }
    }
    if (counter == MINES) {
        return true;
    }
    else {
        return false;
    }
}

function ai_move() {
    if (!lost) {
        let move = AI.make_safe_move();
        if (move == null) {
            move = AI.make_random_move();
        }
        if (mines.includes(JSON.stringify(move))) {
            lost = true;
            end_game();
        }
        else {
            AI.add_knowledge(move);
        }
    }
}


function main() {
    reset_btn = document.getElementById('reset');
    ai_btn = document.getElementById('ai');

    // draw the board
    reset_btn.onclick = create_board;
    ai_btn.onclick = ai_move;
    create_board();
    
}
main(); 