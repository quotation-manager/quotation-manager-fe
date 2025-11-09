import React from 'react';
import { Layout, Menu } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  ContactsOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import './Sidebar.css';

const { Sider } = Layout;

const Sidebar = ({ collapsed, mobileOpen, setMobileOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(state => state.auth);

  // Get user role (1 = admin, 2 = employee)
  const userRole = user?.role || 2;

  // Menu items for admin (role 1)
  const adminMenuItems = [
    {
      key: '/dashboard/users',
      icon: <UserOutlined />,
      label: 'Users',
    },
    {
      key: '/dashboard/references',
      icon: <ContactsOutlined />,
      label: 'References',
    },
    {
      key: '/dashboard/customers',
      icon: <TeamOutlined />,
      label: 'Customers',
    },
    {
      key: '/dashboard/products',
      icon: <ShoppingOutlined />,
      label: 'Products',
    },
    {
      key: '/dashboard/locations',
      icon: <EnvironmentOutlined />,
      label: 'Locations',
    },
    {
      key: '/dashboard/quotations',
      icon: <FileTextOutlined />,
      label: 'Quotations',
    },
  ];

  // Menu items for employee (role 2) - same as admin but without Users
  const employeeMenuItems = [
    {
      key: '/dashboard/references',
      icon: <ContactsOutlined />,
      label: 'References',
    },
    {
      key: '/dashboard/customers',
      icon: <TeamOutlined />,
      label: 'Customers',
    },
    {
      key: '/dashboard/products',
      icon: <ShoppingOutlined />,
      label: 'Products',
    },
    {
      key: '/dashboard/locations',
      icon: <EnvironmentOutlined />,
      label: 'Locations',
    },
    {
      key: '/dashboard/quotations',
      icon: <FileTextOutlined />,
      label: 'Quotations',
    },
  ];

  const menuItems = userRole === 1 ? adminMenuItems : employeeMenuItems;

  const handleMenuClick = ({ key }) => {
    navigate(key);
    // Close mobile sidebar after navigation
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}
      width={250}
    >
      <div className="sidebar-logo">
        <h2>{collapsed ? 'ML' : 'Maruti Laminates'}</h2>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        className="sidebar-menu"
      />
      <div className="sidebar-footer">
        <p className="developer-text">
          {collapsed ? 'SS' : 'Developed by Sunny Softwares'}
        </p>
      </div>
    </Sider>
  );
};

export default Sidebar;
