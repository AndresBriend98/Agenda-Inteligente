import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import RulesManager from './RulesManager';
import FactsManager from './FactsManager';
import ResponseTemplatesManager from './ResponseTemplatesManager';
import ResponseHistory from './ResponseHistory';

const KnowledgeBaseManager = () => {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Gestión de Base de Conocimientos
            </Typography>
            
            <Paper sx={{ width: '100%', mb: 2 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                >
                    <Tab label="Reglas" />
                    <Tab label="Hechos" />
                    <Tab label="Plantillas" />
                    <Tab label="Historial" />
                </Tabs>
            </Paper>

            <Box sx={{ mt: 2 }}>
                {activeTab === 0 && <RulesManager />}
                {activeTab === 1 && <FactsManager />}
                {activeTab === 2 && <ResponseTemplatesManager />}
                {activeTab === 3 && <ResponseHistory />}
            </Box>
        </Box>
    );
};

export default KnowledgeBaseManager; 