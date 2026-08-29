import { useState } from "react"
import LoginPage from "./Components/LoginPage.jsx"

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  return (
    <>
      <LoginPage />
    </>
  )
}

export default App