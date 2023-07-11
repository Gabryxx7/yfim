import React from "react";
import ToolBar from "../components/ToolBar";
import { Typography } from "@mui/material";
import io from "socket.io-client";
import { CMDS, DATA} from '../managers/Communications'

const useStyles = makeStyles((theme) => ({
  toolBar: {
    zIndex: 20,
    right: 0,
    top: "50px",
    backgroundColor: "white",
    position: "absolute",
    flexDirection: "col",
  },
  toggleSwitch: {
    // display: "flex",
    flexDirection: "row",
  },
}));

// Control page for administrators, deprecated now

function ControlPage(props) {
  const room = props.match.params.room;
  return (
    <div>
      <div>DashBoard</div>
      <Typography>Host</Typography>
    </div>
  );
}

// const mapStateToProps = (store) => ({ controlParams: store.controlParams });
// const mapDispatchToProps = (dispatch) => {};
// export default connect(mapStateToProps, mapDispatchToProps)(ControlPage);
export default ControlPage;
