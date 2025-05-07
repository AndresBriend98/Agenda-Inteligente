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
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Typography
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const FactsManager = () => {
    const [facts, setFacts] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingFact, setEditingFact] = useState(null);
    const [formData, setFormData] = useState({
        type: '',
        value: '',
        description: ''
    });

    const factTypes = ['priority', 'status', 'action'];

    useEffect(() => {
        fetchFacts();
    }, []);

    const fetchFacts = async () => {
        try {
            const response = await axios.get('/api/knowledge/facts');
            setFacts(response.data);
        } catch (error) {
            console.error('Error al obtener hechos:', error);
        }
    };

    const handleOpenDialog = (fact = null) => {
        if (fact) {
            setEditingFact(fact);
            setFormData({
                type: fact.type,
                value: fact.value,
                description: fact.description
            });
        } else {
            setEditingFact(null);
            setFormData({
                type: '',
                value: '',
                description: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingFact(null);
    };

    const handleSubmit = async () => {
        try {
            if (editingFact) {
                await axios.put(`/api/knowledge/facts/${editingFact._id}`, formData);
            } else {
                await axios.post('/api/knowledge/facts', formData);
            }
            fetchFacts();
            handleCloseDialog();
        } catch (error) {
            console.error('Error al guardar hecho:', error);
        }
    };

    const handleDelete = async (factId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este hecho?')) {
            try {
                await axios.delete(`/api/knowledge/facts/${factId}`);
                fetchFacts();
            } catch (error) {
                console.error('Error al eliminar hecho:', error);
            }
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Hechos del Sistema Experto</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleOpenDialog()}
                >
                    Agregar Hecho
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Valor</TableCell>
                            <TableCell>Descripción</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {facts.map((fact) => (
                            <TableRow key={fact._id}>
                                <TableCell>{fact.type}</TableCell>
                                <TableCell>{fact.value}</TableCell>
                                <TableCell>{fact.description}</TableCell>
                                <TableCell>
                                    <IconButton
                                        onClick={() => handleOpenDialog(fact)}
                                        color="primary"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleDelete(fact._id)}
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingFact ? 'Editar Hecho' : 'Agregar Nuevo Hecho'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                label="Tipo"
                            >
                                {factTypes.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Valor"
                            value={formData.value}
                            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        />

                        <TextField
                            label="Descripción"
                            multiline
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {editingFact ? 'Actualizar' : 'Agregar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FactsManager; 