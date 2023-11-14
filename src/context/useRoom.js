import { useApp } from "./useApp";

export const useRoom = () => {
   const { room, setRoom, socket } = useApp();
   return {
      room,
      updateRoom: (roomData) => setRoom(prevRoom => ({...prevRoom, ...roomData})),
      joinRoom: () => console.log("Joining room!")
   }
}