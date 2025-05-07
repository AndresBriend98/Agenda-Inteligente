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

const RulesManager = () => {
    const [rules, setRules] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [formData, setFormData] = useState({
        category: '',
        condition: '',
        action: '',
        priority: 0
    });

    const categories = [
        'environment',
        'messages',
        'creation',
        'prioritization',
        'validation',
        'errors'
    ];

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const response = await axios.get('/api/knowledge/rules');
            setRules(response.data);
        } catch (error) {
            console.error('Error al obtener reglas:', error);
        }
    };

    const handleOpenDialog = (rule = null) => {
        if (rule) {
            setEditingRule(rule);
            setFormData({
                category: rule.category,
                condition: rule.condition,
                action: rule.action,
                priority: rule.priority
            });
        } else {
            setEditingRule(null);
            setFormData({
                category: '',
                condition: '',
                action: '',
                priority: 0
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingRule(null);
    };

    const handleSubmit = async () => {
        try {
            if (editingRule) {
                await axios.put(`/api/knowledge/rules/${editingRule._id}`, formData);
            } else {
                await axios.post('/api/knowledge/rules', formData);
            }
            fetchRules();
            handleCloseDialog();
        } catch (error) {
            console.error('Error al guardar regla:', error);
        }
    };

    const handleDelete = async (ruleId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta regla?')) {
            try {
                await axios.delete(`/api/knowledge/rules/${ruleId}`);
                fetchRules();
            } catch (error) {
                console.error('Error al eliminar regla:', error);
            }
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Reglas del Sistema Experto</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleOpenDialog()}
                >
                    Agregar Regla
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Categoría</TableCell>
                            <TableCell>Condición</TableCell>
                            <TableCell>Acción</TableCell>
                            <TableCell>Prioridad</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rules.map((rule) => (
                            <TableRow key={rule._id}>
                                <TableCell>{rule.category}</TableCell>
                                <TableCell>{rule.condition}</TableCell>
                                <TableCell>{rule.action}</TableCell>
                                <TableCell>{rule.priority}</TableCell>
                                <TableCell>
                                    <IconButton
                                        onClick={() => handleOpenDialog(rule)}
                                        color="primary"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleDelete(rule._id)}
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
                    {editingRule ? 'Editar Regla' : 'Agregar Nueva Regla'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>Categoría</InputLabel>
                            <Select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                label="Categoría"
                            >
                                {categories.map((category) => (
                                    <MenuItem key={category} value={category}>
                                        {category}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Condición"
                            multiline
                            rows={3}
                            value={formData.condition}
                            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                        />

                        <TextField
                            label="Acción"
                            multiline
                            rows={3}
                            value={formData.action}
                            onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                        />

                        <TextField
                            label="Prioridad"
                            type="number"
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {editingRule ? 'Actualizar' : 'Agregar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RulesManager; 