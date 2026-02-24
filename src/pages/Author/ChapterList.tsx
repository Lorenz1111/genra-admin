import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Paper, Button, IconButton, Tooltip, 
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { 
  AddCircleOutline, Edit, Delete, ArrowBack, 
  Lock, LockOpen, MenuBook 
} from '@mui/icons-material';
import { supabase } from '../../lib/supabaseClient';
import type { Database } from '../../types/supabase';

type Chapter = Database['public']['Tables']['chapters']['Row'];

export default function ChapterList() {
  const { bookId } = useParams(); 
  const navigate = useNavigate();
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [bookTitle, setBookTitle] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals & Toasts
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean, id: string, title: string } | null>(null);
  const [toast, setToast] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchData = async () => {
      if (!bookId) return;

      const { data: book } = await supabase
        .from('books')
        .select('title')
        .eq('id', bookId)
        .single();
      
      if (book) setBookTitle(book.title);

      const { data: chapterData } = await supabase
        .from('chapters')
        .select('*')
        .eq('book_id', bookId)
        .order('sequence_number', { ascending: true });

      if (chapterData) setChapters(chapterData);
      setLoading(false);
    };

    fetchData();
  }, [bookId]);

  const showToast = (message: string, severity: 'success' | 'error') => {
    setToast({ open: true, message, severity });
  };

  const handleDeleteChapter = async () => {
    if (!deleteDialog) return;

    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', deleteDialog.id);

    if (error) {
      showToast(error.message, 'error');
    } else {
      setChapters(prev => prev.filter(c => c.id !== deleteDialog.id));
      showToast('Chapter deleted successfully!', 'success');
    }
    setDeleteDialog(null);
  };

  const columns: GridColDef[] = [
    { 
      field: 'sequence_number', 
      headerName: 'Ch.', 
      width: 80,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#64748b', mt: 2 }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'title', 
      headerName: 'Chapter Title', 
      flex: 1, 
      minWidth: 250,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a', mt: 2 }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'is_locked', 
      headerName: 'Access / Status', 
      width: 180,
      renderCell: (params) => {
        const isLocked = params.value as boolean;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Chip 
              icon={isLocked ? <Lock fontSize="small" /> : <LockOpen fontSize="small" />}
              label={isLocked ? 'Premium (Locked)' : 'Free to Read'}
              size="small"
              sx={{ 
                backgroundColor: isLocked ? '#fef2f2' : '#ecfdf5', 
                color: isLocked ? '#dc2626' : '#16a34a',
                fontWeight: 'bold', 
                borderRadius: 1.5,
                '& .MuiChip-icon': { color: isLocked ? '#dc2626' : '#16a34a' }
              }}
            />
          </Box>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Tooltip title="Edit Chapter" arrow>
            {/* SENIOR DEV FIX: Dito papasok ang pag-navigate papunta sa Edit Route */}
            <IconButton 
              size="small"
              onClick={() => navigate(`/author/books/${bookId}/chapters/${params.row.id}/edit`)} 
              sx={{ backgroundColor: '#eff6ff', color: '#2563eb', '&:hover': { backgroundColor: '#dbeafe' } }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Chapter" arrow>
            <IconButton 
              size="small"
              onClick={() => setDeleteDialog({ open: true, id: params.row.id, title: params.row.title })}
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
    <Box sx={{ maxWidth: '1200px', pb: 8 }}>
      
      <Button 
        startIcon={<ArrowBack />} 
        onClick={() => navigate('/author/books')} 
        sx={{ mb: 3, color: '#64748b', textTransform: 'none', fontWeight: 'bold', '&:hover': { backgroundColor: '#f1f5f9' } }}
      >
        Back to My Books
      </Button>

      {/* SENIOR DEV FIX: Inilipat ang Add Chapter Button dito sa mismong Header para obvious! */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
            {bookTitle || 'Loading...'}
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Organize your story flow. Add, edit, or reorder your chapters here.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          size="large"
          startIcon={<AddCircleOutline />} 
          onClick={() => navigate(`/author/books/${bookId}/chapters/new`)}
          sx={{ borderRadius: 2, backgroundColor: '#2563eb', textTransform: 'none', fontWeight: 'bold', boxShadow: 'none' }}
        >
          Add New Chapter
        </Button>
      </Box>

      {/* Table Area (Inalis ko na yung toolbar dito para mas malinis) */}
      <Paper 
        elevation={0} 
        sx={{ 
          height: 600, width: '100%', borderRadius: 3, 
          border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}
      >
        <DataGrid
          rows={chapters}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          slots={{
            noRowsOverlay: () => (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                <MenuBook sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#64748b' }}>No chapters yet</Typography>
                <Typography variant="body2">Click "Add New Chapter" at the top to begin your story.</Typography>
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

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#dc2626' }}>
          Delete Chapter?
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>"{deleteDialog?.title}"</strong>? 
            This action cannot be undone and readers will lose access to this content.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleDeleteChapter}
            sx={{ backgroundColor: '#dc2626', boxShadow: 'none', fontWeight: 'bold', '&:hover': { backgroundColor: '#b91c1c' } }}
          >
            Yes, Delete Chapter
          </Button>
        </DialogActions>
      </Dialog>

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