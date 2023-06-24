import React from "react";

const TerminalOutput = ({children} : {children?: React.ReactChild}) => {
  
  return (
    <div className="react-terminal-line" style={{whiteSpace: 'normal', wordWrap: 'break-word'}}>{ children }</div>
  );
} 

export default TerminalOutput;