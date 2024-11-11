import React, { useState } from 'react';
import logo from './logo.svg';
import { Flex } from 'natived';
import { Button, Input, Select } from 'antd';

function App() {
  const [serverName, setServerName] = useState("");
  const [serverID, setServerID] = useState("");
  const [selectedSSQ, setSelectedSSQ] = useState("CAA.Rade.V5R21-V5R22.SSQ");
  return (
    <Flex direction='column'>
      <Flex direction='row' verticalCenter>
        <div>{"Server Name:"}</div>
        <Input value={serverName} onChange={e => {
          setServerName(e.target.value)
        }}></Input>
      </Flex>
      <Flex direction='row' verticalCenter>
        <div>{"Server ID:"}</div>
        <Input value={serverID} onChange={e => {
          setServerID(e.target.value)
        }}></Input>
      </Flex>
      <Flex direction='row' verticalCenter>
        <div>{"SSQ:"}</div>
        <Select options={[
          {
            label: "CAA.Rade.V5R21-V5R22.SSQ",
            value: "CAA.Rade.V5R21-V5R22.SSQ"
          },
          {
            label: "CAA.Rade.V5R26.SSQ",
            value: "CAA.Rade.V5R26.SSQ"
          },
          {
            label: "CATIA.V5R21-V5R22-V23.SSQ",
            value: "CATIA.V5R21-V5R22-V23.SSQ"
          }
        ]} value={selectedSSQ} onChange={e => {
          setSelectedSSQ(e)
        }}></Select>
      </Flex>
      <Flex>
        <Button onClick={e=>{
          
        }}>{"Sure"}</Button>
      </Flex>
    </Flex>
  );
}

export default App;
