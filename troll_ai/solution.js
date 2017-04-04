function Stacker(){

  /*------------------------class variables--------------------------*/

  // assume troll always starts in the center.
  var map = new Array;
  for (var i = 0; i < 36; i++){
    map[i] = new Array
    for (var j = 0; j < 36; j++){
      map[i][j] = null
    }
  }


  var position = {x: 18, y: 18}

  var towerCell,
      towerLaps   = 0,
      towerStairs = {}

  var holdingBlock = false,
      moves        = [],
      blocks       = [];

  var procedures = {
    findTheTower: 1,
    layFirstStairs: 2,
    upgradeTheStairs: 3,
    climbDownStairs: 4
  }

  var presentProcedure = 1;

  var goal        = null,
      openList    = [],
      closedList  = [],
      path        = [];

  var completedStairs = [],
    offStairs         = true,
    exploreGoal       = null,
    reAttempt         = 0


  /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  /*-----------------------------helper functions-----------------------------*/
  /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

  function updateMap(currentCell){
    if (map[currentCell.x - 1][currentCell.y] === null){
      map[currentCell.x-1][currentCell.y] = {type: currentCell.left.type, level: currentCell.left.level, x: currentCell.x-1, y: currentCell.y}
      if (currentCell.left.level === 1 && currentCell.left.type === 2){
        blocks.push({x: currentCell.x - 1, y: currentCell.y})
      }
    }

    if (map[currentCell.x + 1][currentCell.y] === null){
      map[currentCell.x + 1][currentCell.y] = {type: currentCell.right.type, level: currentCell.right.level, x: currentCell.x+1, y:currentCell.y}
      if (currentCell.right.level === 1 && currentCell.right.type === 2){
        blocks.push({x: currentCell.x + 1, y:currentCell.y})
      }
    }

    if (map[currentCell.x][currentCell.y + 1] === null ){
      map[currentCell.x][currentCell.y + 1] = {type: currentCell.down.type, level: currentCell.down.level, x: currentCell.x, y: currentCell.y+1}
      if (currentCell.down.level === 1 && currentCell.down.type === 2){
        blocks.push({x: currentCell.x, y: currentCell.y + 1})
      }
    }
    if (map[currentCell.x][currentCell.y - 1] === null ){
      map[currentCell.x][currentCell.y - 1] = {type: currentCell.up.type, level: currentCell.up.level, x: currentCell.x, y: currentCell.y-1}
      if (currentCell.up.level === 1 && currentCell.up.type === 2){
        blocks.push({x: currentCell.x, y: currentCell.y - 1})
      }
    }

    // visited cells to have similar key structure
    map[currentCell.x][currentCell.y] = currentCell
    map[currentCell.x][currentCell.y]["visited"] = true
  }


  function updateStairs(currentCell){
    updateMap(currentCell)

    towerStairs.left      = map[towerCell.x - 1][towerCell.y]
    towerStairs.upLeft    = map[towerCell.x - 1][towerCell.y - 1]
    towerStairs.up        = map[towerCell.x][towerCell.y - 1]
    towerStairs.upRight   = map[towerCell.x + 1][towerCell.y - 1]
    towerStairs.right     = map[towerCell.x + 1][towerCell.y]
    towerStairs.downRight = map[towerCell.x + 1][towerCell.y + 1]
    towerStairs.down      = map[towerCell.x][towerCell.y + 1]
    towerStairs.blocks    = []
    towerStairs.blanks    = []

    groundStair = map[towerCell.x - 1][towerCell.y + 1] // keep start fixed to keep design easier
    blankStairs = []

    Object.values(towerStairs).slice(0,8).forEach( stair => {
      if (stair.type === 2){
        towerStairs.blocks.push(stair)
      }else if (stair.type === 0){
        towerStairs.blanks.push(stair)
      }
    })
  }


  function getNullAdjacents(cell){
    var up = map[cell.x][cell.y - 1]
    var down = map[cell.x][cell.y + 1]
    var left = map[cell.x - 1][cell.y]
    var right = map[cell.x + 1][cell.y]

    var adjacents = [up, right, down, left].filter( c => !c)

    return adjacents
  }


  function getAdjacentCells(cell){
    var up = map[cell.x][cell.y - 1]
    var down = map[cell.x][cell.y + 1]
    var left = map[cell.x - 1][cell.y]
    var right = map[cell.x + 1][cell.y]

    var adjacents = [up, right, down, left].filter( c => !!c)

    return adjacents
  }


  function getMove(adjacentCell){

    yDirection = adjacentCell.y - position.y
    xDirection = adjacentCell.x - position.x

    if (xDirection === 0 && yDirection === 1){
      return "down"
    }else if (xDirection === 0 && yDirection === -1){
      return "up"
    }else if (xDirection === 1 && yDirection === 0){
      return "right"
    }else if (xDirection === -1 && yDirection === 0){
      return "left"
    }
  }


  function reverseMove(move){
    switch(move){
      case "down":
        return "up"
      case "right":
        return "left"
      case "up":
        return "down"
      case "left":
        return "right"
    }
  }


  function manhattanDistance(originCell, nextCell){
    return(
      Math.abs(originCell.x - nextCell.x) +
      Math.abs(originCell.y - nextCell.y)
    )
  }


  function climbable(originCell, nextCell){
    return Math.abs(originCell.level - nextCell.level) <= 1
  }


  function sameCell(originCell, nextCell){
    return (originCell.x === nextCell.x && originCell.y === nextCell.y)
  }


  function containsThisCell(stairs, block){
    for (var i=0; i < stairs.length; i++){
      if (sameCell(stairs[i], block)){
        return true
      }
    }
  }


  function closestBlanks(currentCell, set){
    return set.sort((a,b) => manhattanDistance(currentCell, a) - manhattanDistance(currentCell, b))
  }

  function sortBlocks(currentCell){
    return blocks.sort((a,b) => manhattanDistance(currentCell, a) - manhattanDistance(currentCell, b))
      .filter((block) => !containsThisCell(towerStairs.blocks, block) && map[block.x][block.y].type === 2)
  }


  function resetVisited(){
    for (var i = 0; i < map.length; i++){
      for (var j = 0; j < map[i].length; j++){
        if (map[i][j] && map[i][j]["visited"]){
          map[i][j]["visited"] = false
        }
      }
    }
  }


  // returns the closest blank cell that is adjacent to an unexplored cell if
  // the blank is not accessible (cannot be aStar-ed, the next closest is used
  function nearestNull(currentCell){
    var blanks = []
    for (var i = 0; i < map.length; i++){
      for (var j = 0; j < map[i].length; j++){
        var cell = map[i][j]
        if (cell && cell.type === 0){
          var adjacents = getNullAdjacents(cell)
          if (adjacents.includes(null)){
            blanks.push(cell)
          }
        }
      }
    }

    blanks = closestBlanks(currentCell, blanks)
    return blanks[0 + reAttempt]
  }


  function getNextStep(currentCell){
    var nextStep,
      x = towerCell.x - currentCell.x,
      y = towerCell.y - currentCell.y,
      towerOrientation = {x,y} //es6 object syntax

    switch(true){
      case towerOrientation.x === -1 && towerOrientation.y === 0:
        nextStep = {x: currentCell.x, y: currentCell.y + 1, level: map[currentCell.x][currentCell.y + 1]["level"]}
        break
      case towerOrientation.x === 1 && towerOrientation.y === 0:
        nextStep = {x: currentCell.x, y: currentCell.y - 1, level: map[currentCell.x][currentCell.y - 1]["level"]}
        break
      case towerOrientation.x === 0 && towerOrientation.y === -1 :
        nextStep = {x: currentCell.x - 1, y: currentCell.y, level: map[currentCell.x - 1][currentCell.y]["level"]}
        break
      case towerOrientation.x === 0 && towerOrientation.y === 1 :
        nextStep = {x: currentCell.x + 1, y: currentCell.y, level: map[currentCell.x + 1][currentCell.y]["level"]}
        break
      case towerOrientation.x === -1 && towerOrientation.y === -1:
        nextStep = {x: currentCell.x - 1, y: currentCell.y, level: map[currentCell.x - 1][currentCell.y]["level"]}
        break
      case towerOrientation.x === -1 && towerOrientation.y === 1:
        nextStep = {x: currentCell.x, y: currentCell.y + 1, level: map[currentCell.x][currentCell.y + 1]["level"]}
        break
      case towerOrientation.x === 1 && towerOrientation.y === -1:
        nextStep = {x: currentCell.x, y: currentCell.y - 1, level: map[currentCell.x][currentCell.y - 1]["level"]}
        break
      case towerOrientation.x === 1 && towerOrientation.y === 1:
        nextStep = {x: currentCell.x + 1, y: currentCell.y, level: map[currentCell.x + 1][currentCell.y]["level"]}
        break
    }
    return nextStep
  }


  function circleTower(currentCell){
    updateMap(currentCell)
    if (towerLaps < 8 ){
      ++towerLaps
      let nextCell = getNextStep(currentCell)
      return getMove(nextCell)
    }else{
      presentProcedure = procedures["layFirstStairs"]
    }
  }


  // creates an array using the parent cells assigned by aStar
  function stitchAstarPath(finalNode, start, goal, presentProcedure){
    path.push(finalNode)

    let current = finalNode.parent
    path.push(current)

    while (current && current.parent){
      current = current.parent
      path.push(current)
    }
    path.pop() // remove the currentCell from the path!
  }


  function aStar(start, goal){
    var finalNode;

    start["parent"] = null // (no parents to start)
    start["g"]      = 0    // cost of starting point to a given cell.  Grows linearly by 1 since each cell is 1 away (no diagonals)
    start["h"]      = 0    // "heuristic", estimated cost of starting point to goal.  See manhattanDistance()
    start["f"]      = 0    // total cost of move; f + g

    // examine each cell in the frontier (stored in openList), starting with the cell you're on
    openList.push(start)
    while (openList.length > 0){

      openList.sort((a,b) => a.f - b.f) // "priority queue". Just sorting an array. (Acceptable for n <= 28)
      let current = openList.shift()    // always consider the least costly

      if (sameCell(current, goal)){
        finalNode = current
        break
      }

      var nodes = getAdjacentCells(current).filter(adj => adj.type !== 1 && climbable(current, adj))

      // remove the node from future consideration following this round
      closedList.push(current)

      for (var i = 0; i < nodes.length; i++){
        var node = nodes[i]

        // if this potential move has already been fully considered, move on
        if (closedList.includes(node)){
          continue
        }

        var moveCost = current.g + 1

        if (!openList.includes(node) ){

          node["parent"] = current
          node["g"]      = current.g + 1
          node["h"]      = manhattanDistance(node, goal)
          node["f"]      = node.g + node.h

          openList.push(node)

        }else if (node.g >= moveCost){
          node.g       =  moveCost
          node.f       =  node.h + node.g
          node.parent  =  current
        }
      }
    }

    if (finalNode){
      stitchAstarPath(finalNode, start, goal, presentProcedure)
    }else{
      console.log("aStar failed to find a path")
    }

  }


  // Constructs a path if it doesnt't exist, otherwise it traces it.
  function pathFind(currentCell, goal){
    updateMap(currentCell)

    if (!sameCell(currentCell, goal)){
      if (path.length < 1){
        openList = []
        closedList = []
        aStar(currentCell, goal)
      }
      return getMove(path.pop())
    }
  }


  function exploreForBlock(currentCell){
    updateStairs(currentCell)

    var exploreGoal = exploreGoal || nearestNull(currentCell)
    if (!sameCell(currentCell, exploreGoal)){
      try{
        move = pathFind(currentCell, exploreGoal)
        return move
      }catch(e){
        console.log("re-attempting!")
        exploreGoal = null
        reAttempt++
        return exploreForBlock(currentCell)
      }
    }else{
      exploreGoal = null
      var adjacents = getAdjacentCells(currentCell)
      for (var i = 0; i < adjacents.length; i++){
        let adj = adjacents[i]
        if (adj.type !== 1 && !adj.visited && climbable(currentCell, adj)){
          return getMove(adj)
        }
      }
      return -1
    }
  }


  // path find to known blocks, or path find to unknown cells and explore
  function findBlock(currentCell){
    blocks = sortBlocks(currentCell)

    if (towerStairs.down.level >= 2 && !offStairs){
      return descendStairs(currentCell)
    }

    if (blocks.length < 1 && !goal){
      return exploreForBlock(currentCell)
    }else{
      resetVisited()
      goal = goal || blocks.shift()
      if (sameCell(currentCell, goal)){
        holdingBlock = true
        goal = null
        return "pickup"
      }else{
        return pathFind(currentCell, goal)
      }
    }
  }


  function descendStairs(currentCell){
    if (sameCell(currentCell, groundStair)){
      offStairs = true
        return findBlock(currentCell)
    }else{
      return pathFind(currentCell, groundStair)
    }
  }

  /********************************************************************************/
  /*===============================primary functions==============================*/
  /********************************************************************************/

  function findTower(currentCell){
    updateMap(currentCell)

    if (currentCell.type === 1 && !holdingBlock){
      map[currentCell.x][currentCell.y].type = 0
      holdingBlock = true
      return "pickup"
    }

    if (towerCell){
      return circleTower(currentCell)
    }

    var adjacents = getAdjacentCells(currentCell)
    for (var i = 0; i < adjacents.length; i++){
      let adj = adjacents[i]
      if (adj.level === 8){
        towerCell = adj
        return circleTower(currentCell)
      }
    }

    for (var i = 0; i < adjacents.length; i++){
      let adj = adjacents[i]
      if (adj.type !== 1 && !adj.visited){
        return getMove(adjacents[i])
      }
    }
    return -1
  }


  function initStairs(currentCell){
    updateStairs(currentCell)

    if (towerStairs.blocks.length >= 7){
      presentProcedure = procedures["upgradeTheStairs"]
      path = []
      goal = null
      completedStairs.push(towerStairs.left)
      return
    }
    if (holdingBlock){
      blanks = closestBlanks(currentCell, towerStairs.blanks)
      goal = goal || blanks[0]

      if (sameCell(currentCell, goal)){
        holdingBlock = false
        goal = null
        blanks.shift()
        return "drop"
      }else {
        return pathFind(currentCell, goal)
      }
    }else{
      return findBlock(currentCell)
    }
  }


  function stackStairs(currentCell){
    updateStairs(currentCell)

    var criterion = completedStairs[completedStairs.length - 1]

    var orderedStairs = [
      towerStairs.left,
      towerStairs.upLeft,
      towerStairs.up,
      towerStairs.upRight,
      towerStairs.right,
      towerStairs.downRight,
      towerStairs.down
    ]

    if (currentCell.level === 7){
      return "up"
    }

    if (holdingBlock){

      orderedStairs = orderedStairs.filter(stair => !sameCell(stair, criterion) && stair.level === criterion.level)
      goal = goal || orderedStairs.shift()

      if (sameCell(currentCell, goal)){
        // begin new upgrade cycle
        if (currentCell === towerStairs.down){
          newCriterion = getNextStep(criterion)
          completedStairs.push(newCriterion)
        }
        holdingBlock = false
        goal = null
        return "drop"
      }else{
        offStairs = false
        return pathFind(currentCell, goal)
      }
    }else{
      return findBlock(currentCell)
    }
  }


  /*##################################################################*/
  /*<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<TURN>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
  /*##################################################################*/

  this.turn = function(cell){

    var move,
        currentCell = Object.assign({},cell, position),
        reversed    = false

    if (presentProcedure === procedures["findTheTower"]){
      move = findTower(currentCell)
    }

    if (presentProcedure === procedures["layFirstStairs"]){
      move = initStairs(currentCell)
    }

    if (presentProcedure === procedures["upgradeTheStairs"]){
      move = stackStairs(currentCell)
    }

    // if you exited DFS with no good move, backtrack
    if (move === -1){
      move = moves.pop().reverse
      reversed = true
    }

    switch(move){
      case "down":
        ++position.y
        break
      case "right":
        ++position.x
        break
      case "up":
        --position.y
        break
      case "left":
        --position.x
        break
      case "pickup":
        break
      case "drop":
        break
    }

    // don't store moves that were backtracks or block setting, or down-climbing stairs
    if (move && !reversed && move !== "pickup" && move !==  "drop" && offStairs){
      moves.push({previous: move, reverse: reverseMove(move)})
    }
    return move
  }
}
