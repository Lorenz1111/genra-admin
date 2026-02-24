import { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Button, IconButton, Tooltip, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert 
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Edit, Delete, AddCircleOutline, Category } from '@mui/icons-material';
import { supabase } from '../../lib/supabaseClient';

interface Genre {
  id: string;
  name: string;
  created_at?: string;
}

export default function GenreManagement() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [genreName, setGenreName] = useState('');
  
  // Confirmation & Toast States
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, id: string, name: string } | null>(null);
  const [toast, setToast] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const fetchGenres = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching genres:', error);
      showToast('Failed to load genres', 'error');
    } else {
      setGenres(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  const showToast = (message: string, severity: 'success' | 'error') => {
    setToast({ open: true, message, severity });
  };

  const handleSaveGenre = async () => {
    if (!genreName.trim()) {
      showToast('Genre name cannot be empty', 'error');
      return;
    }

    if (editId) {
      // UPDATE
      const { error } = await supabase
        .from('genres')
        .update({ name: genreName.trim() })
        .eq('id', editId);

      if (error) showToast(error.message, 'error');
      else {
        showToast('Genre updated successfully!', 'success');
        fetchGenres();
      }
    } else {
      // INSERT
      const { error } = await supabase
        .from('genres')
        .insert([{ name: genreName.trim() }]);

      if (error) showToast(error.message, 'error');
      else {
        showToast('New genre added successfully!', 'success');
        fetchGenres();
      }
    }
    handleCloseModal();
  };

  const handleDeleteGenre = async () => {
    if (!confirmDialog) return;
    
    const { error } = await supabase
      .from('genres')
      .delete()
      .eq('id', confirmDialog.id);

    if (error) {
      showToast('Cannot delete genre. It might be in use by existing books.', 'error');
    } else {
      setGenres(prev => prev.filter(g => g.id !== confirmDialog.id));
      showToast('Genre deleted successfully!', 'success');
    }
    setConfirmDialog(null);
  };

  const handleOpenModal = (genre?: Genre) => {
    if (genre) {
      setEditId(genre.id);
      setGenreName(genre.name);
    } else {
      setEditId(null);
      setGenreName('');
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditId(null);
    setGenreName('');
  };

  const columns: GridColDef[] = [
    { 
      field: 'name', 
      headerName: 'Genre Name', 
      flex: 1, 
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a', mt: 2 }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Tooltip title="Edit Genre" arrow>
            <IconButton 
              size="small" 
              onClick={() => handleOpenModal(params.row as Genre)}
              sx={{ backgroundColor: '#eff6ff', color: '#2563eb', '&:hover': { backgroundColor: '#dbeafe' } }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Genre" arrow>
            <IconButton 
              size="small" 
              onClick={() => setConfirmDialog({ open: true, id: params.row.id, name: params.row.name })}
              sx={{ backgroundColor: '#fef2f2', color: '#dc2626', '&:hover': { backgroundColor: '#fee2e2' } }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    // SENIOR DEV FIX: Tinanggal ang 'mx: auto' at ginawang 1200px ang maxWidth para pumantay sa left side
    <Box sx={{ maxWidth: '1200px', pb: 8 }}>
      
      {/* Header & Add Button */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
            Genre Management
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Add, edit, or remove book genres across the GenrA platform.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddCircleOutline />} 
          onClick={() => handleOpenModal()}
          sx={{ borderRadius: 2, backgroundColor: '#2563eb', textTransform: 'none', fontWeight: 'bold', boxShadow: 'none' }}
        >
          Add New Genre
        </Button>
      </Box>

      {/* Table Area */}
      <Paper 
        elevation={0} 
        sx={{ 
          height: 500, width: '100%', borderRadius: 3, 
          border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}
      >
        <DataGrid
          rows={genres}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          slots={{
            noRowsOverlay: () => (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                <Category sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#64748b' }}>No genres found</Typography>
                <Typography variant="body2">Click "Add New Genre" to get started.</Typography>
              </Box>
            )
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8fafc', color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' },
            '& .MuiDataGrid-cell': { borderColor: '#f1f5f9' }
          }}
        />
      </Paper>

      {/* 1. Add/Edit Modal */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#0f172a', pb: 1 }}>
          {editId ? 'Edit Genre' : 'Add New Genre'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            {editId ? 'Modify the name of this genre.' : 'Create a new genre category for authors and readers.'}
          </Typography>
          <TextField
            autoFocus
            label="Genre Name"
            fullWidth
            variant="outlined"
            value={genreName}
            onChange={(e) => setGenreName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveGenre(); }}
            placeholder="e.g. Science Fiction, Romance, Mystery"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleCloseModal} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveGenre}
            sx={{ backgroundColor: '#2563eb', boxShadow: 'none', fontWeight: 'bold' }}
          >
            {editId ? 'Save Changes' : 'Add Genre'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2. Delete Confirmation Modal */}
      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)}>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#dc2626' }}>
          Delete Genre?
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the genre <strong>"{confirmDialog?.name}"</strong>? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleDeleteGenre}
            sx={{ backgroundColor: '#dc2626', boxShadow: 'none', fontWeight: 'bold', '&:hover': { backgroundColor: '#b91c1c' } }}
          >
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* 3. Success/Error Toast */}
      <Snackbar 
        open={toast.open} 
        autoHideDuration={4000} 
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ width: '100%', boxShadow: 3 }}>
          {toast.message}
        </Alert>
      </Snackbar>

    </Box>
  );
}