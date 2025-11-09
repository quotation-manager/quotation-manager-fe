# Maruti Frontend

A React.js application built with modern JavaScript, featuring Redux Toolkit for state management and Ant Design for UI components.

## 🚀 Features

- **React 19** with modern JavaScript
- **Redux Toolkit** for global state management
- **Ant Design** for UI components
- **ESLint** and **Prettier** for code quality
- **Custom npm scripts** for formatting and linting
- **Best practices** folder structure
- **Global constants** for API routes, timeouts, and messages

## 📁 Project Structure

```
maruti-fe/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   └── layout/
│   │       └── Header.js
│   ├── constants/
│   │   └── index.js
│   ├── store/
│   │   ├── index.js
│   │   └── slices/
│   │       └── authSlice.js
│   ├── App.js
│   ├── App.css
│   └── index.js
├── .eslintrc.js
├── .prettierrc
├── .gitignore
├── package.json
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (version 16 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd maruti-fe
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

The application will open at `http://localhost:3000`

## 📜 Available Scripts

### Development
- `npm start` - Starts the development server
- `npm test` - Runs the test suite
- `npm run build` - Builds the app for production

### Code Quality
- `npm run lint` - Runs ESLint to check for code issues
- `npm run lint:fix` - Automatically fixes ESLint issues
- `npm run format` - Formats code using Prettier
- `npm run format:check` - Checks if code is properly formatted
- `npm run format:all` - Runs both formatting and linting fixes

## 🏗️ Architecture

### State Management
- **Redux Toolkit** for global state management
- **useState** for component-level state
- Sample auth slice included for authentication

### UI Framework
- **Ant Design** as the primary UI component library
- Responsive design with modern styling

### Code Quality
- **ESLint** for code linting with React-specific rules
- **Prettier** for consistent code formatting
- **Custom rules** for best practices

### Constants Management
Global constants are centralized in `src/constants/index.js`:
- API routes (external and internal)
- Timeouts and limits
- Error and success messages

## 🔧 Configuration Files

### ESLint (.eslintrc.js)
- React and React Hooks support
- Prettier integration
- Custom rules for better code quality

### Prettier (.prettierrc)
- Consistent code formatting
- 2-space indentation
- 80 character line width
- Single quotes for strings

## 📦 Dependencies

### Production Dependencies
- `react` - React library
- `react-dom` - React DOM rendering
- `react-scripts` - Create React App scripts
- `@reduxjs/toolkit` - Redux Toolkit for state management
- `react-redux` - React bindings for Redux
- `antd` - Ant Design UI components

### Development Dependencies
- `eslint` - Code linting
- `prettier` - Code formatting
- `eslint-config-prettier` - Prettier ESLint integration
- `eslint-plugin-prettier` - Prettier ESLint plugin
- `eslint-plugin-react` - React ESLint rules
- `eslint-plugin-react-hooks` - React Hooks ESLint rules
- `@babel/eslint-parser` - Babel ESLint parser

## 🚀 Getting Started

1. **Start development**:
   ```bash
   npm start
   ```

2. **Format your code**:
   ```bash
   npm run format:all
   ```

3. **Check for linting issues**:
   ```bash
   npm run lint
   ```

## 📝 Development Guidelines

### Code Style
- Use the provided ESLint and Prettier configurations
- Run `npm run format:all` before committing
- Follow React best practices

### State Management
- Use Redux Toolkit for global state
- Use useState for component-level state
- Create slices in `src/store/slices/`

### Components
- Use Ant Design components when possible
- Create reusable components in `src/components/`
- Follow the established folder structure

### Constants
- Add new constants to `src/constants/index.js`
- Use constants for API routes, timeouts, and messages
- Avoid hardcoding values in components

## 🤝 Contributing

1. Follow the established code style
2. Run `npm run format:all` before committing
3. Ensure all tests pass
4. Update documentation as needed

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions, please refer to the project documentation or create an issue in the repository. 