import { useState, useEffect, useRef, useId } from 'react';
import { socket } from './modules/socket';
import { eventAndChat_daemonListner, chatList } from './modules/eventAndChat';
import { Widgets } from './components/Widgets';
import './app.css';


export function App() {
  const [state, setState] = useState({} as any);

  /* background */
  const [gameScreen, setGameScreen] = useState(true)
  const [day, setDay] = useState(false)
  const [night, setNight] = useState(false)

  const [opacityGameScreen, setOpacityGameScreen] = useState(0.5);
  const [opacityDay, setOpacityDay] = useState(0);
  const [opacityNight, setOpacityNight] = useState(0);

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


  /* boards and input */ 
  const [tdChat, setTDChat] = useState([]);
  const [tdInfo, setTDInfo] = useState([]);

  const inputId = useId();
  const [input, setInput] = useState(' ');

  const pushMsgs = (msgs) => {
    setTDChat([...tdChat, ...msgs]);
  }

  /* socket.io */ 
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat', (msg: string) => {
      chatList.push(msg);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat');
    };
  }, []);


  /* timer */
  const timerRef = useRef(null);
  useEffect(() => {
    timerRef.current = setInterval(
      async () => {
        await eventAndChat_daemonListner(state, setState, pushMsgs);
      },
      1000
    )
    return () => {
      clearInterval(timerRef.current)
    }
  })


  return (
    <>
      <Widgets data = {{
        state, 
        input, inputId, setInput, 
        tdChat, tdInfo, pushMsgs, 
        opacityGameScreen, opacityDay, opacityNight,
        day, night, gameScreen, 
        setOpacityDay, setOpacityNight, setOpacityGameScreen,
        opacitySwitchers: { goToDay, goToNight, goToLobby }
      }}  />
    </>
  )
}
