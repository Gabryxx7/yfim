import React from "react";
import { CMDS, DATA, KEY_SHORTCUTS} from "../../backend/Definitions.js";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useSettings } from '../../context';
import ClosablePanel from "./ClosablePanel.js";

export default function ShortcutsPanel(props) {
   const { settings } = useSettings();
   return <ClosablePanel className={`actions-panel keyboard-actions ${props.className}`}>
         {Object.values(KEY_SHORTCUTS).map((s, i) => 
            <div key={`Key-Action-${i}`} className="action">
               {s.icon ? <FontAwesomeIcon className="key key-icon" icon={s.icon} /> : <span className="key key-name">{s.keyName}</span>}
               <span>{s.name}</span>
            </div>
         )}
      </ClosablePanel>
}

