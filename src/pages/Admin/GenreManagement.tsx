import { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Button, IconButton, Tooltip, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert, Chip, Skeleton 
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Edit, Delete, AddCircleOutline, Category, WarningAmber } from '@mui/icons-material';
import { supabase } from '../../lib/supabaseClient';

interface Genre {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  usage_count?: number;
}

export default function GenreManagement() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [genreName, setGenreName] = useState('');
  const [genreDescription, setGenreDescription] = useState('');
  
  // SD Update: Confirmation States para sa Typed Deletion
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, id: string, name: string, usage_count: number } | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  
  const [toast, setToast] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const fetchGenres = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }
    try {
      const { data, error } = await supabase
        .from('genres')
        .select('*, book_genres(book_id)')
        .order('name', { ascending: true });

      if (error) throw error;
      
      const formattedData = data?.map((genre: any) => ({
        ...genre,
        usage_count: genre.book_genres ? genre.book_genres.length : 0
      })) || [];

      setGenres(formattedData);
    } catch (error: any) {
      console.error('Error fetching genres:', error);
      showToast('Failed to load genres', 'error');
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
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

    const payload = { 
      name: genreName.trim(),
      description: genreDescription.trim() || null
    };

    setSaveLoading(true);

    try {
      if (editId) {
        const { error } = await supabase.from('genres').update(payload).eq('id', editId);
        if (error) throw error;
        showToast('Genre updated successfully!', 'success');
      } else {
        const { error } = await supabase.from('genres').insert([payload]);
        if (error) throw error;
        showToast('New genre added successfully!', 'success');
      }
      await fetchGenres(false);
      handleCloseModal();
    } catch (error: any) {
      showToast(error.message || 'Failed to save genre.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteGenre = async () => {
    if (!confirmDialog) return;
    
    try {
      // SD Note: Ensure your Supabase foreign keys are set to ON DELETE CASCADE 
      // if you want the book_genres entries to be automatically deleted as well.
      const { error } = await supabase.from('genres').delete().eq('id', confirmDialog.id);
      if (error) throw error;
      
      setGenres(prev => prev.filter(g => g.id !== confirmDialog.id));
      showToast('Genre deleted successfully!', 'success');
    } catch (error: any) {
      showToast('Cannot delete genre. Check database constraints.', 'error');
    } finally {
      handleCloseDeleteModal();
    }
  };

  const handleOpenModal = (genre?: Genre) => {
    if (genre) {
      setEditId(genre.id);
      setGenreName(genre.name);
      setGenreDescription(genre.description || '');
    } else {
      setEditId(null);
      setGenreName('');
      setGenreDescription('');
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditId(null);
    setGenreName('');
    setGenreDescription('');
  };

  const handleCloseDeleteModal = () => {
    setConfirmDialog(null);
    setDeleteConfirmationText('');
  };

  const columns: GridColDef[] = [
    { 
      field: 'name', 
      headerName: 'Genre', 
      width: 220,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 320,
      sortable: false,
      renderCell: (params) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            width: '100%',
            py: 1
          }}
        >
          <Box
            sx={{
              maxHeight: 56,
              overflowY: 'auto',
              pr: 1,
              width: '100%',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' }
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: '#64748b',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                lineHeight: 1.45
              }}
            >
              {params.value || 'No description provided.'}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      field: 'usage_count',
      headerName: 'Usage Status',
      width: 150,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => {
        const count = params.value as number;
        const isActive = count > 0;

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'flex-start' }}>
            <Chip 
              label={isActive ? `${count} In Use` : 'Unused'} 
              size="small"
              sx={{ 
                backgroundColor: isActive ? '#dcfce7' : '#f1f5f9', 
                color: isActive ? '#15803d' : '#64748b',
                fontWeight: 'bold', 
                borderRadius: 1.5, 
                fontSize: '0.75rem' 
              }} 
            />
          </Box>
        );
      }
    },
    {
      field: 'created_at',
      headerName: 'Date Added',
      width: 150,
      renderCell: (params) => {
        const date = params.value ? new Date(params.value as string).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        }) : 'Unknown';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {date}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const usageCount = params.row.usage_count || 0;

        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
            <Tooltip title="Edit Genre" arrow>
              <IconButton 
                size="small" 
                onClick={() => handleOpenModal(params.row as Genre)}
                sx={{ backgroundColor: '#eff6ff', color: '#2563eb', '&:hover': { backgroundColor: '#dbeafe' } }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* SD Fix: Laging enabled, ipinapasa ang usage_count sa modal */}
            <Tooltip title="Delete Genre" arrow>
              <IconButton 
                size="small" 
                onClick={() => setConfirmDialog({ open: true, id: params.row.id, name: params.row.name, usage_count: usageCount })}
                sx={{ backgroundColor: '#fef2f2', color: '#dc2626', '&:hover': { backgroundColor: '#fee2e2' } }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
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
          height: 600, width: '100%', borderRadius: 3, 
          border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}
      >
        <DataGrid
          rows={genres}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          rowHeight={80}
          initialState={{
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
          }}
          pageSizeOptions={[5, 10, 20]}
          slots={{
            loadingOverlay: () => (
              <Box sx={{ p: 2 }}>
                {[1, 2, 3, 4, 5].map((item) => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="40%" height={24} />
                      <Skeleton variant="text" width="60%" height={16} />
                    </Box>
                    <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1.5 }} />
                    <Skeleton variant="text" width={100} height={24} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Skeleton variant="circular" width={30} height={30} />
                      <Skeleton variant="circular" width={30} height={30} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ),
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
            '& .MuiDataGrid-cell': { borderColor: '#f1f5f9' },
            '& .MuiTablePagination-root': { color: '#475569', borderTop: '1px solid #e2e8f0' }
          }}
        />
      </Paper>

      {/* 1. Add/Edit Modal */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#0f172a', pb: 1 }}>
          {editId ? 'Edit Genre' : 'Add New Genre'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            {editId ? 'Modify the details of this genre.' : 'Create a new genre category for authors and readers.'}
          </Typography>
          
          <TextField
            autoFocus
            label="Genre Name"
            fullWidth
            variant="outlined"
            value={genreName}
            onChange={(e) => setGenreName(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="e.g. Science Fiction"
          />

          <TextField
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={genreDescription}
            onChange={(e) => setGenreDescription(e.target.value)}
            placeholder="Brief explanation of this genre..."
          />

        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleCloseModal} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveGenre}
            disabled={saveLoading}
            sx={{ backgroundColor: '#2563eb', boxShadow: 'none', fontWeight: 'bold' }}
          >
            {saveLoading ? 'Saving...' : editId ? 'Save Changes' : 'Add Genre'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2. SD Security Update: Typed Confirmation Modal */}
      <Dialog open={!!confirmDialog} onClose={handleCloseDeleteModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: '#dc2626' }}>
          <WarningAmber color="error" /> Delete Genre
        </DialogTitle>
        <DialogContent>
          {/* Kung ginagamit ang genre, lalabas itong warning */}
          {confirmDialog?.usage_count && confirmDialog.usage_count > 0 ? (
            <Alert severity="warning" sx={{ mb: 3, fontWeight: 'bold' }}>
              Caution: There are {confirmDialog.usage_count} book(s) currently assigned to this genre. Deleting it will remove this tag from those books!
            </Alert>
          ) : null}
          
          <Typography variant="body1" sx={{ color: '#334155', mb: 1 }}>
            This action cannot be undone. To proceed, please type <strong>{confirmDialog?.name}</strong> to confirm.
          </Typography>

          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder={confirmDialog?.name}
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteModal} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Button>
          <Button 
            variant="contained" 
            disabled={deleteConfirmationText !== confirmDialog?.name}
            onClick={handleDeleteGenre}
            sx={{ 
              backgroundColor: '#dc2626', 
              boxShadow: 'none', 
              fontWeight: 'bold', 
              '&:hover': { backgroundColor: '#b91c1c' },
              '&.Mui-disabled': { backgroundColor: '#fca5a5', color: '#fff' }
            }}
          >
            Force Delete
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
