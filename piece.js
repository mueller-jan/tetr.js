function Piece() {
  this.x;
  this.y;
  this.pos = 0;
  this.tetro;
  this.index;
  this.kickData;
  this.lockDelay = 0;
  this.shiftDelay = 0;
  this.arrDelay = 0;
  this.held = false;
  this.finesse = 0;
  this.dirty = false;
}
/**
 * Removes last active piece, and gets the next active piece from the grab bag.
 */
Piece.prototype.new = function() {
  this.pos = 0;
  this.tetro = [];
  this.held = false;
  this.finesse = 0;
  this.dirty = true;
  //TODO change this
  landed = false;

  // TODO Do this better. Make clone object func maybe.
  //for property in pieces, this.prop = piece.prop
  this.tetro = pieces[grabBag[0]].tetro;
  this.kickData = pieces[grabBag[0]].kickData;
  this.x = pieces[grabBag[0]].x;
  this.y = pieces[grabBag[0]].y;
  this.index = pieces[grabBag[0]].index;

  // Determine if we need another grab bag.
  //TODO Do this better. (make grabbag object)
  grabBag.shift();
  if (grabBag.length === 7) {
    grabBag.push.apply(grabBag, randomGenerator());
  }
  drawPreview();

  // Check for blockout.
  if (!this.moveValid(0, 0, this.tetro)) {
    gameState = 9;
    msg.innerHTML = 'BLOCK OUT!';
    menu(3);
  }
}
Piece.prototype.rotate = function(direction) {

  // Rotates tetromino.
  var rotated = [];
  if (direction === -1) {
    for (var i = this.tetro.length - 1; i >= 0; i--) {
      rotated[i] = [];
      for (var row = 0; row < this.tetro.length; row++) {
        rotated[i][this.tetro.length - 1 - row] = this.tetro[row][i];
      }
    }
  } else {
    for (var i = 0; i < this.tetro.length; i++) {
      rotated[i] = [];
      for (var row = this.tetro.length - 1; row >= 0; row--) {
        rotated[i][row] = this.tetro[row][this.tetro.length - 1 - i];
      }
    }
  }

  // Goes thorugh kick data until it finds a valid move.
  var curPos = this.pos.mod(4);
  var newPos = (this.pos + direction).mod(4);

  for (var x = 0, len = this.kickData[0].length; x < len; x++) {
    if (this.moveValid(
    this.kickData[curPos][x][0] - this.kickData[newPos][x][0],
    this.kickData[curPos][x][1] - this.kickData[newPos][x][1],
    rotated
    )) {
      this.x += this.kickData[curPos][x][0] -
                this.kickData[newPos][x][0];
      this.y += this.kickData[curPos][x][1] -
                this.kickData[newPos][x][1];
      this.tetro = rotated;
      this.pos = newPos;
      // TODO make 180 rotate count as one or just update finess 180s
      //this.finesse++;
      break;
    }
  }
}
Piece.prototype.checkShift = function() {
  // If left or right is pressed, but not both
  if (keysDown & flags.moveLeft && !(lastKeys & flags.moveLeft)) {
    this.shiftDelay = 0;
    this.arrDelay = 0;
    shiftReleased = true;
    shift = -1;
    //this.finesse++;
  } else if (keysDown & flags.moveRight && !(lastKeys & flags.moveRight)) {
    this.shiftDelay = 0;
    this.arrDelay = 0;
    shiftReleased = true;
    shift = 1;
    //this.finesse++;
  }
  //shift released
  if (shift === 1 &&
  !(keysDown & flags.moveRight) && lastKeys & flags.moveRight && keysDown & flags.moveLeft) {
    this.shiftDelay = 0;
    this.arrDelay = 0;
    shiftReleased = true;
    shift = -1;
  } else if (shift === -1 &&
  !(keysDown & flags.moveLeft) && lastKeys & flags.moveLeft && keysDown & flags.moveRight) {
    this.shiftDelay = 0;
    this.arrDelay = 0;
    shiftReleased = true;
    shift = 1;
  } else if (
  !(keysDown & flags.moveRight) && lastKeys & flags.moveRight && keysDown & flags.moveLeft) {
    shift = -1;
  } else if (
  !(keysDown & flags.moveLeft) && lastKeys & flags.moveLeft && keysDown & flags.moveRight) {
    shift = 1;
  } else if ((!(keysDown & flags.moveLeft) && lastKeys & flags.moveLeft) ||
             (!(keysDown & flags.moveRight) && lastKeys & flags.moveRight)) {
    this.shiftDelay = 0;
    this.arrDelay = 0;
    shiftReleased = true;
    shift = 0;
  }
  if (shift) {
    // 1. When key pressed instantly move over once.
    if (shiftReleased) {
      this.shift(shift);
      this.shiftDelay++;
      shiftReleased = false;
    // 2. Apply DAS delay
    } else if (this.shiftDelay < settings.DAS) {
      this.shiftDelay++;
    // 3. Once the delay is complete, move over once.
    //     Increment delay so this doesn't run again.
    } else if (this.shiftDelay === settings.DAS && settings.DAS !== 0) {
      this.shift(shift);
      if (settings.ARR !== 0) this.shiftDelay++;
    // 4. Apply ARR delay
    } else if (this.arrDelay < settings.ARR) {
      this.arrDelay++;
    // 5. If ARR Delay is full, move piece, and reset delay and repeat.
    } else if (this.arrDelay === settings.ARR && settings.ARR !== 0) {
      this.shift(shift);
    }
  }
}
Piece.prototype.shift = function(direction) {
  this.arrDelay = 0;
  if (settings.ARR === 0 && this.shiftDelay === settings.DAS) {
    for (var i = 1; i < 10; i++) {
      if (!this.moveValid(i * direction, 0, this.tetro)) {
        this.x += i * direction - direction;
        break;
      }
    }
  } else if (this.moveValid(direction, 0, this.tetro)) {
    this.x += direction;
  }
}
Piece.prototype.shiftDown = function() {
  if (this.moveValid(0, 1, this.tetro)) {
    var grav = gravityArr[settings['Soft Drop'] + 1];
    if (grav > 1)
      this.y += this.getDrop(grav);
    else
      this.y += grav;
  }
}
Piece.prototype.hardDrop = function() {
  this.y += this.getDrop(20);
  this.lockDelay = settings['Lock Delay'];
}
Piece.prototype.getDrop = function(distance) {
  for (var i = 1; i <= distance; i++) {
    if (!this.moveValid(0, i, this.tetro))
      return i - 1;
  }
  return i - 1;
}
Piece.prototype.hold = function() {
  var temp = holdPiece;
  if (!this.held) {
    if (holdPiece !== void 0) {
      // TODO make this.new take an argument (number) and remove this.
      this.pos = 0;
      this.x = pieces[holdPiece].x;
      this.y = pieces[holdPiece].y;
      this.tetro = pieces[holdPiece].tetro;
      this.kickData = pieces[holdPiece].kickData;
      holdPiece = this.index;
      this.index = temp;
      this.dirty = true;
      this.finesse = 0;
    } else {
      holdPiece = this.index;
      this.new();
    }
    this.held = true;
    //Draw Hold (make func?)
    clear(holdCtx);
    if (holdPiece === 0 || holdPiece === 3) {
      draw(pieces[holdPiece].tetro, pieces[holdPiece].x - 3,
           2 + pieces[holdPiece].y, holdCtx);
    } else {
      draw(pieces[holdPiece].tetro, pieces[holdPiece].x - 2.5,
           2 + pieces[holdPiece].y, holdCtx);
    }
  }
}
/**
 * Checks if position and orientation passed is valid.
 *  We call it for every action instead of only once a frame in case one
 *  of the actions is still valid, we don't want to block it.
 */
Piece.prototype.moveValid = function(cx, cy, tetro) {
  cx = cx + this.x;
  cy = Math.floor(cy + this.y);

  for (var x = 0; x < tetro.length; x++) {
    for (var y = 0; y < tetro[x].length; y++) {
      if (tetro[x][y] &&
      ((cx + x < 0 || cx + x >= 10 || cy + y >= 22) ||
      stack.grid[cx + x][cy + y])) {
        return false;
      }
    }
  }
  this.lockDelay = 0;
  return true;
}
Piece.prototype.update = function() {
  if (this.moveValid(0, 1, this.tetro)) {
    landed = false;
    if (settings.Gravity) {
      var grav = gravityArr[settings.Gravity - 1];
      if (grav > 1)
        this.y += this.getDrop(grav);
      else
        this.y += grav;
    } else {
      this.y += gravity;
    }
  } else {
    landed = true;
    this.y = Math.floor(this.y);
    if (this.lockDelay >= settings['Lock Delay']) {
      stack.addPiece(this.tetro);
      this.new();
    } else {
      var a = 1 / setting['Lock Delay'][settings['Lock Delay']];
      activeCtx.globalCompositeOperation = 'source-atop';
      activeCtx.fillStyle = 'rgba(0,0,0,' + a + ')';
      activeCtx.fillRect(0, 0, activeCanvas.width, activeCanvas.height);
      activeCtx.globalCompositeOperation = 'source-over';
      this.lockDelay++;
    }
  }
}
Piece.prototype.draw = function() {
  draw(this.tetro, this.x, this.y, activeCtx);
}
Piece.prototype.drawGhost = function() {
  if (!settings.Ghost && !landed) {
    draw(this.tetro, this.x,
         this.y + this.getDrop(22), activeCtx, 0);
  } else if (settings.Ghost === 1 && !landed) {
    activeCtx.globalAlpha = 0.3;
    draw(this.tetro, this.x,
         this.y + this.getDrop(22), activeCtx);
    activeCtx.globalAlpha = 1;
  }
}

var piece = new Piece();
