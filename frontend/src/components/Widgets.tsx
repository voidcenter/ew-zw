
import { useState, useEffect, useRef, useId } from 'react';
import Terminal, { ColorMode, TerminalOutput, TerminalInput } from './terminal';
import { eventAndChat_daemonListner, sendMessage, chatList } from '../modules/eventAndChat';
import { ConnectButton } from '@rainbow-me/rainbowkit'



export function Widgets(props: any) {

  const data = props.data;


  /* window size */ 
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


  // background 

  const yoffset =  (window.innerHeight - window.innerWidth / 16.0 * 9.0) / 2;
  const dayShowPercent = 85;
  const dayShowPercentN = dayShowPercent / 100.0;
  const dayVideoWidth = window.innerWidth / dayShowPercentN;
  const dayVideoPercent = dayVideoWidth / window.innerWidth * 100;
  const dayXoffset = - dayVideoWidth * (1 - dayShowPercentN) / 2;
  const dayYoffset = (window.innerHeight  - dayVideoWidth / 16.0 * 9.0) / 2 - dayVideoWidth * 0.013;

  const gameTitleWidth = window.innerWidth * 0.4;
  const gameTitleX = (window.innerWidth / 2 - gameTitleWidth) / 2 * 0.8;
  const gameTitleY = window.innerHeight * 0.2;

  const dayTitleWidth = window.innerWidth * 0.15;
  const dayTitleX = window.innerWidth * 0.005;
  const dayTitleY = window.innerHeight * 0.02;

  const nightTitleWidth = window.innerWidth * 0.2;
  const nightTitleX = window.innerWidth * 0.01;
  const nightTitleY = window.innerHeight * 0.03;

  const videoGameScreenRef= useRef();
  const videoDayRef= useRef();
  const videoNightRef= useRef();

//   useEffect(() => {
//     videoGameScreenRef.current.playbackRate = 1;
//   });

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
  
  const opacityTimer = useRef();
  const opacityDayRef = useRef(data.opacityDay);
  const opacityNightRef = useRef(data.opacityNight);
  const opacityGameScreenRef = useRef(data.opacityGameScreen);
  useEffect(() => {
    opacityTimer.current = setInterval(() => {
        adjustOpacity(opacityDayRef, data.setOpacityDay, 0.05, data.day);
        adjustOpacity(opacityNightRef, data.setOpacityNight, 0.05, data.night);
        adjustOpacity(opacityGameScreenRef, data.setOpacityGameScreen, 0.05, data.gameScreen);
    }, 50)
    return () => {
      clearInterval(opacityTimer.current)
    }
  })


  // frames 

  const rTopP = 12;
  const rBottomP = 97;
  const rLeftP = 48;
  const rRightP = 92;
  const lTopP = 50;
  const lBottomP = 90;
  const lLeftP = 10;
  const lRightP = 40;
  
  const _rl = dimensions.width * rLeftP / 100.0;
  const _rw = dimensions.width * (rRightP - rLeftP) / 100.0;
  const _rt = dimensions.height * rTopP / 100.0;
  const _rh = dimensions.height * (rBottomP - rTopP) / 100.0;

  const _ll = dimensions.width * lLeftP / 100.0;
  const _lw = dimensions.width * (lRightP - lLeftP) / 100.0;
  const _lt = dimensions.height * lTopP / 100.0;
  const _lh = dimensions.height * (lBottomP - lTopP) / 100.0;

  const input_height = 40;
  const frame_width = 30;
  const wallet_frame_width = 430;
  const wallet_frame_margin = 30;



  return (
    <>

      {/* <h1>ZK-Werewolf</h1> */}
      <div>
            <div style={{ position: 'absolute', top: `${wallet_frame_margin}px`, 
                        left: `${dimensions.width - wallet_frame_margin - wallet_frame_width}px`, 
                        // background: '#7C6553', 
                        zIndex:10}}>
                    <ConnectButton  />
                    {/* <p> test</p> */}
            </div>


            <img src='./public/day-background.png' style={{position: 'absolute', zIndex: 0,  
                opacity: data.opacityDay,
                height: `${dimensions.height}px`, width: `${dimensions.width}px`}}/>

            <img src='./public/night-background.png' style={{position: 'absolute', zIndex: 0,  
                opacity: data.opacityNight,
                height: `${dimensions.height}px`, width: `${dimensions.width}px`}}/>

            <img src='./public/lobby-background.png' style={{position: 'absolute', zIndex: 0,  
                opacity: data.opacityGameScreen,
                height: `${dimensions.height}px`, width: `${dimensions.width}px`}}/>

            {/* <video autoPlay loop muted id='video' ref={videoGameScreenRef} 
                    style={{ 
                        opacity: data.opacityGameScreen * 0.5, position:'absolute', left:'0px', top:`${yoffset}px`, 
                        width: '100%', justifyContent: 'center' 
                    }}>
                <source src='./public/game-screen-3-loop.mp4' type='video/mp4' />
            </video>

            <video autoPlay loop muted id='video' ref={videoDayRef} 
                    style={{ 
                        opacity: data.opacityDay, position:'absolute', left:`${dayXoffset}px`, 
                        top:`${dayYoffset}px`, width: `${dayVideoPercent}%`, justifyContent: 'center' 
                    }}> 
                <source src='./public/day-loop.mp4' type='video/mp4' />
            </video>

            <video autoPlay loop muted id='video' ref={videoNightRef} 
                    style={{ 
                        opacity: data.opacityNight, position:'absolute', left:'0px', top:`${yoffset}px`, 
                        width: '100%', justifyContent: 'center' 
                    }}>
            <source src='./public/night-loop.mp4' type='video/mp4' />
            </video> */}

            <img src='./public/game title 2.png' style={{ 
                opacity: data.opacityGameScreen, position:'absolute', 
                left:`${gameTitleX}px`, top:`${gameTitleY}px`, width: `${gameTitleWidth}px`, 
                zIndex: '2', justifyContent: 'left'  }}/>

            <img src='./public/day title 2.png' style={{ 
                opacity: data.opacityDay, position:'absolute', 
                left:`${dayTitleX}px`, top:`${dayTitleY}px`, width: `${dayTitleWidth}px`, 
                zIndex: '2', justifyContent: 'left'  }}/>

            <img src='./public/night title.png' style={{ 
                opacity: data.opacityNight, position:'absolute', 
                left:`${nightTitleX}px`, top:`${nightTitleY}px`, width: `${nightTitleWidth}px`, 
                zIndex: '2', justifyContent: 'left'  }}/>


            <img src='./public/info-frame-2.png' style={{position: 'absolute', 
                left: `${_ll}px`, top:`${_lt}px`, 
                width: `${_lw}px`, height: `${_lh}px`, 
                zIndex: 10
            }} />

            <div id='left-panel' style={{
                    position:'absolute', left: `${_ll}px`, top:`${_lt}px`, 
                    width: `${_lw}px`, height: `${_lh}px`, 
                    background: "#594530"}}>
                <ul id="messages"></ul>
            
                <Terminal name='Game Events and Dialog' 
                        // ref={leftPanel}
                        colorMode={ ColorMode.Light }  
                        // onInput={ onInput }
                        height = {`${_lh - 110}px`}
                        prompt=''
                        >
                    { data.tdInfo }
                </Terminal>
            </div>


            <img src='./public/chat-frame.png' style={{position: 'absolute', 
            left: `${_rl}px`, top:`${_rt}px`, 
            width: `${_rw}px`, height: `${_rh}px`, 
            zIndex: 4
            }} />

            <div id='right-panel' style={{
                position:'absolute', left: `${_rl}px`, top:`${_rt}px`, 
                width: `${_rw}px`, height: `${_rh}px`, 
                background: "#594530"}}>
                {/* background: "#5D352F"}}> */}
                {/* background: "#534559"}}> */}

                <div style={{ position: 'absolute', top: `${frame_width}px`, left: `${frame_width}px`, 
                                right: `${frame_width}px`, zIndex: 5}}>
                    <Terminal name='Game Events and Dialog' 
                        // ref={rightPanel}
                        colorMode={ ColorMode.Light }  
                        // onInput={ onInput }
                        height = {`${_rh - 150 - frame_width * 2}px`}
                        prompt='>'
                        >
                    { data.tdChat }
                    </Terminal>
                </div>
                
                <form id="form" 
                    onSubmit={
                        (e) => sendMessage(e, data.input, data.state, data.setInput, 
                                           data.pushMsgs, data.opacitySwitchers)} 
                    style={{ 
                        position: 'absolute', bottom: `${frame_width - 1}px`, left: `${frame_width-2}px`, 
                        right: `${frame_width+1}px`, color: '#550022', zIndex: 20
                    }}>

                <input id={data.inputId} autoComplete="off"  
                        value={data.input} 
                        onInput={e => data.setInput(e.target.value)}
                        style={{ width: '100%', height: `${input_height}px`, background: '#42362F', color: 'white', fontSize: '20px'}} />

                </form>

            </div>

      </div>
    </>
  );

}
