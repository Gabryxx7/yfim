import { useContext } from "react"
import { SocketContext } from "./SocketContext"

export const useSocket = (namespace) => {
   return useContext(SocketContext).getSocket(namespace)
}