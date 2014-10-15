SnakeGame = function(players, width, height, itemSize){
	var mps = 10;
	var interval = 1000;
	var snakePlayers = [];
	var moveStep = 6;
	var board = this;
		board.start = false;
		
	width = width || 100;
	height = height || 100;
	itemSize = itemSize || 6;
	itemRange = itemSize / 2;
	
	var table = document.createElement('div');
		table.className = "gamezone";
		table.style.width = width + "px";
		table.style.height = height + "px";
	
	var random = function(maxValue)
	{
		return Math.floor( Math.random() * (maxValue - 1));
	}
	
	var randomDir = function(dir)
	{
		var maxValue = (dir == 'x' ? width : dir == 'y' ? height : dir) / itemSize;	
		return (random(maxValue) * itemSize) + itemRange;
	}
	
	var collision = function(ln, n, r, bn, br){
		if(ln != bn && n != bn){
		    if(ln < n){
				var s = ln;
				var e = n;
			}else{
				var s = n;
				var e = ln;
			}
		
			var IN1 = s - r;
			var EN1 = e + r;

			var IN2 = bn - br;
			var EN2 = bn + br;

			return (IN1 < EN2 && EN1 > IN2);
	   }else{
			return true;
	   }
	}
	
	var collisionXY = function(lx, x, ly, y, r, bx, by, br){
	   return collision(lx, x, r, bx, br) && collision(ly, y, r, by, br);
	}
	
	
	var Blocks = function(type, x, y, size){
		var blocks = [];
		var direction = 'down';
		var lastDirection = direction;
		var blocksScope = this;
		
		this.collision = function(){
			return false;
		};
		
		this.bumped = function(){
			return true;
		};
		
		var Block = function(x, y){
			console.log(type)
		
			this.element = document.createElement('div');
			this.element.style.width = itemSize + "px";
			this.element.style.height = itemSize + "px";
			this.element.className = type;
			
			this.head = false;
			this.parent = blocksScope;
			
			this.destroy = function(){
				console.log("remove element: ", this.element);
				delete Blocks.all[this.uid];
				this.element.parentNode.removeChild(this.element);
			}
			
			this.updatePosition =  function(){
				this.element.style.top = (this.y - itemRange) + 'px';
				this.element.style.left = (this.x - itemRange) + 'px';
			}
			
			this.randomPosition = function(){
				this.setXY(randomDir('x'), randomDir('y'));
			}
			
			this.setX = function(p){
				this.lx = this.x || p;
				this.x = p;
			}
			
			this.setY = function(p){
				this.ly = this.y || p;
				this.y = p;
			}
			
			this.collision = function(){
				return this.parent.collision.apply(this.parent, arguments);
			};
			
			this.bumped = function(){
				return this.parent.bumped.apply(this.parent, arguments);
			};
			
			this.setXY = function(x, y){
				var bumped = false;
				
				if(this.head && x && y){
					bumped = (  x  < 0 
								|| y  < 0 
								|| x  > width 
								|| y  > height) ? board : false;
				
					if(bumped === false && Blocks.all){
						for(var i = 0; i < Blocks.all.length; i++){
							var otherBlock = Blocks.all[i];
							var dx = Math.abs(this.x - x);
							var dy = Math.abs(this.y - y);
							
							if(otherBlock && this !== otherBlock){
								if(collisionXY(this.x, x, this.y, y, itemRange, otherBlock.x, otherBlock.y, itemRange)){
									console.log("Colidiu", otherBlock.element);
									console.log("Colidiu", this.x, x, this.y, y);
									console.log("Colidiu", otherBlock.x, otherBlock.y);
									
									bumped = otherBlock;
									break;
								}
							}
						}
					}
				}
			
				if(!this.collision(bumped, x, y)){
					this.setX(x);
					this.setY(y);
				}
			}
			
			if(x && y)
				this.setXY(x , y);
			else
				this.randomPosition();
				
			this.updatePosition();
			
			table.appendChild(this.element);
			
			var uid = this.uid = Blocks.all.length;
			Blocks.all[uid] = this;
			
			
		}
		
		this.getBlocks = function(ex){
			return blocks;
		}
		
		this.add = function(x, y){
			if(blocks.length <= 0){				
				var block = new Block();
					block.head = true;
			}else{
				var block = new Block(x || blocks[0].lx, y || blocks[0].ly);
			}
			
			blocks.push(block);
		}
		
		this.setDirection = function(newDirection){
			if(newDirection && /up|down|left|right/.test(newDirection)){
				
				if( lastDirection == "up" && newDirection == "down" ||
					lastDirection == "down" && newDirection == "up" ||
					lastDirection == "left" && newDirection == "right" ||
					lastDirection == "right" && newDirection == "left"){
					return false;
				}
				
				direction = newDirection;
				
				return true;
			}
		}
		
		this.move = function(){
			var x = blocks[0].x;
			var y = blocks[0].y;
			
			lastDirection = direction;
			
			switch(direction){
				case "up":
					y -= moveStep;
				break;
				case "down":
					y += moveStep;
				break;
				case "left":
					x -= moveStep;
				break;
				case "right":
					x += moveStep;
				break;	
			}
			
			blocks[0].setXY(x, y);
			blocks[0].updatePosition();
			
			for(var i = 1; i < blocks.length; i++){
				blocks[i].setXY(blocks[i-1].lx,  blocks[i-1].ly);
				blocks[i].updatePosition();
			}
			
			
		}
		
		this.destroy = function(){
			while(blocks.length > 0){
				var obj = blocks.pop();
					obj.destroy();
				
				delete obj;
			}
		}
		
		if(size > 0){
			while(size){
				this.add(x, y);
				size--;
			}
		}else{
			this.add(x, y);
		}
		
	}
	
	Blocks.all = [];
	
	var SnakePlayer = function(x, y, size){
		this.id = SnakePlayer.uid;
		this.mps = 4;
		var dead = false;
		var snake = this;
		var blocks = new Blocks('snake snake_' + this.id, x, y, size);
		
		
			blocks.bumped = function(block){
				console.log("Pegou snake: " + block.id + " com " + snake.id);
			}
			
			blocks.collision = function(block, x, y){
				if(!block)
					return false;
					
				switch(block){
					case board:
						console.log("colidiu com board: " + snake.id);
						clearTimeout(snake.timer);
						return dead = true;
					break;
					default:
						block.bumped(snake, block);
						//return dead = true;
					break;
				}				
				
				return false;
			}
		
		this.move = function(step){
			if(!dead)
				blocks.move();
		}
		
		this.direction = function(dir){
			blocks.setDirection(dir);
		}
		
		this.add = function(){
			blocks.add();
		}
		
		SnakePlayer.uid++;
		
		this.play = function(){
			this.timer = setTimeout(function(){
				if(board.start){
					snake.move();
				}
				
				snake.play();
			}, interval / this.mps);
		}
		
		this.play();
	}
	
	SnakePlayer.uid = 0;
	
	var Iten = function(type){
		this.blocks = new Blocks(type);
	}
	
	var Fruit = function(){
		this.id = Fruit.uid;
		
		var iten = new Iten('fruit fruit_' + this.id);
			iten.blocks.collision = function(block, x, y){
				iten.blocks.destroy();
				//board.addFruit();
			}
			
			iten.blocks.bumped = function(snake, block){
				console.log("Pegou Fruta");
				snake.add();
				snake.mps++;
				iten.blocks.destroy();
				board.addFruit();
			}
			
		Fruit.uid++;
	}
	
	Fruit.uid = 0;
	
	var Wall = function(){
		var iten = new Iten('wall');
			iten.blocks.bumped = function(snake){
				console.log("Colidiu wall: " + snake.id);
			}
			iten.blocks.collision = function(b, x, y){
				console.log(x, y);
			}
		this.add = function(x, y){
			iten.blocks.add(x, y);
		}
	}
	
	this.addFruit = function(){
		new Fruit();
	}
	
	this.bumped = function(){
		return true;
	}
	
	this.start = function(){	
		//this.wall();
		
		while(players){
			var player = new SnakePlayer(0, 12 * players, 1);
				snakePlayers.push(player);
			players--;
		}
		
		this.addFruit();
		
		board.start = true;
	}
	
	this.wall = function(){	
		var t = 200;
		var r = new Wall();
		
		for(var s = 0, e = width / itemSize; s <= e; s++){
			var l = (s * itemSize) - itemRange;
			r.add(l, t);
			
		}
	}
	
	
	var snakeControl = 0;
	
	this.controlSnake = function(id){
		snakeControl = id - 1;
	}
	
	this.controlDirection = function(dir, id){
		var snake = snakePlayers[id];
		
		if(snake){
			snakePlayers[id].direction(dir);
		}
	}
	
	document.body.appendChild(table);
	
}

window.onload = function(){
	Snake = new SnakeGame(2, 408, 408);
}

document.onkeydown = function (e)
{
	if(e.keyCode == 39)
	{
		Snake.controlDirection('right', 1);
	}
	if(e.keyCode == 37)
	{
		Snake.controlDirection('left', 1);
	}
	if(e.keyCode == 38)
	{
		Snake.controlDirection('up', 1);
	}
	if(e.keyCode == 40)
	{
		Snake.controlDirection('down', 1);
	}
	
	if(e.keyCode == 68)
	{
		Snake.controlDirection('right', 0);
	}
	if(e.keyCode == 65)
	{
		Snake.controlDirection('left', 0);
	}
	if(e.keyCode == 87)
	{
		Snake.controlDirection('up', 0);
	}
	if(e.keyCode == 83)
	{
		Snake.controlDirection('down', 0);
	}
	
	console.log(e.keyCode);
}