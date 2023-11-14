import { useContext } from "react";
import { AppContext } from "./AppContext.js";

export const useApp = () => {
   return useContext(AppContext);
}