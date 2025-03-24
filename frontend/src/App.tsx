import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { ConnectKitButton } from 'connectkit';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
   
     
        <ConnectKitButton />
       
    
    </>
  )
}

export default App
