//Importing Pages
import { BrowserRouter } from "react-router-dom";
import Register from "./Pages/RegisterPage";

function App() {
  return (
    <>
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    </>
  );
}

export default App;
