import React, { useEffect, useState } from "react";
import ReactJson from "react-json-view";
import io from "socket.io-client";
import { CMDS, DATA} from '../managers/Definitions'

var headers = new Headers();

headers.append("Authorization", "Basic " + btoa("admin:admin"));

// as database port is not open in the MRC instance, query data from server
// use ReactJson to show data in Json format

export default function (props) {
  const [result, setResult] = useState();
  const [data_show, setData_show] = useState();
  const [data_num, setData_num] = useState(0);
  useEffect(() => {
    const socket = io.connect(`/${CMDS.NAMESPACES.CONTROL}`);
    socket.emit(CMDS.SOCKET.DATA_CONNECT);
    socket.on("data-retrieve", (data) => {
      setResult(data);
      const len = data.length;
      setData_show(data[len - 1]);
    });
  }, []);
  return (
    <div style={{ padding: "15px" }}>
      <ReactJson src={data_show} theme="google" style={{ fontSize: "15px" }} />
    </div>
  );
}
