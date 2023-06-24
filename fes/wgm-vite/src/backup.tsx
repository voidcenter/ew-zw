import { useState, useRef, useEffect, Fragment } from 'react'
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







function App(setVideo1Opacity: any) {
  // const [count, setCount] = useState(0)
  // const [interval, updateInterval] = useState(1000)
  const [gameScreen, setGameScreen] = useState(true)
  const [day, setDay] = useState(false)
  const [night, setNight] = useState(false)
  const [score, setScore] = useState(0)

  const [opacity, setOpacity] = useState(1);

  const onWhack = points => setScore(score + points)

  // const { height, width } = useWindowDimensions();

  const opacityTimer = useRef();
  const opacityRef = useRef(opacity);
  useEffect(() => {
    opacityTimer.current = setInterval(() => {
      if (opacityRef.current > 0) {
        setOpacity(Math.max(0, (opacityRef.current -= 0.05)));
        console.log(opacityRef.current);
      }
    }, 50)
    return () => {
      clearInterval(opacityTimer.current)
    }
  })


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


  // setVideo1Opacity(0.5);

  // useEffect(() => {
  // });

  console.log(window.innerHeight, window.innerWidth);
  const yoffset = Math.max(0, (window.innerHeight - window.innerWidth / 16.0 * 9.0) / 2);


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
    <>

        {/* <video autoPlay loop muted id='video' style={{ opacity, position:'absolute', left:'0px', top:`${yoffset}px`, width: '100%', justifyContent: 'center' }}>
          <source src='./public/game-screen-3-loop.mp4' type='video/mp4' />
        </video> */}

        <video autoPlay loop muted id='video' style={{ opacity: 1-opacity, position:'absolute', left:'0px', top:`${yoffset}px`, width: '100%', justifyContent: 'center' }}>
          <source src='./public/day-loop.mp4' type='video/mp4' />
        </video>


      <h1>wagamama</h1>
      <div className="card" style={{ position: 'relative', zIndex: '5', background: '#888888'}}>
        {/* <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button> */}
        {/* <Time interval={interval}/> */}
        {/* <h2>{`Interval: ${interval}`}</h2>
        <input type="range" min="1" value={interval} max="10000" onChange={e => updateInterval(e.target.value)}/> */}

        <Fragment>
        <button onClick={ goToDay() }>Start Game</button>
        <button onClick={ goToNight() }>Go to night</button>
        <button onClick={ goToDay() }>Go to day</button>
 
        </Fragment>

        <Fragment>
        <Fragment>
        <button onClick={ goToDay() }>Start Game</button>
        <button onClick={ goToNight() }>Go to night</button>
        <button onClick={ goToDay() }>Go to day</button>
 
        </Fragment>
          <button onClick={ go }>Start Game</button>
 

          {!playing && <h1>WGM</h1>}
          <button onClick={() => setPlaying(!playing)}>
            {playing? 'Stop': 'Start'} 
          </button>
          {playing && (
            <Fragment>
              <Score value={score}/>
              <Timer time={TIME_LIMIT} onEnd={endGame}/>
              {new Array(5).fill().map((_, id) =>
                <Mole onWhack={onWhack} />
              )}
            </Fragment>
          )}

        </Fragment>


      </div>
    </>
  )
}

export default App


