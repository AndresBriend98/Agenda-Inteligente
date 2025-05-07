import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TaskBoard from './components/TaskBoard';
import KnowledgeBaseManager from './components/KnowledgeBase/KnowledgeBaseManager';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/board" element={<TaskBoard />} />
                        <Route path="/knowledge" element={<KnowledgeBaseManager />} />
                    </Routes>
                </Layout>
            </Router>
        </ThemeProvider>
    );
}

export default App; 