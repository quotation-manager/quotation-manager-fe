import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Breadcrumb,
  notification,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { SUCCESS_MESSAGES, getErrorMessage } from '../constants';
import './ChangePassword.css';

const { Title, Text } = Typography;
const { Password } = Input;

const ChangePassword = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  // Handle form submit
  const handleFormSubmit = async values => {
    try {
      setLoading(true);

      const response = await userService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      if (response.success) {
        api.success({
          message: 'Success',
          description: SUCCESS_MESSAGES.PASSWORD_CHANGED,
        });
        form.resetFields();
      }
    } catch (error) {
      api.error({
        message: 'Error',
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {contextHolder}

      {/* Breadcrumbs */}
      <div className="change-password-breadcrumb">
        <Breadcrumb>
          <Breadcrumb.Item>
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Change Password</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Card>
        <Title level={3}>Change Password</Title>
        <Text
          type="secondary"
          style={{ marginBottom: '24px', display: 'block' }}
        >
          Update your account password to keep it secure
        </Text>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          style={{ maxWidth: '500px' }}
        >
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[
              {
                required: true,
                message: 'Please enter your current password',
              },
            ]}
          >
            <Password
              prefix={<LockOutlined />}
              placeholder="Enter your current password"
              iconRender={visible =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              {
                required: true,
                message: 'Please enter a new password',
              },
              {
                min: 6,
                message: 'Password must be at least 6 characters long',
              },
            ]}
          >
            <Password
              prefix={<LockOutlined />}
              placeholder="Enter your new password"
              iconRender={visible =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              {
                required: true,
                message: 'Please confirm your new password',
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('The two passwords do not match')
                  );
                },
              }),
            ]}
          >
            <Password
              prefix={<LockOutlined />}
              placeholder="Confirm your new password"
              iconRender={visible =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          {/* Form Actions */}
          <Row justify="end">
            <Col>
              <Space size="middle">
                <Button
                  onClick={() => navigate('/dashboard')}
                  style={{ minWidth: '100px' }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<LockOutlined />}
                  style={{ minWidth: '140px' }}
                >
                  Change Password
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default ChangePassword;
