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
    Typography,
    Chip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const ResponseTemplatesManager = () => {
    const [templates, setTemplates] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [formData, setFormData] = useState({
        type: '',
        template: '',
        variables: []
    });

    const templateTypes = ['success', 'error', 'notification'];

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await axios.get('/api/knowledge/responses/templates');
            setTemplates(response.data);
        } catch (error) {
            console.error('Error al obtener plantillas:', error);
        }
    };

    const handleOpenDialog = (template = null) => {
        if (template) {
            setEditingTemplate(template);
            setFormData({
                type: template.type,
                template: template.template,
                variables: template.variables
            });
        } else {
            setEditingTemplate(null);
            setFormData({
                type: '',
                template: '',
                variables: []
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingTemplate(null);
    };

    const handleSubmit = async () => {
        try {
            if (editingTemplate) {
                await axios.put(`/api/knowledge/responses/templates/${editingTemplate._id}`, formData);
            } else {
                await axios.post('/api/knowledge/responses/templates', formData);
            }
            fetchTemplates();
            handleCloseDialog();
        } catch (error) {
            console.error('Error al guardar plantilla:', error);
        }
    };

    const handleDelete = async (templateId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
            try {
                await axios.delete(`/api/knowledge/responses/templates/${templateId}`);
                fetchTemplates();
            } catch (error) {
                console.error('Error al eliminar plantilla:', error);
            }
        }
    };

    const handleVariablesChange = (value) => {
        const variables = value.split(',').map(v => v.trim()).filter(v => v);
        setFormData({ ...formData, variables });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Plantillas de Respuestas</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleOpenDialog()}
                >
                    Agregar Plantilla
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Plantilla</TableCell>
                            <TableCell>Variables</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {templates.map((template) => (
                            <TableRow key={template._id}>
                                <TableCell>{template.type}</TableCell>
                                <TableCell>{template.template}</TableCell>
                                <TableCell>
                                    {template.variables.map((variable, index) => (
                                        <Chip
                                            key={index}
                                            label={variable}
                                            size="small"
                                            sx={{ mr: 0.5, mb: 0.5 }}
                                        />
                                    ))}
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        onClick={() => handleOpenDialog(template)}
                                        color="primary"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleDelete(template._id)}
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
                    {editingTemplate ? 'Editar Plantilla' : 'Agregar Nueva Plantilla'}
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
                                {templateTypes.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Plantilla"
                            multiline
                            rows={3}
                            value={formData.template}
                            onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                            helperText="Usa {variable} para incluir variables dinámicas"
                        />

                        <TextField
                            label="Variables"
                            value={formData.variables.join(', ')}
                            onChange={(e) => handleVariablesChange(e.target.value)}
                            helperText="Ingresa las variables separadas por comas"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {editingTemplate ? 'Actualizar' : 'Agregar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ResponseTemplatesManager; 