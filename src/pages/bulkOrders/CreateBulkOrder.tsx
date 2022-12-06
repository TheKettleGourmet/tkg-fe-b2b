import {
  Button,
  Space,
  Typography,
  Input,
  Form,
  InputNumber,
  Select,
  Grid
} from 'antd';
import { isEmpty, startCase } from 'lodash';
import React from 'react';
import { useLocation } from 'react-router-dom';
import authContext from 'src/context/auth/authContext';
import bulkOrdersContext from 'src/context/bulkOrders/bulkOrdersContext';
import { PaymentMode } from 'src/models/types';
import {
  createBulkOrder,
  getBulkOrderByOrderId
} from 'src/services/bulkOrdersService';
import asyncFetchCallback from 'src/services/util/asyncFetchCallback';
import { redirectToExternal } from 'src/utils/utils';
import {
  convertBulkOrdersToFormValues,
  convertFormValuesToBulkOrder,
  Hamper,
  HamperOrdersFormItem,
  hasValidHampers
} from '../../components/bulkOrders/bulkOrdersHelper';
import Hampers from '../../components/bulkOrders/createBulkOrder/hampers/Hampers';
import { MsgTmpl } from '../../components/bulkOrders/createBulkOrder/messageTemplate/MessageTemplate';
import ConfirmationModalButton from '../../components/common/ConfirmationModalButton';
import DynamicFormItem from '../../components/common/DynamicFormItem';
import '../../styles/common/common.scss';

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

const CreateBulkOrder = () => {
  const location = useLocation();
  const orderId = location.state?.orderId;

  const screens = useBreakpoint();

  const { user } = React.useContext(authContext);
  const { updateBulkOrderId } = React.useContext(bulkOrdersContext);

  const [form] = Form.useForm();
  const [hampersMap, setHampersMap] = React.useState<Map<string, Hamper>>(
    new Map()
  );

  const [msgPreviewFormItem, setMsgPreviewFormItem] =
    React.useState<HamperOrdersFormItem | null>(null);

  const [msgTmpl, setMsgTmpl] = React.useState<MsgTmpl>({
    tmpl: '',
    varSymbolCount: 0
  });
  const [disableFormBtns, setDisableFormBtns] = React.useState<boolean>(
    !(orderId || !isEmpty(form.getFieldsValue(true)))
  );
  const [submitLoading, setSubmitLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (orderId) {
      asyncFetchCallback(getBulkOrderByOrderId(orderId), (res) => {
        const [formValues, generatedHampersMap] =
          convertBulkOrdersToFormValues(res);
        setHampersMap(generatedHampersMap);
        form.setFieldsValue(formValues);
      });
    } else if (user) {
      const { firstName, lastName, email, company, contactNo } = user;
      form.setFieldsValue({
        payeeName: `${firstName} ${lastName}`,
        payeeEmail: email,
        payeeContactNo: contactNo,
        payeeCompany: company
      });
    }
  }, [orderId, user, form]);

  const onFinish = (values: any) => {
    const bulkOrder = convertFormValuesToBulkOrder(values, hampersMap, msgTmpl);

    setSubmitLoading(true);
    asyncFetchCallback(
      createBulkOrder(bulkOrder),
      (res) => {
        console.log(res);
        updateBulkOrderId(res.bulkOrder.orderId);
        redirectToExternal(res.paymentUrl);
      },
      (err) => console.log(err),
      { updateLoading: setSubmitLoading, delay: 500 }
    );
  };

  return (
    <div className='container-left' style={{ marginBottom: '2em' }}>
      <Title level={2}>Orders</Title>
      <Space direction='vertical' size='large' style={{ width: '100%' }}>
        <Text>Create a Bulk Order for multiple addresses.</Text>
        <Space direction='vertical'>
          <Text>*Here's how: </Text>
          <Text>
            1) Fill up payee details in Section A and choose your mode of
            payment
          </Text>
          <Text>
            2) Design and name your customized bundles from our menu in section
            B, save after finish editing
          </Text>
          <Text>
            3) Input your recipient details in Section C, choose the bundle name
            created in Section B to allocate to your preferred recipient
          </Text>
          <Text>
            4) Craft your personalize message and input remarks (if any) in the
            given text boxes
          </Text>
          <Text>5) Finally, check your order and make payment</Text>
        </Space>
        <Space direction='vertical'>
          <Text underline>
            For allocation of bulk orders to multiple addresses (e.g Christmas
            Mini x100, x200):
          </Text>
          <Text>
            a) Allocate bulk bundle item (e.g Christmas Mini x100) to your first
            added customer
          </Text>
          <Text>
            b) For subsequent customers, fill in customer details and leave
            bundle selection empty
          </Text>
          <Text>
            c) Under remarks, state quantity to deliver or special instructions
          </Text>
        </Space>
        <div>
          <Text italic>
            Note: If you have enquiries or are looking for a quantity that is
            not available in our selection (e.g MM Box x 102), please
            contact/whatsapp us at{' '}
          </Text>
          <Text strong italic>
            +65 8020 0741
          </Text>
          <Text> or drop us an email at </Text>
          <Text strong italic>
            zac@thekettlegourmet.com
          </Text>
          <Text italic>. We will respond to your query accordingly.</Text>
        </div>
        <Space direction='vertical'>
          <Title level={4} style={{ marginTop: 10 }}>
            Section A: Insert Payee Details
          </Title>
          <Text>Fill up payee details and choose your mode of payment.</Text>
        </Space>
        <Form
          form={form}
          name='hamperOrders'
          labelCol={{ span: screens.xxl ? 2 : 3 }}
          wrapperCol={{ span: 8 }}
          autoComplete='off'
        >
          <Form.Item
            label='Name'
            name='payeeName'
            rules={[{ required: true, message: 'Please input your name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label='Email'
            name='payeeEmail'
            rules={[
              { type: 'email', message: 'Please input a valid email!' },
              { required: true, message: 'Please input your email!' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label='Contact No.'
            name='payeeContactNo'
            rules={[
              {
                required: true,
                message: 'Please input a valid contact number!',
                pattern: /^\+?(65)?[689][0-9]{7}$/
              }
            ]}
          >
            <InputNumber
              controls={false}
              style={{ width: '100%' }}
              stringMode
            />
          </Form.Item>
          <Form.Item label='Company' name='payeeCompany'>
            <Input />
          </Form.Item>
          <Form.Item
            label='Payment Mode'
            name='paymentMode'
            rules={[
              { required: true, message: 'Please select a payment mode!' }
            ]}
          >
            <Select>
              {Object.values(PaymentMode).map((paymentMode) => (
                <Option key={paymentMode} value={paymentMode}>
                  {startCase(paymentMode.toLowerCase())}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label='Remarks' name='payeeRemarks'>
            <TextArea rows={3} />
          </Form.Item>
        </Form>
        {/* <Title level={4}>Excel Upload</Title>
        <Button type='primary' icon={<DownloadOutlined />}>
          Download Excel Template
        </Button>
        <Space align='start' size='large'>
          <Text>Upload Template (optional):</Text>
          <Upload maxCount={1}>
            <Button icon={<UploadOutlined />}>Click to upload template</Button>
          </Upload>
        </Space> */}
        <Space
          direction='vertical'
          style={{ width: '100%', marginBottom: '2em' }}
        >
          <Title level={4} style={{ marginTop: 10 }}>
            Section B: Bundle Creation
          </Title>
          <Text>
            Click on Add Gift to design and name your customized bundles from
            our menu, save after you have finished editing.
          </Text>
          <Hampers
            hampers={[...hampersMap.values()]}
            updateHampers={(hampers) =>
              setHampersMap(
                new Map<string, Hamper>(
                  hampers.map((hamper) => [hamper.id, hamper])
                )
              )
            }
          />
        </Space>
        {/* <Space direction='vertical' style={{ width: '100%' }}>
          <Space align='baseline'>
            <Title level={4}>Craft Message</Title>
            <ConfirmationModalButton
              modalProps={{
                title: 'Message Template',
                body: MESSAGE_TEMPLATE_DESC,
                onConfirm: () => void 0
              }}
              type='text'
              shape='circle'
              icon={<InfoCircleOutlined />}
            />
          </Space>
          <MessageTemplate msgTmpl={msgTmpl} updateMsgTmpl={setMsgTmpl} />
        </Space> */}
        <Space direction='vertical' style={{ width: '100%' }}>
          <Title level={4}>Section C: Insert Receiver Details</Title>
          <Text>
            Insert your receiver details, choose the bundle name you created
            earlier to allocate to your preferred recipient*
          </Text>
        </Space>
        <Space direction='vertical' style={{ marginBottom: '1em' }}>
          <Text underline>
            For allocation of bulk orders to multiple addresses (e.g Christmas
            Mini x100, x200):
          </Text>
          <Text>
            a) Allocate bulk bundle item (e.g Christmas Mini x100) to your first
            added customer
          </Text>
          <Text>
            b) For subsequent customers, fill in customer details and leave
            bundle selection empty
          </Text>
          <Text>
            c) Under remarks, state quantity to deliver or special instructions
          </Text>
        </Space>
        <Form
          name='hamperOrders'
          onFinish={onFinish}
          scrollToFirstError
          onValuesChange={(_, allValues) =>
            setDisableFormBtns(!allValues?.hamperOrdersList?.length)
          }
          form={form}
        >
          <DynamicFormItem
            formName='hamperOrders'
            addBtnTxt='Add Customer'
            disableAdd={!hasValidHampers([...hampersMap.values()])}
            formChildren={({ key, name, ...restField }) => (
              <div style={{ display: 'flex', gap: '0.6em', width: '100%' }}>
                <Form.Item
                  {...restField}
                  name={[name, 'customerName']}
                  rules={[
                    { required: true, message: 'Customer name required' }
                  ]}
                  style={{ flex: 1 }}
                >
                  <Input placeholder='Customer Name' />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'customerContactNo']}
                  rules={[
                    {
                      required: true,
                      message: 'Valid contact no. required',
                      pattern: /^\+?(65)?[689][0-9]{7}$/
                    }
                  ]}
                  style={{ flex: 0.75 }}
                >
                  <InputNumber
                    placeholder='Contact Number'
                    controls={false}
                    style={{ width: '100%' }}
                    stringMode
                  />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'hamperId']}
                  // rules={[{ required: true, message: 'Hamper type required' }]}
                  style={{ flex: 0.5 }}
                >
                  <Select placeholder='Bundle'>
                    {[...hampersMap.values()].map((hamper) => (
                      <Option key={hamper.id} value={hamper.id}>
                        {hamper.hamperName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'customerAddress']}
                  rules={[{ required: true, message: 'Address required' }]}
                  style={{ flex: 1 }}
                >
                  <Input placeholder='Address' />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'postalCode']}
                  rules={[{ required: true, message: 'Postal code required' }]}
                  style={{ flex: 0.5 }}
                >
                  <Input placeholder='Postal Code' />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'customerMessage']}
                  style={{ flex: 0.8 }}
                >
                  <Input.TextArea
                    showCount
                    maxLength={500}
                    placeholder='Customer Message'
                  />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'customerRemarks']}
                  style={{ flex: 0.6 }}
                >
                  <Input.TextArea
                    showCount
                    maxLength={500}
                    placeholder='Remarks'
                  />
                </Form.Item>
                {/* {Array.from(
                  { length: msgTmpl.varSymbolCount },
                  (_, i) => i + 1
                ).map((i) => (
                  <Form.Item
                    {...restField}
                    key={i}
                    name={[name, `msgVar${i}`]}
                    rules={[
                      { required: true, message: 'Message variable required' }
                    ]}
                    style={{ flex: 1.5 / msgTmpl.varSymbolCount }}
                  >
                    <Input placeholder={`Message Variable ${i}`} />
                  </Form.Item>
                ))} */}
                {/* <Tooltip
                  mouseEnterDelay={0.5}
                  placement='bottom'
                  title='Preview Message'
                >
                  <Button
                    size='small'
                    type='primary'
                    shape='circle'
                    icon={<EyeOutlined />}
                    onClick={() =>
                      setMsgPreviewFormItem(
                        form.getFieldValue('hamperOrdersList')?.[key]
                      )
                    }
                  />
                </Tooltip> */}
              </div>
            )}
          />
          {/* {msgPreviewFormItem && (
            <CustomerMessageModal
              open={!!msgPreviewFormItem}
              msgTmpl={msgTmpl}
              hamperOrderFormItem={msgPreviewFormItem}
              onClose={() => setMsgPreviewFormItem(null)}
            />
          )} */}
          <div className='container-spaced-out' style={{ marginTop: '2em' }}>
            {/* <Button style={{ flex: 1 }} onClick={() => form.resetFields()}>
              Cancel
            </Button> */}
            <ConfirmationModalButton
              modalProps={{
                title: 'Confirm Cancel',
                body: 'Are you sure you want to cancel all hamper orders?',
                onConfirm: () => {
                  form.resetFields();
                  setDisableFormBtns(true);
                }
              }}
              style={{ flex: 1 }}
              disabled={disableFormBtns}
            >
              Cancel
            </ConfirmationModalButton>
            <Form.Item style={{ flex: 1 }}>
              <Button
                type='primary'
                htmlType='submit'
                block
                disabled={disableFormBtns}
                loading={submitLoading}
              >
                Make Payment
              </Button>
            </Form.Item>
          </div>
        </Form>
      </Space>
    </div>
  );
};

export default CreateBulkOrder;
