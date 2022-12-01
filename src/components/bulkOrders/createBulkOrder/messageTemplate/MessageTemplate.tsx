import { Button, Space, Typography } from 'antd';
import React from 'react';
import TextArea from 'antd/lib/input/TextArea';

const { Text } = Typography;

export interface MsgTmpl {
  tmpl: string;
  varSymbolCount: number;
}

type MessageTemplateProps = {
  msgTmpl: MsgTmpl;
  updateMsgTmpl: (msgTmpl: MsgTmpl) => void;
};

export const MSG_TMPL_VAR_SYMBOL = '{}';

export const getMsgTmplVarSymbolWithNumber = (value: number) => `{${value}}`;

export const MSG_TMPL_VAR_LIMIT = 3;

export const MESSAGE_TEMPLATE_DESC = (
  <Space direction='vertical' size={40}>
    <Text>
      {`Message templates allow you to tailor your message to each of your customers. Enter a fixed message template and insert “{ }” where you want to customize your inputs for each customer. 
`}
    </Text>
    <Space direction='vertical'>
      <Text>{`*Note that a maximum of 3 “{}” are allowed.`}</Text>
      <Text>{`*Example 4 is used when you would like to enter different messages for each customer.`}</Text>
    </Space>

    <Space direction='vertical'>
      <div>
        <Text italic>Example 1: Hey </Text>
        <Text italic keyboard>
          {MSG_TMPL_VAR_SYMBOL}
        </Text>
        <Text italic>, Happy Holidays to you and your family!</Text>
      </div>
      <div>
        <Text italic>Example 2: Hello </Text>
        <Text italic keyboard>
          {MSG_TMPL_VAR_SYMBOL}
        </Text>
        <Text italic>, enjoy the gift! </Text>
        <Text italic keyboard>
          {MSG_TMPL_VAR_SYMBOL}
        </Text>
      </div>
      <div>
        <Text italic>Example 3: Hi </Text>
        <Text italic keyboard>
          {MSG_TMPL_VAR_SYMBOL}
        </Text>
        <Text italic>! Share this gift with your </Text>
        <Text italic keyboard>
          {MSG_TMPL_VAR_SYMBOL}
        </Text>
        <Text italic>, Happy Holiday! From </Text>
        <Text italic keyboard>
          {MSG_TMPL_VAR_SYMBOL}
        </Text>
      </div>
      <div>
        <Text italic>Example 4: </Text>
        <Text italic keyboard>
          {MSG_TMPL_VAR_SYMBOL}
        </Text>
      </div>
    </Space>
  </Space>
);

const getMsgTmplDisplay = (msgTmpl: MsgTmpl): React.ReactNode => {
  if (msgTmpl.varSymbolCount < 1) {
    return <Text>{msgTmpl.tmpl}</Text>;
  }

  /*
  Custom string splitter that splits only up to a specified limit, then returns the entire string after that limit.

  note: this function is required as the default behaviour of Javascript's String.split() is that it will NOT return the string after the specified limit.
  */
  const stringSplitter = {
    [Symbol.split](str: string) {
      const res = [];

      let count = 0;
      let pos = 0;
      let matchPos = str.indexOf(MSG_TMPL_VAR_SYMBOL, pos);

      while (matchPos !== -1 && count < MSG_TMPL_VAR_LIMIT) {
        const subStr = str.slice(pos, matchPos);
        res.push(subStr);
        pos = matchPos + MSG_TMPL_VAR_SYMBOL.length;
        matchPos = str.indexOf(MSG_TMPL_VAR_SYMBOL, pos);

        count++;
      }

      // if the limit has been hit, then add the remaining string into the result array. otherwise, add empty string to the end
      res.push(str.slice(pos, str.length));

      return res;
    }
  };

  const chunks = msgTmpl.tmpl
    .split(stringSplitter)
    .map((chunk) => <Text>{chunk}</Text>);

  return (
    <div>
      {chunks
        .flatMap((chunk, index) =>
          index > 0
            ? [
                <Text keyboard>{getMsgTmplVarSymbolWithNumber(index)}</Text>,
                chunk
              ]
            : chunk
        )
        .map((elem, index) => (
          <React.Fragment key={index}>{elem}</React.Fragment>
        ))}
    </div>
  );
};

const MessageTemplate = ({ msgTmpl, updateMsgTmpl }: MessageTemplateProps) => {
  const [showEditMsg, setShowEditMsg] = React.useState<boolean>(false);
  const [editMsgTmpl, setEditMsgTmpl] = React.useState<string>(msgTmpl.tmpl);

  const handleMsgTmplUpdate = () => {
    const numVarSymbols = (editMsgTmpl.match(/{}/g) ?? []).length;
    updateMsgTmpl({
      tmpl: editMsgTmpl.trim(),
      varSymbolCount:
        numVarSymbols > MSG_TMPL_VAR_LIMIT ? MSG_TMPL_VAR_LIMIT : numVarSymbols
    });
  };

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      {(msgTmpl.tmpl || showEditMsg) &&
        (showEditMsg ? (
          <>
            <TextArea
              rows={5}
              value={editMsgTmpl}
              onChange={(e) => setEditMsgTmpl(e.target.value)}
            />
            <Space style={{ float: 'right', marginTop: 2 }}>
              <Button
                onClick={() => {
                  setEditMsgTmpl(msgTmpl.tmpl);
                  setShowEditMsg(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type='primary'
                onClick={() => {
                  handleMsgTmplUpdate();
                  setShowEditMsg(false);
                }}
              >
                Save
              </Button>
            </Space>
          </>
        ) : (
          <Space style={{ marginBottom: '0.5em' }}>
            {getMsgTmplDisplay(msgTmpl)}
          </Space>
        ))}
      {!showEditMsg && (
        <Button type='primary' onClick={() => setShowEditMsg(true)}>
          {`${editMsgTmpl ? 'Edit' : 'Add'} Message Template`}
        </Button>
      )}
    </Space>
  );
};

export default MessageTemplate;
