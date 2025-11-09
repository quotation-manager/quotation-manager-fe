import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Divider,
  notification,
} from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { loginUser } from '../store/slices/authSlice';
import { SUCCESS_MESSAGES, getErrorMessage } from '../constants';
import './Login.css';

const { Title, Text } = Typography;

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const { loading, isAuthenticated, error } = useSelector(state => state.auth);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Show error notification if there's an error
  useEffect(() => {
    if (error) {
      api.error({
        message: 'Login Failed',
        description: error,
        duration: 5,
      });
    }
  }, [error]);

  const onFinish = async values => {
    try {
      await dispatch(loginUser(values)).unwrap();

      // Show success notification
      api.success({
        message: 'Login Successful',
        description: SUCCESS_MESSAGES.LOGIN_SUCCESS,
        duration: 3,
      });

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by the useEffect above
    }
  };

  return (
    <div className="login-container">
      {contextHolder}
      <div className="login-background">
        <div className="login-overlay"></div>
      </div>

      <div className="login-content">
        <Card className="login-card" bordered={false}>
          <div className="login-header">
            <Space direction="vertical" align="center" size="large">
              <Title level={2} className="login-title">
                Maruti Laminates
              </Title>
              <Text type="secondary" className="login-subtitle">
                Sign in to your account to continue
              </Text>
            </Space>
          </div>

          <Divider />

          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            layout="vertical"
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                {
                  required: true,
                  message: 'Please enter your email!',
                },
                {
                  type: 'email',
                  message: 'Please enter a valid email!',
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your email"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                {
                  required: true,
                  message: 'Please enter your password!',
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="login-button"
                block
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
