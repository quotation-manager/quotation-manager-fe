import React from 'react';
import { Layout, Button, Dropdown, Avatar, Space, Typography } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  ContactsOutlined,
  ShoppingOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { logoutUser } from '../../store/slices/authSlice';
import './Header.css';

const { Header: AntHeader } = Layout;
const { Text, Title } = Typography;

const Header = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(state => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleChangePassword = () => {
    navigate('/dashboard/change-password');
  };

  const userMenuItems = [
    // Show change password only for admin users
    ...(user?.role === 1
      ? [
          {
            key: 'change-password',
            icon: <LockOutlined />,
            label: 'Change Password',
            onClick: handleChangePassword,
          },
        ]
      : []),
    // Show logout for all users
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const getRoleText = role => {
    return role === 1 ? 'Admin' : 'Employee';
  };

  const getPageInfo = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard/users':
        return {
          title: 'Users Management',
          icon: <UserOutlined />,
          subtitle: 'Manage system users and their permissions',
        };
      case '/dashboard/references':
        return {
          title: 'References Management',
          icon: <ContactsOutlined />,
          subtitle: 'Manage business references and contacts',
        };
      case '/dashboard/customers':
        return {
          title: 'Customers Management',
          icon: <TeamOutlined />,
          subtitle: 'Manage customer information and relationships',
        };
      case '/dashboard/products':
        return {
          title: 'Products Management',
          icon: <ShoppingOutlined />,
          subtitle: 'Manage products and inventory information',
        };
      case '/dashboard/locations':
        return {
          title: 'Locations Management',
          icon: <EnvironmentOutlined />,
          subtitle: 'Manage business locations and addresses',
        };
      case '/dashboard/quotations':
        return {
          title: 'Quotations Management',
          icon: <FileTextOutlined />,
          subtitle: 'Manage quotations and pricing information',
        };
      default:
        // Handle quotation sub-routes
        if (path.startsWith('/dashboard/quotations/add')) {
          return {
            title: 'Add Quotation',
            icon: <FileTextOutlined />,
            subtitle: 'Create a new quotation',
          };
        }
        if (path.startsWith('/dashboard/quotations/edit/')) {
          return {
            title: 'Edit Quotation',
            icon: <FileTextOutlined />,
            subtitle: 'Modify quotation details',
          };
        }
        if (path.startsWith('/dashboard/quotations/view/')) {
          return {
            title: 'View Quotation',
            icon: <FileTextOutlined />,
            subtitle: 'View quotation details',
          };
        }
        return {
          title: 'Dashboard',
          icon: <UserOutlined />,
          subtitle: 'Welcome to Maruti Laminates',
        };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <AntHeader className={`dashboard-header ${collapsed ? 'collapsed' : ''}`}>
      <div className="header-left">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => {
            // On mobile, toggle mobile sidebar; on desktop, toggle collapsed state
            if (window.innerWidth <= 768) {
              setMobileOpen(!mobileOpen);
            } else {
              setCollapsed(!collapsed);
            }
          }}
          className="sidebar-toggle"
        />
        <div className="page-info">
          <div className="page-title">
            {pageInfo.icon}
            <Title level={3} style={{ margin: 0, marginLeft: 8 }}>
              {pageInfo.title}
            </Title>
          </div>
          <Text type="secondary" className="page-subtitle">
            {pageInfo.subtitle}
          </Text>
        </div>
      </div>

      <div className="header-right">
        <Space size="large">
          <div className="user-info">
            <Text strong>{user?.user_name || 'User'}</Text>
            <Text type="secondary" className="user-role">
              {getRoleText(user?.role)}
            </Text>
          </div>
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            arrow
          >
            <Avatar
              size="large"
              icon={<UserOutlined />}
              className="user-avatar"
            />
          </Dropdown>
        </Space>
      </div>
    </AntHeader>
  );
};

export default Header;
