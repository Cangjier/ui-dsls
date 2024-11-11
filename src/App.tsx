import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import { Button, Input, message, Select, Spin } from 'antd';
import { Flex } from './ui-lib/Flex';
import { VizGroupService } from './services';
import { utils } from './utils';

function App() {
  useEffect(() => {
    console.log(process.env.REACT_APP_BUILD_TIME);
  }, []);
  const [serverName, setServerName] = useState("");
  const [serverID, setServerID] = useState("");
  const [selectedSSQ, setSelectedSSQ] = useState("CAA.Rade.V5R21-V5R22.SSQ");
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  return <div>
    {contextHolder}
    <Spin fullscreen spinning={loading}></Spin>
    <Flex direction='column' spacing={'1em'} style={{
      padding: '1em'
    }}>
      <Flex direction='row' verticalCenter>
        <div style={{
          minWidth: '10em',
          textWrap: 'nowrap'
        }}>{"Server Name:"}</div>
        <Input style={{
          flex: 1
        }} value={serverName} onChange={e => {
          setServerName(e.target.value)
        }}></Input>
      </Flex>
      <Flex direction='row' verticalCenter>
        <div style={{
          minWidth: '10em',
          textWrap: 'nowrap'
        }}>{"Server ID:"}</div>
        <Input style={{
          flex: 1
        }} value={serverID} onChange={e => {
          setServerID(e.target.value)
        }}></Input>
      </Flex>
      <Flex direction='row' verticalCenter>
        <div style={{
          minWidth: '10em',
          textWrap: 'nowrap'
        }}>{"SSQ:"}</div>
        <Select style={{
          flex: 1
        }} options={[
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
        <Button style={{
          flex: 1
        }} onClick={async e => {
          setLoading(true)
          try {
            let task = await VizGroupService.Tasks.Run("dsls", {
              ServerName: serverName,
              ServerID: serverID,
              SSQ: selectedSSQ,
            }, progress => {
              console.log(progress)
            });
            if (task.Output.FileID) {
              utils.download(`/api/v1/iostorage/download/${task.Output.FileID}`);
            }
            else if (task.Output.Message) {
              messageApi.open({
                type: 'error',
                content: task.Output.Message,
                duration: 10,
              });
            }
          }
          finally {
            setLoading(false)
          }
        }}>{"Sure"}</Button>
      </Flex>
    </Flex>
  </div>
}

export default App;
