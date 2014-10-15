/* INTERVALS SUPORT */
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
	
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
            || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame){
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
	}
	
	if (!window.cancelAnimationFrame){
        window.cancelAnimationFrame = function(id) {
			if(id)
				clearTimeout(id);
        };
	}
}());

Interval = function(fps, skipFirstCall){
	if(!fps)
		fps = 0;
	
	if(!Interval.intervals[fps]){
		var callbacks = [];
		var running = false;
		var interval = false;
		
		var updates = function(){
			for(var i = 0; i < callbacks.length; i++){
				if(callbacks[i])
					callbacks[i]();
			}
			
			if(!fps)
				window.requestAnimationFrame(updates);
		};
	
	
		Interval.intervals[fps] = {
			add: function(fn){
				
				if(!skipFirstCall){
					if(fn)
						fn(0);
				}
			
				callbacks.push(fn);
				
				if(!running){
					running = true;
					interval = !fps ? window.requestAnimationFrame(updates) : setInterval(updates, 1000 / fps);
				}
				
				return fn;
			},
			remove: function(fn){
				for(var i = 0; i < callbacks.length; i++){
					if(callbacks[i] === fn){
						callbacks.splice(i, 1);
					}
				}
				
				if(callbacks.length <= 0){
					if(!fps)
						window.cancelAnimationFrame(interval);
					else
						clearInterval(interval);
						
					running = false;
				}
			}
		};
	}
	
	return Interval.intervals[fps];
}

Interval.intervals = {};
Interval.create = function(fn, fps, skipFirstCall){
	return Interval(fps, skipFirstCall).add(fn);
}

Interval.remove = function(fn){
	for(var i in Interval.intervals){
		if(Interval.intervals[i]){
			Interval.intervals[i].remove(fn);
		}
	}
}

/* BASIC CLASS SUPORT */

Base = function(propertys, extend){
  function Constructor(){
	 if ( !(this instanceof Constructor) ) {
       return new Constructor.callee(arguments);
     }
	 
	 if(Constructor.prototype.parent){
	     var scope = this;
			 
		 for(var key in propertys){
			if(Constructor.prototype[key] !== undefined){
			   this.parent[key] = function(args){
				  return extend.prototype[key].apply(scope, args);
			   }
			}
			Constructor.prototype[key] = propertys[key];
		 }
	 }
	 
	 this.self = Constructor;
	 
     if(typeof this.construct == "function")
        this.construct.apply(this, arguments);
  }
  
  if(extend){
     Constructor.prototype = extend.prototype;
	 Constructor.prototype.parent = {};
  }else{
     Constructor.prototype = propertys;
  }
  
  return Constructor;
}

Base.FN = function(ret, obj){
	return function(){
		if(obj)
			return ret.apply(this, obj);
			
		return ret; 
	}
}

Base.FireListener = function(name, check){
	return function(){
		var cb = this.options[name + 'Listener'];
		var result = undefined;
		
		if(check)
			arguments.result = check.apply(this, arguments);
		
		if(cb)
			result = cb.apply(this, arguments);
		
		return result;
	}
}

Base.options = function(update, defaults, noModify){
	var obj = {};

	for (var key in defaults) {
	    if (update[key] != undefined){
			obj[key] = update[key];
			
			if(!noModify)
				defaults[key] = update[key];
	    }else{
			obj[key] = defaults[key];
		}
	}
	
	return obj;
}



/* GAME CLASS */

SnakeGame = new Base({
	options: {
		itens: [],
		width: 100,
		height: 100
	},
	
	started: false,
	players: [],
	
	construct: function(){
		console.log('game create');
	},
	
	start: function(){
		this.randomItem();
		
		for(var p = 0; p < this.players.length; p++){
			this.players[p].run();
		}
		
		this.started = true;
	},
	
	addPlayer: function(type, options, size){
		var player = new SnakeGame[type || "Player"](options, size || 1);
		this.players.push(player);
	},
	
	randomItem: function(){
		
	}
});

NWay = new Base({
	construct: function(){
		console.log("not");
	}
})

SnakeGame.Blocks = new Base({
	options: {
		mps: 3,
		step: 6,
		size: 6,
		direction: null,
		collisionListener: Base.FN(false),
		bumpedListener: Base.FN(true),
		moveListener: Base.FN(true),
		destroyListener: Base.FN(true)
	},
	
	list: [],
	timer: null,
	orientation: null,
	
	parentBoard: null,
	
	construct: function(options, size, x, y){
		Base.options(options, this.options);
		
		if(size > 0){
			while(size){
				this.add(x, y);
				size--;
			}
		}
	},
	
	run: function(){
		var blocks = this;
		
		this.timer = setTimeout(function(){
			if(blocks.list.length > 0)
				blocks.move();
				
			blocks.run();
		}, 1000 / this.options.mps);
	},
	
	add: function(x, y){
		if(this.list.length <= 0){				
			var block = new SnakeGame.Blocks.Block();
				block.head = true;
		}else{
			var block = new SnakeGame.Blocks.Block(x || blocks[0].lx, y || blocks[0].ly);
		}
		
		this.list.push(block);
	},
	
	get: function(){
		return this.list;
	},
	
	direction: function(direction){
		if(direction && /up|down|left|right/.test(direction)){
			if( this.orientation == "up" && direction == "down" ||
				this.orientation == "down" && direction == "up" ||
				this.orientation == "left" && direction == "right" ||
				this.orientation == "right" && direction == "left"){
				return false;
			}
			
			this.options.direction = direction;
			
			return true;
		}else{
			return this.orientation;
		}
	},

	move: Base.FireListener('move', function(){
		var x = this.list[0].x;
		var y = this.list[0].y;
		var s = this.options.step;
		
		this.orientation = this.options.direction;
		
		switch(this.orientation){
			case "up":
				y -= s;
			break;
			case "down":
				y += s;
			break;
			case "left":
				x -= s;
			break;
			case "right":
				x += s;
			break;
			default:
				return null;
			break;
		}
		
		this.list[0].setXY(x, y);
		this.list[0].update();
		
		for(var i = 1; i < this.list.length; i++){
			this.list[i].setXY(this.list[i-1].lx,  this.list[i-1].ly);
			this.list[i].update();
		}
		
		return true;
	}),
	
	destroy: Base.FireListener('destroy', function(){
		while(this.list.length > 0){
			var obj = this.list.pop();
				obj.destroy();
			
			delete obj;
		}
		
		return true;
	}),
	
	
	collision: Base.FireListener('collision'),
	bumped: Base.FireListener('bumped')
});

SnakeGame.Blocks.all = [];

SnakeGame.Blocks.Block = new Base({
	options:{
		updateListener: Base.FN(true),
		collisionListener: Base.FN(false),
		bumpedListener: Base.FN(false),
		destroyListener: Base.FN(true)
	},
	
	uid: null,
	
	x:0,
	y:0,
	lx:0,
	ly:0,
	
	head: false,
	parentBlocks: null,
	
	construct: function(x, y){
		if(x && y)
			this.setXY(x , y);
			
		this.update();
		this.uid = SnakeGame.Blocks.all.length;
		
		SnakeGame.Blocks.all[this.uid] = this;
	},
	
	destroy: Base.FireListener('destroy', function(){
		delete SnakeGame.Blocks.all[this.uid];
	}),
	
	update: Base.FireListener('update'),
	bumped: Base.FireListener('bumped'),
	
	collision: Base.FireListener('collision', function(){
		for(var i = 0; i < SnakeGame.Blocks.all.length; i++){
			var otherBlock = SnakeGame.Blocks.all[i];
			var dx = Math.abs(this.x - x);
			var dy = Math.abs(this.y - y);
			
			if(otherBlock && this !== otherBlock){
				if(this.hasCollisionXY(this.x, x, this.y, y, itemRange, otherBlock.x, otherBlock.y, itemRange)){
					console.log("Colidiu", otherBlock.element);
					console.log("Colidiu", this.x, x, this.y, y);
					console.log("Colidiu", otherBlock.x, otherBlock.y);
					
					break;
				}
			}
		}
		
		return {target: otherBlock, block: this, x: x, y: y};
	}),
	
	randomBlockPosition: function(board){
		return this.setXY(this.randomBlockPositionInBoard('x'), this.randomBlockPositionInBoard('y'));
	},
	
	randomBlockPositionInBoard: function(dirORpos)
	{
		if(dirORpos == 'x') 
			dirORpos = this.parentBlocks.parentBoard.options.width / this.parentBlocks.options.size;
		else if(dirORpos == 'y') 
			dirORpos = this.parentBlocks.parentBoard.options.height / this.parentBlocks.options.size;
			
		return (random(dirORpos) * this.parentBlocks.options.size) + (this.parentBlocks.options.size * 2);
	},
	
	setX: function(p){
		this.lx = this.x || p;
		this.x = p;
		return true;
	},
	
	setY: function(p){
		this.ly = this.y || p;
		this.y = p;
		return true;
	},
	
	setXY: function(x, y){
		var bumped = false;
		
		if(this.head && x && y){
			bumped = (  x  < 0 || y  < 0 || x  > width || y  > height) ? board : false;
		
			if(bumped === false){
				bumped = this.collision();
			}
		}
	
		if(!bumped){
			this.setX(x);
			this.setY(y);
		}
	},
	
	hasCollision: function(ln, n, r, bn, br){
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
	},
	
	hasCollisionXY: function(lx, x, ly, y, r, bx, by, br){
	   return this.hasCollision(lx, x, r, bx, br) && this.hasCollision(ly, y, r, by, br);
	}
});


SnakeGame.Player = new Base({
	/*mps: 3,
	dead: false,
	
	construct: function(options, size){
		this.parent.construct(arguments);
	},
	
	bumped: function(){
		console.log("Bateu snake: " , arguments);
		this.parent.bumped();
	},
	
	collision: function(){
		console.log("Colidiu snake: " , arguments);
		this.parent.collision();
	}*/
}, SnakeGame.Blocks)



/* GAME CONTROL */

window.onload = function(){
	MyGame = new SnakeGame({
		
	});
	
	MyGame.addPlayer('Player', {
		direction: 'down',
		collisionListener: function(){
			console.log(arguments);
		}
	});
	
	/*keyMap = {
		40: Base.FN(MyGame.controlDirection, ['down']),
		39: Base.FN(MyGame.controlDirection, ['right']),
		38: Base.FN(MyGame.controlDirection, ['up']),
		37: Base.FN(MyGame.controlDirection, ['left'])
	};
	
	document.onkeydown = function (e)
	{
		if(keyMap[e.keyCode])
			keyMap[e.keyCode]();
	}*/
}