import { useState, useRef, useEffect, Fragment, MutableRefObject } from 'react'
import './App.css'
// import { useWindowDimensions } from './units'


// const Time = ({ interval }) => {
//   const [time, setTime] = useState(Date.now())
//   const timer = useRef(null)
//   useEffect(() => {
//     timer.current = setInterval(() => setTime(Date.now()), interval)
//     return () => clearInterval(timer.current)
//   }, [interval])
//   return <h1>{`Time: ${time}`}</h1>
// }

const TIME_LIMIT = 3000000


const Moles = ({ children }) => <div>{children}</div>

const MOLE_SCORE = 100

const Mole = ({ onWhack }) => (
  <button onClick={() => onWhack(MOLE_SCORE)}>Mole</button>
)

const Score = ({ value }) => <div>{`Score: ${value}`}</div>



const Timer = ({ time, interval = 1000, onEnd }) => {
  const [internalTime, setInternalTime] = useState(time)
  const [score, setScore] = useState(0)
  const timerRef = useRef(time)
  const timeRef = useRef(time)


  useEffect(() => {
    if (internalTime === 0 && onEnd) onEnd()
  }, [internalTime, onEnd])

  useEffect(() => {
    timerRef.current = setInterval(
      () => setInternalTime((timeRef.current -= interval)),
      interval
    )
    return () => {
      clearInterval(timerRef.current)
    }
  }, [interval])
  console.log(time, internalTime)
  return <div>{`Time: ${timeRef.current}`}</div>
} 



const adjustOpacity = (opacityRef: MutableRefObject<number>, setOpacity, delta: number, shouldBeVisible: boolean) => {
  if (shouldBeVisible) {
    if (opacityRef.current < 1) {
      setOpacity(Math.max(0, (opacityRef.current += delta)));
    }
  } else {
    if (opacityRef.current > 0) {
      setOpacity(Math.max(0, (opacityRef.current -= delta)));
      // console.log(opacityRef.current);
    }
  }
}




function App() {
  // const [count, setCount] = useState(0)
  // const [interval, updateInterval] = useState(1000)
  const [playing, setPlaying] = useState(true)
  const [finished, setFinished] = useState(false)
  const [score, setScore] = useState(0)

  const [gameScreen, setGameScreen] = useState(true)
  const [day, setDay] = useState(false)
  const [night, setNight] = useState(false)

  const [opacityGameScreen, setOpacityGameScreen] = useState(0.75);
  const [opacityDay, setOpacityDay] = useState(0);
  const [opacityNight, setOpacityNight] = useState(0);

  const onWhack = points => setScore(score + points)

  // const { height, width } = useWindowDimensions();

  const opacityTimer = useRef();
  const opacityDayRef = useRef(opacityDay);
  const opacityNightRef = useRef(opacityNight);
  const opacityGameScreenRef = useRef(opacityGameScreen);
  useEffect(() => {
    opacityTimer.current = setInterval(() => {
      adjustOpacity(opacityDayRef, setOpacityDay, 0.05, day);
      adjustOpacity(opacityNightRef, setOpacityNight, 0.05, night);
      adjustOpacity(opacityGameScreenRef, setOpacityGameScreen, 0.05, gameScreen);
    }, 50)
    return () => {
      clearInterval(opacityTimer.current)
    }
  })


  const videoGameScreenRef= useRef();
  const videoDayRef= useRef();
  const videoNightRef= useRef();

  useEffect(() => {
    videoGameScreenRef.current.playbackRate = 1;
  });


  const endGame = () => {
    setPlaying(false)
    setFinished(true)
  }
  
  const startGame = () => {
    setScore(0)
    setPlaying(true)
    setFinished(false)
  }

  const goToDay = () => {
    setGameScreen(false)
    setDay(true)
    setNight(false)
  }
 
  const goToNight = () => {
    setGameScreen(false)
    setDay(false)
    setNight(true)
  }

  const goToLobby = () => {
    setGameScreen(true)
    setDay(false)
    setNight(false)
  }

  // setVideo1Opacity(0.5);

  // useEffect(() => {
  // });

  console.log(window.innerHeight, window.innerWidth);
  const yoffset =  (window.innerHeight - window.innerWidth / 16.0 * 9.0) / 2;
  const dayShowPercent = 85;
  const dayShowPercentN = dayShowPercent / 100.0;
  const dayVideoWidth = window.innerWidth / dayShowPercentN;
  const dayVideoPercent = dayVideoWidth / window.innerWidth * 100;
  const dayXoffset = - dayVideoWidth * (1 - dayShowPercentN) / 2;
  const dayYoffset = (window.innerHeight  - dayVideoWidth / 16.0 * 9.0) / 2 - dayVideoWidth * 0.013;

  const gameTitleWidth = window.innerWidth * 0.75;
  const gameTitleX = (window.innerWidth - gameTitleWidth) / 2;
  const gameTitleY = window.innerHeight * 0.15;

  const dayTitleWidth = window.innerWidth * 0.15;
  const dayTitleX = window.innerWidth * 0.005;
  const dayTitleY = window.innerHeight * 0.02;

  const nightTitleWidth = window.innerWidth * 0.2;
  const nightTitleX = window.innerWidth * 0.01;
  const nightTitleY = window.innerHeight * 0.03;

  // console.log('day offsets = ', dayShowPercentN, dayVideoWidth, dayXoffset, dayYoffset, dayVideoPercent);

  const [dimensions, setDimensions] = useState({ 
    height: window.innerHeight,
    width: window.innerWidth
  })
  useEffect(() => {
    function handleResize() {
      setDimensions({
        height: window.innerHeight,
        width: window.innerWidth
      })
    }

    window.addEventListener('resize', handleResize)

    return _ => {
      window.removeEventListener('resize', handleResize)
    }
  })


  return (
    <div>


        <video autoPlay loop muted id='video' ref={videoGameScreenRef} style={{ opacity: opacityGameScreen, position:'absolute', left:'0px', top:`${yoffset}px`, width: '100%', justifyContent: 'center' }}>
          <source src='./public/game-screen-3-loop.mp4' type='video/mp4' />
        </video>

        <video autoPlay loop muted id='video' ref={videoDayRef} style={{ opacity: opacityDay, position:'absolute', left:`${dayXoffset}px`, top:`${dayYoffset}px`, width: `${dayVideoPercent}%`, justifyContent: 'center' }}>
          <source src='./public/day-loop.mp4' type='video/mp4' />
        </video>

        <video autoPlay loop muted id='video' ref={videoNightRef} style={{ opacity: opacityNight, position:'absolute', left:'0px', top:`${yoffset}px`, width: '100%', justifyContent: 'center' }}>
          <source src='./public/night-loop.mp4' type='video/mp4' />
        </video>

        <img src='./public/game title 2.png' style={{ 
            opacity: opacityGameScreen, position:'absolute', 
            left:`${gameTitleX}px`, top:`${gameTitleY}px`, width: `${gameTitleWidth}px`, 
            zIndex: '2', justifyContent: 'left'  }}/>

        <img src='./public/day title 2.png' style={{ 
            opacity: opacityDay, position:'absolute', 
            left:`${dayTitleX}px`, top:`${dayTitleY}px`, width: `${dayTitleWidth}px`, 
            zIndex: '2', justifyContent: 'left'  }}/>

        <img src='./public/night title.png' style={{ 
            opacity: opacityNight, position:'absolute', 
            left:`${nightTitleX}px`, top:`${nightTitleY}px`, width: `${nightTitleWidth}px`, 
            zIndex: '2', justifyContent: 'left'  }}/>

      <h1>wagamama</h1>
      <div className="card" style={{ position: 'relative', zIndex: '5', background: '#888888'}}>
        {/* <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button> */}
        {/* <Time interval={interval}/> */}
        {/* <h2>{`Interval: ${interval}`}</h2>
        <input type="range" min="1" value={interval} max="10000" onChange={e => updateInterval(e.target.value)}/> */}


        <Fragment>

        {/* <img src='./public/game title 2.png'/> */}

          <button onClick={() => goToDay()}>
            Start game
          </button>

          <button onClick={() => goToNight()}>
            go to night
          </button>

          <button onClick={() => goToDay()}>
            go to day
          </button>

          <button onClick={() => goToLobby()}>
            return to game lobby
          </button>


        </Fragment>


      </div>
    </div>
  )
}

export default App

