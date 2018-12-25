/*
  게임의 내부적인 작동을 위한 스크립트.
*/
const game = {
  version: "v0.1-Beta"
};

//편의를 위해 빈칸은 0, 흰색은 1, 검은색은 2로 취급한다.
const EMPTY = 0,
      WHITE = 1,
      BLACK = 2;

//캔버스 요소를 사용하기 편한 형태로 리턴하는 함수.
game.getCanvas = () => {
  let board = $('#board');
  if (!board) return {elem:null};
  return {
    elem: board,
    ctx: board.getContext('2d'),
    width: board.width,
    height: board.height,
    padding: board.width/25,
    blockWidth: (board.width - board.width*2/25)/14
  };
}

//바둑돌 객체.
game.stone = {};

//바둑돌의 위치를 담을 2차원 배열.
game.stone.list = [];

//바둑돌들의 위치를 모두 초기화할 함수.
game.stone.reset = () => {
  for (let i = 0; i < 15; i++) {
    game.stone.list[i] = [];
    for (let j = 0; j < 15; j++)
      game.stone.list[i][j] = EMPTY;
  }
}

//바둑돌들의 위치를 모두 초기화한다.
game.stone.reset();

//x, y좌표에 착수하는 함수.
game.stone.set = (color, x, y) => {
  if (game.checkWin() || !game.getCanvas().elem) return;

  game.stone.list[x][y] = color;
  game.stone.update();
}

//저장된 바둑돌에 위치에 따라 캔버스를 다시 그려내는 함수.
game.stone.update = () => {
  let board = game.getCanvas(),
      ctx = board.ctx,
      r = board.width / 35,
      color,
      x, y;

  game.drawBoard();
  for (let i = 0; i < 15; i++) {
    for (let j = 0; j < 15; j++) {
      if (!game.stone.list[i][j]) continue;

      color = game.stone.list[i][j];

      x = board.padding + board.blockWidth * i;
      y = board.padding + board.blockWidth * j;

      ctx.fillStyle = (color == WHITE)? "white" : "black";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fill();

      ctx.lineWidth = 5;
      ctx.strokeStyle = '#808080';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }
}

//x,y 좌표에 돌이 존재하는지 불리언값으로 리턴하는 함수.
game.stone.isStone = (x, y) => {
  const board = game.stone.list;
  return board[x] && board[x][y];
}

//해당 시점에 승리한 돌의 색을 리턴. 없으면 EMPTY리턴하는 함수.
game.checkWin = () => {
  /*
    모든 돌 (stone.list[x][y])의 색이 x 축 또는 y 축 또는 대각선으로
    같은 색 5개가 동일하게 놓여있다면 승리다.
  */
  let color, x, y, k, h, l;
  for (x = 0; x < 15; x++) {
    for (y = 0; y < 15; y++) {
      if (!game.stone.list[x][y]) continue;
      for (h = 0; h < 2; h++)
      for (l = -1; l < 2; l++) {
        color = game.stone.list[x][y];
        for (k = 0; k < 5; k++) {
          const PX = x + k * h,
                PY = y + k * l ** h;
          if (!game.stone.list[PX] || color !== game.stone.list[PX][PY]) {
            color = EMPTY;
            break;
          }
        }
        if (color) return color;
      }
    }
  }

  return EMPTY;
}

//금수 목록을 얻는 함수.
game.getBanedPosition = color => {
  const result = [],
        board = game.stone.list,
        X = 0, Y = 1;
  var x, y, k, h, l, g, t, s, nowColor;

  if (!color || color !== BLACK) return result;

  //흑돌 6, 7, 8, 9목(장목) 금수 지정
  // 이것은... 바로 육중한 6중 반복문이다.
  [6,7,8,9].forEach(n => {
    const LIMIT = 16 - n;
    if (color === BLACK)
    for (x = 0; x < LIMIT; x++)
    for (y = 0; y < LIMIT; y++)
    for (h = 0; h < 2; h++)
    for (l = -1; l < 2; l++) {
      let emptyCount = 0,
          emptyCoords = [-1, -1];
      if (board[x][y] !== BLACK) break;
      for (k = 0; k < n; k++) {
        const PX = x + k * h,
              PY = y + k * (l ** h);
        if (
          !board[PX] ||
          [WHITE, undefined].includes(board[PX][PY]) ||
          (board[PX][PY] === EMPTY && emptyCount)
        ) {
          emptyCount = -1;
          break;
        }
        if (board[PX][PY] === EMPTY) {
          emptyCount++;
          emptyCoords[X] = PX;
          emptyCoords[Y] = PY;
        }
      }
      if (emptyCount === 1)
        result.push(emptyCoords);
    }
  });

  //흑돌 3-3, 3-4, 4-4 금수
  if (color === BLACK)
  for (x = 1; x < 13; x++)
  for (y = 1; y < 13; y++) {
    if (board[x][y] !== EMPTY) continue;
    function blockChecking(dx, dy) {
      const PX = x + dx,
            PY = y + dy;
      return board[PX] && EMPTY === board[PX][PY];
    }

    for (k = 0; k < 2; k++)
    for (h = 0; h < 2; h++)
    for (l = 0; l < 2; l++) {
      const sign = (-1) ** l;
      const mapArr = [
        [-1,-2].concat(Array(2).fill(3).map((e,i) => e + i + k)),
        [-1,-2].concat(Array(2).fill(3).map((e,i) => e + i + h)).map(e => e * sign),
        Array(2+k).fill(1).map((e,i) => e + i),
        Array(2+h).fill(1).map((e,i) => (e + i) * sign)
      ];
      if (mapArr[0].every(p => blockChecking(0, p))
      &&  mapArr[1].every(p => blockChecking(p, 0))
      &&  mapArr[2].every(p => board[x] && board[x][y+p] === BLACK)
      &&  mapArr[3].every(p => board[x+p] && board[x+p][y] === BLACK)) {
        result.push([x,y]);
      }
    }

    // if ([-1, -2, 3, 4].every(p => blockChecking(0, p))
    // &&  [-1, -2, 3, 4].every(p => blockChecking(p, 0))
    // &&  [1, 2].every(p => board[x] && board[x][y+p] === BLACK)
    // &&  [1, 2].every(p => board[x+p] && board[x+p][y] === BLACK)) {
    //   result.push([x,y]);
    // }
  }

  return result;
}

//AI의 테스트를 위해, AI vs AI 대결을 시키는 함수.
game.AIvsAI = async () => {
  game.stone.reset();
  let i = 0;
  while (!game.checkWin()) {
    await new Promise(resolve =>  {
      setTimeout(resolve, 50);
    });
    game.stone.set(i + 1, ...AI(i + 1, game.stone.list));
    i = 1 - i;
  }
}
