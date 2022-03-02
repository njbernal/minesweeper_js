import { make_move, get_mines, check_win, mark_mine, end_game } from './game.js';

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
        this.moves_made = [];
        this.tracker = document.getElementById('temp');
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
        let difference = this.safes.filter(x => this.moves_made.indexOf(x) === -1);
        // console.log(`safes: ${this.safes}`);
        // console.log(`moves: ${this.moves_made}`);
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
            let row = Math.floor(Math.random() * this.height);
            let col = Math.floor(Math.random() * this.width);
            let cell = [row, col];
            if (!this.moves_made.includes(JSON.stringify(cell))) {
                return cell;
            }
        }
    }
    add_knowledge(move) {
        let neighbors = make_move(move);
        let local_mines = get_mines(neighbors);
        this.moves_made.push(JSON.stringify(move));

        // Going to remove the move from safes if it is in there
        let id = this.safes.indexOf(move);
        this.safes.splice(id, 1);
        
        // Difference should be neighbors, excluding anything marked safe OR moves made 
        let difference = neighbors.filter(x => this.safes.indexOf(x) === -1);
        difference = difference.filter(x => this.moves_made.indexOf(x) === -1);
        
        // This will include any mines already touching this cell
        let marked_mines = difference.filter(x => this.mines.includes(x));

        // remove from 'difference' any already identified mines, and reduce mine count
        // This way we start the sentence with only the unknowns
        if (marked_mines.length != 0) {
            marked_mines.forEach(function(cell, id) {
                let index = difference.indexOf(cell);
                difference.splice(index, 1);
                local_mines--;
            });
        }

        // If we know there are no mines, mark all open neighbors as safe
        let cells = [...difference];
        if (local_mines == 0) {
            cells.forEach((item) => {
                // console.log(`item: ${item}`); 
                let id = difference.indexOf(item);
                difference.splice(id, 1);
                this.mark_safe(JSON.parse(item));
            }, this);
        }

        // console.log(`Safes: ${this.safes.length}: ${this.safes}`);
        
        // create the sentence if there are any unknowns left 
        if (difference.length != 0) {
            let s = new Sentence(difference, local_mines);
            
            let new_set = [];
            let new_count = [];
            let k_copy = [...this.knowledge];
            k_copy.forEach( (item) => {
                if (item.cells.length != 0) {
                    if (this.is_subset(item.cells, s.cells)) {
                        if (item.cells.length >= s.cells.length) {
                            new_set = item.cells.filter( (x) => s.cells.indexOf(x) === -1);
                        }
                        else {
                            new_set = s.cells.filter( (x) => item.cells.indexOf(x) === -1);
                        }
                        // console.log(`subsets: ${item.cells} x ${s.cells} = ${new_set}`);
                        new_count = Math.abs(item.count - s.count);

                        console.log(`${item.count} x ${s.count} x ${new_count}`);
                        let new_sentence = new Sentence(new_set, new_count);
                        this.knowledge.push(new_sentence);
                    }
                }
            });
            this.knowledge.push(s);
        }

        // This is for debugging only
        // this.make_table();

        // Iterate through knowledge
        let k_copy = [...this.knowledge];
        k_copy.forEach( (item) => {
            
            let cells = [...item.cells];
            // If cells remaining and item are equal, they're all mines
            if (item.count == 0) {
                cells.forEach( (item) => {
                    this.mark_safe(JSON.parse(item));
                });
            }
            if (cells.length == item.count) {
                cells.forEach( (item) => {
                    mark_mine(JSON.parse(item));
                    this.mark_mine(JSON.parse(item));
                }, this);
            }
        }, this);

        let win = check_win();
        if (win) {
            end_game();
        }
    }

    // A function to return true if one array is subset of the other (in either direction)
    is_subset(arr1, arr2) {
        if (arr1.every(val => arr2.includes(val)) || arr2.every(val => arr1.includes(val))) {
            return true;
        }
        else {
            return false;
        }
    }

    // part of debugging only
    make_table() {
        let html = '<table class="table">';
        html += '<thead><th>Mines</th><th>Cells</th></thead>'
        this.knowledge.forEach( (item, index) => {
            let line = `<tr><td>${item.count}</td><td>${item.cells}</td></tr>`;
            html += line;
        });
        html += '</table>';
        this.tracker.innerHTML = html;
    }
}

export { MinesweeperAI };