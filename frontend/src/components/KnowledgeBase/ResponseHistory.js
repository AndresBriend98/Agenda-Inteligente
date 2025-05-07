import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid
} from '@mui/material';
import axios from 'axios';

const ResponseHistory = () => {
    const [history, setHistory] = useState([]);
    const [filters, setFilters] = useState({
        type: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchHistory();
    }, [filters]);

    const fetchHistory = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.type) params.append('type', filters.type);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await axios.get(`/api/knowledge/responses/history?${params.toString()}`);
            setHistory(response.data);
        } catch (error) {
            console.error('Error al obtener historial:', error);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Historial de Respuestas
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={filters.type}
                                onChange={(e) => handleFilterChange('type', e.target.value)}
                                label="Tipo"
                            >
                                <MenuItem value="">Todos</MenuItem>
                                <MenuItem value="success">Éxito</MenuItem>
                                <MenuItem value="error">Error</MenuItem>
                                <MenuItem value="notification">Notificación</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Fecha Inicio"
                            type="datetime-local"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Fecha Fin"
                            type="datetime-local"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Plantilla</TableCell>
                            <TableCell>Variables</TableCell>
                            <TableCell>Respuesta</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {history.map((item) => (
                            <TableRow key={item._id}>
                                <TableCell>{formatDate(item.timestamp)}</TableCell>
                                <TableCell>{item.template.type}</TableCell>
                                <TableCell>{item.template.template}</TableCell>
                                <TableCell>
                                    {Object.entries(item.variables).map(([key, value]) => (
                                        <Box key={key} sx={{ mb: 0.5 }}>
                                            <strong>{key}:</strong> {value}
                                        </Box>
                                    ))}
                                </TableCell>
                                <TableCell>{item.response}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ResponseHistory; 